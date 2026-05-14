import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { RefreshCw, BarChart2, Users, ShoppingBag, Eye, TrendingUp } from "lucide-react";

interface AnalyticsSummary {
  pageViews: number;
  uniqueUsers: number;
  gameViews: number;
  purchases: number;
  topGames: { game_id: string; count: number }[];
  topPages: { page: string; count: number }[];
  recentEvents: { event_type: string; page: string; created_at: string }[];
}

export function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7");

  useEffect(() => { loadAnalytics(); }, [range]);

  async function loadAnalytics() {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - parseInt(range));

    const { data: events } = await supabase
      .from("analytics_events")
      .select("event_type, page, game_id, user_id, session_id, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);

    const ev = events || [];
    const pageViewEvents = ev.filter(e => e.event_type === "page_view");
    const gameViewEvents = ev.filter(e => e.event_type === "game_view");
    const purchaseEvents = ev.filter(e => e.event_type === "purchase" || e.event_type === "checkout");

    const uniqueUsers = new Set(ev.map(e => e.user_id || e.session_id).filter(Boolean)).size;

    // Top games
    const gameCounts = new Map<string, number>();
    gameViewEvents.forEach(e => { if (e.game_id) gameCounts.set(e.game_id, (gameCounts.get(e.game_id) || 0) + 1); });
    const topGames = Array.from(gameCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([game_id, count]) => ({ game_id, count }));

    // Top pages
    const pageCounts = new Map<string, number>();
    pageViewEvents.forEach(e => { if (e.page) pageCounts.set(e.page, (pageCounts.get(e.page) || 0) + 1); });
    const topPages = Array.from(pageCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([page, count]) => ({ page, count }));

    setData({
      pageViews: pageViewEvents.length,
      uniqueUsers,
      gameViews: gameViewEvents.length,
      purchases: purchaseEvents.length,
      topGames,
      topPages,
      recentEvents: ev.slice(0, 20).map(e => ({ event_type: e.event_type, page: e.page || "", created_at: e.created_at })),
    });
    setLoading(false);
  }

  const statCards = [
    { label: "Page Views", value: data?.pageViews ?? 0, icon: Eye, color: "text-blue-600 bg-blue-50" },
    { label: "Unique Visitors", value: data?.uniqueUsers ?? 0, icon: Users, color: "text-purple-600 bg-purple-50" },
    { label: "Game Views", value: data?.gameViews ?? 0, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Purchases", value: data?.purchases ?? 0, icon: ShoppingBag, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart2 size={20} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
          </div>
          <div className="flex gap-2 items-center">
            <select value={range} onChange={e => setRange(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white">
              <option value="1">Last 24h</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button onClick={loadAnalytics} className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg hover:text-gray-800">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className={`inline-flex p-2 rounded-lg mb-3 ${card.color}`}>
                <card.icon size={18} />
              </div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-black text-gray-900">{loading ? "—" : card.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Top Pages */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Top Pages</h3>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : (data?.topPages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {data?.topPages.map(p => (
                  <div key={p.page} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{p.page || "/"}</p>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, (p.count / (data?.pageViews || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 flex-shrink-0">{p.count}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Top Games */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Top Games Viewed</h3>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : (data?.topGames.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {data?.topGames.map(g => (
                  <div key={g.game_id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate font-mono">{g.game_id}</p>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, (g.count / (data.topGames[0]?.count || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 flex-shrink-0">{g.count}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Recent events */}
        <div className="mt-5 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Recent Events</h3>
          </div>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {(data?.recentEvents || []).map((e, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-2.5 text-xs">
                  <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{e.event_type}</span>
                  <span className="text-gray-500 truncate flex-1">{e.page}</span>
                  <span className="text-gray-400 flex-shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
