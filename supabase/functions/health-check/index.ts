import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    components: {} as Record<string, { status: string; latency_ms?: number; error?: string }>
  }

  try {
    // Check database connectivity
    const dbStart = Date.now()
    const { data: dbCheck, error: dbError } = await supabase
      .from('system_status')
      .select('component')
      .limit(1)

    healthStatus.components.database = {
      status: dbError ? 'down' : 'operational',
      latency_ms: Date.now() - dbStart,
      ...(dbError && { error: dbError.message })
    }

    // Update system status in database
    await supabase
      .from('system_status')
      .update({ 
        status: dbError ? 'down' : 'operational',
        last_check_at: new Date().toISOString(),
        response_time_ms: Date.now() - dbStart
      })
      .eq('component', 'database')

    // Check for recent failed transactions (last hour)
    const { count: failedTxns } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())

    healthStatus.components.transactions = {
      status: (failedTxns || 0) > 10 ? 'degraded' : 'operational',
      ...(failedTxns && failedTxns > 0 && { error: `${failedTxns} failed transactions in last hour` })
    }

    // Check pending webhook events
    const { count: pendingWebhooks } = await supabase
      .from('webhook_events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 300000).toISOString()) // Older than 5 min

    healthStatus.components.webhooks = {
      status: (pendingWebhooks || 0) > 5 ? 'degraded' : 'operational',
      ...(pendingWebhooks && pendingWebhooks > 0 && { error: `${pendingWebhooks} stale pending webhooks` })
    }

    // Check pending notifications
    const { count: pendingNotifications } = await supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 600000).toISOString()) // Older than 10 min

    healthStatus.components.notifications = {
      status: (pendingNotifications || 0) > 20 ? 'degraded' : 'operational',
      ...(pendingNotifications && pendingNotifications > 0 && { error: `${pendingNotifications} stale pending notifications` })
    }

    // Get system status for external services
    const { data: systemStatuses } = await supabase
      .from('system_status')
      .select('component, status, last_check_at, response_time_ms, error_message')

    for (const svc of systemStatuses || []) {
      if (svc.component !== 'database') {
        healthStatus.components[svc.component] = {
          status: svc.status,
          latency_ms: svc.response_time_ms,
          ...(svc.error_message && { error: svc.error_message })
        }
      }
    }

    // Determine overall health
    const componentStatuses = Object.values(healthStatus.components).map(c => c.status)
    if (componentStatuses.includes('down')) {
      healthStatus.status = 'unhealthy'
    } else if (componentStatuses.includes('degraded')) {
      healthStatus.status = 'degraded'
    }

    const totalLatency = Date.now() - startTime
    
    console.log('Health check completed:', healthStatus.status, `(${totalLatency}ms)`)

    return new Response(
      JSON.stringify({ ...healthStatus, total_latency_ms: totalLatency }),
      { 
        status: healthStatus.status === 'unhealthy' ? 503 : 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Health check error:', error)
    return new Response(
      JSON.stringify({ 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
