import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOOTBAR_BASE = "https://api.lootbar.gg";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ─── Token Management ────────────────────────────────────────────────────────

async function getStoredToken(): Promise<{ token: string; callback_key: string } | null> {
  const { data, error } = await supabase
    .from("lootbar_tokens")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const nowSec = Math.floor(Date.now() / 1000);
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
async function lootbarRequest(method: string, path: string, body?: unknown): Promise<unknown> {
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

  console.log(`[LootbarProxy] Response ${resp.status}: ${text.substring(0, 500)}`);

  if (!resp.ok) throw new Error(`Lootbar API error ${resp.status}: ${text}`);

  return JSON.parse(text);
}

// ─── Get games with caching ──────────────────────────────────────────────────
async function getGamesWithCache(pageNum: number, pageSize: number): Promise<unknown> {
  // Check DB cache — 1 hour TTL
  const { data: cached, error: cacheError } = await supabase
    .from("games_cache")
    .select("*")
    .order("game_name");

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  if (!cacheError && cached && cached.length > 0) {
    const cacheAge = cached[0]?.cached_at;
    if (cacheAge && cacheAge > oneHourAgo) {
      console.log("[LootbarProxy] Returning cached games:", cached.length);
      return {
        status: "ok",
        data: {
          items: cached.map((g: Record<string, unknown>) => ({
            game_id: g.game_id,
            game_name: g.game_name,
            game_image: g.game_image,
            category: g.category,
            rating: g.rating,
            sold_count: g.sold_count,
            is_hot: g.is_hot,
            discount: g.discount,
            min_price: g.min_price,
          })),
          page_num: pageNum,
          page_size: pageSize,
          total_count: cached.length,
          total_page: 1,
        }
      };
    }
  }

  // Fetch fresh from Lootbar API
  console.log("[LootbarProxy] Fetching fresh games from Lootbar API...");
  const result = await lootbarRequest("GET", `/api/reseller/games?page_num=1&page_size=200`) as Record<string, unknown>;

  if (result.status === "ok") {
    const data = result.data as Record<string, unknown>;
    const items = (data.items as Array<Record<string, unknown>>) || [];

    console.log("[LootbarProxy] Got", items.length, "games from API, caching...");

    const upsertData = items.map((game: Record<string, unknown>) => {
      const name = String(game.game_name || "").toLowerCase();
      let category = "Top Up";
      if (name.includes("gift") || name.includes("card") || name.includes("voucher") || name.includes("itunes") || name.includes("google play")) category = "Gift Card";
      else if (name.includes("coin") || name.includes("credit") || name.includes("gold") || name.includes("token")) category = "Game Coins";
      else if (name.includes("key") || name.includes("steam") || name.includes("epic") || name.includes("ubisoft")) category = "Game Keys";

      // Use real Lootbar image — the API returns game_image directly
      const rawImage = game.game_image || game.image_url || game.icon || game.thumb || null;
      const gameImage = rawImage ? String(rawImage) : null;

      const soldRaw = Number(game.sold_num || game.sold_count || 0);
      const soldCount = soldRaw > 100000
        ? `${Math.floor(soldRaw / 1000)}k+ Sold`
        : soldRaw > 1000 ? `${Math.floor(soldRaw / 1000)}k Sold`
        : soldRaw > 0 ? `${soldRaw} Sold` : "100k+ Sold";

      return {
        game_id: String(game.game_id),
        game_name: String(game.game_name),
        game_image: gameImage,
        category,
        rating: Number(game.rating || game.score || 5.0),
        sold_count: soldCount,
        is_hot: Boolean(game.is_hot || game.hot),
        discount: Number(game.discount || game.discount_percent || 0),
        // min_price will be updated separately when SKUs are fetched
        cached_at: new Date().toISOString(),
      };
    });

    if (upsertData.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < upsertData.length; i += batchSize) {
        await supabase.from("games_cache").upsert(upsertData.slice(i, i + batchSize));
      }
      console.log("[LootbarProxy] Cached", upsertData.length, "games");
    }

    return {
      status: "ok",
      data: {
        ...data,
        items: upsertData,
        total_count: upsertData.length,
      }
    };
  }

  return result;
}

// ─── Get SKUs — also updates min_price in games_cache ────────────────────────
async function getSkusWithMinPrice(gameId: string): Promise<unknown> {
  const result = await lootbarRequest("GET", `/api/reseller/skus?game_id=${gameId}`) as Record<string, unknown>;

  if (result.status === "ok") {
    const data = result.data as Record<string, unknown>;
    const items = (data.items as Array<Record<string, unknown>>) || [];

    // Calculate min price from SKUs
    const prices = items
      .map((sku: Record<string, unknown>) => Number(sku.price || sku.final_price || 0))
      .filter((p: number) => p > 0);

    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      // Update min_price in games_cache
      await supabase
        .from("games_cache")
        .update({ min_price: minPrice })
        .eq("game_id", gameId);
      console.log(`[LootbarProxy] Updated min_price for game ${gameId}: $${minPrice}`);
    }
  }

  return result;
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
        const pageSize = params?.page_size ?? 200;
        result = await getGamesWithCache(pageNum, pageSize);
        break;
      }

      case "get_skus": {
        if (!params?.game_id) throw new Error("game_id required");
        result = await getSkusWithMinPrice(params.game_id);
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

        if ((result as Record<string, unknown>)?.status === "ok") {
          const orderData = (result as Record<string, unknown>).data as Record<string, unknown>;
          await supabase.from("orders").upsert({
            reference_id,
            order_id: orderData?.order_id,
            game_id: params.game_id,
            game_name: params.game_name ?? "",
            sku_id: params.sku_id,
            sku_name: params.sku_name ?? "",
            quantity: params.num ?? 1,
            price: params.price ?? 0,
            base_price: params.base_price ?? 0,
            profit_amount: params.profit_amount ?? 0,
            markup_percent: params.markup_percent ?? 0,
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

        if ((result as Record<string, unknown>)?.status === "ok") {
          const d = (result as Record<string, unknown>).data as Record<string, unknown>;
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
        const { token } = await getToken();
        result = { status: "ok", data: { valid: true, token_preview: token.slice(0, 8) + "..." } };
        break;
      }

      case "clear_game_cache": {
        await supabase.from("games_cache").update({ cached_at: new Date(0).toISOString() }).neq("game_id", "");
        result = { status: "ok", msg: "Cache cleared, will refresh on next request" };
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
