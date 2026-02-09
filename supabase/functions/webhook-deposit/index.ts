import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const signature = req.headers.get('x-webhook-signature') || ''
    const body = await req.json()
    
    console.log('Deposit webhook received:', JSON.stringify(body))

    // Extract reference from different webhook formats
    let externalReference: string
    let amount: number
    let phoneNumber: string
    let provider = 'mpesa'
    let status = 'completed'

    // M-Pesa STK Push callback format
    if (body.Body?.stkCallback) {
      const callback = body as MpesaCallback
      const stkCallback = callback.Body.stkCallback
      externalReference = stkCallback.CheckoutRequestID
      
      if (stkCallback.ResultCode !== 0) {
        status = 'failed'
        console.log('M-Pesa callback failed:', stkCallback.ResultDesc)
      }

      const metadata = stkCallback.CallbackMetadata?.Item || []
      amount = Number(metadata.find(i => i.Name === 'Amount')?.Value || 0)
      phoneNumber = String(metadata.find(i => i.Name === 'PhoneNumber')?.Value || '')
    } 
    // Generic webhook format
    else {
      externalReference = body.transaction_id || body.reference || body.id
      amount = Number(body.amount || 0)
      phoneNumber = body.phone_number || body.msisdn || ''
      provider = body.provider || 'manual'
      status = body.status || 'completed'
    }

    if (!externalReference) {
      return new Response(
        JSON.stringify({ error: 'Missing transaction reference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for idempotency - prevent double processing
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('provider', provider)
      .eq('external_reference', externalReference)
      .single()

    if (existingEvent) {
      console.log('Duplicate webhook detected:', externalReference)
      
      // Update as duplicate
      await supabase
        .from('webhook_events')
        .update({ status: 'duplicate', retry_count: existingEvent.retry_count || 0 + 1 })
        .eq('id', existingEvent.id)

      return new Response(
        JSON.stringify({ success: true, message: 'Already processed', duplicate: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        provider,
        event_type: 'deposit',
        external_reference: externalReference,
        payload: body,
        signature,
        status: 'pending'
      })
      .select()
      .single()

    if (webhookError) {
      console.error('Failed to record webhook:', webhookError)
      throw webhookError
    }

    // If callback indicates failure, just record it
    if (status === 'failed') {
      await supabase
        .from('webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', webhookEvent.id)

      return new Response(
        JSON.stringify({ success: true, message: 'Failure recorded' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the pending deposit by reference or phone
    let deposit = null
    
    // Try to find by external reference first
    const { data: depositByRef } = await supabase
      .from('deposits')
      .select('*, profiles(id, phone_number)')
      .eq('external_reference', externalReference)
      .eq('status', 'pending')
      .single()

    if (depositByRef) {
      deposit = depositByRef
    } else if (phoneNumber) {
      // Find user by phone and match pending deposit
      const normalizedPhone = phoneNumber.replace(/^254/, '0').replace(/^\+254/, '0')
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .or(`phone_number.eq.${phoneNumber},phone_number.eq.${normalizedPhone}`)
        .single()

      if (profile) {
        const { data: depositByProfile } = await supabase
          .from('deposits')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('status', 'pending')
          .eq('amount', amount)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (depositByProfile) {
          deposit = { ...depositByProfile, profiles: profile }
        }
      }
    }

    if (!deposit) {
      console.log('No matching pending deposit found for:', { externalReference, phoneNumber, amount })
      
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'failed', 
          error_message: 'No matching pending deposit found',
          processed_at: new Date().toISOString() 
        })
        .eq('id', webhookEvent.id)

      return new Response(
        JSON.stringify({ success: false, error: 'No matching deposit found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Credit the wallet using atomic function
    const { data: creditResult, error: creditError } = await supabase
      .rpc('credit_wallet', {
        p_profile_id: deposit.profile_id,
        p_amount: amount,
        p_reference: deposit.reference_code,
        p_description: `Deposit via ${provider}`
      })

    if (creditError || !creditResult?.success) {
      console.error('Failed to credit wallet:', creditError || creditResult?.error)
      
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'failed', 
          error_message: creditError?.message || creditResult?.error,
          processed_at: new Date().toISOString() 
        })
        .eq('id', webhookEvent.id)

      throw new Error(creditError?.message || creditResult?.error || 'Failed to credit wallet')
    }

    // Update deposit status
    await supabase
      .from('deposits')
      .update({ 
        status: 'completed', 
        external_reference: externalReference,
        confirmed_at: new Date().toISOString() 
      })
      .eq('id', deposit.id)

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', webhookEvent.id)

    // Queue notification
    await supabase
      .from('notification_queue')
      .insert({
        profile_id: deposit.profile_id,
        channel: 'sms',
        template_name: 'deposit_success',
        recipient: deposit.profiles?.phone_number || phoneNumber,
        payload: { amount, reference: deposit.reference_code, new_balance: creditResult.new_balance }
      })

    console.log('Deposit processed successfully:', {
      depositId: deposit.id,
      amount,
      newBalance: creditResult.new_balance
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deposit processed',
        deposit_id: deposit.id,
        new_balance: creditResult.new_balance
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
