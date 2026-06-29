import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      gameName,
      skuName,
      quantity,
      totalPrice,
      userEmail,
      successUrl,
      cancelUrl,
      referenceId,
    } = await req.json();

    if (!totalPrice || !userEmail) {
      throw new Error("Missing required fields: totalPrice or userEmail");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const amountInCents = Math.round(totalPrice * 100);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${skuName} — ${gameName}`,
              description: `Qty: ${quantity} | Ref: ${referenceId}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // No payment_method_types — Stripe auto-enables Apple Pay / Google Pay
      metadata: {
        reference_id: referenceId || "",
        game_name: gameName || "",
        sku_name: skuName || "",
      },
      success_url: successUrl || `${req.headers.get("origin")}/checkout/success?ref=${referenceId}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/checkout/cancel`,
    });

    console.log(`[stripe-checkout] Session created: ${session.id} for ${userEmail} amount=$${totalPrice}`);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[stripe-checkout] Error:", error.message);
    return new Response(JSON.stringify({ error: `Stripe: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
