/**
 * NatCash Payment Edge Function
 *
 * HOW TO GET YOUR NATCASH API KEYS:
 * ──────────────────────────────────
 * NatCash is operated by Natcom (National Telecom S.A.), Haiti's national telecom.
 *
 * Steps to get API access:
 * 1. Contact NatCash Business directly:
 *      Email:   business@natcom.ht  or  natcash@natcom.ht
 *      Phone:   +509 2813-7777
 *      Website: https://natcash.ht  (or https://natcom.ht → Services → NatCash)
 * 2. Request a "Merchant/Business API account".
 * 3. After approval you will receive:
 *      - Merchant ID
 *      - API Key / Secret Key
 *      - API Base URL (sandbox + production)
 * 4. In OnSpace Cloud → Secrets, add:
 *      NATCASH_MERCHANT_ID  = your_merchant_id
 *      NATCASH_API_KEY      = your_api_key
 *      NATCASH_ENV          = sandbox  (or "production")
 *
 * NOTE: NatCash does not have a public developer portal as of 2025.
 * You MUST contact them directly via email/phone for API credentials.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";

// NatCash API endpoints (update when you receive official URLs from Natcom)
const NATCASH_SANDBOX_BASE = "https://sandbox.natcash.ht/api/v1";
const NATCASH_PROD_BASE = "https://api.natcash.ht/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, orderId, referenceId, userEmail, phoneNumber, returnUrl } = await req.json();

    if (!amount || !orderId) {
      throw new Error("Missing required fields: amount or orderId");
    }

    const merchantId = Deno.env.get("NATCASH_MERCHANT_ID");
    const apiKey = Deno.env.get("NATCASH_API_KEY");
    const env = Deno.env.get("NATCASH_ENV") || "sandbox";
    const isProd = env === "production";

    if (!merchantId || !apiKey) {
      throw new Error("NatCash API keys not configured. Please add NATCASH_MERCHANT_ID and NATCASH_API_KEY in OnSpace Secrets. Contact NatCash Business at business@natcom.ht to get your credentials.");
    }

    const base = isProd ? NATCASH_PROD_BASE : NATCASH_SANDBOX_BASE;

    // Create NatCash payment request
    // NOTE: Update the endpoint and payload structure based on official API docs from Natcom
    const payRes = await fetch(`${base}/payment/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Merchant-ID": merchantId,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        order_id: orderId,
        amount: Number(amount).toFixed(2),
        currency: "HTG", // Haitian Gourde — adjust if USD supported
        phone_number: phoneNumber || "",
        description: `NoxyStore Order ${referenceId}`,
        return_url: returnUrl || "https://noxystore.gg/checkout/success",
        cancel_url: "https://noxystore.gg/checkout/cancel",
        webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/natcash-callback`,
      }),
    });

    if (!payRes.ok) {
      const errText = await payRes.text();
      throw new Error(`NatCash payment error: ${payRes.status} ${errText}`);
    }

    const payData = await payRes.json();
    const paymentUrl = payData?.payment_url || payData?.redirect_url;

    if (!paymentUrl) {
      throw new Error("NatCash did not return a payment URL");
    }

    console.log(`[natcash-payment] Created payment for ${userEmail}, orderId=${orderId}, amount=${amount}`);

    // Update order to pending in DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("orders").update({
      state: 1,
      updated_at: new Date().toISOString(),
    }).eq("reference_id", referenceId);

    return new Response(JSON.stringify({
      success: true,
      paymentUrl,
      orderId,
      referenceId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[natcash-payment] Error:", error.message);
    return new Response(JSON.stringify({ error: `NatCash: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
