import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Shield, Zap, Headphones, ChevronDown, ChevronUp } from "lucide-react";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { MobileFooter } from "@/components/layout/MobileFooter";
import { FloatingChat } from "@/components/features/FloatingChat";
import { lootbarApi } from "@/lib/lootbar-api";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { CURRENCY_RATES } from "@/constants/translations";
import { useTranslation } from "@/hooks/useTranslation";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import type { LootbarGame, SkuItem } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────
const isUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface ManualProduct {
  id: string;
  product_name: string;
  photo_url: string | null;
  game_category: string;
  requires_server: boolean;
  requires_player_id: boolean;
  short_description: string;
  full_description: string;
}

interface ManualRegion {
  id: string;
  region_name: string;
  region_key: string;
  sort_order: number;
}

interface ManualSku {
  id: string;
  sku_name: string;
  original_price: number;
  sale_price: number | null;
  photo_url: string | null;
  region_id: string | null;
  sort_order: number;
}

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency } = useSettingsStore();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  // ── Product type detection ────────────────────────────────────────────────
  const isManual = gameId ? isUUID(gameId) : false;

  // ── Lootbar state ─────────────────────────────────────────────────────────
  const [lootbarGame, setLootbarGame] = useState<LootbarGame | null>(null);
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [markupPercent, setMarkupPercent] = useState(0);

  // ── Manual product state ──────────────────────────────────────────────────
  const [manualProduct, setManualProduct] = useState<ManualProduct | null>(null);
  const [manualRegions, setManualRegions] = useState<ManualRegion[]>([]);
  const [manualSkus, setManualSkus] = useState<ManualSku[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // ── Shared state ──────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // ── Price formatter ───────────────────────────────────────────────────────
  const fmt = (usd: number) => {
    const rate = CURRENCY_RATES[currency] ?? 1;
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", IDR: "Rp", MYR: "RM",
      SGD: "S$", THB: "฿", VND: "₫", PHP: "₱", BRL: "R$",
    };
    const sym = symbols[currency] ?? "$";
    const val = usd * rate;
    if (currency === "IDR" || currency === "VND") return `${sym}${Math.round(val).toLocaleString()}`;
    return `${sym}${val.toFixed(2)}`;
  };

  // ── Fetch markup ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from("markup_settings").select("markup_percent").eq("id", 1).single()
      .then(({ data }) => { if (data) setMarkupPercent(Number(data.markup_percent)); });
  }, []);

  // ── Fetch product data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    trackEvent("page_view", { page: `/game/${gameId}` });
    setIsLoading(true);

    if (isManual) {
      // Manual product
      Promise.all([
        supabase.from("manual_products").select("*").eq("id", gameId).single(),
        supabase.from("manual_product_regions").select("*").eq("product_id", gameId).order("sort_order"),
        supabase.from("manual_skus").select("*").eq("product_id", gameId).order("sort_order"),
      ]).then(([{ data: prod }, { data: regions }, { data: skusData }]) => {
        if (prod) setManualProduct(prod as ManualProduct);
        setManualRegions((regions as ManualRegion[]) || []);
        const skuList = (skusData as ManualSku[]) || [];
        setManualSkus(skuList);
        if (regions && regions.length > 0) setSelectedRegionId((regions as ManualRegion[])[0].id);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    } else {
      // Lootbar product
      Promise.all([
        lootbarApi.getGames().then(games => games.find(g => String(g.game_id) === String(gameId)) ?? null),
        supabase.from("sku_cache").select("*").eq("game_id", gameId).order("price"),
      ]).then(([game, { data: skuData }]) => {
        setLootbarGame(game);
        setSkus((skuData as unknown as SkuItem[]) || []);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, [gameId, isManual]);

  // ── Filtered SKUs by region (manual) ─────────────────────────────────────
  const filteredSkus = isManual
    ? (selectedRegionId
        ? manualSkus.filter(s => s.region_id === selectedRegionId)
        : manualSkus.filter(s => !s.region_id))
    : [];

  // ── Selected SKU ─────────────────────────────────────────────────────────
  const selectedLootbarSku = skus.find(s => String(s.sku_id) === selectedSkuId);
  const selectedManualSku = manualSkus.find(s => s.id === selectedSkuId);

  // ── Price with markup (Lootbar) ───────────────────────────────────────────
  const withMarkup = (price: number) => price * (1 + markupPercent / 100);

  // ── Game image & name ─────────────────────────────────────────────────────
  const gameName = isManual ? manualProduct?.product_name : lootbarGame?.game_name;
  const gameImage = isManual ? manualProduct?.photo_url : lootbarGame?.game_image;
  const requiresPlayerId = isManual ? manualProduct?.requires_player_id ?? true : true;
  const shortDesc = isManual ? manualProduct?.short_description : lootbarGame?.short_description ?? "";
  const fullDesc = isManual ? manualProduct?.full_description : lootbarGame?.full_description ?? "";

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!selectedSkuId) { toast.error("Please select a package"); return; }
    if (requiresPlayerId && !playerId.trim()) { toast.error("Please enter your Player ID"); return; }

    setIsOrdering(true);
    try {
      if (isManual && selectedManualSku) {
        const price = Number(selectedManualSku.sale_price ?? selectedManualSku.original_price);
        const refId = `NX-${Date.now()}`;
        await supabase.from("orders").insert({
          reference_id: refId,
          game_id: gameId,
          game_name: gameName,
          sku_id: selectedSkuId,
          sku_name: selectedManualSku.sku_name,
          price,
          state: 1,
          user_email: user?.email ?? null,
          user_id: user?.id ?? null,
          extra_info: { player_id: playerId, region_id: selectedRegionId },
        });
        toast.success("Order placed! Redirecting…");
        navigate(`/orders/${refId}`);
      } else if (selectedLootbarSku) {
        const price = withMarkup(Number(selectedLootbarSku.price));
        navigate("/checkout", {
          state: {
            gameId,
            gameName,
            gameImage,
            skuId: selectedSkuId,
            skuName: selectedLootbarSku.sku_name,
            price,
            playerId,
          },
        });
      }
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <div className="hidden lg:block"><DesktopHeader /></div>
        <div className="lg:hidden"><Header /></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!gameName) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Game not found</p>
        <button onClick={() => navigate("/")} className="text-yellow-600 font-semibold underline">Go Home</button>
      </div>
    );
  }

  // ── Render SKU grid ───────────────────────────────────────────────────────
  const renderSkuGrid = () => {
    if (isManual) {
      const list = filteredSkus.length > 0 ? filteredSkus : manualSkus.filter(s => !s.region_id);
      if (list.length === 0) return <p className="text-gray-400 text-sm">No packages available for this region.</p>;
      return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {list.map(sku => {
            const price = Number(sku.sale_price ?? sku.original_price);
            const orig = Number(sku.original_price);
            const discount = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
            const isSelected = selectedSkuId === sku.id;
            return (
              <button
                key={sku.id}
                onClick={() => setSelectedSkuId(sku.id)}
                className={`relative rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md ${
                  isSelected ? "border-yellow-400 shadow-lg" : "border-gray-200 bg-white"
                }`}
              >
                {sku.photo_url && (
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img src={sku.photo_url} alt={sku.sku_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1">{sku.sku_name}</p>
                  <p className="text-orange-500 font-black text-sm">{fmt(price)}</p>
                  {discount > 0 && <p className="text-gray-400 line-through text-xs">{fmt(orig)}</p>}
                </div>
                {discount > 0 && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    -{discount}%
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">✓</div>
                )}
              </button>
            );
          })}
        </div>
      );
    }

    // Lootbar SKUs
    if (skus.length === 0) return <p className="text-gray-400 text-sm">No packages available.</p>;
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {skus.map(sku => {
          const price = withMarkup(Number(sku.price));
          const orig = withMarkup(Number(sku.original_price ?? sku.price));
          const discount = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
          const isSelected = selectedSkuId === String(sku.sku_id);
          return (
            <button
              key={sku.sku_id}
              onClick={() => setSelectedSkuId(String(sku.sku_id))}
              className={`relative rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md ${
                isSelected ? "border-yellow-400 shadow-lg" : "border-gray-200 bg-white"
              }`}
            >
              {sku.image && (
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img src={sku.image} alt={sku.sku_name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3">
                <p className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1">{sku.sku_name}</p>
                <p className="text-orange-500 font-black text-sm">{fmt(price)}</p>
                {discount > 0 && <p className="text-gray-400 line-through text-xs">{fmt(orig)}</p>}
              </div>
              {discount > 0 && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  -{discount}%
                </div>
              )}
              {isSelected && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">✓</div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="hidden lg:block"><DesktopHeader /></div>
      <div className="lg:hidden"><Header /></div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-4 lg:py-8 pb-32 lg:pb-12">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* ── Left: game info + SKUs ── */}
          <div className="space-y-5">
            {/* Game Header */}
            <div className="bg-white rounded-2xl p-5 flex gap-4 items-start shadow-sm">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={gameImage || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=200&fit=crop"}
                  alt={gameName}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=200&fit=crop"; }}
                />
              </div>
              <div className="flex-1">
                <h1 className="text-xl lg:text-2xl font-black text-gray-900 mb-1">{gameName}</h1>
                {!isManual && lootbarGame && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} className={i <= Math.round(lootbarGame.rating ?? 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-yellow-500">{lootbarGame.rating?.toFixed(1)}</span>
                    {lootbarGame.sold_count && <span className="text-xs text-gray-400">• {lootbarGame.sold_count}</span>}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Zap size={12} className="text-yellow-500" /> Fast</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Shield size={12} className="text-green-500" /> Safe</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Headphones size={12} className="text-blue-500" /> 24/7</div>
                </div>
              </div>
            </div>

            {/* Region Tabs (manual only) */}
            {isManual && manualRegions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Region / Server</p>
                <div className="flex flex-wrap gap-2">
                  {manualRegions.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRegionId(r.id); setSelectedSkuId(null); }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        selectedRegionId === r.id
                          ? "bg-yellow-400 text-black"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {r.region_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SKU Grid */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Package</p>
              {renderSkuGrid()}
            </div>

            {/* Description */}
            {(shortDesc || fullDesc) && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-3">Product Information</h2>
                {shortDesc && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{shortDesc}</p>}
                {fullDesc && (
                  <>
                    {showFullDesc && (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mt-3">{fullDesc}</p>
                    )}
                    <button
                      onClick={() => setShowFullDesc(v => !v)}
                      className="mt-2 flex items-center gap-1 text-sm text-yellow-600 font-semibold hover:text-yellow-700"
                    >
                      {showFullDesc ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show More</>}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Right: order form ── */}
          <div className="mt-5 lg:mt-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-20">
              <h2 className="font-black text-gray-900 mb-4">Complete Order</h2>

              {/* Player ID */}
              {requiresPlayerId && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Player ID / UID
                  </label>
                  <input
                    type="text"
                    value={playerId}
                    onChange={e => setPlayerId(e.target.value)}
                    placeholder="Enter your in-game ID"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              )}

              {/* Selected summary */}
              {(selectedLootbarSku || selectedManualSku) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-0.5">Selected</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {selectedManualSku?.sku_name ?? selectedLootbarSku?.sku_name}
                  </p>
                  <p className="text-orange-500 font-black text-lg mt-0.5">
                    {selectedManualSku
                      ? fmt(Number(selectedManualSku.sale_price ?? selectedManualSku.original_price))
                      : fmt(withMarkup(Number(selectedLootbarSku!.price)))}
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isOrdering || !selectedSkuId}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl text-base transition-colors"
              >
                {isOrdering ? "Processing…" : "Buy Now"}
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Shield size={12} /> Secure</span>
                <span className="flex items-center gap-1"><Zap size={12} /> Instant</span>
                <span className="flex items-center gap-1"><Headphones size={12} /> Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile checkout bar */}
      {selectedSkuId && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-50 bg-white border-t shadow-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">Selected</p>
              <p className="font-bold text-sm text-gray-900 line-clamp-1">
                {selectedManualSku?.sku_name ?? selectedLootbarSku?.sku_name}
              </p>
              <p className="text-orange-500 font-black">
                {selectedManualSku
                  ? fmt(Number(selectedManualSku.sale_price ?? selectedManualSku.original_price))
                  : selectedLootbarSku ? fmt(withMarkup(Number(selectedLootbarSku.price))) : ""}
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isOrdering}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black px-6 py-3 rounded-2xl text-sm"
            >
              {isOrdering ? "…" : "Buy Now"}
            </button>
          </div>
        </div>
      )}

      <div className="hidden lg:block"><Footer /></div>
      <div className="lg:hidden"><MobileFooter /></div>
      <FloatingChat />
      <div className="lg:hidden"><BottomNav /></div>
    </div>
  );
}
