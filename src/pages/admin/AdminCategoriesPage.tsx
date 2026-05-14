import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, Edit2, X } from "lucide-react";

interface GameCategory {
  name: string;
  count: number;
}

const DEFAULT_CATEGORIES = ["Top Up", "Gift Card", "Game Pass", "CD Key", "Voucher", "Subscription"];

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    const { data } = await supabase.from("games_cache").select("category");
    const manualData = await supabase.from("manual_products").select("game_category");

    const countMap = new Map<string, number>();
    (data || []).forEach(g => { if (g.category) countMap.set(g.category, (countMap.get(g.category) || 0) + 1); });
    (manualData.data || []).forEach(g => { if (g.game_category) countMap.set(g.game_category, (countMap.get(g.game_category) || 0) + 1); });

    // Also show default categories even if 0 games
    DEFAULT_CATEGORIES.forEach(c => { if (!countMap.has(c)) countMap.set(c, 0); });

    const sorted = Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    setCategories(sorted);
    setLoading(false);
  }

  async function renameCategory() {
    if (!editTarget || !editValue.trim()) return;
    // Update all games_cache records
    await supabase.from("games_cache").update({ category: editValue }).eq("category", editTarget);
    // Update all manual_products records
    await supabase.from("manual_products").update({ game_category: editValue }).eq("game_category", editTarget);
    toast.success(`Renamed "${editTarget}" → "${editValue}"`);
    setEditTarget(null);
    setEditValue("");
    loadCategories();
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <button onClick={loadCategories} className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg hover:text-gray-800">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5">
          <strong>Note:</strong> Categories are derived from existing game entries. Renaming a category updates all games in that category.
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Category Name</span>
            <span>Games</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
          ) : categories.map(cat => (
            <div key={cat.name} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 group">
              {editTarget === cat.name ? (
                <div className="flex items-center gap-2 flex-1">
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                    className="flex-1 border border-yellow-400 rounded-lg px-3 py-1.5 text-sm outline-none" />
                  <button onClick={renameCategory} className="bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs">Save</button>
                  <button onClick={() => { setEditTarget(null); setEditValue(""); }} className="border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-xs">Cancel</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="font-semibold text-gray-900 text-sm">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{cat.count} game{cat.count !== 1 ? "s" : ""}</span>
                    <button onClick={() => { setEditTarget(cat.name); setEditValue(cat.name); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 transition-opacity p-1">
                      <Edit2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
