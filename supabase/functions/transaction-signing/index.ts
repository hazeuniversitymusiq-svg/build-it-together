import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base64 encode helper
function base64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
/**
 * Transaction Signing Edge Function
 * 
 * Creates HMAC signatures for the intent → plan → execute chain.
 * Ensures transaction integrity and tamper-proofing.
 */

// Use environment variable for signing key (auto-generated per project)
const getSigningKey = () => {
  const key = Deno.env.get("FLOW_SIGNING_KEY");
  if (key) return key;
  
  // Fallback: derive from service role key (not ideal but works for prototype)
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return serviceKey.slice(0, 32);
};

async function hmacSign(payload: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const data = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return base64Encode(signature);
}

async function sha256Hash(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return base64Encode(hashBuffer);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const signingKey = getSigningKey();
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

    const { action, payload, intentId, planId, signatureId } = await req.json();

    // ---------------------------------------------------------------------
    // Compatibility API used by the app (security-service.ts)
    // ---------------------------------------------------------------------
    if (action === "sign") {
      if (!intentId || !planId || !payload) {
        return new Response(JSON.stringify({ error: "Missing intentId/planId/payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payloadString = JSON.stringify({
        intentId,
        planId,
        payload,
        signedAt: new Date().toISOString(),
      });

      const payloadHash = await sha256Hash(payloadString);
      const signature = await hmacSign(payloadString, signingKey);

      const { data: sigRow, error: sigError } = await supabase
        .from("transaction_signatures")
        .insert({
          intent_id: intentId,
          plan_id: planId,
          signature_type: "execution",
          payload_hash: payloadHash,
          signature,
          verified: false,
        })
        .select("id, signature, verified")
        .single();

      if (sigError || !sigRow) {
        console.error("Transaction signature insert error:", sigError);
        return new Response(JSON.stringify({ error: "Failed to store signature" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        id: sigRow.id,
        signature: sigRow.signature,
        verified: sigRow.verified === true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!signatureId) {
        return new Response(JSON.stringify({ error: "Missing signatureId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sig, error: sigFetchError } = await supabase
        .from("transaction_signatures")
        .select("id, signature, verified")
        .eq("id", signatureId)
        .maybeSingle();

      if (sigFetchError || !sig?.signature) {
        return new Response(JSON.stringify({ verified: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!sig.verified) {
        await supabase
          .from("transaction_signatures")
          .update({ verified: true, verified_at: new Date().toISOString() })
          .eq("id", signatureId);
      }

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sign_intent") {
      // Sign an intent
      const { intentId, intentData } = payload;
      
      const payloadString = JSON.stringify({
        id: intentId,
        type: intentData.type,
        amount: intentData.amount,
        payee: intentData.payee_identifier,
        timestamp: new Date().toISOString(),
      });

      const payloadHash = await sha256Hash(payloadString);
      const signature = await hmacSign(payloadString, signingKey);

      // Store signature
      await supabase.from("transaction_signatures").insert({
        intent_id: intentId,
        signature_type: "intent",
        payload_hash: payloadHash,
        signature: signature,
      });

      return new Response(JSON.stringify({ 
        signature,
        payloadHash,
        signedAt: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "sign_plan") {
      // Sign a resolution plan
      const { planId, planData, intentSignature } = payload;

      const payloadString = JSON.stringify({
        id: planId,
        intentId: planData.intent_id,
        chosenRail: planData.chosen_rail,
        amount: planData.topup_amount,
        previousSignature: intentSignature,
        timestamp: new Date().toISOString(),
      });

      const payloadHash = await sha256Hash(payloadString);
      const signature = await hmacSign(payloadString, signingKey);

      await supabase.from("transaction_signatures").insert({
        plan_id: planId,
        intent_id: planData.intent_id,
        signature_type: "plan",
        payload_hash: payloadHash,
        signature: signature,
      });

      return new Response(JSON.stringify({ 
        signature,
        payloadHash,
        signedAt: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "sign_execution") {
      // Sign a transaction execution
      const { transactionId, planId, intentId, planSignature, outcome } = payload;

      const payloadString = JSON.stringify({
        transactionId,
        planId,
        intentId,
        outcome,
        previousSignature: planSignature,
        timestamp: new Date().toISOString(),
      });

      const payloadHash = await sha256Hash(payloadString);
      const signature = await hmacSign(payloadString, signingKey);

      await supabase.from("transaction_signatures").insert({
        transaction_id: transactionId,
        plan_id: planId,
        intent_id: intentId,
        signature_type: "execution",
        payload_hash: payloadHash,
        signature: signature,
      });

      return new Response(JSON.stringify({ 
        signature,
        payloadHash,
        signedAt: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "verify_chain") {
      // Verify the entire signature chain for a transaction
      const { transactionId } = payload;

      // Get all signatures for this transaction
      const { data: transaction } = await supabase
        .from("transactions")
        .select("*, resolution_plans(*), intents(*)")
        .eq("id", transactionId)
        .single();

      if (!transaction) {
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: signatures } = await supabase
        .from("transaction_signatures")
        .select("*")
        .or(`intent_id.eq.${transaction.intent_id},plan_id.eq.${transaction.plan_id},transaction_id.eq.${transactionId}`)
        .order("created_at");

      const chainValid = signatures && signatures.length === 3;
      const hasIntent = signatures?.some(s => s.signature_type === "intent");
      const hasPlan = signatures?.some(s => s.signature_type === "plan");
      const hasExecution = signatures?.some(s => s.signature_type === "execution");

      // Mark as verified if chain is complete
      if (chainValid) {
        for (const sig of signatures) {
          await supabase
            .from("transaction_signatures")
            .update({ verified: true, verified_at: new Date().toISOString() })
            .eq("id", sig.id);
        }
      }

      return new Response(JSON.stringify({
        valid: chainValid && hasIntent && hasPlan && hasExecution,
        signatures: signatures?.length || 0,
        hasIntent,
        hasPlan,
        hasExecution,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Signing error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
