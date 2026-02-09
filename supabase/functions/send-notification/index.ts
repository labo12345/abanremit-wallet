import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Notification templates
const templates: Record<string, (payload: any) => { subject?: string; message: string }> = {
  login_alert: (p) => ({
    subject: 'New Login to AbanRemit',
    message: `New login to your AbanRemit account detected at ${p.time || new Date().toLocaleString()}. If this wasn't you, please contact support immediately.`
  }),
  send_money_success: (p) => ({
    message: `You have sent KES ${p.amount?.toLocaleString()} to ${p.recipient_name}. Ref: ${p.reference}. New balance: KES ${p.new_balance?.toLocaleString()}.`
  }),
  receive_money: (p) => ({
    message: `You have received KES ${p.amount?.toLocaleString()} from ${p.sender_name}. Ref: ${p.reference}. New balance: KES ${p.new_balance?.toLocaleString()}.`
  }),
  withdrawal_request: (p) => ({
    message: `Your withdrawal request of KES ${p.amount?.toLocaleString()} has been submitted. Ref: ${p.reference}. Visit your selected agent to complete.`
  }),
  withdrawal_approved: (p) => ({
    message: `Your withdrawal of KES ${p.amount?.toLocaleString()} has been approved by agent. Ref: ${p.reference}. New balance: KES ${p.new_balance?.toLocaleString()}.`
  }),
  withdrawal_rejected: (p) => ({
    message: `Your withdrawal of KES ${p.amount?.toLocaleString()} was rejected. Ref: ${p.reference}. Reason: ${p.reason || 'Contact support'}.`
  }),
  deposit_success: (p) => ({
    message: `You have deposited KES ${p.amount?.toLocaleString()} to your AbanRemit wallet. Ref: ${p.reference}. New balance: KES ${p.new_balance?.toLocaleString()}.`
  }),
  airtime_success: (p) => ({
    message: `Airtime purchase of KES ${p.amount?.toLocaleString()} for ${p.phone} successful.`
  }),
  airtime_failed: (p) => ({
    message: `Airtime purchase of KES ${p.amount?.toLocaleString()} failed. ${p.reason}. Amount refunded to wallet.`
  }),
  kyc_reminder: (p) => ({
    subject: 'Complete Your KYC Verification',
    message: `Please complete your KYC verification on AbanRemit to access all features including withdrawals.`
  }),
  agent_withdrawal_pending: (p) => ({
    message: `New withdrawal request: ${p.user_name} - KES ${p.amount?.toLocaleString()}. Ref: ${p.reference}. Please verify and process.`
  })
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
    // Process pending notifications (batch)
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      throw fetchError
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending notifications', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${pendingNotifications.length} notifications`)

    let successCount = 0
    let failCount = 0

    for (const notification of pendingNotifications) {
      try {
        const template = templates[notification.template_name]
        
        if (!template) {
          console.warn(`Unknown template: ${notification.template_name}`)
          await supabase
            .from('notification_queue')
            .update({ 
              status: 'failed', 
              error_message: `Unknown template: ${notification.template_name}`,
              retry_count: notification.retry_count + 1
            })
            .eq('id', notification.id)
          failCount++
          continue
        }

        const { subject, message } = template(notification.payload)

        // Log the notification that would be sent
        // In production, integrate with actual SMS/Email providers here
        console.log(`[${notification.channel.toUpperCase()}] To: ${notification.recipient}`)
        console.log(`  Template: ${notification.template_name}`)
        console.log(`  Message: ${message}`)
        if (subject) console.log(`  Subject: ${subject}`)

        // Simulate sending (replace with actual provider calls)
        // SMS: AfricasTalking, Twilio, etc.
        // Email: SendGrid, Resend, etc.
        
        const smsApiKey = Deno.env.get('SMS_API_KEY')
        const emailApiKey = Deno.env.get('EMAIL_API_KEY')

        if (notification.channel === 'sms' && smsApiKey) {
          // Example: Send via Africa's Talking or other SMS provider
          // const response = await fetch('https://api.africastalking.com/...', { ... })
          console.log('SMS would be sent via configured provider')
        } else if (notification.channel === 'email' && emailApiKey) {
          // Example: Send via SendGrid, Resend, etc.
          // const response = await fetch('https://api.sendgrid.com/...', { ... })
          console.log('Email would be sent via configured provider')
        }

        // Mark as sent (in production, only after successful API call)
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id)

        successCount++

      } catch (err) {
        console.error(`Failed to send notification ${notification.id}:`, err)
        
        await supabase
          .from('notification_queue')
          .update({ 
            status: notification.retry_count >= 2 ? 'failed' : 'pending',
            error_message: err.message,
            retry_count: notification.retry_count + 1
          })
          .eq('id', notification.id)

        failCount++
      }
    }

    console.log(`Notification processing complete: ${successCount} sent, ${failCount} failed`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: pendingNotifications.length,
        sent: successCount,
        failed: failCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
