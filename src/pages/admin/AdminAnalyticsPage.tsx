import { useEffect, useState } from "react";
import { RefreshCw, Eye, Users, Monitor, Smartphone, Globe, Star, BarChart2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAnalytics } from "@/lib/analytics";
import { toast } from "sonner";

export function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [days, setDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { load(); }, [days]);

  const load = async () => {
    setIsLoading(true);
    try { const data = await getAnalytics(days); setAnalyticsData(data); }
    catch { toast.error("Failed to load analytics"); }
    finally { setIsLoading(false); }
  };

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-2">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${days === d ? "bg-yellow-400 text-black" : "bg-white/10 text-gray-300 hover:bg-white/15"}`}>
              {d}d
            </button>
          ))}
          <button onClick={load} disabled={isLoading} className="p-2 text-gray-400 hover:text-white ml-2">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-[#1a1a1a] rounded-2xl h-28 animate-pulse" />)}
          </div>
        ) : analyticsData ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Eye, label: "Total Visits", value: String(analyticsData.totalVisits), color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                { icon: Users, label: "Unique Sessions", value: String(analyticsData.uniqueSessions), color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
                { icon: Monitor, label: "Desktop", value: String(analyticsData.deviceCounts?.desktop || 0), color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
                { icon: Smartphone, label: "Mobile", value: String(analyticsData.deviceCounts?.mobile || 0), color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
                { icon: Users, label: "Logged-in Users", value: String(analyticsData.uniqueLoggedInUsers), color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
                { icon: Globe, label: "Tablet", value: String(analyticsData.deviceCounts?.tablet || 0), color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
                { icon: Eye, label: "Game Views", value: String(analyticsData.topGames?.reduce((s: number, g: any) => s + g.count, 0) || 0), color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
                { icon: Star, label: "Page Views", value: String(analyticsData.topPages?.reduce((s: number, p: any) => s + p.count, 0) || 0), color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
              ].map((s) => (
                <div key={s.label} className={`bg-[#1a1a1a] border ${s.border} rounded-2xl p-5`}>
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}><s.icon size={20} className={s.color} /></div>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {analyticsData.dailyData?.length > 0 && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Daily Visits</h3>
                <div className="flex items-end gap-1 h-32">
                  {analyticsData.dailyData.map((d: any) => {
                    const max = Math.max(...analyticsData.dailyData.map((x: any) => x.count), 1);
                    const h = (d.count / max) * 100;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-yellow-400/20 rounded-t relative" style={{ height: `${h}%` }}>
                          <div className="absolute inset-0 bg-yellow-400 rounded-t opacity-80" />
                        </div>
                        <span className="text-[9px] text-gray-600 truncate w-full text-center">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Top Pages</h3>
                <div className="space-y-2">
                  {(analyticsData.topPages || []).slice(0, 8).map((p: any) => (
                    <div key={p.page} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 font-mono truncate flex-1">{p.page || "/"}</span>
                      <span className="text-sm font-bold text-yellow-400 ml-3">{p.count}</span>
                    </div>
                  ))}
                  {!analyticsData.topPages?.length && <p className="text-gray-500 text-sm">No page data yet</p>}
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Top Viewed Games</h3>
                <div className="space-y-2">
                  {(analyticsData.topGames || []).slice(0, 8).map((g: any) => (
                    <div key={g.gameId} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 truncate flex-1">{g.gameId}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{g.uniqueUsers} users</span>
                        <span className="text-sm font-bold text-yellow-400">{g.count}</span>
                      </div>
                    </div>
                  ))}
                  {!analyticsData.topGames?.length && <p className="text-gray-500 text-sm">No game view data yet</p>}
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4">Hourly Activity (UTC)</h3>
              <div className="grid grid-cols-12 gap-1">
                {(analyticsData.hourlyActivity || Array(24).fill(0)).map((count: number, hour: number) => {
                  const max = Math.max(...(analyticsData.hourlyActivity || [1]), 1);
                  const intensity = count / max;
                  return (
                    <div key={hour} className="flex flex-col items-center gap-1">
                      <div title={`${hour}:00 — ${count}`} className="w-full rounded"
                        style={{ height: "32px", backgroundColor: `rgba(250, 204, 21, ${Math.max(0.08, intensity)})` }} />
                      <span className="text-[8px] text-gray-600">{hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-12 text-center">
            <BarChart2 size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Click the refresh button to load analytics data</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
