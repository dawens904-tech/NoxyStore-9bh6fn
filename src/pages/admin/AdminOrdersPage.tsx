import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { ORDER_STATE_MAP } from "@/types";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (data) setOrders(data);
    setIsLoading(false);
  };

  const filtered = filter === "all" ? orders : orders.filter(o => String(o.state) === filter);

  return (
    <AdminLayout title="All Orders">
      <div className="space-y-4 max-w-5xl">
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "All", value: "all" },
            { label: "In Transaction", value: "1" },
            { label: "Successful", value: "2" },
            { label: "Failed", value: "3" },
            { label: "Cancelled", value: "6" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === f.value ? "bg-yellow-400 text-black" : "bg-white/10 text-gray-300 hover:bg-white/15"}`}>
              {f.label} {f.value === "all" ? `(${orders.length})` : `(${orders.filter(o => String(o.state) === f.value).length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-500">Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-12 text-center">
            <Package size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr className="text-gray-500 text-xs uppercase tracking-wide">
                    {["Game", "SKU", "User", "Price", "Profit", "Status", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((order) => {
                    const si = ORDER_STATE_MAP[order.state as keyof typeof ORDER_STATE_MAP] || ORDER_STATE_MAP[1];
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">{order.game_name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{order.sku_name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[120px]">{order.user_email || "—"}</td>
                        <td className="px-4 py-3 font-bold text-yellow-400">${Number(order.price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-green-400 text-xs">{order.profit_amount ? `+$${Number(order.profit_amount).toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${si.color} ${si.bg}`}>{si.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
