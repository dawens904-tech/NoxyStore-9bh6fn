/**
 * fetch-game-images Edge Function
 *
 * Automatically finds and stores game cover images for games missing images.
 * Priority: RAWG Video Games DB → Unsplash fallback → skip
 *
 * Endpoint: POST /functions/v1/fetch-game-images
 * Body: { game_ids?: string[] }  — omit to process ALL missing-image games (max 50)
 *
 * Only fetches when game_image is null or empty string — never overwrites existing images.
 * Results are saved directly to games_cache.game_image.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const RAWG_API_KEY = Deno.env.get("RAWG_API_KEY") ?? "";
const RAWG_BASE = "https://api.rawg.io/api";

// Noise words to strip before searching
const NOISE_WORDS = [
  "top up", "topup", "top-up", "uc", "diamonds", "gems", "coins", "credits",
  "points", "tokens", "gold", "silver", "voucher", "gift card", "key",
  "steam", "epic", "ubisoft", "bundle", "pack", "recharge", "direct",
  "global", "asia", "eu", "us", "na", "sea", "official", "game", "mobile",
  "pc", "console", "online", "card", "code", "pin",
];

/** Remove noise words and clean up game name for search */
function normalizeGameName(name: string): string {
  let clean = name.toLowerCase();
  for (const noise of NOISE_WORDS) {
    clean = clean.replace(new RegExp(`\\b${noise}\\b`, "gi"), "");
  }
  // Remove parenthetical region tags like (SEA), (Global)
  clean = clean.replace(/\([^)]*\)/g, "");
  // Remove trailing numbers that look like amounts (e.g. "570 UC" → "")
  clean = clean.replace(/\b\d+\b/g, "");
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  return clean || name; // fallback to original if everything was stripped
}

/** Search RAWG by normalized game name, return best image URL */
async function fetchFromRAWG(gameName: string): Promise<string | null> {
  if (!RAWG_API_KEY) {
    console.warn("[FetchImages] RAWG_API_KEY not set, skipping RAWG");
    return null;
  }

  const query = normalizeGameName(gameName);
  const url = `${RAWG_BASE}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5&ordering=-rating`;

  try {
    const resp = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      console.warn(`[FetchImages] RAWG ${resp.status} for "${query}"`);
      return null;
    }

    const data = await resp.json() as {
      results?: Array<{
        name: string;
        background_image: string | null;
        rating: number;
      }>;
    };

    if (!data.results?.length) return null;

    // Pick the result with highest rating that has an image
    const best = data.results
      .filter((r) => r.background_image)
      .sort((a, b) => b.rating - a.rating)[0];

    if (!best?.background_image) return null;

    console.log(`[FetchImages] RAWG found "${best.name}" for "${gameName}"`);
    return best.background_image;

  } catch (e) {
    console.warn(`[FetchImages] RAWG error for "${gameName}":`, e);
    return null;
  }
}

/** Unsplash free CDN fallback — returns a gaming-themed image */
function getUnsplashFallback(gameName: string): string {
  const keywords = normalizeGameName(gameName);
  // Use Unsplash Source API with game-related search
  const searchTerm = encodeURIComponent(`${keywords} video game`);
  return `https://source.unsplash.com/featured/400x400?${searchTerm}`;
}

interface GameRow {
  game_id: string;
  game_name: string;
  game_image: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: { game_ids?: string[]; use_fallback?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // empty body OK
    }

    const { game_ids, use_fallback = true } = body;

    // Fetch games that need images
    let query = supabase
      .from("games_cache")
      .select("game_id, game_name, game_image");

    if (game_ids?.length) {
      query = query.in("game_id", game_ids);
    }

    // Only process games missing images
    const { data: games, error: fetchErr } = await query.limit(50);

    if (fetchErr) {
      return new Response(JSON.stringify({ status: "error", msg: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const missing: GameRow[] = (games ?? []).filter(
      (g: GameRow) => !g.game_image || g.game_image.trim() === ""
    );

    console.log(`[FetchImages] Processing ${missing.length} games with missing images`);

    const results: Array<{ game_id: string; game_name: string; status: string; image?: string }> = [];

    for (const game of missing) {
      let imageUrl: string | null = null;

      // 1. Try RAWG
      imageUrl = await fetchFromRAWG(game.game_name);

      // 2. Fallback to Unsplash
      if (!imageUrl && use_fallback) {
        imageUrl = getUnsplashFallback(game.game_name);
        console.log(`[FetchImages] Using Unsplash fallback for "${game.game_name}"`);
      }

      if (imageUrl) {
        // Save to database
        const { error: updateErr } = await supabase
          .from("games_cache")
          .update({ game_image: imageUrl })
          .eq("game_id", game.game_id);

        if (updateErr) {
          console.error(`[FetchImages] DB update failed for ${game.game_id}:`, updateErr);
          results.push({ game_id: game.game_id, game_name: game.game_name, status: "db_error" });
        } else {
          results.push({ game_id: game.game_id, game_name: game.game_name, status: "updated", image: imageUrl });
        }
      } else {
        results.push({ game_id: game.game_id, game_name: game.game_name, status: "not_found" });
      }

      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 150));
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const notFound = results.filter((r) => r.status === "not_found").length;

    console.log(`[FetchImages] Done: ${updated} updated, ${notFound} not found`);

    return new Response(
      JSON.stringify({
        status: "ok",
        total_processed: missing.length,
        updated,
        not_found: notFound,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[FetchImages] Unhandled error:", msg);
    return new Response(
      JSON.stringify({ status: "error", msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
