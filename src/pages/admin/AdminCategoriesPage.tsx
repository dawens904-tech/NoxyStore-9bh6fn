import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { lootbarApi } from "@/lib/lootbar-api";
import { CATEGORIES } from "@/constants/mockData";
import { toast } from "sonner";

export function AdminCategoriesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setIsLoading(true);
    const { data: cached } = await supabase.from("games_cache").select("*").order("game_name");
    if (cached && cached.length > 0) { setGames(cached); }
    else {
      try { const g = await lootbarApi.getGames(1, 200); setGames(g); } catch {}
    }
    const { data: ovr } = await supabase.from("game_overrides").select("game_id, category_override");
    if (ovr) {
      const map: Record<string, string> = {};
      ovr.forEach((r: any) => { if (r.category_override) map[r.game_id] = r.category_override; });
      setOverrides(map);
    }
    setIsLoading(false);
  };

  const save = async (gameId: string, category: string) => {
    await supabase.from("game_overrides").upsert({ game_id: gameId, category_override: category, updated_at: new Date().toISOString() });
    setOverrides(prev => ({ ...prev, [gameId]: category }));
    toast.success("Category updated");
  };

  const filtered = games.filter(g => !search || g.game_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Game Categories">
      <div className="space-y-4 max-w-4xl">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games…"
            className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-yellow-400 placeholder-gray-600" />
        </div>
        <p className="text-xs text-gray-500">{filtered.length} games{search ? " matching search" : ""}</p>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <p className="text-center text-gray-500 py-12">Loading games…</p>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((game) => (
                <div key={game.game_id} className="px-5 py-4 flex items-center gap-4">
                  <img src={game.game_image} alt={game.game_name}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-gray-800"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{game.game_name}</p>
                    <p className="text-xs text-gray-500">ID: {game.game_id}</p>
                  </div>
                  <select
                    value={overrides[game.game_id] || game.category || "Top Up"}
                    onChange={(e) => save(game.game_id, e.target.value)}
                    className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 flex-shrink-0"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-gray-500 text-center py-12">No games found</p>}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
