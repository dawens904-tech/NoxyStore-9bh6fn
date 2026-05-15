import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  ShoppingBag, Users, MessageSquare, TrendingUp,
  Package, Tag, LayoutGrid, Settings, BarChart2,
  Zap, ChevronRight, DollarSign, Activity, RefreshCw
} from "lucide-react";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalUsers: number;
  openChats: number;
  totalProducts: number;
}

interface LootbarStatus {
  ok: boolean;
  checkedAt: number | null; // timestamp ms
  checking: boolean;
}

const LOOTBAR_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pendingOrders: 0, totalRevenue: 0,
    totalUsers: 0, openChats: 0, totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lootbar, setLootbar] = useState<LootbarStatus>({ ok: false, checkedAt: null, checking: false });

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "moderator") {
      navigate("/");
      return;
    }
    loadStats();
    checkLootbar(false);
  }, [user]);

  async function loadStats() {
    setLoading(true);
    const [orders, users, chats, products] = await Promise.all([
      supabase.from("orders").select("id, price, state"),
      supabase.from("user_profiles").select("id", { count: "exact", head: true }),
      supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("manual_products").select("id", { count: "exact", head: true }),
    ]);

    const allOrders = orders.data || [];
    setStats({
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter(o => o.state === 1).length,
      totalRevenue: allOrders.filter(o => o.state === 2).reduce((s, o) => s + Number(o.price || 0), 0),
      totalUsers: users.count || 0,
      openChats: chats.count || 0,
      totalProducts: products.count || 0,
    });
    setLoading(false);
  }

  const checkLootbar = useCallback(async (force: boolean) => {
    // Respect 5-minute cooldown unless forced
    if (!force && lootbar.checkedAt !== null) {
      const elapsed = Date.now() - lootbar.checkedAt;
      if (elapsed < LOOTBAR_CHECK_INTERVAL) return;
    }

    setLootbar(prev => ({ ...prev, checking: true }));
    try {
      const { data, error } = await supabase.functions.invoke("lootbar-proxy", {
        body: { action: "check_token" },
      });
      const ok = !error && data?.data?.valid === true;
      setLootbar({ ok, checkedAt: Date.now(), checking: false });
    } catch {
      setLootbar({ ok: false, checkedAt: Date.now(), checking: false });
    }
  }, [lootbar.checkedAt]);

  const lootbarAgo = lootbar.checkedAt
    ? Math.round((Date.now() - lootbar.checkedAt) / 1000)
    : null;

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400", path: "/admin/orders" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: Activity, color: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400", path: "/admin/orders" },
    { label: "Revenue (USD)", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400", path: "/admin/analytics" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400", path: "/admin/roles" },
    { label: "Open Chats", value: stats.openChats, icon: MessageSquare, color: "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400", path: "/admin/livechat" },
    { label: "Manual Products", value: stats.totalProducts, icon: Package, color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400", path: "/admin/products" },
  ];

  const quickLinks = [
    { label: "Products", icon: Package, path: "/admin/products", desc: "Manage manual & Lootbar games" },
    { label: "Orders", icon: ShoppingBag, path: "/admin/orders", desc: "View and manage all orders" },
    { label: "Banners", icon: LayoutGrid, path: "/admin/banners", desc: "Homepage banner management" },
    { label: "Coupons", icon: Tag, path: "/admin/coupons", desc: "Create and manage coupons" },
    { label: "Markup", icon: TrendingUp, path: "/admin/markup", desc: "Set global price markup" },
    { label: "Sections", icon: LayoutGrid, path: "/admin/sections", desc: "Home page sections" },
    { label: "Roles", icon: Users, path: "/admin/roles", desc: "Manage admin access" },
    { label: "Analytics", icon: BarChart2, path: "/admin/analytics", desc: "Site analytics & traffic" },
    { label: "Live Chat", icon: MessageSquare, path: "/admin/livechat", desc: "Customer support chat" },
    { label: "API Status", icon: Zap, path: "/admin/api-status", desc: "Lootbar API health check" },
    { label: "Categories", icon: Settings, path: "/admin/categories", desc: "Manage game categories" },
    { label: "Group Chat", icon: MessageSquare, path: "/admin/group-chat", desc: "Community group chat" },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.nickname || "Admin"}</p>
          </div>

          {/* Lootbar API status pill */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm flex-shrink-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${lootbar.checking ? "bg-yellow-400 animate-pulse" : lootbar.checkedAt === null ? "bg-gray-300 dark:bg-gray-600" : lootbar.ok ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Lootbar API: {lootbar.checking ? "Checking…" : lootbar.checkedAt === null ? "Unknown" : lootbar.ok ? "Online" : "Offline"}
            </span>
            {lootbarAgo !== null && !lootbar.checking && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                ({lootbarAgo < 60 ? `${lootbarAgo}s ago` : `${Math.round(lootbarAgo / 60)}m ago`})
              </span>
            )}
            <button
              onClick={() => checkLootbar(true)}
              disabled={lootbar.checking}
              className="ml-1 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition-colors"
              title="Re-check now"
            >
              <RefreshCw size={12} className={lootbar.checking ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-2 rounded-lg mb-3 ${card.color}`}>
                <card.icon size={18} />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {loading ? "—" : card.value}
              </p>
            </button>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <link.icon size={18} className="text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{link.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{link.desc}</p>
              </div>
              <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
