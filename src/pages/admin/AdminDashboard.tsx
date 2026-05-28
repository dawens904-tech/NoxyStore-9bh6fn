import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "./AdminSidebar";
import {
  ShoppingCart, Users, TrendingUp, DollarSign, Package,
  Activity, RefreshCw, Eye, CheckCircle, Clock, XCircle,
  BarChart2, Sun, Moon, Smartphone, Globe, MousePointer,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const ADMIN_DASHBOARD_PREFIX = "/secure-dashboard-92x2011";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  failedOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeProducts: number;
  todayOrders: number;
}

interface RecentOrder {
  id: string;
  reference_id: string;
  game_name: string;
  sku_name: string;
  price: number;
  state: number;
  user_email: string | null;
  created_at: string;
}

interface AnalyticsRow {
  created_at: string;
  event_type: string;
  device_type: string | null;
  page: string | null;
}

const STATE_LABELS: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: "Pending", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: <Clock size={12} /> },
  2: { label: "Processing", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <RefreshCw size={12} /> },
  3: { label: "Completed", color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle size={12} /> },
  4: { label: "Failed", color: "text-red-600 bg-red-50 border-red-200", icon: <XCircle size={12} /> },
};

const CHART_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Analytics state
  const [pageViewsData, setPageViewsData] = useState<Array<{ date: string; views: number; orders: number }>>([]);
  const [deviceData, setDeviceData] = useState<Array<{ name: string; value: number }>>([]);
  const [topPagesData, setTopPagesData] = useState<Array<{ page: string; count: number }>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [totalPageViews, setTotalPageViews] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchDashboard();
    fetchAnalytics();
  }, [user]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [
        { data: orders },
        { data: manualProds },
        { data: cacheProds },
        { data: userRoles },
        { data: todayOrders },
      ] = await Promise.all([
        supabase.from("orders").select("price, state, profit_amount").limit(10000),
        supabase.from("manual_products").select("id").eq("is_active", true),
        supabase.from("games_cache").select("game_id").limit(1),
        supabase.from("user_roles").select("id"),
        supabase.from("orders").select("id").gte("created_at", `${today}T00:00:00.000Z`),
      ]);

      const allOrders = orders || [];
      setStats({
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(o => o.state === 1 || o.state === 2).length,
        completedOrders: allOrders.filter(o => o.state === 3).length,
        failedOrders: allOrders.filter(o => o.state === 4).length,
        totalRevenue: allOrders.filter(o => o.state === 3).reduce((sum, o) => sum + Number(o.price || 0), 0),
        totalUsers: userRoles?.length ?? 0,
        activeProducts: (manualProds?.length ?? 0) + (cacheProds ? 1 : 0),
        todayOrders: todayOrders?.length ?? 0,
      });

      const { data: recent } = await supabase
        .from("orders")
        .select("id, reference_id, game_name, sku_name, price, state, user_email, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setRecentOrders(recent || []);
    } catch (err) {
      console.error("AdminDashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Last 14 days
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: events }, { data: ordersData }] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("created_at, event_type, device_type, page")
          .gte("created_at", since)
          .limit(5000),
        supabase
          .from("orders")
          .select("created_at")
          .gte("created_at", since)
          .limit(5000),
      ]);

      const evts: AnalyticsRow[] = events || [];
      setTotalEvents(evts.length);

      const pageViews = evts.filter(e => e.event_type === "page_view");
      setTotalPageViews(pageViews.length);

      // Build daily page views + orders for last 14 days
      const dayMap: Record<string, { views: number; orders: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = { views: 0, orders: 0 };
      }
      pageViews.forEach(e => {
        const day = e.created_at.slice(0, 10);
        if (dayMap[day]) dayMap[day].views++;
      });
      (ordersData || []).forEach((o: { created_at: string }) => {
        const day = o.created_at.slice(0, 10);
        if (dayMap[day]) dayMap[day].orders++;
      });
      setPageViewsData(
        Object.entries(dayMap).map(([date, v]) => ({
          date: date.slice(5), // MM-DD
          views: v.views,
          orders: v.orders,
        }))
      );

      // Device breakdown
      const devCount: Record<string, number> = {};
      evts.forEach(e => {
        const d = e.device_type || "Unknown";
        devCount[d] = (devCount[d] || 0) + 1;
      });
      setDeviceData(
        Object.entries(devCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );

      // Top pages
      const pagesCount: Record<string, number> = {};
      pageViews.forEach(e => {
        const p = e.page || "/";
        pagesCount[p] = (pagesCount[p] || 0) + 1;
      });
      setTopPagesData(
        Object.entries(pagesCount)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      );
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  const bg = isDark ? "bg-gray-950" : "bg-[#f5f7fa]";
  const cardBg = isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const tableBg = isDark ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-500";
  const rowHover = isDark ? "hover:bg-gray-800/60" : "hover:bg-gray-50/60";
  const divider = isDark ? "divide-gray-800" : "divide-gray-50";
  const borderColor = isDark ? "border-gray-800" : "border-gray-100";
  const chartBg = isDark ? "#1f2937" : "#ffffff";
  const chartGridColor = isDark ? "#374151" : "#f3f4f6";
  const chartTextColor = isDark ? "#9ca3af" : "#6b7280";

  const statCards = stats ? [
    { label: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: <ShoppingCart size={20} />, color: "bg-blue-500", sub: `${stats.todayOrders} today` },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: <DollarSign size={20} />, color: "bg-green-500", sub: "Completed orders" },
    { label: "Pending", value: stats.pendingOrders.toLocaleString(), icon: <Clock size={20} />, color: "bg-yellow-500", sub: "Need attention" },
    { label: "Completed", value: stats.completedOrders.toLocaleString(), icon: <CheckCircle size={20} />, color: "bg-emerald-500", sub: "Fulfilled" },
    { label: "Failed", value: stats.failedOrders.toLocaleString(), icon: <XCircle size={20} />, color: "bg-red-500", sub: "Require review" },
    { label: "Users", value: stats.totalUsers.toLocaleString(), icon: <Users size={20} />, color: "bg-purple-500", sub: "Registered" },
    { label: "Products", value: stats.activeProducts.toLocaleString(), icon: <Package size={20} />, color: "bg-indigo-500", sub: "Active listings" },
    { label: "Fill Rate", value: stats.totalOrders > 0 ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}%` : "—", icon: <TrendingUp size={20} />, color: "bg-teal-500", sub: "Orders fulfilled" },
  ] : [];

  return (
    <div className={`flex min-h-screen ${bg} transition-colors duration-300`}>
      <AdminSidebar />

      <main className="ml-0 md:ml-64 flex-1 p-4 md:p-8 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
          <div>
            <h1 className={`text-2xl md:text-3xl font-black ${textPrimary}`}>Admin Dashboard</h1>
            <p className={`${textSecondary} text-xs md:text-sm mt-1 truncate max-w-xs`}>
              Welcome, <span className="font-semibold">{user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Dark/Light toggle */}
            <button
              onClick={() => setIsDark(v => !v)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                isDark ? "bg-yellow-400 border-yellow-400 text-black" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => { fetchDashboard(); fetchAnalytics(); }}
              className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition ${
                isDark ? "bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <RefreshCw size={14} className={(isLoading || analyticsLoading) ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${cardBg} rounded-2xl p-4 h-24 animate-pulse border`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
            {statCards.map(card => (
              <div key={card.label} className={`${cardBg} rounded-2xl p-4 md:p-5 shadow-sm border flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${textSecondary} leading-tight`}>{card.label}</span>
                  <div className={`w-8 h-8 md:w-9 md:h-9 ${card.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                    {card.icon}
                  </div>
                </div>
                <div>
                  <p className={`text-xl md:text-2xl font-black ${textPrimary}`}>{card.value}</p>
                  <p className={`text-[10px] md:text-xs ${textSecondary} mt-0.5`}>{card.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: "Manage Games", desc: "Add or edit games", path: `${ADMIN_DASHBOARD_PREFIX}/games`, color: "from-blue-500 to-blue-600" },
            { label: "Manage Products", desc: "Edit products & pricing", path: `${ADMIN_DASHBOARD_PREFIX}/products`, color: "from-purple-500 to-purple-600" },
            { label: "Add Product", desc: "Create new listing", path: `${ADMIN_DASHBOARD_PREFIX}/products/add`, color: "from-green-500 to-green-600" },
            { label: "Lootbar Games", desc: "Override API games", path: `${ADMIN_DASHBOARD_PREFIX}/lootbar-games`, color: "from-orange-500 to-orange-600" },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 md:p-5 text-left text-white hover:opacity-90 transition shadow-sm`}
            >
              <p className="font-bold text-sm md:text-base mb-0.5">{action.label}</p>
              <p className="text-white/80 text-[10px] md:text-xs hidden sm:block">{action.desc}</p>
            </button>
          ))}
        </div>

        {/* ── Analytics Section ── */}
        <div className="mb-6 md:mb-8">
          <div className={`flex items-center gap-2 mb-4`}>
            <BarChart2 size={18} className="text-yellow-500" />
            <h2 className={`text-lg font-black ${textPrimary}`}>Analytics</h2>
            <span className={`text-xs ${textSecondary} ml-1`}>Last 14 days</span>
            {!analyticsLoading && (
              <span className="ml-auto text-xs text-yellow-500 font-semibold">
                {totalPageViews.toLocaleString()} page views · {totalEvents.toLocaleString()} events
              </span>
            )}
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`${cardBg} rounded-2xl h-64 animate-pulse border col-span-2`} />
              <div className={`${cardBg} rounded-2xl h-64 animate-pulse border`} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Page Views + Orders Trend */}
              <div className={`${cardBg} rounded-2xl p-4 md:p-5 border shadow-sm col-span-1 lg:col-span-2`}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={15} className="text-blue-500" />
                  <p className={`text-sm font-bold ${textPrimary}`}>Page Views & Orders Trend</p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={pageViewsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: chartTextColor }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: chartTextColor }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: chartBg, border: "none", borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: chartTextColor }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#viewsGrad)" strokeWidth={2} name="Page Views" dot={false} />
                    <Area type="monotone" dataKey="orders" stroke="#f59e0b" fill="url(#ordersGrad)" strokeWidth={2} name="Orders" dot={false} />
                    <Legend wrapperStyle={{ fontSize: 11, color: chartTextColor }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Device Breakdown */}
              <div className={`${cardBg} rounded-2xl p-4 md:p-5 border shadow-sm`}>
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone size={15} className="text-purple-500" />
                  <p className={`text-sm font-bold ${textPrimary}`}>Device Types</p>
                </div>
                {deviceData.length === 0 ? (
                  <div className={`flex items-center justify-center h-40 ${textSecondary} text-sm`}>No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {deviceData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: chartBg, border: "none", borderRadius: 12, fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: chartTextColor }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Top Pages */}
          {!analyticsLoading && topPagesData.length > 0 && (
            <div className={`${cardBg} rounded-2xl p-4 md:p-5 border shadow-sm`}>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={15} className="text-green-500" />
                <p className={`text-sm font-bold ${textPrimary}`}>Top Pages (Last 14 Days)</p>
                <MousePointer size={12} className={textSecondary} />
              </div>
              <div className="overflow-hidden">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={topPagesData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: chartTextColor }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="page"
                      tick={{ fontSize: 9, fill: chartTextColor }}
                      tickLine={false}
                      width={80}
                      tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                    />
                    <Tooltip
                      contentStyle={{ background: chartBg, border: "none", borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: chartTextColor }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className={`${cardBg} rounded-2xl shadow-sm border overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 md:px-6 py-4 border-b ${borderColor}`}>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-gray-600" />
              <h2 className={`text-sm md:text-base font-bold ${textPrimary}`}>Recent Orders</h2>
            </div>
            <span className={`text-xs ${textSecondary}`}>{recentOrders.length} latest</span>
          </div>

          {isLoading ? (
            <div className="p-4 md:p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`${tableBg} text-xs uppercase tracking-wide`}>
                    <th className="px-4 md:px-6 py-3 text-left font-semibold">Reference</th>
                    <th className="px-4 md:px-6 py-3 text-left font-semibold">Game</th>
                    <th className="px-4 md:px-6 py-3 text-left font-semibold hidden md:table-cell">SKU</th>
                    <th className="px-4 md:px-6 py-3 text-left font-semibold hidden lg:table-cell">User</th>
                    <th className="px-4 md:px-6 py-3 text-left font-semibold">Price</th>
                    <th className="px-4 md:px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 md:px-6 py-3 text-left font-semibold hidden md:table-cell">Date</th>
                    <th className="px-4 md:px-6 py-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {recentOrders.map(order => {
                    const stateInfo = STATE_LABELS[order.state] ?? STATE_LABELS[1];
                    return (
                      <tr key={order.id} className={`${rowHover} transition-colors`}>
                        <td className={`px-4 md:px-6 py-3 font-mono text-xs ${textSecondary} whitespace-nowrap`}>
                          {order.reference_id.slice(0, 12)}…
                        </td>
                        <td className={`px-4 md:px-6 py-3 font-semibold ${textPrimary} whitespace-nowrap max-w-[120px] md:max-w-[160px] truncate`}>
                          {order.game_name}
                        </td>
                        <td className={`px-4 md:px-6 py-3 ${textSecondary} whitespace-nowrap max-w-[160px] truncate hidden md:table-cell`}>
                          {order.sku_name}
                        </td>
                        <td className={`px-4 md:px-6 py-3 ${textSecondary} whitespace-nowrap max-w-[160px] truncate hidden lg:table-cell`}>
                          {order.user_email ?? "—"}
                        </td>
                        <td className={`px-4 md:px-6 py-3 font-bold ${textPrimary} whitespace-nowrap`}>
                          ${Number(order.price).toFixed(2)}
                        </td>
                        <td className="px-4 md:px-6 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] md:text-xs font-semibold ${stateInfo.color}`}>
                            {stateInfo.icon} {stateInfo.label}
                          </span>
                        </td>
                        <td className={`px-4 md:px-6 py-3 ${textSecondary} text-xs whitespace-nowrap hidden md:table-cell`}>
                          {new Date(order.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-right">
                          <button
                            onClick={() => navigate(`/orders/${order.reference_id}`)}
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-semibold"
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
