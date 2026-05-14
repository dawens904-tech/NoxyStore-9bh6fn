import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  ShoppingBag, Users, MessageSquare, TrendingUp,
  Package, Tag, LayoutGrid, Settings, BarChart2,
  Zap, ChevronRight, DollarSign, Activity
} from "lucide-react";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalUsers: number;
  openChats: number;
  totalProducts: number;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pendingOrders: 0, totalRevenue: 0,
    totalUsers: 0, openChats: 0, totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "moderator") {
      navigate("/");
      return;
    }
    loadStats();
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

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-blue-50 text-blue-600", path: "/admin/orders" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: Activity, color: "bg-orange-50 text-orange-600", path: "/admin/orders" },
    { label: "Revenue (USD)", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-green-50 text-green-600", path: "/admin/analytics" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-purple-50 text-purple-600", path: "/admin/roles" },
    { label: "Open Chats", value: stats.openChats, icon: MessageSquare, color: "bg-pink-50 text-pink-600", path: "/admin/livechat" },
    { label: "Manual Products", value: stats.totalProducts, icon: Package, color: "bg-yellow-50 text-yellow-600", path: "/admin/products" },
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
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.nickname || "Admin"}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-2 rounded-lg mb-3 ${card.color}`}>
                <card.icon size={18} />
              </div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-black text-gray-900">
                {loading ? "—" : card.value}
              </p>
            </button>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="text-base font-bold text-gray-800 mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <link.icon size={18} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{link.label}</p>
                <p className="text-xs text-gray-400 truncate">{link.desc}</p>
              </div>
              <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
