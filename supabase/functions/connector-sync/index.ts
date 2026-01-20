/**
 * FLOW Connector Sync Edge Function
 * 
 * Background sync service that:
 * - Caches balances with confidence levels
 * - Tracks connector health
 * - Updates last_verified_at
 * - Feeds Smart Resolution Engine
 * 
 * Endpoints:
 * POST /sync-balance - Sync balance for a connector
 * POST /health-check - Run health check for connectors
 * POST /sync-all     - Sync all user connectors
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Balance confidence rules
const determineConfidence = (
  source: string,
  ageMinutes: number,
  hasRecentActivity: boolean
): 'high' | 'medium' | 'low' => {
  // API response within 5 minutes = high
  if (source === 'api' && ageMinutes < 5) return 'high';
  // API response within 30 minutes = medium
  if (source === 'api' && ageMinutes < 30) return 'medium';
  // Statement import within 24 hours = medium
  if (source === 'statement' && ageMinutes < 1440) return 'medium';
  // Manual entry or old data = low
  return 'low';
};

// Simulated balance fetching (Prototype mode)
const fetchPrototypeBalance = async (connectorName: string): Promise<{
  amount: number;
  success: boolean;
  latencyMs: number;
}> => {
  const start = Date.now();
  
  // Simulate API latency (200-800ms)
  await new Promise(r => setTimeout(r, 200 + Math.random() * 600));
  
  // Prototype balances with slight variance
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
  // Add ±10% variance for realism
  const variance = base * (0.9 + Math.random() * 0.2);
  
  return {
    amount: Math.round(variance * 100) / 100,
    success: Math.random() > 0.05, // 95% success rate
    latencyMs: Date.now() - start,
  };
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const body = req.method === 'POST' ? await req.json() : {};

    // ========================================
    // SYNC BALANCE ENDPOINT
    // ========================================
    if (path === 'sync-balance') {
      const { connector_id } = body;

      if (!connector_id) {
        return new Response(
          JSON.stringify({ error: 'connector_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch connector details
      const { data: connector, error: connectorError } = await supabase
        .from('connectors')
        .select('*')
        .eq('id', connector_id)
        .eq('user_id', user.id)
        .single();

      if (connectorError || !connector) {
        return new Response(
          JSON.stringify({ error: 'Connector not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch balance (Prototype mode)
      const balanceResult = await fetchPrototypeBalance(connector.name);

      // Record health check
      await supabase.from('connector_health').insert({
        connector_id,
        user_id: user.id,
        check_type: 'balance',
        status: balanceResult.success ? 'healthy' : 'unhealthy',
        latency_ms: balanceResult.latencyMs,
        error_message: balanceResult.success ? null : 'Failed to fetch balance',
      });

      if (balanceResult.success) {
        // Upsert cached balance
        await supabase.from('cached_balances').upsert({
          connector_id,
          user_id: user.id,
          amount: balanceResult.amount,
          currency: 'MYR',
          confidence_level: 'high',
          source: 'api',
          last_updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
        }, { onConflict: 'connector_id' });

        return new Response(
          JSON.stringify({
            success: true,
            balance: balanceResult.amount,
            confidence: 'high',
            latency_ms: balanceResult.latencyMs,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Balance fetch failed',
            latency_ms: balanceResult.latencyMs,
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ========================================
    // HEALTH CHECK ENDPOINT
    // ========================================
    if (path === 'health-check') {
      const { connector_id, check_type = 'auth' } = body;

      if (!connector_id) {
        return new Response(
          JSON.stringify({ error: 'connector_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Simulate health check
      const start = Date.now();
      await new Promise(r => setTimeout(r, 100 + Math.random() * 300));
      const latencyMs = Date.now() - start;
      const isHealthy = Math.random() > 0.02; // 98% healthy

      // Record health check
      await supabase.from('connector_health').insert({
        connector_id,
        user_id: user.id,
        check_type,
        status: isHealthy ? 'healthy' : 'degraded',
        latency_ms: latencyMs,
        error_message: isHealthy ? null : 'Connection timeout',
      });

      return new Response(
        JSON.stringify({
          success: true,
          status: isHealthy ? 'healthy' : 'degraded',
          latency_ms: latencyMs,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // SYNC ALL ENDPOINT
    // ========================================
    if (path === 'sync-all') {
      // Fetch all user connectors
      const { data: connectors, error: listError } = await supabase
        .from('connectors')
        .select('id, name, type, status')
        .eq('user_id', user.id)
        .eq('status', 'available');

      if (listError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch connectors' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];
      
      for (const connector of connectors || []) {
        const balanceResult = await fetchPrototypeBalance(connector.name);
        
        // Record health
        await supabase.from('connector_health').insert({
          connector_id: connector.id,
          user_id: user.id,
          check_type: 'balance',
          status: balanceResult.success ? 'healthy' : 'unhealthy',
          latency_ms: balanceResult.latencyMs,
        });

        if (balanceResult.success) {
          // Upsert cached balance
          await supabase.from('cached_balances').upsert({
            connector_id: connector.id,
            user_id: user.id,
            amount: balanceResult.amount,
            currency: 'MYR',
            confidence_level: 'high',
            source: 'api',
            last_updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          }, { onConflict: 'connector_id' });
        }

        results.push({
          connector_id: connector.id,
          name: connector.name,
          success: balanceResult.success,
          balance: balanceResult.success ? balanceResult.amount : null,
          latency_ms: balanceResult.latencyMs,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          synced: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown endpoint
    return new Response(
      JSON.stringify({ error: 'Unknown endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Connector sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
