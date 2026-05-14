import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Edit2, Check, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { lootbarApi } from "@/lib/lootbar-api";
import { toast } from "sonner";

interface HomeSection {
  id: string; section_name: string; section_key: string;
  sort_order: number; is_active: boolean; game_ids: string[];
}

const DEFAULT_SECTIONS = [
  { name: "New Games", key: "new_games" },
  { name: "Hot Selling", key: "hot_selling" },
  { name: "Trending Gift Card", key: "trending_gift_card" },
  { name: "Game Coins", key: "game_coins" },
  { name: "Popular Game Keys", key: "popular_game_keys" },
];

export function AdminHomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSections();
    loadGames();
  }, []);

  const loadSections = async () => {
    const { data } = await supabase.from("home_sections").select("*").order("sort_order");
    if (data) setSections(data as HomeSection[]);
  };

  const loadGames = async () => {
    const { data } = await supabase.from("games_cache").select("game_id, game_name, game_image, category").order("game_name");
    if (data && data.length > 0) { setGames(data); return; }
    try { const g = await lootbarApi.getGames(1, 200); setGames(g); } catch {}
  };

  const createSection = async () => {
    if (!newSectionName.trim()) return;
    const key = newSectionName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    await supabase.from("home_sections").insert({ section_name: newSectionName, section_key: key, sort_order: sections.length + 1, is_active: true, game_ids: [] });
    setNewSectionName(""); toast.success("Section created!"); loadSections();
  };

  const addDefaultSection = async (name: string, key: string) => {
    const exists = sections.some(s => s.section_key === key);
    if (exists) { toast.info("Section already exists"); return; }
    await supabase.from("home_sections").insert({ section_name: name, section_key: key, sort_order: sections.length + 1, is_active: true, game_ids: [] });
    toast.success(`"${name}" section added!`); loadSections();
  };

  const saveSection = async (sec: HomeSection) => {
    await supabase.from("home_sections").upsert({ ...sec, updated_at: new Date().toISOString() });
    toast.success("Section saved!"); setEditingId(null); setEditingSection(null); loadSections();
  };

  const deleteSection = async (id: string) => {
    await supabase.from("home_sections").delete().eq("id", id);
    toast.success("Section deleted"); loadSections();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("home_sections").update({ is_active: !current }).eq("id", id);
    loadSections();
  };

  const toggleGame = (gameId: string, sec: HomeSection) => {
    const newIds = sec.game_ids.includes(gameId)
      ? sec.game_ids.filter(id => id !== gameId)
      : [...sec.game_ids, gameId];
    setEditingSection({ ...sec, game_ids: newIds });
  };

  return (
    <AdminLayout title="Home Sections">
      <div className="space-y-6 max-w-4xl">
        {/* Quick add default sections */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-3">Quick Add Preset Sections</h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SECTIONS.map(s => (
              <button key={s.key} onClick={() => addDefaultSection(s.name, s.key)}
                className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-yellow-400/20">
                <Plus size={12} /> {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Create custom section */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-3">Create Custom Section</h3>
          <div className="flex gap-3">
            <input type="text" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createSection()}
              placeholder="Section name (e.g. Weekend Deals)"
              className="flex-1 bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
            <button onClick={createSection} className="bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl hover:bg-yellow-300 flex items-center gap-2">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Sections list */}
        {sections.map((sec) => (
          <div key={sec.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-white">{sec.section_name}</h3>
                <p className="text-xs text-gray-500 font-mono">key: {sec.section_key}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(sec.id, sec.is_active)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${sec.is_active ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                  {sec.is_active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => { setEditingId(editingId === sec.id ? null : sec.id); setEditingSection(editingId === sec.id ? null : { ...sec }); }}
                  className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => deleteSection(sec.id)} className="p-2 text-red-500 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-xs text-gray-500">{sec.game_ids.length} games assigned</p>

            {editingId === sec.id && editingSection && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-sm font-semibold text-gray-300 mb-3">Select games:</p>
                <input type="text" placeholder="Filter games…" id={`filter-${sec.id}`}
                  className="w-full mb-3 bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 placeholder-gray-600"
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    document.querySelectorAll(`[data-section="${sec.id}"]`).forEach((el: any) => {
                      el.style.display = el.dataset.name.includes(q) ? "" : "none";
                    });
                  }} />
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                  {games.map((game) => {
                    const isIn = editingSection.game_ids.includes(game.game_id);
                    return (
                      <button key={game.game_id} data-section={sec.id} data-name={game.game_name?.toLowerCase()}
                        onClick={() => toggleGame(game.game_id, editingSection)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all ${isIn ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-300" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isIn ? "bg-yellow-400" : "bg-white/10"}`}>
                          {isIn && <Check size={10} className="text-black" />}
                        </div>
                        {game.game_image && <img src={game.game_image} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />}
                        <span className="truncate text-xs">{game.game_name}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => saveSection(editingSection)} className="bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl hover:bg-yellow-300 flex items-center gap-2 text-sm">
                    <Save size={14} /> Save ({editingSection.game_ids.length} games)
                  </button>
                  <button onClick={() => { setEditingId(null); setEditingSection(null); }} className="bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-500">No sections yet. Add a preset section or create a custom one.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
