import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  Star, ShoppingCart, ChevronDown, ChevronUp, Shield, Zap, Clock,
  ChevronRight, AlertCircle, Loader2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ManualProduct {
  id: string;
  product_name: string;
  game_category: string;
  photo_url: string | null;
  requires_server: boolean;
  requires_player_id: boolean;
  short_description: string;
  full_description: string;
  is_active: boolean;
  is_featured: boolean;
}

interface ManualRegion {
  id: string;
  region_name: string;
  region_key: string;
  sort_order: number;
}

interface ManualSku {
  id: string;
  product_id: string;
  region_id: string | null;
  sku_name: string;
  original_price: number;
  sale_price: number | null;
  photo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface LootbarCachedGame {
  game_id: string;
  game_name: string;
  game_image: string | null;
  category: string | null;
  rating: number | null;
  sold_count: string | null;
  is_hot: boolean;
  discount: number;
  short_description: string | null;
  full_description: string | null;
}

interface LootbarSku {
  game_id: string;
  sku_id: string;
  sku_name: string;
  price: number | null;
  original_price: number | null;
  discount_amount: number | null;
  attributes: unknown;
  extra_info: unknown;
  image: string | null;
}

interface MarkupSettings {
  markup_percent: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function applyMarkup(price: number, markupPct: number) {
  return price * (1 + markupPct / 100);
}

function fmt(price: number) {
  return `$${price.toFixed(2)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isManual = !!gameId && isUUID(gameId);

  // ─── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual product state
  const [manualProduct, setManualProduct] = useState<ManualProduct | null>(null);
  const [regions, setRegions] = useState<ManualRegion[]>([]);
  const [allSkus, setAllSkus] = useState<ManualSku[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ManualRegion | null>(null);

  // Lootbar state
  const [lootbarGame, setLootbarGame] = useState<LootbarCachedGame | null>(null);
  const [lootbarSkus, setLootbarSkus] = useState<LootbarSku[]>([]);
  const [loadingSkus, setLoadingSkus] = useState(false);

  // Common UI state
  const [selectedSku, setSelectedSku] = useState<ManualSku | LootbarSku | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [playerServer, setPlayerServer] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [markup, setMarkup] = useState(0);

  // ─── Load markup ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("markup_settings")
      .select("markup_percent")
      .eq("id", 1)
      .single()
      .then(({ data }: { data: MarkupSettings | null }) => {
        if (data) setMarkup(data.markup_percent);
      });
  }, []);

  // ─── Load Manual Product ──────────────────────────────────────────────────
  const loadManualProduct = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);

    const { data: product, error: pErr } = await supabase
      .from("manual_products")
      .select("*")
      .eq("id", gameId)
      .single();

    if (pErr || !product) {
      setError("Product not found");
      setLoading(false);
      return;
    }

    setManualProduct(product as ManualProduct);

    // Load regions if server required
    if (product.requires_server) {
      const { data: regData } = await supabase
        .from("manual_product_regions")
        .select("*")
        .eq("product_id", gameId)
        .eq("is_active", true)
        .order("sort_order");
      const regs = (regData as ManualRegion[]) || [];
      setRegions(regs);
      if (regs.length > 0) setSelectedRegion(regs[0]);
    }

    // Load all SKUs
    const { data: skuData } = await supabase
      .from("manual_skus")
      .select("*")
      .eq("product_id", gameId)
      .eq("is_active", true)
      .order("sort_order")
      .order("original_price");
    setAllSkus((skuData as ManualSku[]) || []);

    setLoading(false);
  }, [gameId]);

  // ─── Load Lootbar Product ─────────────────────────────────────────────────
  const loadLootbarProduct = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);

    const { data: game, error: gErr } = await supabase
      .from("games_cache")
      .select("*")
      .eq("game_id", gameId)
      .single();

    if (gErr || !game) {
      setError("Game not found in catalogue");
      setLoading(false);
      return;
    }

    setLootbarGame(game as LootbarCachedGame);
    setLoading(false);

    // Load SKUs from sku_cache
    setLoadingSkus(true);
    const { data: skuData } = await supabase
      .from("sku_cache")
      .select("*")
      .eq("game_id", gameId)
      .order("price");

    if (skuData && skuData.length > 0) {
      setLootbarSkus(skuData as LootbarSku[]);
    } else {
      // Try fetching from lootbar-proxy edge function
      try {
        const { data: proxyData, error: proxyErr } = await supabase.functions.invoke("lootbar-proxy", {
          body: { action: "get_skus", params: { game_id: gameId } },
        });
        if (!proxyErr && proxyData?.status === "ok" && proxyData.data?.items?.length) {
          const skus: LootbarSku[] = proxyData.data.items.map((s: {
            sku_id: string; sku_name: string; price?: number;
            original_price?: number; discount_amount?: number; image?: string;
          }) => ({
            game_id: gameId,
            sku_id: s.sku_id,
            sku_name: s.sku_name,
            price: s.price ?? null,
            original_price: s.original_price ?? null,
            discount_amount: s.discount_amount ?? null,
            attributes: [],
            extra_info: [],
            image: s.image ?? null,
          }));
          setLootbarSkus(skus);

          // Cache them for future use
          await supabase.from("sku_cache").upsert(
            skus.map((s) => ({
              game_id: s.game_id,
              sku_id: s.sku_id,
              sku_name: s.sku_name,
              price: s.price,
              original_price: s.original_price,
              discount_amount: s.discount_amount,
              attributes: s.attributes,
              extra_info: s.extra_info,
              image: s.image,
            })),
            { onConflict: "game_id,sku_id" }
          );
        }
      } catch (e) {
        console.warn("[GameDetailPage] Failed to fetch lootbar skus:", e);
      }
    }
    setLoadingSkus(false);
  }, [gameId]);

  useEffect(() => {
    if (isManual) {
      loadManualProduct();
    } else {
      loadLootbarProduct();
    }
  }, [isManual, loadManualProduct, loadLootbarProduct]);

  // ─── Derived: display SKUs ─────────────────────────────────────────────────
  const displaySkus: ManualSku[] = isManual
    ? manualProduct?.requires_server
      ? selectedRegion
        ? allSkus.filter((s) => s.region_id === selectedRegion.id)
        : []
      : allSkus.filter((s) => s.region_id === null)
    : [];

  // ─── Price helpers ─────────────────────────────────────────────────────────
  const getManualPrice = (sku: ManualSku) => {
    const base = sku.sale_price ?? sku.original_price;
    return applyMarkup(base, markup);
  };

  const getManualOldPrice = (sku: ManualSku) => {
    if (sku.sale_price != null) return applyMarkup(sku.original_price, markup);
    return null;
  };

  const getManualDiscount = (sku: ManualSku) => {
    if (sku.sale_price != null) {
      return Math.round(((sku.original_price - sku.sale_price) / sku.original_price) * 100);
    }
    return 0;
  };

  const getLootbarPrice = (sku: LootbarSku) => {
    const base = sku.price ?? sku.original_price ?? 0;
    return applyMarkup(base, markup);
  };

  const getLootbarOldPrice = (sku: LootbarSku) => {
    if (sku.discount_amount && sku.discount_amount > 0 && sku.original_price) {
      return applyMarkup(sku.original_price, markup);
    }
    return null;
  };

  const getLootbarDiscount = (sku: LootbarSku) => {
    if (sku.discount_amount && sku.discount_amount > 0 && sku.original_price && sku.price) {
      return Math.round(((sku.original_price - sku.price) / sku.original_price) * 100);
    }
    return 0;
  };

  // ─── Checkout ──────────────────────────────────────────────────────────────
  const handleTopUp = () => {
    if (!selectedSku) { toast.error("Please select a product"); return; }

    if (isManual) {
      const sku = selectedSku as ManualSku;
      const price = getManualPrice(sku);

      if (manualProduct?.requires_player_id && !playerId.trim()) {
        toast.error("Please enter your Player ID");
        return;
      }
      if (manualProduct?.requires_server && !selectedRegion) {
        toast.error("Please select a server");
        return;
      }

      navigate("/checkout", {
        state: {
          gameId: manualProduct!.id,
          gameName: manualProduct!.product_name,
          gameImage: manualProduct!.photo_url,
          skuId: sku.id,
          skuName: sku.sku_name,
          price,
          server: selectedRegion?.region_name ?? null,
          playerId: playerId.trim() || null,
          isManual: true,
        },
      });
    } else {
      const sku = selectedSku as LootbarSku;
      const price = getLootbarPrice(sku);

      if (!playerId.trim()) {
        toast.error("Please enter your Player ID");
        return;
      }

      navigate("/checkout", {
        state: {
          gameId: lootbarGame!.game_id,
          gameName: lootbarGame!.game_name,
          gameImage: lootbarGame!.game_image,
          skuId: sku.sku_id,
          skuName: sku.sku_name,
          price,
          server: playerServer || null,
          playerId: playerId.trim(),
          isManual: false,
        },
      });
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const gameName = isManual ? manualProduct?.product_name : lootbarGame?.game_name;
  const gameImage = isManual ? manualProduct?.photo_url : lootbarGame?.game_image;
  const gameRating = isManual ? 4.9 : (lootbarGame?.rating ?? 4.9);
  const gameSoldCount = isManual ? "1k+ Sold" : (lootbarGame?.sold_count ?? "1k+ Sold");
  const shortDesc = isManual ? manualProduct?.short_description : (lootbarGame?.short_description ?? "");
  const fullDesc = isManual ? manualProduct?.full_description : (lootbarGame?.full_description ?? "");
  const requiresPlayerId = isManual ? (manualProduct?.requires_player_id ?? true) : true;

  // ─── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <div className="md:hidden"><Header showBack title="Loading…" /></div>
        <div className="hidden md:block"><DesktopHeader /></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-yellow-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading product…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <div className="md:hidden"><Header showBack title="Error" /></div>
        <div className="hidden md:block"><DesktopHeader /></div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">{error}</h2>
            <button
              onClick={() => navigate(-1)}
              className="bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl mt-2"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main content ──────────────────────────────────────────────────────────
  const OrderInfoSidebar = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
      <h3 className="font-bold text-gray-800 text-sm mb-4">Order Information</h3>
      <ol className="space-y-3">
        {[
          { n: 1, title: "Select Product", desc: "Choose the amount you want to purchase." },
          { n: 2, title: "Enter ID", desc: requiresPlayerId ? "Enter your Player ID." : "No ID required." },
          { n: 3, title: "Payment", desc: "Select your preferred payment method." },
          { n: 4, title: "Top-up", desc: "Item will be added to your account shortly." },
        ].map((step) => (
          <li key={step.n} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-yellow-400 text-black text-xs font-black flex items-center justify-center flex-shrink-0">{step.n}</span>
            <div>
              <p className="text-xs font-bold text-gray-800">{step.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );

  const GameBanner = () => (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        {gameImage && <img src={gameImage} alt="" className="w-full h-full object-cover blur-sm scale-110" />}
      </div>
      <div className="relative z-10 flex items-end gap-4 px-4 py-5 md:px-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-white/20 flex-shrink-0 bg-gray-700">
          {gameImage ? (
            <img src={gameImage} alt={gameName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
          )}
        </div>
        <div className="pb-1">
          <h1 className="text-white font-black text-xl md:text-2xl leading-tight">{gameName}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <Shield size={12} className="text-green-400" />
              <span className="text-green-400 text-[11px] font-semibold">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} className="text-yellow-400" />
              <span className="text-yellow-400 text-[11px] font-semibold">Safe & Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-blue-400" />
              <span className="text-blue-400 text-[11px] font-semibold">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ServerTabs = () => {
    if (!isManual || !manualProduct?.requires_server || regions.length === 0) return null;
    return (
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Server</p>
        <div className="flex gap-2 flex-wrap">
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedRegion(r); setSelectedSku(null); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedRegion?.id === r.id
                  ? "bg-yellow-400 border-yellow-400 text-black"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {r.region_name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const ProductGrid = () => {
    if (isManual) {
      if (manualProduct?.requires_server && !selectedRegion) {
        return (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">Select a server above to see products</p>
          </div>
        );
      }
      if (displaySkus.length === 0) {
        return (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No products available yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {displaySkus.map((sku) => {
            const price = getManualPrice(sku);
            const oldPrice = getManualOldPrice(sku);
            const disc = getManualDiscount(sku);
            const isSelected = (selectedSku as ManualSku)?.id === sku.id;
            return (
              <button
                key={sku.id}
                onClick={() => setSelectedSku(isSelected ? null : sku)}
                className={`relative flex flex-col bg-white rounded-xl border-2 transition-all text-left overflow-hidden ${
                  isSelected
                    ? "border-yellow-400 shadow-md shadow-yellow-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {disc > 0 && (
                  <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10">
                    -{disc}%
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                  {sku.photo_url ? (
                    <img src={sku.photo_url} alt={sku.sku_name} className="w-full h-full object-cover" />
                  ) : manualProduct?.photo_url ? (
                    <img src={manualProduct.photo_url} alt={sku.sku_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">💎</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-gray-700 font-semibold leading-tight line-clamp-2 mb-1">{sku.sku_name}</p>
                  <p className="text-sm font-black text-orange-500">{fmt(price)}</p>
                  {oldPrice && (
                    <p className="text-[10px] text-gray-400 line-through">{fmt(oldPrice)}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // Lootbar SKUs
    if (loadingSkus) {
      return (
        <div className="text-center py-10">
          <Loader2 size={24} className="animate-spin text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading products…</p>
        </div>
      );
    }
    if (lootbarSkus.length === 0) {
      return (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">No products available — try syncing from Admin &gt; API Status</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {lootbarSkus.map((sku) => {
          const price = getLootbarPrice(sku);
          const oldPrice = getLootbarOldPrice(sku);
          const disc = getLootbarDiscount(sku);
          const isSelected = (selectedSku as LootbarSku)?.sku_id === sku.sku_id;
          return (
            <button
              key={sku.sku_id}
              onClick={() => setSelectedSku(isSelected ? null : sku)}
              className={`relative flex flex-col bg-white rounded-xl border-2 transition-all text-left overflow-hidden ${
                isSelected
                  ? "border-yellow-400 shadow-md shadow-yellow-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {disc > 0 && (
                <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10">
                  -{disc}%
                </div>
              )}
              {isSelected && (
                <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                {sku.image ? (
                  <img src={sku.image} alt={sku.sku_name} className="w-full h-full object-cover" />
                ) : gameImage ? (
                  <img src={gameImage} alt={sku.sku_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">💎</div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] text-gray-700 font-semibold leading-tight line-clamp-2 mb-1">{sku.sku_name}</p>
                <p className="text-sm font-black text-orange-500">{fmt(price)}</p>
                {oldPrice && (
                  <p className="text-[10px] text-gray-400 line-through">{fmt(oldPrice)}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const PlayerIdForm = () => {
    if (!requiresPlayerId) return null;
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            Player ID <span className="text-red-500">*</span>
          </label>
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="Enter your Player ID"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
          />
        </div>
        {!isManual && lootbarGame && (
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Server (optional)</label>
            <input
              value={playerServer}
              onChange={(e) => setPlayerServer(e.target.value)}
              placeholder="e.g., Asia, Global"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>
        )}
      </div>
    );
  };

  const DescriptionBlock = () => {
    if (!shortDesc && !fullDesc) return null;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Product Description</h3>
        <div className="text-sm text-gray-600 leading-relaxed">
          <p>{shortDesc}</p>
          {fullDesc && showFullDesc && (
            <p className="mt-3 whitespace-pre-line">{fullDesc}</p>
          )}
        </div>
        {fullDesc && (
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="flex items-center gap-1 text-yellow-600 font-bold text-xs mt-3 hover:text-yellow-700"
          >
            {showFullDesc ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All</>}
          </button>
        )}

        {/* Rating */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(gameRating ?? 4.9) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
              />
            ))}
          </div>
          <span className="text-sm font-black text-gray-800">{(gameRating ?? 4.9).toFixed(1)}</span>
          <span className="text-xs text-gray-400">{gameSoldCount}</span>
        </div>
      </div>
    );
  };

  // ─── Selected SKU info ─────────────────────────────────────────────────────
  const selectedPrice = selectedSku
    ? isManual
      ? getManualPrice(selectedSku as ManualSku)
      : getLootbarPrice(selectedSku as LootbarSku)
    : null;

  const selectedName = selectedSku
    ? isManual
      ? (selectedSku as ManualSku).sku_name
      : (selectedSku as LootbarSku).sku_name
    : null;

  // ─── Mobile Layout ─────────────────────────────────────────────────────────
  const MobileLayout = () => (
    <div className="md:hidden flex flex-col min-h-screen bg-[#f5f5f5]">
      <Header showBack title={gameName || "Product"} />

      <GameBanner />
      <ServerTabs />

      {/* Products grid */}
      <div className="px-3 pt-3 pb-4">
        <ProductGrid />
      </div>

      {/* Player ID form */}
      {(selectedSku || requiresPlayerId) && (
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-4">
          <PlayerIdForm />
        </div>
      )}

      {/* Description */}
      <div className="px-3 pb-4">
        <DescriptionBlock />
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        {selectedSku ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">{selectedName}</p>
              <p className="text-lg font-black text-orange-500">{selectedPrice ? fmt(selectedPrice) : ""}</p>
            </div>
            <button
              onClick={handleTopUp}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-3 rounded-2xl flex items-center gap-2 transition-colors"
            >
              <ShoppingCart size={16} /> Top Up Now
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-400 font-bold py-3.5 rounded-2xl text-sm"
          >
            Select a Product to Continue
          </button>
        )}
      </div>
      <div className="h-20" />
    </div>
  );

  // ─── Desktop Layout ────────────────────────────────────────────────────────
  const DesktopLayout = () => (
    <div className="hidden md:flex flex-col min-h-screen bg-[#f5f5f5]">
      <DesktopHeader />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <button onClick={() => navigate("/")} className="hover:text-gray-800">Home</button>
          <ChevronRight size={12} />
          <button onClick={() => navigate("/categories")} className="hover:text-gray-800">Top-up</button>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-semibold truncate max-w-[200px]">{gameName}</span>
        </div>
      </div>

      <GameBanner />

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-6 w-full flex gap-6">
        {/* Left: product grid + form */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <ServerTabs />
            <div className="p-5">
              <ProductGrid />
            </div>
          </div>

          {/* Player ID form (desktop inline) */}
          {requiresPlayerId && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-800 text-sm mb-4">Enter Player Information</h3>
              <PlayerIdForm />
              {selectedSku && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Selected</p>
                      <p className="text-sm font-bold text-gray-800">{selectedName}</p>
                    </div>
                    <p className="text-xl font-black text-orange-500">{selectedPrice ? fmt(selectedPrice) : ""}</p>
                  </div>
                  <button
                    onClick={handleTopUp}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <ShoppingCart size={16} /> Top Up Now
                  </button>
                </div>
              )}
            </div>
          )}

          {!requiresPlayerId && selectedSku && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Selected</p>
                  <p className="text-sm font-bold text-gray-800">{selectedName}</p>
                </div>
                <p className="text-xl font-black text-orange-500">{selectedPrice ? fmt(selectedPrice) : ""}</p>
              </div>
              <button
                onClick={handleTopUp}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <ShoppingCart size={16} /> Top Up Now
              </button>
            </div>
          )}

          <DescriptionBlock />
        </div>

        {/* Right: order info sidebar */}
        <div className="w-72 flex-shrink-0">
          <OrderInfoSidebar />
        </div>
      </div>

      <Footer />
    </div>
  );

  return (
    <>
      <MobileLayout />
      <DesktopLayout />
    </>
  );
}
