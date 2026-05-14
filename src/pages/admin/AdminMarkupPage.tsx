import { useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export function AdminMarkupPage() {
  const { orders } = useAuthStore();
  const [markup, setMarkup] = useState(0);
  const [markupInput, setMarkupInput] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.from("markup_settings").select("markup_percent").eq("id", 1).single()
      .then(({ data }) => {
        if (data) { setMarkup(Number(data.markup_percent)); setMarkupInput(String(data.markup_percent)); }
      });
  }, []);

  const saveMarkup = async () => {
    const val = parseFloat(markupInput);
    if (isNaN(val) || val < 0 || val > 100) { toast.error("Markup must be 0–100%"); return; }
    setIsSaving(true);
    await supabase.from("markup_settings").upsert({ id: 1, markup_percent: val, updated_at: new Date().toISOString() });
    setIsSaving(false);
    setMarkup(val);
    toast.success(`Markup set to ${val}%`);
  };

  const totalRevenue = orders.reduce((s, o) => s + o.price, 0);

  return (
    <AdminLayout title="Markup & Pricing">
      <div className="space-y-6 max-w-2xl">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-2">Global Price Markup</h3>
          <p className="text-sm text-gray-400 mb-5">All Lootbar prices multiplied by (1 + markup%). Customer sees the marked-up price.</p>
          <div className="flex items-center gap-6 mb-5">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Markup Percentage</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={markupInput} onChange={(e) => setMarkupInput(e.target.value)}
                  className="w-32 bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-xl font-black outline-none focus:border-yellow-400"
                />
                <span className="text-white text-2xl font-black">%</span>
              </div>
            </div>
            <div className="text-right bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">$10.00 base →</p>
              <p className="text-xl font-black text-yellow-400">${(10 * (1 + parseFloat(markupInput || "0") / 100)).toFixed(2)}</p>
              <p className="text-xs text-green-400">+${(10 * parseFloat(markupInput || "0") / 100).toFixed(2)} profit</p>
            </div>
          </div>
          <button onClick={saveMarkup} disabled={isSaving} className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-300">
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Markup
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Profit Tracking</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-yellow-400" },
              { label: "Est. Base Cost", value: `$${(totalRevenue / (1 + markup / 100)).toFixed(2)}`, color: "text-gray-300" },
              { label: "Est. Profit", value: `$${(totalRevenue - totalRevenue / (1 + markup / 100)).toFixed(2)}`, color: "text-green-400" },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-xl p-4 text-center">
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
