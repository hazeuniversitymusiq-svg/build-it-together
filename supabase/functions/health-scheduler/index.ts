/**
 * FLOW Health Scheduler Edge Function
 * 
 * Background job that runs on a schedule to:
 * - Check connector health for all users
 * - Update connector health status
 * - Refresh stale balances when expires_at has passed
 * - Update last_verified_at for healthy connectors
 * 
 * Designed to be called via pg_cron every 5 minutes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers - includes Capacitor origins for mobile app support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulated health check (Prototype mode)
const performHealthCheck = async (connectorName: string): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
}> => {
  const start = Date.now();
  
  // Simulate network latency (100-400ms)
  await new Promise(r => setTimeout(r, 100 + Math.random() * 300));
  
  const latencyMs = Date.now() - start;
  
  // 95% healthy, 4% degraded, 1% unhealthy
  const rand = Math.random();
  const status = rand > 0.05 ? 'healthy' : rand > 0.01 ? 'degraded' : 'unhealthy';
  
  return { status, latencyMs };
};

// Simulated balance fetch (Prototype mode)
const fetchBalance = async (connectorName: string): Promise<{
  amount: number;
  success: boolean;
  latencyMs: number;
}> => {
  const start = Date.now();
  
  await new Promise(r => setTimeout(r, 200 + Math.random() * 600));
  
  const baseBalances: Record<string, number> = {
    TouchNGo: 85.50,
    GrabPay: 42.00,
    Boost: 25.00,
    DuitNow: 0,
    Maybank: 1250.00,
    CIMB: 890.00,
    PublicBank: 650.00,
    Atome: 1500.00,
    SPayLater: 1000.00,
    GrabPayLater: 800.00,
  };

  const base = baseBalances[connectorName] ?? 100;
  const variance = base * (0.9 + Math.random() * 0.2);
  
  return {
    amount: Math.round(variance * 100) / 100,
    success: Math.random() > 0.05,
    latencyMs: Date.now() - start,
  };
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for background job
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // ========================================
    // RUN ALL HEALTH CHECKS
    // ========================================
    if (path === 'run-all' || path === 'health-scheduler') {
      console.log('[Health Scheduler] Starting scheduled health checks...');

      // Get all available connectors that haven't been checked in 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: connectors, error: fetchError } = await supabase
        .from('connectors')
        .select('id, user_id, name, status, last_health_check_at')
        .eq('status', 'available')
        .or(`last_health_check_at.is.null,last_health_check_at.lt.${fiveMinutesAgo}`);

      if (fetchError) {
        console.error('[Health Scheduler] Failed to fetch connectors:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch connectors' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Health Scheduler] Found ${connectors?.length || 0} connectors to check`);

      const results = {
        checked: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        errors: 0,
      };

      for (const connector of connectors || []) {
        try {
          const healthResult = await performHealthCheck(connector.name);
          
          // Record health check
          await supabase.from('connector_health').insert({
            connector_id: connector.id,
            user_id: connector.user_id,
            check_type: 'scheduled',
            status: healthResult.status,
            latency_ms: healthResult.latencyMs,
          });

          // Update connector's last health check timestamp
          await supabase
            .from('connectors')
            .update({
              last_health_check_at: new Date().toISOString(),
              last_verified_at: healthResult.status === 'healthy' ? new Date().toISOString() : undefined,
            })
            .eq('id', connector.id);

          results.checked++;
          results[healthResult.status]++;

          console.log(`[Health Scheduler] ${connector.name}: ${healthResult.status} (${healthResult.latencyMs}ms)`);
        } catch (error) {
          console.error(`[Health Scheduler] Error checking ${connector.name}:`, error);
          results.errors++;
        }
      }

      console.log('[Health Scheduler] Health check complete:', results);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Scheduled health checks complete',
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // REFRESH STALE BALANCES
    // ========================================
    if (path === 'refresh-stale') {
      console.log('[Health Scheduler] Refreshing stale balances...');

      // Find balances where expires_at has passed
      const now = new Date().toISOString();
      
      const { data: staleBalances, error: staleError } = await supabase
        .from('cached_balances')
        .select(`
          id,
          connector_id,
          user_id,
          connectors!inner(name, status)
        `)
        .lt('expires_at', now);

      if (staleError) {
        console.error('[Health Scheduler] Failed to fetch stale balances:', staleError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch stale balances' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Health Scheduler] Found ${staleBalances?.length || 0} stale balances to refresh`);

      const refreshResults = {
        refreshed: 0,
        failed: 0,
      };

      for (const stale of staleBalances || []) {
        try {
          const connectorData = stale.connectors as any;
          
          // Skip if connector is not available
          if (connectorData.status !== 'available') {
            continue;
          }

          const balanceResult = await fetchBalance(connectorData.name);

          if (balanceResult.success) {
            // Update cached balance
            await supabase
              .from('cached_balances')
              .update({
                amount: balanceResult.amount,
                confidence_level: 'high',
                source: 'scheduled_refresh',
                last_updated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              })
              .eq('id', stale.id);

            // Also update funding_sources to keep in sync
            await supabase
              .from('funding_sources')
              .update({ balance: balanceResult.amount })
              .eq('user_id', stale.user_id)
              .eq('name', connectorData.name);

            refreshResults.refreshed++;
            console.log(`[Health Scheduler] Refreshed ${connectorData.name}: RM${balanceResult.amount}`);
          } else {
            // Mark as low confidence on failure
            await supabase
              .from('cached_balances')
              .update({
                confidence_level: 'low',
                last_updated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 1 * 60 * 1000).toISOString(), // Retry in 1 min
              })
              .eq('id', stale.id);

            refreshResults.failed++;
          }

          // Record health check
          await supabase.from('connector_health').insert({
            connector_id: stale.connector_id,
            user_id: stale.user_id,
            check_type: 'balance',
            status: balanceResult.success ? 'healthy' : 'unhealthy',
            latency_ms: balanceResult.latencyMs,
          });
        } catch (error) {
          console.error(`[Health Scheduler] Error refreshing balance:`, error);
          refreshResults.failed++;
        }
      }

      console.log('[Health Scheduler] Stale balance refresh complete:', refreshResults);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Stale balance refresh complete',
          results: refreshResults,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // COMBINED: HEALTH + BALANCE REFRESH
    // ========================================
    if (path === 'run-scheduled' || path === '' || !path) {
      console.log('[Health Scheduler] Running combined scheduled job...');

      // Run health checks first
      const healthResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/health-scheduler/run-all`, {
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
      });
      const healthResult = await healthResponse.json();

      // Then refresh stale balances
      const balanceResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/health-scheduler/refresh-stale`, {
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
      });
      const balanceResult = await balanceResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          health: healthResult,
          balances: balanceResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Health Scheduler] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
