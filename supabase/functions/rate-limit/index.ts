import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration per action type
const RATE_LIMITS: Record<string, { maxRequests: number; windowMinutes: number }> = {
  "intent.create": { maxRequests: 30, windowMinutes: 1 },
  "payment.execute": { maxRequests: 10, windowMinutes: 1 },
  "auth.attempt": { maxRequests: 5, windowMinutes: 1 },
  "api.call": { maxRequests: 100, windowMinutes: 1 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, actionType } = await req.json();

    if (action === "check") {
      // Check if user is rate limited
      const config = RATE_LIMITS[actionType] || RATE_LIMITS["api.call"];
      const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

      const { data: requests, error: countError } = await supabase
        .from("rate_limits")
        .select("request_count")
        .eq("user_id", user.id)
        .eq("action_type", actionType)
        .gte("window_start", windowStart.toISOString());

      if (countError) {
        console.error("Rate limit check error:", countError);
        return new Response(JSON.stringify({ allowed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const totalRequests = requests?.reduce((sum, r) => sum + r.request_count, 0) || 0;
      const allowed = totalRequests < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - totalRequests);
      const resetAt = new Date(Date.now() + config.windowMinutes * 60 * 1000).toISOString();

      return new Response(JSON.stringify({ 
        allowed, 
        remaining,
        limit: config.maxRequests,
        resetAt,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "record") {
      // Record a request
      const windowStart = new Date();
      windowStart.setSeconds(0, 0); // Round to minute

      const { error: upsertError } = await supabase
        .from("rate_limits")
        .upsert({
          user_id: user.id,
          action_type: actionType,
          window_start: windowStart.toISOString(),
          request_count: 1,
        }, {
          onConflict: "user_id,action_type,window_start",
          ignoreDuplicates: false,
        });

      // If upsert failed, try increment
      if (upsertError) {
        await supabase.rpc("increment_rate_limit", {
          p_user_id: user.id,
          p_action_type: actionType,
          p_window_start: windowStart.toISOString(),
        });
      }

      return new Response(JSON.stringify({ recorded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Rate limit error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
