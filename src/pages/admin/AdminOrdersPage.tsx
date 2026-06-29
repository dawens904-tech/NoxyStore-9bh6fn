import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import AdminSidebar from "./AdminSidebar";
import {
  ShoppingCart, RefreshCw, Search, Eye, Clock, CheckCircle,
  XCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  reference_id: string;
  order_id: string | null;
  game_id: string;
  game_name: string;
  sku_name: string;
  quantity: number;
  price: number;
  state: number;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

const STATE_CONFIG: Record<number, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  1: { label: "Pending",    color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: <Clock size={12} /> },
  2: { label: "Processing", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <Loader2 size={12} className="animate-spin" /> },
  3: { label: "Completed",  color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={12} /> },
  4: { label: "Failed",     color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: <XCircle size={12} /> },
};

const TABS = [
  { key: "all",        label: "All",        state: null },
  { key: "pending",    label: "Pending",    state: 1    },
  { key: "processing", label: "Processing", state: 2    },
  { key: "completed",  label: "Completed",  state: 3    },
  { key: "failed",     label: "Failed",     state: 4    },
];

const PAGE_SIZE = 25;

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchOrders();
    fetchTabCounts();
  }, [user, activeTab, page]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const tab = TABS.find(t => t.key === activeTab);

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (tab?.state !== null && tab?.state !== undefined) {
      query = query.eq("state", tab.state);
    }
    if (search.trim()) {
      query = query.or(
        `reference_id.ilike.%${search.trim()}%,game_name.ilike.%${search.trim()}%,user_email.ilike.%${search.trim()}%`
      );
    }

    const { data, count, error } = await query;
    if (error) {
      toast.error("Failed to fetch orders: " + error.message);
    } else {
      setOrders(data || []);
      setTotal(count || 0);
    }
    setIsLoading(false);
  }, [activeTab, page, search]);

  const fetchTabCounts = async () => {
    const [
      { count: all },
      { count: pending },
      { count: processing },
      { count: completed },
      { count: failed },
    ] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("state", 1),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("state", 2),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("state", 3),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("state", 4),
    ]);
    setTabCounts({ all: all ?? 0, pending: pending ?? 0, processing: processing ?? 0, completed: completed ?? 0, failed: failed ?? 0 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchOrders();
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(0);
  };

  const handleStateChange = async (orderId: string, newState: number) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ state: newState, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update state: " + error.message);
    } else {
      toast.success(`Order status updated to ${STATE_CONFIG[newState]?.label}`);
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, state: newState } : o)
      );
      fetchTabCounts();
    }
    setUpdatingId(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExportCSV = async () => {
    // Fetch all filtered orders (no pagination limit) for export
    toast.info("Preparing CSV export...");
    const tab = TABS.find(t => t.key === activeTab);
    let query = supabase
      .from("orders")
      .select("reference_id, game_name, sku_name, user_email, price, state, created_at")
      .order("created_at", { ascending: false });
    if (tab?.state !== null && tab?.state !== undefined) {
      query = query.eq("state", tab.state);
    }
    if (search.trim()) {
      query = query.or(
        `reference_id.ilike.%${search.trim()}%,game_name.ilike.%${search.trim()}%,user_email.ilike.%${search.trim()}%`
      );
    }
    const { data, error } = await query;
    if (error || !data) { toast.error("Export failed: " + error?.message); return; }

    const stateLabel = (s: number) => STATE_CONFIG[s]?.label ?? String(s);
    const rows = [
      ["reference_id", "game_name", "sku_name", "user_email", "price", "state", "created_at"],
      ...data.map((o: any) => [
        o.reference_id,
        o.game_name,
        o.sku_name,
        o.user_email ?? "",
        Number(o.price).toFixed(2),
        stateLabel(o.state),
        new Date(o.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} orders to CSV`);
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <AdminSidebar />
      <div className="ml-64 flex-1 py-8 max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-1">Orders Management</h1>
              <p className="text-gray-500 text-sm">View and manage all customer orders</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 rounded-xl px-4 py-2 text-sm font-bold text-black transition-all shadow-sm"
              >
                <Download size={14} />
                Export CSV
              </button>
              <button
                onClick={() => { fetchOrders(); fetchTabCounts(); }}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm w-fit">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? "bg-gray-900 text-white shadow"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-lg font-black ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-5">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by reference ID, game, email..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-yellow-400 transition-colors shadow-sm"
              />
            </div>
          </form>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <AlertCircle size={40} className="mb-3 opacity-30" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm mt-1">Try adjusting the filter or search term</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3.5 text-left font-semibold">Reference ID</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Game</th>
                      <th className="px-5 py-3.5 text-left font-semibold">SKU</th>
                      <th className="px-5 py-3.5 text-left font-semibold">User</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Price</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Date</th>
                      <th className="px-5 py-3.5 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(order => {
                      const st = STATE_CONFIG[order.state] ?? STATE_CONFIG[1];
                      return (
                        <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                          {/* Reference ID */}
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                              {order.reference_id.length > 18 ? order.reference_id.slice(0, 18) + "…" : order.reference_id}
                            </span>
                          </td>

                          {/* Game */}
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-gray-900 max-w-[140px] truncate">{order.game_name}</p>
                          </td>

                          {/* SKU */}
                          <td className="px-5 py-3.5">
                            <p className="text-gray-600 max-w-[160px] truncate text-xs">{order.sku_name}</p>
                          </td>

                          {/* User */}
                          <td className="px-5 py-3.5">
                            <p className="text-gray-500 text-xs max-w-[160px] truncate">{order.user_email ?? "—"}</p>
                          </td>

                          {/* Price */}
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-gray-900">${Number(order.price).toFixed(2)}</span>
                          </td>

                          {/* Status badge */}
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold ${st.bg} ${st.color}`}>
                              {st.icon} {st.label}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5">
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              {/* State dropdown */}
                              <div className="relative">
                                {updatingId === order.id ? (
                                  <Loader2 size={14} className="animate-spin text-yellow-500" />
                                ) : (
                                  <select
                                    value={order.state}
                                    onChange={e => handleStateChange(order.id, Number(e.target.value))}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none hover:border-yellow-400 focus:border-yellow-400 cursor-pointer transition-colors font-semibold text-gray-700"
                                  >
                                    <option value={1}>Pending</option>
                                    <option value={2}>Processing</option>
                                    <option value={3}>Completed</option>
                                    <option value={4}>Failed</option>
                                  </select>
                                )}
                              </div>

                              {/* View button */}
                              <button
                                onClick={() => navigate(`/orders/${order.reference_id}`)}
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all"
                              >
                                <Eye size={12} /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} orders
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-all"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-sm font-semibold text-gray-700 px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-all"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
