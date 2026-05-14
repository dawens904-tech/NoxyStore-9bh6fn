import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TrendingUp, Save } from "lucide-react";

export function AdminMarkupPage() {
  const [markup, setMarkup] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMarkup(); }, []);

  async function loadMarkup() {
    const { data } = await supabase.from("markup_settings").select("markup_percent").eq("id", 1).single();
    if (data) setMarkup(String(data.markup_percent));
    setLoading(false);
  }

  async function saveMarkup() {
    const val = parseFloat(markup);
    if (isNaN(val) || val < 0 || val > 500) { toast.error("Enter a valid markup (0–500%)"); return; }
    setSaving(true);
    const { error } = await supabase.from("markup_settings").upsert({ id: 1, markup_percent: val, updated_at: new Date().toISOString() });
    if (error) { toast.error("Failed to save markup"); } else { toast.success("Markup updated!"); }
    setSaving(false);
  }

  const exampleBase = 10.00;
  const markedUp = exampleBase * (1 + (parseFloat(markup) || 0) / 100);

  return (
    <AdminLayout>
      <div className="p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Price Markup</h1>
            <p className="text-sm text-gray-500">Applied globally to all product prices</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Markup Percentage (%)</label>
          {loading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="number" min="0" max="500" step="0.01"
                value={markup} onChange={e => setMarkup(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-yellow-400"
                placeholder="0"
              />
              <span className="text-2xl font-black text-gray-400">%</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Set to 0 for no markup. Max 500%.</p>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Preview</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-gray-400">Base price</p>
              <p className="text-xl font-black text-gray-900">${exampleBase.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-yellow-600 font-bold">+{markup || 0}%</p>
              <p className="text-sm text-gray-400">markup</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Customer pays</p>
              <p className="text-xl font-black text-orange-500">${markedUp.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">Profit per unit: ${(markedUp - exampleBase).toFixed(2)}</p>
        </div>

        <button onClick={saveMarkup} disabled={saving || loading}
          className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3.5 rounded-xl disabled:opacity-50 transition-colors">
          <Save size={16} /> {saving ? "Saving…" : "Save Markup"}
        </button>
      </div>
    </AdminLayout>
  );
}
