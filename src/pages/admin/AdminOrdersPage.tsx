import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Search, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const STATE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Pending", color: "bg-blue-100 text-blue-700" },
  2: { label: "Success", color: "bg-green-100 text-green-700" },
  3: { label: "Failed", color: "bg-red-100 text-red-700" },
  4: { label: "Settlement", color: "bg-purple-100 text-purple-700" },
  5: { label: "Partial", color: "bg-orange-100 text-orange-700" },
  6: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
  7: { label: "Deleted", color: "bg-gray-100 text-gray-400" },
};

interface Order {
  id: string;
  reference_id: string;
  order_id: string | null;
  game_name: string;
  sku_name: string;
  price: number;
  state: number;
  user_email: string | null;
  created_at: string;
  extra_info: Record<string, string>;
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error("Failed to load orders"); }
    else { setOrders(data || []); }
    setLoading(false);
  }

  const filtered = orders.filter(o => {
    const matchState = filterState === "all" || String(o.state) === filterState;
    const q = search.toLowerCase();
    const matchSearch = !q || o.reference_id?.toLowerCase().includes(q) ||
      o.game_name?.toLowerCase().includes(q) || o.user_email?.toLowerCase().includes(q) ||
      o.order_id?.toLowerCase().includes(q);
    return matchState && matchSearch;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <button onClick={loadOrders} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-yellow-400" />
          </div>
          <select value={filterState} onChange={e => setFilterState(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
            <option value="all">All States</option>
            {Object.entries(STATE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading orders…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(order => {
                const stateInfo = STATE_LABELS[order.state] || { label: "Unknown", color: "bg-gray-100 text-gray-500" };
                const isExpanded = expanded === order.id;
                return (
                  <div key={order.id}>
                    <button onClick={() => setExpanded(isExpanded ? null : order.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">{order.reference_id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stateInfo.color}`}>{stateInfo.label}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 truncate">{order.game_name} — {order.sku_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.user_email || "Guest"} · {new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-orange-500">${Number(order.price || 0).toFixed(2)}</p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 bg-gray-50 text-xs text-gray-600 space-y-1.5">
                        <p><span className="font-semibold">Order ID:</span> {order.order_id || "—"}</p>
                        <p><span className="font-semibold">State:</span> {order.state}</p>
                        {Object.entries(order.extra_info || {}).map(([k, v]) => (
                          <p key={k}><span className="font-semibold capitalize">{k}:</span> {v}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} orders shown</p>
      </div>
    </AdminLayout>
  );
}
