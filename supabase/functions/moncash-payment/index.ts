/**
 * MonCash Payment Edge Function
 *
 * HOW TO GET YOUR MONCASH API KEYS:
 * ─────────────────────────────────
 * 1. Go to https://sandbox.moncashbutton.digicelgroup.com/Moncash-business/Register
 *    (sandbox for testing) or https://moncashbutton.digicelgroup.com for production.
 * 2. Register your business account.
 * 3. After approval, go to Dashboard → Business → API Keys.
 * 4. Copy your Client ID and Client Secret.
 * 5. In OnSpace Cloud → Secrets, add:
 *      MONCASH_CLIENT_ID     = your_client_id
 *      MONCASH_CLIENT_SECRET = your_client_secret
 *      MONCASH_ENV           = sandbox  (or "production")
 *
 * MonCash API Docs: https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";

const MONCASH_SANDBOX_BASE = "https://sandbox.moncashbutton.digicelgroup.com/Api";
const MONCASH_PROD_BASE = "https://moncashbutton.digicelgroup.com/Api";

async function getMoncashToken(clientId: string, clientSecret: string, isProd: boolean): Promise<string> {
  const base = isProd ? MONCASH_PROD_BASE : MONCASH_SANDBOX_BASE;
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(`${base}/oauth/token?grant_type=client_credentials&scope=read,write`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MonCash token error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, orderId, referenceId, userEmail, returnUrl } = await req.json();

    if (!amount || !orderId) {
      throw new Error("Missing required fields: amount or orderId");
    }

    const clientId = Deno.env.get("MONCASH_CLIENT_ID");
    const clientSecret = Deno.env.get("MONCASH_CLIENT_SECRET");
    const env = Deno.env.get("MONCASH_ENV") || "sandbox";
    const isProd = env === "production";

    if (!clientId || !clientSecret) {
      throw new Error("MonCash API keys not configured. Please add MONCASH_CLIENT_ID and MONCASH_CLIENT_SECRET in OnSpace Secrets.");
    }

    const base = isProd ? MONCASH_PROD_BASE : MONCASH_SANDBOX_BASE;

    // Get OAuth token
    const token = await getMoncashToken(clientId, clientSecret, isProd);

    // Create payment order
    const payRes = await fetch(`${base}/v1/CreatePayment`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount).toFixed(2),
        orderId: orderId,
      }),
    });

    if (!payRes.ok) {
      const errText = await payRes.text();
      throw new Error(`MonCash payment error: ${payRes.status} ${errText}`);
    }

    const payData = await payRes.json();
    const token_id = payData?.payment_token?.token;

    if (!token_id) {
      throw new Error("MonCash did not return a payment token");
    }

    const paymentUrl = isProd
      ? `https://moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect?token=${token_id}`
      : `https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect?token=${token_id}`;

    // Log transaction
    console.log(`[moncash-payment] Created payment for ${userEmail}, orderId=${orderId}, amount=${amount}, token=${token_id}`);

    // Update order to pending in DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("orders").update({
      state: 1, // pending payment
      updated_at: new Date().toISOString(),
    }).eq("reference_id", referenceId);

    return new Response(JSON.stringify({
      success: true,
      paymentUrl,
      tokenId: token_id,
      orderId,
      referenceId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[moncash-payment] Error:", error.message);
    return new Response(JSON.stringify({ error: `MonCash: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
