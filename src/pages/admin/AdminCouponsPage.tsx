import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, Tag } from "lucide-react";

interface Coupon {
  id: string;
  user_email: string;
  code: string;
  type: string;
  discount_value: number;
  max_discount: number | null;
  min_order: number;
  description: string | null;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    user_email: "", code: "", type: "percent", discount_value: "10",
    max_discount: "", min_order: "0.01", description: "", expires_days: "30",
  });

  useEffect(() => { loadCoupons(); }, []);

  async function loadCoupons() {
    setLoading(true);
    const { data } = await supabase.from("user_coupons").select("*").order("created_at", { ascending: false }).limit(100);
    setCoupons(data || []);
    setLoading(false);
  }

  async function createCoupon() {
    if (!form.user_email || !form.code) { toast.error("Email and code are required"); return; }
    const expires = new Date();
    expires.setDate(expires.getDate() + parseInt(form.expires_days || "30"));

    const { data: profile } = await supabase.from("user_profiles").select("id").eq("email", form.user_email).single();

    const { error } = await supabase.from("user_coupons").insert({
      user_id: profile?.id,
      user_email: form.user_email,
      code: form.code.toUpperCase(),
      type: form.type,
      discount_value: parseFloat(form.discount_value),
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      min_order: parseFloat(form.min_order || "0.01"),
      description: form.description || null,
      expires_at: expires.toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Coupon created!");
    setShowForm(false);
    setForm({ user_email: "", code: "", type: "percent", discount_value: "10", max_discount: "", min_order: "0.01", description: "", expires_days: "30" });
    loadCoupons();
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
          <div className="flex gap-2">
            <button onClick={loadCoupons} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-200">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300">
              <Plus size={15} /> New Coupon
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <h3 className="font-bold text-gray-900 mb-4">Create Coupon</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">User Email *</label>
                <input value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                  placeholder="user@email.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE10" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400 font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Discount Value</label>
                <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Min Order ($)</label>
                <input type="number" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Expires in (days)</label>
                <input type="number" value={form.expires_days} onChange={e => setForm(f => ({ ...f, expires_days: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-600 mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={createCoupon} className="bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-300">Create</button>
              <button onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 font-semibold px-5 py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading coupons…</div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center">
              <Tag size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No coupons yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.user_email}</td>
                    <td className="px-4 py-3 font-semibold text-orange-500">
                      {c.type === "percent" ? `${c.discount_value}%` : `$${c.discount_value}`}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.expires_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.is_used ? "bg-gray-100 text-gray-500" : new Date(c.expires_at) < new Date() ? "bg-red-100 text-red-500" : "bg-green-100 text-green-600"}`}>
                        {c.is_used ? "Used" : new Date(c.expires_at) < new Date() ? "Expired" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
