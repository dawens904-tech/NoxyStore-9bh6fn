import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminSidebar from "./AdminSidebar";
import {
  Search, Star, ShoppingCart, Edit2, RefreshCw, Eye, EyeOff,
  ArrowUpDown, Tag, Flame, Image, X, Check, ChevronDown, ChevronUp,
  DollarSign, AlertCircle, Loader2, List, Upload
} from "lucide-react";
import { toast } from "sonner";
import { invalidateGameCache } from "@/lib/gameCache";

interface GameCache {
  game_id: string;
  game_name: string;
  game_image: string | null;
  category: string | null;
  rating: number | null;
  sold_count: string | null;
  is_hot: boolean | null;
  discount: number | null;
  min_price: number | null;
  requires_server: boolean | null;
  requires_player_id: boolean | null;
  short_description: string | null;
  full_description: string | null;
  sort_order: number | null;
  cached_at: string | null;
}

interface GameOverride {
  game_id: string;
  custom_price: number | null;
  category_override: string | null;
  custom_name: string | null;
  is_featured: boolean;
  is_hidden: boolean;
  sort_order: number;
  custom_image_url: string | null;
  slug?: string | null;
  custom_rating?: number | null;
}

type MergedGame = GameCache & {
  override?: GameOverride;
};

const CATEGORIES = ["Top Up", "Game Coins", "Gift Card", "Game Keys", "Game Items"];

