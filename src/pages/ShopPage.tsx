import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MOCK_GAMES } from "@/constants/mockData";
import { GameCard } from "@/components/features/GameCard";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { toast } from "sonner";

interface Store {
  id: string;
  store_name: string;
  store_link: string;
  tagline: string;
  avatar_url: string;
  banner_url: string;
  featured_game_id: string;
  game_ids: string[];
  social_links: Record<string, string>;
  orders_30d: number;
  income_30d: number;
}

export function ShopPage() {
  const { storeName } = useParams<{ storeName: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!storeName) return;
    supabase.from("affiliate_stores").select("*").eq("store_link", storeName).eq("is_active", true).single()
      .then(({ data }) => { if (data) setStore(data as Store); setIsLoading(false); });
  }, [storeName]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`https://noxystore.gg/shop/${storeName}`);
    setCopied(true);
    toast.success("Store link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const SOCIAL_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    youtube: { label: "YouTube", color: "#FF0000", icon: <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
    twitter: { label: "X", color: "#000000", icon: <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.257 5.629L18.244 2.25z"/></svg> },
    facebook: { label: "Facebook", color: "#1877F2", icon: <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    whatsapp: { label: "WhatsApp", color: "#25D366", icon: <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    discord: { label: "Discord", color: "#5865F2", icon: <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <div className="hidden lg:block"><DesktopHeader /></div>
        <div className="lg:hidden"><Header showBack title="Shop" /></div>
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="bg-white rounded-2xl h-48 animate-pulse mb-4" />
          <div className="bg-white rounded-2xl h-32 animate-pulse" />
        </div>
        <div className="lg:hidden"><BottomNav /></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center">
        <div className="hidden lg:block"><DesktopHeader /></div>
        <div className="text-center px-4">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-gray-500 mb-6">This store doesn't exist or has been deactivated.</p>
          <button onClick={() => navigate("/")} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 rounded-2xl">Go Home</button>
        </div>
      </div>
    );
  }

  const storeGames = MOCK_GAMES.filter(g => store.game_ids?.includes(g.game_id));
  const featuredGame = MOCK_GAMES.find(g => g.game_id === store.featured_game_id);
  const socialEntries = Object.entries(store.social_links || {}).filter(([k]) => !k.startsWith("custom_") && SOCIAL_LABELS[k]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="hidden lg:block"><DesktopHeader /></div>
      <div className="lg:hidden"><Header showBack title={store.store_name} /></div>

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-24 lg:pb-8">
        {/* Hero / Store Header */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          {/* Banner */}
          <div className="relative h-40 bg-gradient-to-br from-purple-700 to-blue-700">
            {store.banner_url && (
              <img src={store.banner_url} alt="banner" className="w-full h-full object-cover" />
            )}
            {/* Avatar */}
            <div className="absolute bottom-0 left-6 translate-y-1/2">
              {store.avatar_url ? (
                <img src={store.avatar_url} alt="avatar" className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-xl" />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                  {store.store_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="pt-12 px-6 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-black text-gray-900 text-xl">{store.store_name}</h1>
                {store.tagline && <p className="text-gray-500 text-sm mt-0.5">{store.tagline}</p>}
              </div>
              <button onClick={handleCopyLink} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {socialEntries.map(([key, username]) => {
                  const social = SOCIAL_LABELS[key];
                  if (!social || !username) return null;
                  return (
                    <a key={key} href={`https://${key === "twitter" ? "x.com" : key === "discord" ? "discord.gg" : `${key}.com`}/${username}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80" style={{ backgroundColor: social.color }}>
                      {social.icon}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Store stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="font-black text-gray-900 text-lg">{store.orders_30d || 0}</p>
                <p className="text-xs text-gray-500">30-Day Orders</p>
              </div>
              <div className="text-center">
                <p className="font-black text-orange-500 text-lg">${(store.income_30d || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500">30-Day Revenue</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <p className="font-black text-gray-900 text-lg">5.0</p>
                </div>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Game */}
        {featuredGame && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="font-bold text-gray-900 text-base mb-3">Featured Game</h2>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors" onClick={() => navigate(`/game/${featuredGame.game_id}`)}>
              <img src={featuredGame.game_image} alt={featuredGame.game_name} className="w-16 h-16 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=64&h=64&fit=crop"; }} />
              <div>
                <p className="font-bold text-gray-900">{featuredGame.game_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded">{featuredGame.rating}</span>
                  <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={10} className={i <= Math.floor(featuredGame.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />)}</div>
                  <span className="text-gray-400 text-xs">{featuredGame.sold_count} Sold</span>
                </div>
                {featuredGame.discount ? <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block">-{featuredGame.discount}%</span> : null}
              </div>
            </div>
          </div>
        )}

        {/* Best Sellers */}
        {storeGames.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="font-bold text-gray-900 text-base mb-3">Best Sellers</h2>
            <div className="grid grid-cols-3 gap-3">
              {storeGames.map((game) => (
                <GameCard key={game.game_id} game={game} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Store link */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-900 text-sm mb-2">Store Link</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 font-mono truncate">
              https://noxystore.gg/shop/{store.store_link}
            </div>
            <button onClick={handleCopyLink} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-3 rounded-xl transition-colors">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden"><BottomNav /></div>
    </div>
  );
}
