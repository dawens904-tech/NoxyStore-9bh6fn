/**
 * ff-lookup Edge Function
 * Free Fire player info lookup with dual-API strategy
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── CORS Headers (defini isit la pou pa depann nan lòt fichye) ────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Supported regions for HL Gaming fallback ──────────────────────────────────
const HL_REGIONS = ["ind", "br", "sg", "id", "us", "pk", "bd", "ru", "tw", "vn", "th", "me", "cis"];

// ── Helper: Gameskinbo API (primary) ─────────────────────────────────────────
async function lookupGameskinbo(uid: string): Promise<{ name: string; level: number; region: string } | null> {
  const apiKey = Deno.env.get("GAMESKINBO_API_KEY") || "2UvYv6OOhwFlujpc4AMFVjEW7Bkl2S6ZTmnx2uAn5EY";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(
      `https://api.gameskinbo.com/ff-info/get?uid=${uid}`,
      {
        headers: { "x-api-key": apiKey },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    
    if (!res.ok) return null;
    const data = await res.json();
    const name = data?.AccountInfo?.AccountName;
    if (!name) return null;
    return {
      name,
      level: data?.AccountInfo?.AccountLevel || 0,
      region: data?.AccountInfo?.AccountRegion || "unknown",
    };
  } catch (e) {
    console.error("Gameskinbo error:", e);
    return null;
  }
}

// ── Helper: HL Gaming API (fallback) ─────────────────────────────────────────
async function lookupHLGaming(uid: string): Promise<{ name: string; level: number; region: string } | null> {
  const useruid = Deno.env.get("HLGAMING_BUID") || "ZHZjplOjuNWpeYzQnT35F2GDN541";
  const apiKey  = Deno.env.get("HLGAMING_TOKEN") || "nqNAiBYSh2|AuJSkWlhOxWnllgALV3";

  for (const region of HL_REGIONS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const url = `https://proapis.hlgamingofficial.com/main/games/freefire/account/api?sectionName=AccountInfo&PlayerUid=${uid}&region=${region}&useruid=${encodeURIComponent(useruid)}&api=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.error) continue;
      const result = data?.result;
      const name = result?.AccountName;
      if (!name) continue;
      return {
        name,
        level: result?.AccountLevel || 0,
        region: result?.AccountRegion || region,
      };
    } catch {
      continue;
    }
  }
  return null;
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify it's a POST request
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON body with error handling
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { uid } = body;

    if (!uid || typeof uid !== "string" || uid.trim().length < 6) {
      return new Response(
        JSON.stringify({ error: "Invalid UID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanUid = uid.trim();
    console.log(`[ff-lookup] Looking up UID: ${cleanUid}`);

    // 1. Try Gameskinbo first
    let result = await lookupGameskinbo(cleanUid);
    let source = "gameskinbo";

    // 2. Fallback to HL Gaming if primary fails
    if (!result) {
      console.log("[ff-lookup] Gameskinbo failed, trying HL Gaming fallback…");
      result = await lookupHLGaming(cleanUid);
      source = "hlgaming";
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Player not found", uid: cleanUid }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ff-lookup] Found via ${source}: ${result.name} (Level ${result.level}, Region ${result.region})`);

    return new Response(
      JSON.stringify({ ...result, source }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ff-lookup] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
