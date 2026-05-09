import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// SHA-1 signature verification (matches Lootbar Python reference)
async function computeSignature(
  method: string,
  pathQs: string,
  body: string,
  key: string
): Promise<string> {
  const strToSign = `${method.toUpperCase()}${pathQs}${body || ""}${key}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(strToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const rawBody = await req.text();
  const incomingSignature = req.headers.get("X-Inner-Authorization") ?? "";

  console.log("[LootbarNotify] Received callback");
  console.log("[LootbarNotify] Signature:", incomingSignature);
  console.log("[LootbarNotify] Body:", rawBody);

  // Get callback key from DB
  const { data: tokenRow } = await supabase
    .from("lootbar_tokens")
    .select("callback_key")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  const callbackKey = tokenRow?.callback_key ?? Deno.env.get("LOOTBAR_CALLBACK_KEY") ?? "";

  // Verify signature
  const pathQs = url.pathname + (url.search || "");
  const expectedSig = await computeSignature("POST", pathQs, rawBody, callbackKey);
  const isValid = expectedSig === incomingSignature;

  // Parse payload
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[LootbarNotify] Failed to parse body");
  }

  const { reference_id, order_id, state } = payload as {
    reference_id?: string;
    order_id?: string;
    state?: number;
  };

  // Log callback
  await supabase.from("callback_logs").insert({
    reference_id: reference_id ?? null,
    order_id: order_id ?? null,
    state: state ?? null,
    signature: incomingSignature,
    is_valid: isValid,
    raw_body: rawBody,
  });

  if (!isValid) {
    console.warn("[LootbarNotify] Invalid signature! Expected:", expectedSig);
    return new Response(JSON.stringify({ status: "error", msg: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update order state
  if (reference_id && state !== undefined) {
    const updateData: Record<string, unknown> = {
      state,
      callback_received_at: new Date().toISOString(),
    };
    if (order_id) updateData.order_id = order_id;

    await supabase.from("orders")
      .update(updateData)
      .eq("reference_id", reference_id);

    console.log(`[LootbarNotify] Updated order ${reference_id} state → ${state}`);
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
