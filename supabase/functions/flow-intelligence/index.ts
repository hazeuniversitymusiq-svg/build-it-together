import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * FLOW Intelligence Edge Function
 * 
 * Quiet AI that provides:
 * - Spending pattern analysis
 * - Anomaly detection
 * - Smart predictions
 * - Personalized recommendations
 * 
 * Feels like Apple/Tesla - works silently, surfaces insights when relevant.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
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

    const { action, context } = await req.json();

    // Fetch user's recent transaction history for context
    const { data: recentTransactions } = await supabase
      .from("transaction_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch user's funding sources
    const { data: fundingSources } = await supabase
      .from("funding_sources")
      .select("*")
      .eq("user_id", user.id);

    if (action === "analyze_payment") {
      // Analyze a pending payment for risk and recommendations
      const { amount, payeeName, payeeIdentifier, intentType } = context;

      // Build context for AI
      const transactionSummary = recentTransactions?.map(t => ({
        amount: t.amount,
        type: t.intent_type,
        merchant: t.merchant_name || t.recipient_name,
        status: t.status,
        date: t.created_at,
      })) || [];

      const prompt = `You are FLOW's quiet intelligence system. Analyze this payment and provide insights.

PAYMENT CONTEXT:
- Amount: RM ${amount}
- Payee: ${payeeName}
- Type: ${intentType}

USER HISTORY (last 50 transactions):
${JSON.stringify(transactionSummary, null, 2)}

FUNDING SOURCES:
${JSON.stringify(fundingSources?.map(f => ({ name: f.name, type: f.type, balance: f.balance })), null, 2)}

Respond with a JSON object containing:
1. riskScore (0-100): How unusual is this payment?
2. riskFactors: Array of specific concerns (e.g., "unusually high amount", "new recipient")
3. recommendation: One sentence of helpful context (not a warning unless needed)
4. suggestedSource: Best funding source for this payment and why
5. isAnomalous: Boolean - true only if genuinely unusual

Be helpful, not alarmist. Most payments are normal.`;

      if (!lovableApiKey) {
        // Fallback without AI
        return new Response(JSON.stringify({
          riskScore: 0,
          riskFactors: [],
          recommendation: null,
          suggestedSource: fundingSources?.[0]?.name || "Wallet",
          isAnomalous: false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "analyze_payment",
              description: "Analyze a payment for risk and provide recommendations",
              parameters: {
                type: "object",
                properties: {
                  riskScore: { type: "number", minimum: 0, maximum: 100 },
                  riskFactors: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" },
                  suggestedSource: { type: "string" },
                  isAnomalous: { type: "boolean" },
                },
                required: ["riskScore", "riskFactors", "isAnomalous"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "analyze_payment" } },
        }),
      });

      if (!aiResponse.ok) {
        // AI unavailable - return safe defaults instead of failing
        console.warn(`AI gateway returned ${aiResponse.status}, using fallback`);
        return new Response(JSON.stringify({
          riskScore: 0,
          riskFactors: [],
          recommendation: null,
          suggestedSource: fundingSources?.[0]?.name || "Wallet",
          isAnomalous: false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        const analysis = JSON.parse(toolCall.function.arguments);
        
        // Store risk event if anomalous
        if (analysis.isAnomalous) {
          await supabase.from("risk_events").insert({
            user_id: user.id,
            event_type: "ai_anomaly_detected",
            severity: analysis.riskScore > 70 ? "high" : analysis.riskScore > 40 ? "medium" : "low",
            details: { amount, payeeName, analysis },
          });
        }

        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback
      return new Response(JSON.stringify({
        riskScore: 0,
        riskFactors: [],
        recommendation: null,
        suggestedSource: fundingSources?.[0]?.name || "Wallet",
        isAnomalous: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "generate_insights") {
      // Generate proactive insights for the user
      
      const transactionSummary = recentTransactions?.map(t => ({
        amount: t.amount,
        type: t.intent_type,
        merchant: t.merchant_name || t.recipient_name,
        status: t.status,
        date: t.created_at,
      })) || [];

      if (!lovableApiKey || transactionSummary.length < 5) {
        return new Response(JSON.stringify({ insights: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = `You are FLOW's quiet intelligence. Generate 1-3 helpful, personalized insights based on this user's payment history. Be like Apple - helpful, not annoying.

TRANSACTION HISTORY:
${JSON.stringify(transactionSummary, null, 2)}

FUNDING SOURCES:
${JSON.stringify(fundingSources?.map(f => ({ name: f.name, type: f.type, balance: f.balance })), null, 2)}

Generate insights that are:
- Actually useful (not generic)
- Based on real patterns in the data
- Actionable when possible
- Quietly helpful (not alarmist)

Examples of good insights:
- "You've paid RM 45 to Maxis monthly for the last 3 months. Set up auto-pay?"
- "Your Touch n Go balance is low. Top up before your next coffee run?"
- "You spent 40% less on food this week. Nice!"`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "generate_insights",
              description: "Generate personalized spending insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["spending_pattern", "prediction", "recommendation", "achievement"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        confidence: { type: "number", minimum: 0, maximum: 1 },
                        actionable: { type: "boolean" },
                      },
                      required: ["type", "title", "description"],
                    },
                  },
                },
                required: ["insights"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_insights" } },
        }),
      });

      if (!aiResponse.ok) {
        return new Response(JSON.stringify({ insights: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        const { insights } = JSON.parse(toolCall.function.arguments);
        
        // Store insights in database
        for (const insight of insights) {
          await supabase.from("ai_insights").insert({
            user_id: user.id,
            insight_type: insight.type,
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence || 0.5,
            metadata: { actionable: insight.actionable },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          });
        }

        return new Response(JSON.stringify({ insights }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ insights: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "smart_funding_recommendation") {
      // Recommend the best funding source for a payment
      const { amount } = context;

      const availableSources = fundingSources?.filter(f => f.available && f.linked_status === "linked") || [];
      
      // Simple logic: prefer wallet if sufficient, else bank
      const wallet = availableSources.find(f => f.type === "wallet" && f.balance >= amount);
      const bank = availableSources.find(f => f.type === "bank");
      const card = availableSources.find(f => f.type === "debit_card" || f.type === "credit_card");

      let recommended = wallet || bank || card || availableSources[0];
      let reason = "Best available option";

      if (wallet && wallet.balance >= amount) {
        reason = "Sufficient wallet balance, no fees";
      } else if (bank && amount > 100) {
        reason = "Direct bank transfer for larger amounts";
      } else if (card) {
        reason = "Card available as backup";
      }

      return new Response(JSON.stringify({
        recommended: recommended?.name || "Touch n Go",
        reason,
        needsTopup: wallet ? wallet.balance < amount : true,
        topupAmount: wallet ? Math.max(0, amount - wallet.balance) : amount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Intelligence error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
