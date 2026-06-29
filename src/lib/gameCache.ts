/**
 * gameCache.ts — localStorage-based cache for games, overrides, manual products, and banners.
 * TTL: 3 days. On first load: serve from cache instantly, then revalidate silently.
 * On cache miss / expiry: fetch fresh data and store.
 */

import { lootbarApi } from "@/lib/lootbar-api";
import { supabase } from "@/lib/supabase";
import type { LootbarGame } from "@/types";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// ── Key names ──────────────────────────────────────────────────────────────
const KEYS = {
  games: "noxy_games_v1",
  overrides: "noxy_game_overrides_v1",
  manualGames: "noxy_manual_games_v1",
  banners: "noxy_banners_v1",
  sections: "noxy_sections_v1",
};

// ── Generic read/write helpers ─────────────────────────────────────────────
function readCache<T>(key: string): { data: T; ts: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

function isStale(ts: number): boolean {
  return Date.now() - ts > THREE_DAYS_MS;
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

async function fetchGamesRaw(): Promise<LootbarGame[]> {
  return lootbarApi.getGames();
}

async function fetchOverridesRaw(): Promise<Array<{ game_id: string; custom_image_url: string | null; custom_name: string | null; is_hidden: boolean }>> {
  const { data } = await supabase.from("game_overrides").select("game_id, custom_image_url, custom_name, is_hidden");
  return data || [];
}

async function fetchManualGamesRaw(): Promise<LootbarGame[]> {
  const [{ data: prods }, { data: skuData }] = await Promise.all([
    supabase.from("manual_products").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("manual_skus").select("product_id, original_price, sale_price").eq("is_active", true),
  ]);
  if (!prods) return [];
  const skuMap = new Map<string, number>();
  (skuData || []).forEach((s: any) => {
    const price = Number(s.sale_price ?? s.original_price);
    const existing = skuMap.get(s.product_id);
    if (existing === undefined || price < existing) skuMap.set(s.product_id, price);
  });
  return prods.map((p: any) => ({
    game_id: p.id,
    game_name: p.product_name,
    game_image: p.photo_url || "",
    category: p.game_category || "Top Up",
    rating: 5.0,
    sold_count: "",
    is_hot: p.is_featured || false,
    discount: 0,
    min_price: skuMap.get(p.id) ?? null,
  }));
}

async function fetchBannersRaw() {
  const { data } = await supabase
    .from("home_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

async function fetchSectionsRaw() {
  const { data } = await supabase
    .from("home_sections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

// ── Merge utility ──────────────────────────────────────────────────────────

export type GameOverride = {
  game_id: string;
  custom_image_url: string | null;
  custom_name: string | null;
  is_hidden: boolean;
};

export function mergeGamesWithOverrides(
  games: LootbarGame[],
  overrides: GameOverride[]
): LootbarGame[] {
  const overrideMap = new Map<string, GameOverride>();
  overrides.forEach((o) => overrideMap.set(o.game_id, o));

  return games
    .filter((g) => !overrideMap.get(String(g.game_id))?.is_hidden)
    .map((g) => {
      const ov = overrideMap.get(String(g.game_id));
      return {
        ...g,
        game_image: ov?.custom_image_url || g.game_image,
        game_name: ov?.custom_name || g.game_name,
      };
    });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Load all games and overrides. Returns cached data instantly if fresh,
 * otherwise fetches fresh. After serving cached data, silently revalidates
 * in background if stale.
 */
export async function loadGames(
  onUpdate: (games: LootbarGame[], overrides: GameOverride[]) => void
): Promise<void> {
  const cachedGames = readCache<LootbarGame[]>(KEYS.games);
  const cachedOverrides = readCache<GameOverride[]>(KEYS.overrides);

  // Serve from cache immediately if available
  if (cachedGames && cachedOverrides) {
    onUpdate(cachedGames.data, cachedOverrides.data);

    // If either is stale, silently revalidate in background
    if (isStale(cachedGames.ts) || isStale(cachedOverrides.ts)) {
      setTimeout(async () => {
        try {
          const [freshGames, freshOverrides] = await Promise.all([
            fetchGamesRaw(),
            fetchOverridesRaw(),
          ]);
          writeCache(KEYS.games, freshGames);
          writeCache(KEYS.overrides, freshOverrides);
          onUpdate(freshGames, freshOverrides);
        } catch {
          // silent fail — use existing cache
        }
      }, 0);
    }
    return;
  }

  // Cache miss — fetch fresh data (blocking)
  try {
    const [freshGames, freshOverrides] = await Promise.all([
      fetchGamesRaw(),
      fetchOverridesRaw(),
    ]);
    writeCache(KEYS.games, freshGames);
    writeCache(KEYS.overrides, freshOverrides);
    onUpdate(freshGames, freshOverrides);
  } catch {
    // fallback: if cache is present but expired, still use it
    if (cachedGames && cachedOverrides) {
      onUpdate(cachedGames.data, cachedOverrides.data);
    }
  }
}

/**
 * Load manual games. Same cache-first + silent revalidation strategy.
 */
export async function loadManualGames(
  onUpdate: (games: LootbarGame[]) => void
): Promise<void> {
  const cached = readCache<LootbarGame[]>(KEYS.manualGames);

  if (cached) {
    onUpdate(cached.data);

    if (isStale(cached.ts)) {
      setTimeout(async () => {
        try {
          const fresh = await fetchManualGamesRaw();
          writeCache(KEYS.manualGames, fresh);
          onUpdate(fresh);
        } catch {
          // silent fail
        }
      }, 0);
    }
    return;
  }

  try {
    const fresh = await fetchManualGamesRaw();
    writeCache(KEYS.manualGames, fresh);
    onUpdate(fresh);
  } catch {
    if (cached) onUpdate((cached as any).data);
  }
}

/**
 * Load banners. Same cache-first + silent revalidation strategy.
 */
export async function loadBanners(
  onUpdate: (banners: any[]) => void
): Promise<void> {
  const cached = readCache<any[]>(KEYS.banners);

  if (cached) {
    onUpdate(cached.data);

    if (isStale(cached.ts)) {
      setTimeout(async () => {
        try {
          const fresh = await fetchBannersRaw();
          writeCache(KEYS.banners, fresh);
          onUpdate(fresh);
        } catch {
          // silent fail
        }
      }, 0);
    }
    return;
  }

  try {
    const fresh = await fetchBannersRaw();
    writeCache(KEYS.banners, fresh);
    onUpdate(fresh);
  } catch {
    if (cached) onUpdate((cached as any).data);
  }
}

/**
 * Load home sections. Same cache-first + silent revalidation strategy.
 */
export async function loadSections(
  onUpdate: (sections: any[]) => void
): Promise<void> {
  const cached = readCache<any[]>(KEYS.sections);

  if (cached) {
    onUpdate(cached.data);

    if (isStale(cached.ts)) {
      setTimeout(async () => {
        try {
          const fresh = await fetchSectionsRaw();
          writeCache(KEYS.sections, fresh);
          onUpdate(fresh);
        } catch {
          // silent fail
        }
      }, 0);
    }
    return;
  }

  try {
    const fresh = await fetchSectionsRaw();
    writeCache(KEYS.sections, fresh);
    onUpdate(fresh);
  } catch {
    if (cached) onUpdate((cached as any).data);
  }
}

/**
 * Invalidate all caches (call this after admin edits games/banners).
 */
export function invalidateGameCache() {
  Object.values(KEYS).forEach((key) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}
