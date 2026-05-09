import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Zap, Shield, Clock, ChevronRight, Info, AlertCircle } from "lucide-react";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { FloatingChat } from "@/components/features/FloatingChat";
import { lootbarApi } from "@/lib/lootbar-api";
import { MOCK_GAMES } from "@/constants/mockData";
import type { LootbarGame, SkuItem } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { formatPrice } = useSettingsStore();

  const [game, setGame] = useState<LootbarGame | null>(null);
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState<SkuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [markup, setMarkup] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    // Track page view
    trackEvent("game_view", { page: `/game/${gameId}`, gameId });

    // Load game
    const foundGame = MOCK_GAMES.find((g) => g.game_id === gameId) || null;
    setGame(foundGame);

    // Load markup setting
    supabase.from("markup_settings").select("markup_percent").eq("id", 1).single().then(({ data }) => {
      if (data) setMarkup(Number(data.markup_percent) || 0);
    });

    // Load SKUs
    lootbarApi.getSkus(gameId).then((data) => {
      setSkus(data);
      if (data.length > 0) {
        const regions = [...new Set(data.map((s) => s.attribute[0]?.value || "global"))];
        setSelectedRegion(regions[0]);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    // Game-specific notice
    if (gameId === "1002" || gameId === "1001") {
      setNotice("Americas Area Topup may take 10 minutes. Longer during busy periods.");
    }
  }, [gameId]);

  const regions = useMemo(() => {
    const seen = new Set<string>();
    return skus.filter((s) => {
      const region = s.attribute[0]?.value;
      if (region && !seen.has(region)) { seen.add(region); return true; }
      return false;
    }).map((s) => ({ value: s.attribute[0]?.value, label: s.attribute[0]?.value_text || s.attribute[0]?.value }));
  }, [skus]);

  const filteredSkus = useMemo(() => {
    if (!selectedRegion) return skus;
    return skus.filter((s) => s.attribute[0]?.value === selectedRegion || s.attribute.length === 0);
  }, [skus, selectedRegion]);

  // Apply markup to price
  const applyMarkup = (price: number) => price * (1 + markup / 100);

  const totalPrice = selectedSku ? applyMarkup(selectedSku.price || 0) * quantity : 0;
  const totalSavings = selectedSku ? (selectedSku.discount_amount || 0) * quantity : 0;
  const originalPrice = selectedSku ? (selectedSku.original_price || selectedSku.price || 0) * quantity : 0;

  const handleTopUpNow = () => {
    if (!selectedSku) {
      toast.error("Please select a package first");
      return;
    }
    const extraInfoFields = selectedSku.extra_info || [];
    // Check if UID/extra info is needed
    if (extraInfoFields.length > 0) {
      // Go to verify player page first
      navigate("/verify-player", {
        state: { sku: { ...selectedSku, price: applyMarkup(selectedSku.price || 0) }, game, quantity },
      });
    } else {
      navigate("/checkout", {
        state: { sku: { ...selectedSku, price: applyMarkup(selectedSku.price || 0) }, game, quantity, extraInfo: {} },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="hidden lg:block"><DesktopHeader /></div>
        <div className="bg-dark-header px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => navigate(-1)} className="text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg></button>
          <span className="text-white font-bold">Top-up</span>
        </div>
        <div className="px-4 pt-4 space-y-4 max-w-[1280px] mx-auto">
          <div className="shimmer h-32 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // ─── Desktop Layout ────────────────────────────────────────────────────────
  const DesktopLayout = () => (
    <div className="hidden lg:block min-h-screen bg-[#f5f5f5]">
      <DesktopHeader />

      {/* Breadcrumb + trust */}
      <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate("/")} className="hover:text-gray-700">Home</button>
          <ChevronRight size={14} />
          <button onClick={() => navigate("/categories")} className="hover:text-gray-700">Top Up</button>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">{game?.game_name} Top Up</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-semibold">Excellent</span>
          <div className="flex gap-0.5">
            {Array.from({length:5}).map((_,i)=><div key={i} className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center"><Star size={10} fill="white" stroke="none" /></div>)}
          </div>
          <span className="text-sm text-gray-500">44,884 reviews on Trustpilot</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-16">
        <div className="flex gap-6">
          {/* Left: Game info + products */}
          <div className="flex-1 min-w-0">
            {/* Game header card */}
            <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
              <div className="flex items-start gap-4">
                <img
                  src={imgError ? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop" : (game?.game_image || "")}
                  alt={game?.game_name}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  onError={() => setImgError(true)}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-black text-gray-900 mb-1">{game?.game_name}</h1>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded">{game?.rating?.toFixed(1)}</span>
                          <div className="flex">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} fill="#FFD200" stroke="none" />)}</div>
                          <span className="text-sm text-gray-400">30,000+ reviews</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm text-gray-500">{game?.sold_count} Sold</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600"><Zap size={14} className="text-yellow-500" /> Fast</span>
                        <span className="flex items-center gap-1.5 text-gray-600"><Shield size={14} className="text-green-500" /> Safe</span>
                        <span className="flex items-center gap-1.5 text-gray-600"><Clock size={14} className="text-blue-500" /> 24/7</span>
                      </div>
                    </div>

                    {/* Promo banner (top right) */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl px-4 py-3 text-center hidden xl:block">
                      <div className="flex items-center gap-1 justify-center text-orange-600 font-mono text-sm font-bold mb-1">
                        <span>19</span><span>:</span><span>21</span><span>:</span><span>03</span>
                      </div>
                      <p className="text-xs text-gray-700">Invite Friends and Get <span className="text-orange-500 font-bold">3×10% OFF</span></p>
                      <button className="mt-2 bg-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-xl hover:bg-orange-500">Invite Now</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              {notice && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{notice}</p>
                  </div>
                  <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Region tabs */}
            {regions.length > 1 && (
              <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {regions.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => { setSelectedRegion(r.value); setSelectedSku(null); }}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        selectedRegion === r.value
                          ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SKU grid */}
            <div className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredSkus.map((sku) => {
                  const markedPrice = applyMarkup(sku.price || 0);
                  const savings = sku.discount_amount || 0;
                  const isSelected = selectedSku?.sku_id === sku.sku_id;
                  return (
                    <button
                      key={sku.sku_id}
                      onClick={() => setSelectedSku(sku)}
                      className={`relative flex flex-col bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-md text-left ${
                        isSelected ? "border-yellow-400 shadow-md" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* SKU image */}
                      <div className="aspect-[4/3] bg-gray-100">
                        <img
                          src={sku.image || game?.game_image}
                          alt={sku.sku_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=150&fit=crop"; }}
                        />
                      </div>
                      <button className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                        <Info size={10} className="text-gray-500" />
                      </button>

                      <div className="p-2.5">
                        <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 mb-1.5">{sku.sku_name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-orange-500">${markedPrice.toFixed(2)}</span>
                          {savings > 0 && (
                            <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              -${savings.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {savings > 0 && (
                          <p className="text-[10px] text-gray-400 line-through">${(sku.original_price || sku.price || 0).toFixed(2)}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top-up instructions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top-up instructions</h3>
              <h4 className="font-bold text-gray-900 mb-2">{game?.game_name} Top-up Guidance</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Please be sure to fill in the required information accurately to prevent your top-up from being delayed.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Top-up takes about 3–5 minutes. In special cases, the recharge arrival time may be delayed.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm mb-1">Applicable Platform</h5>
                  <p className="text-sm text-gray-500">Mobile game</p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm mb-1">Delivery Method</h5>
                  <p className="text-sm text-gray-500">Direct top-up via API</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sticky order panel */}
          <div className="w-72 flex-shrink-0">
            <div className="sticky top-20">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Order Information</h3>

                  {/* UID fields for selected SKU */}
                  {selectedSku && selectedSku.extra_info?.map((field) => (
                    <div key={field.name} className="mb-4">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                        *{field.title}
                      </label>
                      <input
                        type="text"
                        placeholder={field.placeholder || `Please fill in the game ${field.title}`}
                        className="w-full border border-red-300 focus:border-yellow-400 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-yellow-200 transition-colors"
                        readOnly
                        onClick={handleTopUpNow}
                      />
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        <AlertCircle size={10} className="inline mr-1" />{field.title} is required
                      </p>
                    </div>
                  ))}

                  {!selectedSku && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center text-sm text-gray-500 mb-4">
                      Select a package to continue
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor"><rect width="12" height="2" rx="1" /></svg>
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M7 1a1 1 0 00-2 0v4H1a1 1 0 000 2h4v4a1 1 0 002 0V7h4a1 1 0 000-2H7V1z" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">Price</span>
                    <span className="text-xl font-black text-orange-500">
                      {selectedSku ? `$${totalPrice.toFixed(2)}` : "—"}
                    </span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <button className="text-xs text-orange-500 font-semibold flex items-center gap-0.5">
                        Savings ${totalSavings.toFixed(2)} <ChevronRight size={10} />
                      </button>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={handleTopUpNow}
                    disabled={!selectedSku}
                    className={`w-full py-3.5 rounded-xl font-bold text-base transition-all mt-2 ${
                      selectedSku
                        ? "bg-yellow-400 hover:bg-yellow-300 text-black active:scale-[0.99]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Top-up Now
                  </button>

                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <Shield size={13} className="text-green-500" />
                    <span className="text-xs text-gray-500">NoxyStore Security Guarantee</span>
                    <span className="text-xs text-gray-400">24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingChat />
    </div>
  );

  // ─── Mobile Layout ─────────────────────────────────────────────────────────
  const MobileLayout = () => (
    <div className="lg:hidden bg-white min-h-screen">
      {/* Mobile Header */}
      <div className="bg-[#0a0a0a] sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            </button>
            <span className="text-white font-bold text-base">Top-up</span>
          </div>
          <div className="flex items-center gap-3 text-white/70 text-xs">
            <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> Fast</span>
            <span className="flex items-center gap-1"><Shield size={12} className="text-green-400" /> Safe</span>
            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-400" /> 24/7</span>
          </div>
        </div>
      </div>

      <div className="pb-40">
        {/* Game info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={imgError ? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop" : (game?.game_image || "")}
              alt={game?.game_name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              onError={() => setImgError(true)}
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{game?.game_name}</h1>
              <p className="text-sm text-gray-500">{game?.sold_count || "100k+"} Sold</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded">{game?.rating?.toFixed(1)}</span>
                <div className="flex">{Array.from({length:5}).map((_,i)=><Star key={i} size={12} fill="#FFD200" stroke="none" />)}</div>
                <span className="text-xs text-gray-400">30,349</span>
              </div>
            </div>
          </div>
          {/* Promo */}
          <div className="mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <div>
                <div className="flex items-center gap-1 text-orange-600 font-mono text-xs font-bold">
                  <span>19</span><span>:</span><span>12</span><span>:</span><span>40</span>
                </div>
                <p className="text-xs text-gray-700">Invite Friends and Get <span className="text-orange-500 font-bold">3×10% OFF</span> Discount</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
          </div>

          {notice && (
            <div className="mt-2 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
              <p className="text-xs text-gray-600">{notice}</p>
              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Region tabs */}
        {regions.length > 1 && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {regions.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setSelectedRegion(r.value); setSelectedSku(null); }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    selectedRegion === r.value
                      ? "border-yellow-400 text-yellow-600 bg-yellow-50"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SKU grid */}
        <div className="px-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {filteredSkus.map((sku) => {
              const markedPrice = applyMarkup(sku.price || 0);
              const savings = sku.discount_amount || 0;
              const isSelected = selectedSku?.sku_id === sku.sku_id;
              return (
                <button
                  key={sku.sku_id}
                  onClick={() => setSelectedSku(sku)}
                  className={`relative flex flex-col bg-white rounded-xl border-2 overflow-hidden text-left transition-all ${
                    isSelected ? "border-yellow-400 shadow-md" : "border-gray-200"
                  }`}
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    <img
                      src={sku.image || game?.game_image}
                      alt={sku.sku_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=150&fit=crop"; }}
                    />
                  </div>
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                    <Info size={10} className="text-gray-500" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 mb-1">{sku.sku_name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black text-orange-500">${markedPrice.toFixed(2)}</span>
                      {savings > 0 && (
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">-${savings.toFixed(2)}</span>
                      )}
                    </div>
                    {savings > 0 && <p className="text-[10px] text-gray-400 line-through">${(sku.original_price || sku.price || 0).toFixed(2)}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-up instructions */}
        <div className="px-4 mt-5">
          <h3 className="text-base font-bold text-gray-900 mb-2">Top-up instructions</h3>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h4 className="font-bold text-gray-900 mb-2">{game?.game_name} Top-up Guidance</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">Please be sure to fill in the required information accurately to prevent your top-up from being delayed.</p>
            <p className="text-sm text-gray-600 leading-relaxed">Top-up takes about 3–5 minutes. In special cases, the recharge arrival time may be delayed.</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-1">Applicable Platform</p>
              <p className="text-sm text-gray-500">Mobile game</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Quantity</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600">−</button>
            <span className="text-base font-bold w-6 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600">+</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {totalSavings > 0 && (
              <button className="flex items-center gap-1 text-orange-500 text-xs font-semibold mb-0.5">
                Savings ${totalSavings.toFixed(2)} <ChevronRight size={12} />
              </button>
            )}
            <p className="text-xl font-bold text-orange-500">
              {selectedSku ? `$${totalPrice.toFixed(2)}` : "—"}
            </p>
          </div>
          <button
            onClick={handleTopUpNow}
            disabled={!selectedSku}
            className={`px-8 py-3 rounded-2xl font-bold text-base transition-all ${
              selectedSku ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Top-up Now
          </button>
        </div>
      </div>

      <FloatingChat />
    </div>
  );

  return (
    <>
      <DesktopLayout />
      <MobileLayout />
    </>
  );
}
