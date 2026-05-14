import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Zap, RefreshCw, CheckCircle, XCircle, Clock, Database } from "lucide-react";
import { lootbarApi } from "@/lib/lootbar-api";

interface ApiStatus {
  connected: boolean;
  balance: string;
  latencyMs: number;
  checkedAt: string;
}

interface CacheStats {
  totalGames: number;
  gamesWithImages: number;
  gamesWithoutImages: number;
  lastCached: string | null;
}

export function AdminApiStatusPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingCache, setSyncingCache] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(false);

  useEffect(() => { checkStatus(); loadCacheStats(); }, []);

  async function checkStatus() {
    setLoading(true);
    const start = Date.now();
    try {
      const balance = await lootbarApi.getBalance();
      setApiStatus({
        connected: balance !== "--",
        balance,
        latencyMs: Date.now() - start,
        checkedAt: new Date().toISOString(),
      });
    } catch {
      setApiStatus({ connected: false, balance: "--", latencyMs: Date.now() - start, checkedAt: new Date().toISOString() });
    }
    setLoading(false);
  }

  async function loadCacheStats() {
    const { data, count } = await supabase.from("games_cache").select("game_image, cached_at", { count: "exact" }).order("cached_at", { ascending: false }).limit(1000);
    const items = data || [];
    const withImages = items.filter(g => g.game_image && g.game_image.trim()).length;
    const lastCached = items[0]?.cached_at || null;
    setCacheStats({ totalGames: count || 0, gamesWithImages: withImages, gamesWithoutImages: (count || 0) - withImages, lastCached });
  }

  async function syncCache() {
    setSyncingCache(true);
    const { error } = await supabase.functions.invoke("games-cache-refresh", { body: {} });
    if (error) { toast.error("Sync failed: " + error.message); } else { toast.success("Cache synced!"); loadCacheStats(); }
    setSyncingCache(false);
  }

  async function fetchMissingImages() {
    setFetchingImages(true);
    const { data: missingGames } = await supabase.from("games_cache").select("game_id, game_name").is("game_image", null).limit(20);
    if (!missingGames || missingGames.length === 0) { toast.success("No missing images!"); setFetchingImages(false); return; }

    let fetched = 0;
    for (const game of missingGames) {
      const { error } = await supabase.functions.invoke("fetch-game-images", { body: { game_id: game.game_id, game_name: game.game_name } });
      if (!error) fetched++;
    }
    toast.success(`Fetched images for ${fetched}/${missingGames.length} games`);
    loadCacheStats();
    setFetchingImages(false);
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">API Status</h1>
            <p className="text-sm text-gray-500">Lootbar API and cache health</p>
          </div>
        </div>

        {/* API Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Lootbar API</h3>
            <button onClick={checkStatus} disabled={loading}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Check
            </button>
          </div>
          {apiStatus ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {apiStatus.connected
                  ? <CheckCircle size={20} className="text-green-500" />
                  : <XCircle size={20} className="text-red-500" />}
                <span className={`font-bold text-sm ${apiStatus.connected ? "text-green-700" : "text-red-700"}`}>
                  {apiStatus.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Balance</p>
                  <p className="font-bold text-gray-900">{apiStatus.balance === "--" ? "—" : `$${apiStatus.balance}`}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Latency</p>
                  <p className="font-bold text-gray-900">{apiStatus.latencyMs}ms</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Last Check</p>
                  <p className="font-bold text-gray-900 text-xs">{new Date(apiStatus.checkedAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">
              <Clock size={24} className="mx-auto mb-2 text-gray-300" /> Click "Check" to test connection
            </div>
          )}
        </div>

        {/* Cache Stats */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Games Cache</h3>
            <button onClick={syncCache} disabled={syncingCache}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg disabled:opacity-50">
              <RefreshCw size={13} className={syncingCache ? "animate-spin" : ""} />
              {syncingCache ? "Syncing…" : "Sync Now"}
            </button>
          </div>
          {cacheStats ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Total Games</p>
                <p className="text-2xl font-black text-gray-900">{cacheStats.totalGames}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">With Images</p>
                <p className="text-2xl font-black text-green-600">{cacheStats.gamesWithImages}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Missing Images</p>
                <p className="text-2xl font-black text-orange-500">{cacheStats.gamesWithoutImages}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Last Sync</p>
                <p className="text-xs font-bold text-gray-900">{cacheStats.lastCached ? new Date(cacheStats.lastCached).toLocaleString() : "Never"}</p>
              </div>
            </div>
          ) : (
            <div className="h-20 bg-gray-50 rounded-lg animate-pulse mb-4" />
          )}
          {(cacheStats?.gamesWithoutImages ?? 0) > 0 && (
            <button onClick={fetchMissingImages} disabled={fetchingImages}
              className="w-full flex items-center justify-center gap-2 border border-orange-200 text-orange-600 font-bold py-2.5 rounded-xl text-sm hover:bg-orange-50 disabled:opacity-50">
              <Database size={15} className={fetchingImages ? "animate-pulse" : ""} />
              {fetchingImages ? "Fetching images…" : `Fetch missing images (${cacheStats?.gamesWithoutImages})`}
            </button>
          )}
        </div>

        {/* Edge functions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-3">Edge Functions</h3>
          <div className="space-y-2">
            {["lootbar-proxy", "games-cache-refresh", "fetch-game-images", "ai-support", "ff-lookup", "lootbar-notify"].map(fn => (
              <div key={fn} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                <span className="font-mono text-sm text-gray-700 flex-1">{fn}</span>
                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">Deployed</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
