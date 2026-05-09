import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOOTBAR_BASE = "https://api.lootbar.gg";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ─── Token Management ───────────────────────────────────────────────────────

async function getStoredToken(): Promise<{ token: string; callback_key: string } | null> {
  const { data, error } = await supabase
    .from("lootbar_tokens")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  // Token valid if not expiring in next 5 minutes
  if (data.expire_at > nowSec + 300) {
    console.log("[LootbarProxy] Using cached token, expires in", data.expire_at - nowSec, "s");
    return { token: data.token, callback_key: data.callback_key };
  }

  console.log("[LootbarProxy] Token expired or expiring soon, refreshing...");
  return null;
}

async function doLogin(): Promise<{ token: string; callback_key: string }> {
  const nickname = Deno.env.get("LOOTBAR_NICKNAME") ?? "";
  const email = Deno.env.get("LOOTBAR_EMAIL") ?? "";
  const password = Deno.env.get("LOOTBAR_PASSWORD") ?? "";

  console.log("[LootbarProxy] Logging in to Lootbar...");

  const resp = await fetch(`${LOOTBAR_BASE}/api/reseller/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "accept": "application/json" },
    body: JSON.stringify({ nickname, email, password }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Lootbar login failed: ${resp.status} ${errText}`);
  }

  const json = await resp.json();
  if (json.status !== "ok") throw new Error(`Lootbar login error: ${json.msg}`);

  const { token, callback_key, expire_at } = json.data;

  // Store token in DB (upsert row id=1)
  await supabase.from("lootbar_tokens").upsert({
    id: 1,
    token,
    callback_key,
    expire_at,
    updated_at: new Date().toISOString(),
  });

  console.log("[LootbarProxy] Login successful, token stored");
  return { token, callback_key };
}

async function getToken(): Promise<{ token: string; callback_key: string }> {
  const stored = await getStoredToken();
  if (stored) return stored;
  return doLogin();
}

// ─── Lootbar API Request ─────────────────────────────────────────────────────

async function lootbarRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const { token } = await getToken();

  const headers: Record<string, string> = {
    "Authorization": `PS ${token}`,
    "accept": "application/json",
    "Content-Type": "application/json",
  };

  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  console.log(`[LootbarProxy] ${method} ${LOOTBAR_BASE}${path}`);

  const resp = await fetch(`${LOOTBAR_BASE}${path}`, opts);
  const text = await resp.text();

  console.log(`[LootbarProxy] Response ${resp.status}: ${text.substring(0, 200)}`);

  if (!resp.ok) throw new Error(`Lootbar API error ${resp.status}: ${text}`);

  return JSON.parse(text);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();

    console.log(`[LootbarProxy] Action: ${action}`);

    let result: unknown;

    switch (action) {
      case "get_games": {
        const pageNum = params?.page_num ?? 1;
        const pageSize = params?.page_size ?? 100;
        result = await lootbarRequest("GET", `/api/reseller/games?page_num=${pageNum}&page_size=${pageSize}`);
        break;
      }

      case "get_skus": {
        if (!params?.game_id) throw new Error("game_id required");
        result = await lootbarRequest("GET", `/api/reseller/skus?game_id=${params.game_id}`);
        break;
      }

      case "create_order": {
        const { reference_id, game_id, sku_id, num, extra_info, callback_url } = params;
        if (!reference_id || !game_id || !sku_id) throw new Error("Missing required order fields");

        const orderBody = {
          reference_id,
          game_id,
          product: [{ sku_id, num: num ?? 1 }],
          extra_info: extra_info ?? {},
          callback_url: callback_url ?? `${Deno.env.get("SUPABASE_URL")}/functions/v1/lootbar-notify`,
        };

        result = await lootbarRequest("POST", "/api/reseller/create_order", orderBody);

        // Save order to DB
        if ((result as Record<string,unknown>)?.status === "ok") {
          const orderData = (result as Record<string,unknown>).data as Record<string,unknown>;
          await supabase.from("orders").upsert({
            reference_id,
            order_id: orderData?.order_id,
            game_id: params.game_id,
            game_name: params.game_name ?? "",
            sku_id: params.sku_id,
            sku_name: params.sku_name ?? "",
            quantity: params.num ?? 1,
            price: params.price ?? 0,
            state: 1,
            extra_info: params.extra_info ?? {},
            user_email: params.user_email ?? "",
            user_id: params.user_id ?? "",
          });
        }
        break;
      }

      case "query_order": {
        if (!params?.reference_id) throw new Error("reference_id required");
        result = await lootbarRequest("POST", "/api/reseller/query_order", {
          reference_id: params.reference_id,
        });

        // Update order state in DB
        if ((result as Record<string,unknown>)?.status === "ok") {
          const d = (result as Record<string,unknown>).data as Record<string,unknown>;
          await supabase.from("orders")
            .update({ state: d.state, order_id: d.order_id })
            .eq("reference_id", params.reference_id);
        }
        break;
      }

      case "query_asset": {
        result = await lootbarRequest("GET", "/api/reseller/query_asset");
        break;
      }

      case "check_token": {
        const { token, callback_key } = await getToken();
        result = { status: "ok", data: { valid: true, token_preview: token.slice(0, 8) + "..." } };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[LootbarProxy] Error:", err);
    return new Response(
      JSON.stringify({ status: "error", msg: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
