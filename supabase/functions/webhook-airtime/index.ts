import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

Deno.serve(async (req) => {
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
    
    console.log('Airtime webhook received:', JSON.stringify(body))

    const externalReference = body.requestId || body.transaction_id || body.reference
    const status = body.status || 'completed'
    const phoneNumber = body.phoneNumber || body.phone_number
    const amount = Number(body.amount || 0)
    const provider = body.provider || 'airtime_provider'

    if (!externalReference) {
      return new Response(
        JSON.stringify({ error: 'Missing transaction reference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('provider', provider)
      .eq('external_reference', externalReference)
      .single()

    if (existingEvent) {
      console.log('Duplicate airtime webhook detected:', externalReference)
      
      await supabase
        .from('webhook_events')
        .update({ status: 'duplicate', retry_count: (existingEvent.retry_count || 0) + 1 })
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
        event_type: 'airtime',
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

    // Find the pending airtime transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, wallets(profile_id, profiles(phone_number))')
      .eq('reference_code', externalReference)
      .eq('type', 'airtime')
      .eq('status', 'pending')
      .single()

    if (!transaction) {
      // Try finding by phone number if no reference match
      console.log('No transaction found by reference, checking by phone:', phoneNumber)
      
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'processed', 
          processed_at: new Date().toISOString(),
          error_message: 'No matching pending transaction - may already be processed'
        })
        .eq('id', webhookEvent.id)

      return new Response(
        JSON.stringify({ success: true, message: 'No pending transaction found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update transaction status based on provider response
    const newStatus = status === 'completed' || status === 'success' ? 'completed' : 'failed'
    
    await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', transaction.id)

    // If failed, refund the wallet
    if (newStatus === 'failed') {
      const { error: refundError } = await supabase
        .rpc('credit_wallet', {
          p_profile_id: transaction.wallets.profile_id,
          p_amount: transaction.amount,
          p_reference: `REFUND-${transaction.reference_code}`,
          p_description: 'Airtime purchase refund'
        })

      if (refundError) {
        console.error('Refund failed:', refundError)
      }

      // Queue failure notification
      await supabase
        .from('notification_queue')
        .insert({
          profile_id: transaction.wallets.profile_id,
          channel: 'sms',
          template_name: 'airtime_failed',
          recipient: transaction.wallets.profiles?.phone_number || phoneNumber,
          payload: { amount: transaction.amount, reason: body.errorMessage || 'Purchase failed' }
        })
    } else {
      // Queue success notification
      await supabase
        .from('notification_queue')
        .insert({
          profile_id: transaction.wallets.profile_id,
          channel: 'sms',
          template_name: 'airtime_success',
          recipient: transaction.wallets.profiles?.phone_number || phoneNumber,
          payload: { amount: transaction.amount, phone: transaction.recipient_phone }
        })
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', webhookEvent.id)

    console.log('Airtime webhook processed:', { transactionId: transaction.id, status: newStatus })

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Airtime webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
