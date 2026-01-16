import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Audit Logging Edge Function
 * 
 * Creates immutable audit log entries with hash chains.
 * Used for compliance, forensics, and security monitoring.
 */

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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, entries } = body;

    if (action === "log") {
      // Create audit log entry
      const {
        auditAction,
        entityType,
        entityId,
        payload,
        riskScore,
      } = entries || body;

      const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip");
      const userAgent = req.headers.get("user-agent");

      // Get user's device_id
      const { data: userData } = await supabase
        .from("users")
        .select("device_id")
        .eq("id", user.id)
        .single();

      // The hash will be computed by the database trigger
      const { data: logEntry, error: insertError } = await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          device_id: userData?.device_id,
          action: auditAction,
          entity_type: entityType,
          entity_id: entityId,
          payload: payload || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          risk_score: riskScore || 0,
          current_hash: "PENDING", // Will be replaced by trigger
        })
        .select()
        .single();

      if (insertError) {
        console.error("Audit log insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create audit log" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        logged: true,
        id: logEntry?.id,
        hash: logEntry?.current_hash,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "query") {
      // Query audit logs (with pagination)
      const { entityType, entityId, startDate, endDate, limit = 50, offset = 0 } = body;

      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }
      if (entityId) {
        query = query.eq("entity_id", entityId);
      }
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data: logs, count, error: queryError } = await query;

      if (queryError) {
        console.error("Audit log query error:", queryError);
        return new Response(JSON.stringify({ error: "Failed to query audit logs" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        logs,
        total: count,
        limit,
        offset,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "verify_chain") {
      // Verify the integrity of the audit log hash chain
      const { data: logs, error: chainError } = await supabase
        .from("audit_logs")
        .select("id, created_at, current_hash, previous_hash")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1000);

      if (chainError) {
        return new Response(JSON.stringify({ error: "Failed to verify chain" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let chainValid = true;
      let brokenAt: string | null = null;

      for (let i = 1; i < (logs?.length || 0); i++) {
        const current = logs![i];
        const previous = logs![i - 1];

        if (current.previous_hash !== previous.current_hash) {
          chainValid = false;
          brokenAt = current.id;
          break;
        }
      }

      return new Response(JSON.stringify({
        valid: chainValid,
        totalEntries: logs?.length || 0,
        brokenAt,
        firstEntry: logs?.[0]?.id,
        lastEntry: logs?.[logs!.length - 1]?.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Audit log error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