export default function LootbarGameManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [games, setGames] = useState<MergedGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showHidden, setShowHidden] = useState(false);

  // Override modal
  const [editGame, setEditGame] = useState<MergedGame | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [overrideForm, setOverrideForm] = useState<{
    custom_name: string;
    custom_price: string;
    category_override: string;
    is_featured: boolean;
    is_hidden: boolean;
    sort_order: string;
    custom_image_url: string;
    slug: string;
    custom_rating: string;
  }>({
    custom_name: "",
    custom_price: "",
    category_override: "",
    is_featured: false,
    is_hidden: false,
    sort_order: "0",
    custom_image_url: "",
    slug: "",
    custom_rating: "",
  });

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user?.role !== "admin") { navigate("/"); return; }
    fetchGames();
  }, [user]);

  const fetchGames = async () => {
    setIsLoading(true);
    const [{ data: cacheData }, { data: overrideData }] = await Promise.all([
      supabase.from("games_cache").select("*").order("sort_order").order("game_name"),
      supabase.from("game_overrides").select("*"),
    ]);

    const overrideMap = new Map<string, GameOverride>();
    (overrideData || []).forEach((o: GameOverride) => overrideMap.set(o.game_id, o));

    const merged: MergedGame[] = (cacheData || []).map((g: GameCache) => ({
      ...g,
      override: overrideMap.get(g.game_id),
    }));

    setGames(merged);
    setIsLoading(false);
  };

  /**
   * Fetch ONLY new games from Lootbar — never overwrite existing images.
   * For each new game detected: download its image to Supabase Storage (banners bucket),
   * save the stored URL permanently in games_cache, and upsert game_overrides
   * so the stored URL is always displayed — even if Lootbar changes their CDN.
   */
  const handleSyncCache = async () => {
    setIsSyncing(true);
    toast.info("Fetching new games from Lootbar...");
    try {
      // Step 1: Get current game IDs in our DB (to detect new ones)
      const { data: existingRows } = await supabase.from("games_cache").select("game_id, game_image");
      const existingIds = new Set((existingRows || []).map((r: any) => r.game_id));
      // Only games that already have a stored image (non-lootbar URL saved to our storage)
      const storedImages = new Map<string, string>();
      (existingRows || []).forEach((r: any) => {
        if (r.game_image && r.game_image.includes(import.meta.env.VITE_SUPABASE_URL)) {
          storedImages.set(r.game_id, r.game_image);
        }
      });

      // Step 2: Sync game list from Lootbar proxy
      const { data: proxyData, error } = await supabase.functions.invoke("lootbar-proxy", {
        body: { action: "get_games", params: {} },
      });
      if (error) throw error;

      // Step 3: Get all games from cache after sync
      const { data: allGames } = await supabase.from("games_cache").select("game_id, game_name, game_image");
      const newGames = (allGames || []).filter((g: any) => !existingIds.has(g.game_id));

      if (newGames.length === 0) {
        toast.success(`No new games found. Cache refreshed (${existingIds.size} existing games unchanged).`);
        await fetchGames();
        setIsSyncing(false);
        return;
      }

      toast.info(`Found ${newGames.length} new games. Saving images permanently...`);

      // Step 4: For each new game, download & store image permanently
      let savedCount = 0;
      for (const game of newGames) {
        if (!game.game_image) continue;
        try {
          // Download original Lootbar image
          const imgResp = await fetch(game.game_image);
          if (!imgResp.ok) continue;
          const blob = await imgResp.blob();
          const ext = game.game_image.split(".").pop()?.split("?")[0] || "jpg";
          const storagePath = `games/${game.game_id}.${ext}`;

          // Upload to Supabase Storage (banners bucket)
          const { error: uploadErr } = await supabase.storage.from("banners")
            .upload(storagePath, blob, { contentType: blob.type || "image/jpeg", upsert: false });

          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("banners").getPublicUrl(storagePath);
            const storedUrl = urlData.publicUrl;

            // Save stored URL permanently in games_cache
            await supabase.from("games_cache").update({ game_image: storedUrl }).eq("game_id", game.game_id);

            // Also save in game_overrides so it never gets overwritten by future syncs
            await supabase.from("game_overrides").upsert(
              { game_id: game.game_id, custom_image_url: storedUrl,
                is_featured: false, is_hidden: false, sort_order: 0 },
              { onConflict: "game_id", ignoreDuplicates: true }
            );
            savedCount++;
          }
        } catch (imgErr) {
          console.warn(`Failed to store image for ${game.game_name}:`, imgErr);
        }
      }

      toast.success(`✅ ${newGames.length} new games added, ${savedCount} images stored permanently. ${existingIds.size} existing games untouched.`);
      await fetchGames();
    } catch (err: any) {
      toast.error("Sync failed: " + (err.message || "Unknown error"));
    } finally {
      setIsSyncing(false);
    }
  };

  const openOverrideModal = (game: MergedGame) => {
    setEditGame(game);
    setOverrideForm({
      custom_name: game.override?.custom_name ?? "",
      custom_price: game.override?.custom_price != null ? String(game.override.custom_price) : "",
      category_override: game.override?.category_override ?? "",
      is_featured: game.override?.is_featured ?? false,
      is_hidden: game.override?.is_hidden ?? false,
      sort_order: String(game.override?.sort_order ?? game.sort_order ?? 0),
      custom_image_url: game.override?.custom_image_url ?? "",
      slug: (game.override as any)?.slug ?? "",
      custom_rating: (game.override as any)?.custom_rating != null ? String((game.override as any).custom_rating) : "",
    });
  };

  const handlePhotoUpload = async (file: File) => {
    if (!editGame) return;
    setIsUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `games/${editGame.game_id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("banners")
        .upload(storagePath, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(storagePath);
      setOverrideForm(f => ({ ...f, custom_image_url: urlData.publicUrl }));
      toast.success("Photo uploaded successfully");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!editGame) return;
    const customImageUrl = overrideForm.custom_image_url || null;
    const customName = overrideForm.custom_name.trim() || null;
    const slug = overrideForm.slug.trim().replace(/^\/+/, "").replace(/\s+/g, "-").toLowerCase() || null;
    const customRating = overrideForm.custom_rating !== "" ? Number(overrideForm.custom_rating) : null;
    if (customRating !== null && (customRating < 0 || customRating > 5)) {
      toast.error("Rating must be between 0.0 and 5.0");
      return;
    }
    const payload: Partial<GameOverride> = {
      game_id: editGame.game_id,
      custom_name: customName,
      custom_price: overrideForm.custom_price !== "" ? Number(overrideForm.custom_price) : null,
      category_override: overrideForm.category_override || null,
      is_featured: overrideForm.is_featured,
      is_hidden: overrideForm.is_hidden,
      sort_order: Number(overrideForm.sort_order),
      custom_image_url: customImageUrl,
      slug,
      custom_rating: customRating,
    };

    const { error } = await supabase
      .from("game_overrides")
      .upsert(payload as GameOverride, { onConflict: "game_id" });

    if (error) {
      toast.error("Failed to save override: " + error.message);
      return;
    }

    // Persist custom image + custom name in games_cache so all pages show the admin-set values.
    const cacheUpdate: Record<string, unknown> = {};
    if (customImageUrl) cacheUpdate.game_image = customImageUrl;
    if (customName) cacheUpdate.game_name = customName;
    if (Object.keys(cacheUpdate).length > 0) {
      await supabase
        .from("games_cache")
        .update(cacheUpdate)
        .eq("game_id", editGame.game_id);
    }

    toast.success(`Override saved for ${editGame.game_name}`);
    invalidateGameCache(); // force frontend cache refresh on next page visit
    setEditGame(null);
    await fetchGames();
  };

  const toggleHidden = async (game: MergedGame) => {
    const newHidden = !(game.override?.is_hidden ?? false);
    const { error } = await supabase
      .from("game_overrides")
      .upsert(
        {
          game_id: game.game_id,
          is_hidden: newHidden,
          is_featured: game.override?.is_featured ?? false,
          sort_order: game.override?.sort_order ?? 0,
        } as GameOverride,
        { onConflict: "game_id" }
      );
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success(newHidden ? `${game.game_name} hidden` : `${game.game_name} visible`);
    setGames(prev =>
      prev.map(g =>
        g.game_id === game.game_id
          ? { ...g, override: { ...(g.override ?? { game_id: g.game_id, custom_price: null, category_override: null, is_featured: false, is_hidden: false, sort_order: 0, custom_image_url: null }), is_hidden: newHidden } }
          : g
      )
    );
  };

  const toggleFeatured = async (game: MergedGame) => {
    const newFeatured = !(game.override?.is_featured ?? false);
    const { error } = await supabase
      .from("game_overrides")
      .upsert(
        {
          game_id: game.game_id,
          is_featured: newFeatured,
          is_hidden: game.override?.is_hidden ?? false,
          sort_order: game.override?.sort_order ?? 0,
        } as GameOverride,
        { onConflict: "game_id" }
      );
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success(newFeatured ? `${game.game_name} featured` : `${game.game_name} unfeatured`);
    setGames(prev =>
      prev.map(g =>
        g.game_id === game.game_id
          ? { ...g, override: { ...(g.override ?? { game_id: g.game_id, custom_price: null, category_override: null, is_featured: false, is_hidden: false, sort_order: 0, custom_image_url: null }), is_featured: newFeatured } }
          : g
      )
    );
  };

  const filteredGames = games.filter(g => {
    if (!showHidden && g.override?.is_hidden) return false;
    if (filterCategory !== "All") {
      const cat = g.override?.category_override ?? g.category ?? "";
      if (cat !== filterCategory) return false;
    }
    return g.game_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: games.length,
    hidden: games.filter(g => g.override?.is_hidden).length,
    featured: games.filter(g => g.override?.is_featured).length,
    overridden: games.filter(g => g.override?.custom_price != null).length,
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <div className="ml-64 flex-1 py-8">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-1">Lootbar Game Management</h1>
              <p className="text-gray-500 text-sm">Manage visibility, pricing overrides, and display settings for Lootbar API games</p>
            </div>
            <Button
              onClick={handleSyncCache}
              disabled={isSyncing}
              className="gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0"
            >
              {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isSyncing ? "Syncing..." : "Sync from Lootbar"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Games", value: stats.total, icon: <ShoppingCart size={18} />, color: "text-blue-600 bg-blue-50" },
              { label: "Featured", value: stats.featured, icon: <Flame size={18} />, color: "text-orange-600 bg-orange-50" },
              { label: "Hidden", value: stats.hidden, icon: <EyeOff size={18} />, color: "text-gray-600 bg-gray-100" },
              { label: "Price Override", value: stats.overridden, icon: <DollarSign size={18} />, color: "text-green-600 bg-green-50" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl bg-white"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {["All", ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterCategory === cat
                      ? "bg-yellow-400 text-black"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowHidden(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                showHidden ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {showHidden ? <Eye size={13} /> : <EyeOff size={13} />}
              {showHidden ? "Hide Hidden" : "Show Hidden"}
            </button>

            <span className="text-xs text-gray-400 font-medium ml-auto">{filteredGames.length} games</span>
          </div>

          {/* Game Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="shimmer h-40 w-full" />
                  <div className="p-3 space-y-2">
                    <div className="shimmer h-4 w-3/4 rounded" />
                    <div className="shimmer h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredGames.map(game => {
                const isHidden = game.override?.is_hidden ?? false;
                const isFeatured = game.override?.is_featured ?? false;
                const hasCustomPrice = game.override?.custom_price != null;
                const displayImage = game.override?.custom_image_url || game.game_image;
                const displayCategory = game.override?.category_override || game.category;
                const displayPrice = game.override?.custom_price ?? game.min_price;

                return (
                  <div
                    key={game.game_id}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                      isHidden ? "opacity-50 border-gray-100" : "border-gray-100 hover:shadow-md"
                    } ${isFeatured ? "ring-2 ring-yellow-400" : ""}`}
                  >
                    {/* Image */}
                    <div className="relative h-36 bg-gray-100 overflow-hidden">
                      <img
                        src={displayImage || `https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=200&fit=crop`}
                        alt={game.game_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=200&fit=crop`; }}
                      />
                      {/* Badges */}
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                        {isFeatured && (
                          <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Flame size={8} /> HOT
                          </span>
                        )}
                        {isHidden && (
                          <span className="bg-gray-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <EyeOff size={8} /> HIDDEN
                          </span>
                        )}
                        {hasCustomPrice && (
                          <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <DollarSign size={8} /> OVERRIDE
                          </span>
                        )}
                      </div>
                      {(game.discount ?? 0) > 0 && (
                        <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          -{game.discount}%
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-1">{game.game_name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{displayCategory}</span>
                        {displayPrice != null && (
                          <span className={`text-[11px] font-black ${hasCustomPrice ? "text-green-600" : "text-orange-500"}`}>
                            ${Number(displayPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {game.rating != null && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={10} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] text-gray-500">{Number(game.rating).toFixed(1)}</span>
                          {game.sold_count && (
                            <>
                              <span className="text-[10px] text-gray-300">·</span>
                              <span className="text-[10px] text-gray-400">{game.sold_count}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-1 mb-1">
                        {game.requires_server ? (
                          <button
                            onClick={() => navigate(`/secure-dashboard-92x2011/games/${game.game_id}/servers`)}
                            className="flex items-center justify-center gap-0.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold transition-all col-span-2"
                          >
                            <List size={10} /> Manage Servers
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/secure-dashboard-92x2011/lootbar-games/${game.game_id}/skus`)}
                            className="flex items-center justify-center gap-0.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-all col-span-2"
                          >
                            <List size={10} /> Manage Regions & SKUs
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => openOverrideModal(game)}
                          className="flex items-center justify-center gap-0.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition-all"
                        >
                          <Edit2 size={10} /> Edit
                        </button>
                        <button
                          onClick={() => toggleFeatured(game)}
                          className={`flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            isFeatured ? "bg-yellow-400 text-black" : "bg-gray-100 hover:bg-yellow-100 text-gray-600"
                          }`}
                        >
                          <Flame size={10} /> Hot
                        </button>
                        <button
                          onClick={() => toggleHidden(game)}
                          className={`flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            isHidden ? "bg-gray-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                          }`}
                        >
                          {isHidden ? <Eye size={10} /> : <EyeOff size={10} />}
                          {isHidden ? "Show" : "Hide"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && filteredGames.length === 0 && (
            <div className="text-center py-16">
              <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No games found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or sync from Lootbar API</p>
            </div>
          )}
        </div>
      </div>

      {/* Override Modal */}
      <Dialog open={!!editGame} onOpenChange={(open) => { if (!open) setEditGame(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 size={16} />
              Override: {editGame?.game_name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-4 py-1">
              {/* Preview */}
              {(overrideForm.custom_image_url || editGame?.game_image) && (
                <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
                  <img
                    src={overrideForm.custom_image_url || editGame?.game_image || ""}
                    alt={editGame?.game_name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=64&h=64&fit=crop`; }}
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{editGame?.game_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Game ID: {editGame?.game_id}</p>
                    <p className="text-xs text-gray-400">Cached: {editGame?.cached_at ? new Date(editGame.cached_at).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
              )}

              {/* Custom Game Name */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5"><Edit2 size={13} /> Custom Game Name</Label>
                <Input
                  value={overrideForm.custom_name}
                  onChange={(e) => setOverrideForm(f => ({ ...f, custom_name: e.target.value }))}
                  placeholder={`Original: ${editGame?.game_name}`}
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Overrides the game name everywhere (Home, Categories, Detail page).</p>
              </div>

              {/* Custom Image URL + Upload */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5"><Image size={13} /> Custom Game Image</Label>
                <Input
                  value={overrideForm.custom_image_url}
                  onChange={(e) => setOverrideForm(f => ({ ...f, custom_image_url: e.target.value }))}
                  placeholder="Paste URL or upload a photo below"
                  className="text-sm mb-2"
                />
                {/* Upload button */}
                <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  isUploadingPhoto ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-yellow-400 hover:bg-yellow-50"
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
                  />
                  {isUploadingPhoto ? (
                    <><Loader2 size={15} className="animate-spin text-yellow-500" /><span className="text-sm text-yellow-600 font-medium">Uploading...</span></>
                  ) : (
                    <><Upload size={15} className="text-gray-400" /><span className="text-sm text-gray-500 font-medium">Upload photo from device</span></>
                  )}
                </label>
                <p className="text-xs text-gray-400 mt-1">Upload a JPG/PNG/WebP image or paste a URL. Overrides the Lootbar image everywhere.</p>
              </div>

              {/* Category Override */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5"><Tag size={13} /> Category Override</Label>
                <select
                  value={overrideForm.category_override}
                  onChange={(e) => setOverrideForm(f => ({ ...f, category_override: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Use Lootbar category ({editGame?.category})</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Custom Slug */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5"><ChevronDown size={13} className="rotate-90 text-blue-500" /> Custom URL Slug</Label>
                <Input
                  value={overrideForm.slug}
                  onChange={(e) => setOverrideForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="e.g. topup/free-fire"
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Sets a custom URL: /topup/your-slug or /top-up/your-slug. Leave empty to use default /game/ID.</p>
              </div>

              {/* Custom Rating */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5"><Star size={13} className="text-yellow-400" /> Custom Rating (0.0–5.0)</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={overrideForm.custom_rating}
                  onChange={(e) => setOverrideForm(f => ({ ...f, custom_rating: e.target.value }))}
                  placeholder="e.g. 4.8 (leave empty for default)"
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Overrides the star rating shown on game cards and detail pages.</p>
              </div>

              {/* Custom Price */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5"><DollarSign size={13} /> Custom Price (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={overrideForm.custom_price}
                  onChange={(e) => setOverrideForm(f => ({ ...f, custom_price: e.target.value }))}
                  placeholder={`Lootbar price: $${editGame?.min_price != null ? Number(editGame.min_price).toFixed(2) : "N/A"}`}
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Overrides displayed starting price. Leave empty to use Lootbar price.</p>
              </div>

              {/* Sort Order */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5"><ArrowUpDown size={13} /> Sort Order</Label>
                <Input
                  type="number"
                  value={overrideForm.sort_order}
                  onChange={(e) => setOverrideForm(f => ({ ...f, sort_order: e.target.value }))}
                  placeholder="0 = default"
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first. Default is 0.</p>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Featured / Hot</span>
                  </div>
                  <div
                    onClick={() => setOverrideForm(f => ({ ...f, is_featured: !f.is_featured }))}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${
                      overrideForm.is_featured ? "bg-yellow-400" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${overrideForm.is_featured ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <EyeOff size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Hidden from storefront</span>
                  </div>
                  <div
                    onClick={() => setOverrideForm(f => ({ ...f, is_hidden: !f.is_hidden }))}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${
                      overrideForm.is_hidden ? "bg-gray-700" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${overrideForm.is_hidden ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveOverride} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0">
                  Save Override
                </Button>
                <Button onClick={() => setEditGame(null)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
create a logo for my store and put it in favicon and all google must see it in the link.
