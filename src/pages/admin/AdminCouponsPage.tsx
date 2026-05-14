import { useEffect, useState } from "react";
import { RefreshCw, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function AdminCouponsPage() {
  const { user } = useAuthStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("coupon");
  const [newValue, setNewValue] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("admin_redeem_codes").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data);
  };

  const create = async () => {
    if (!newCode.trim() || !newValue) { toast.error("Fill all fields"); return; }
    setIsSaving(true);
    const { error } = await supabase.from("admin_redeem_codes").insert({
      code: newCode.trim().toUpperCase(), type: newType,
      value: parseFloat(newValue), max_uses: parseInt(newMaxUses) || 100,
      is_active: true, created_by: user?.email
    });
    setIsSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Coupon created!");
    setNewCode(""); setNewValue(""); setNewMaxUses("100");
    load();
  };

  const toggle = async (id: string, current: boolean) => {
    await supabase.from("admin_redeem_codes").update({ is_active: !current }).eq("id", id);
    load();
  };

  const del = async (id: string) => {
    await supabase.from("admin_redeem_codes").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  return (
    <AdminLayout title="Coupon Codes">
      <div className="space-y-6 max-w-3xl">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Create New Code</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Code</label>
              <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400">
                <option value="coupon">% Coupon Discount</option>
                <option value="balance">$ Balance Credit</option>
                <option value="free_order">Free Order</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                {newType === "coupon" ? "Discount (%)" : "Value ($)"}
              </label>
              <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)}
                placeholder={newType === "coupon" ? "10" : "5.00"}
                className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Max Uses</label>
              <input type="number" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
            </div>
          </div>
          <button onClick={create} disabled={isSaving}
            className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-300">
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Create Code
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="font-bold text-white">Active Codes ({coupons.length})</h3>
          </div>
          {coupons.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No coupon codes yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {coupons.map((c) => (
                <div key={c.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-yellow-400 font-mono">{c.code}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.type === "coupon" ? "bg-orange-500/20 text-orange-400"
                        : c.type === "balance" ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                      }`}>{c.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Value: {c.type === "coupon" ? `${c.value}%` : `$${c.value}`} · Uses: {c.used_count}/{c.max_uses}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(c.id, c.is_active)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${c.is_active ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                      {c.is_active ? "Active" : "Paused"}
                    </button>
                    <button onClick={() => del(c.id)} className="p-1.5 text-red-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
