import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// CORS headers - includes Capacitor origins for mobile app support
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * FLOW Protocol - Layer 2: Balance Sync
 * 
 * Screenshot Balance Reader - The "Secret Sauce"
 * 
 * User takes screenshot of their wallet app → FLOW AI extracts the balance.
 * No API needed. No partnerships. Just computer vision.
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

    // Auth check
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

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, walletHint } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Gemini Vision to extract wallet info from screenshot
    const prompt = `You are analyzing a screenshot of a Malaysian payment wallet app. Extract the following information:

TASK: Identify the wallet app and extract the main balance displayed.

Known Malaysian wallets:
- Touch 'n Go eWallet (TNG) - usually shows "RM" balance prominently
- GrabPay - green theme, shows "GrabPay balance"  
- Boost - orange theme, shows balance in RM
- MAE/Maybank2u - Maybank app
- ShopeePay - orange/white theme
- BigPay - blue theme

${walletHint ? `User hint: They believe this is ${walletHint}` : ''}

Extract:
1. The wallet app name (be specific)
2. The main balance amount (just the number, in MYR)
3. Your confidence level (0-1)
4. Any secondary balances visible (e.g., rewards, cashback)

If you cannot determine the balance clearly, set balance to null.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_wallet_balance",
            description: "Extract wallet name and balance from screenshot",
            parameters: {
              type: "object",
              properties: {
                walletName: { 
                  type: "string",
                  description: "Name of the wallet app (e.g., 'Touch n Go', 'GrabPay', 'Boost')"
                },
                balance: { 
                  type: "number",
                  description: "The main balance in MYR (null if unclear)"
                },
                currency: {
                  type: "string",
                  description: "Currency code (usually MYR)"
                },
                confidence: { 
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Confidence in the extraction (0-1)"
                },
                secondaryBalances: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      amount: { type: "number" }
                    }
                  },
                  description: "Any other balances visible (rewards, points, etc.)"
                },
                notes: {
                  type: "string",
                  description: "Any relevant notes about the extraction"
                }
              },
              required: ["walletName", "confidence"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_wallet_balance" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ 
        error: "Could not extract balance from image",
        walletName: null,
        balance: null,
        confidence: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extraction = JSON.parse(toolCall.function.arguments);
    
    // Log this extraction for audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "screenshot_balance_sync",
      entity_type: "funding_source",
      entity_id: null,
      payload: {
        wallet_detected: extraction.walletName,
        balance_extracted: extraction.balance,
        confidence: extraction.confidence,
      },
      current_hash: crypto.randomUUID(), // Will be computed by trigger
    });

    return new Response(JSON.stringify({
      success: true,
      ...extraction,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Screenshot balance error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to process screenshot" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
