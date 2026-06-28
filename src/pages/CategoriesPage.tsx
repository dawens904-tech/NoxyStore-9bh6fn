import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Star } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { lootbarApi } from "@/lib/lootbar-api";
import { useTranslation } from "@/hooks/useTranslation";
import type { LootbarGame } from "@/types";
import { supabase } from "@/lib/supabase";
import { FloatingChat } from "@/components/features/FloatingChat";
import { Footer } from "@/components/layout/Footer";
import { MobileFooter } from "@/components/layout/MobileFooter";

const CATEGORIES = ["All", "Top Up", "Game Coins", "Gift Card", "Game Keys", "Game Items"];

type SortMode = "recommended" | "latest";

export function CategoriesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter") || "All";
  const initialQuery = searchParams.get("q") || "";

  const [games, setGames] = useState<LootbarGame[]>([]);
  const [manualGames, setManualGames] = useState<LootbarGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialFilter);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");

  useEffect(() => {
    // Load Lootbar games + overrides (image + name) in parallel
    Promise.all([
      lootbarApi.getGames(),
      supabase.from("game_overrides").select("game_id, custom_image_url, custom_name, is_hidden"),
    ]).then(([data, { data: overrides }]) => {
      const overrideMap = new Map<string, { image?: string; name?: string }>();
      (overrides || []).forEach((o: any) => {
        overrideMap.set(o.game_id, {
          image: o.custom_image_url || undefined,
          name: o.custom_name || undefined,
        });
      });
      const merged = data
        .filter(g => {
          const ov = overrides?.find((o: any) => o.game_id === String(g.game_id));
          return !ov?.is_hidden;
        })
        .map(g => ({
          ...g,
          game_image: overrideMap.get(String(g.game_id))?.image || g.game_image,
          game_name: overrideMap.get(String(g.game_id))?.name || g.game_name,
        }));
      setGames(merged);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    // Fetch manual products
    Promise.all([
      supabase.from("manual_products").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("manual_skus").select("product_id, original_price, sale_price").eq("is_active", true),
    ]).then(([{ data: prods }, { data: skuData }]) => {
      if (!prods) return;
      const skuMap = new Map<string, number>();
      (skuData || []).forEach(s => {
        const price = Number(s.sale_price ?? s.original_price);
        const existing = skuMap.get(s.product_id);
        if (existing === undefined || price < existing) skuMap.set(s.product_id, price);
      });
      const converted: LootbarGame[] = prods.map(p => ({
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
      setManualGames(converted);
    });
  }, []);

  const allGames = [...manualGames, ...games];

  const filtered = allGames.filter((g) => {
    const matchCat = activeCategory === "All" || g.category === activeCategory;
    const matchSearch = !search || g.game_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "latest") return String(b.game_id).localeCompare(String(a.game_id));
    return (b.is_hot ? 1 : 0) - (a.is_hot ? 1 : 0);
  });

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = cat === "All"
      ? allGames.length
      : allGames.filter((g) => g.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <Header showMenu />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <div className="max-w-[1280px] mx-auto">
        {/* Filter Bar */}
        <div className="bg-white sticky top-[56px] z-30 border-b border-gray-100 shadow-sm">
          {/* Desktop title */}
          <div className="hidden lg:flex items-center gap-4 px-6 py-4">
            <h1 className="text-2xl font-black text-gray-900">{t("categories")}</h1>
            <span className="text-gray-400 font-medium">/ {activeCategory}</span>
          </div>

          {/* Search */}
          <div className="px-4 lg:px-6 pb-3 pt-3 lg:pt-0">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchGames")}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 px-4 lg:px-6 pb-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat} ({categoryCounts[cat] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Sort + Total */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 bg-white border-b border-gray-100">
          <p className="text-sm text-gray-500">Total {sorted.length} items</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortMode("recommended")}
              className={`text-sm font-semibold ${sortMode === "recommended" ? "text-yellow-600" : "text-gray-400"}`}
            >
              Recommended
            </button>
            <button
              onClick={() => setSortMode("latest")}
              className={`text-sm font-semibold ${sortMode === "latest" ? "text-yellow-600" : "text-gray-400"}`}
            >
              Latest
            </button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="px-4 lg:px-6 pt-4 pb-24">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="shimmer rounded-xl aspect-square" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="text-5xl mb-4">🎮</div>
              <p className="text-base font-medium text-gray-500">No products found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 lg:gap-4">
              {sorted.map((game) => (
                <button
                  key={game.game_id}
                  onClick={() => navigate(`/game/${game.game_id}`)}
                  className="flex flex-col text-left w-full"
                >
                  {/* Image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 mb-2">
                    <img
                      src={game.game_image || `https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=300&fit=crop`}
                      alt={game.game_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=300&fit=crop";
                      }}
                    />
                    {(game.discount ?? 0) > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        -{game.discount}%
                      </div>
                    )}
                    {game.is_hot && (
                      <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        HOT
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-1 mb-1">
                    {game.game_name}
                  </h3>

                  {/* Rating & Sold */}
                  {(game.rating != null || game.sold_count) && (
                    <div className="flex items-center gap-1">
                      {game.rating != null && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[11px] font-bold text-yellow-500">{game.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {game.rating != null && game.sold_count && <span className="text-[10px] text-gray-400">|</span>}
                      {game.sold_count && <span className="text-[10px] text-gray-400">{game.sold_count}</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block"><Footer /></div>
        <div className="lg:hidden"><MobileFooter /></div>
      </div>

      <FloatingChat />
      <BottomNav />
    </div>
  );
}
