import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, GripVertical } from "lucide-react";

interface HomeSection {
  id: string;
  section_name: string;
  section_key: string;
  sort_order: number;
  is_active: boolean;
  game_ids: string[];
}

interface Game {
  game_id: string;
  game_name: string;
}

export function AdminHomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<HomeSection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newSection, setNewSection] = useState({ section_name: "", section_key: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: secs }, { data: gms }] = await Promise.all([
      supabase.from("home_sections").select("*").order("sort_order"),
      supabase.from("games_cache").select("game_id, game_name").order("game_name").limit(200),
    ]);
    setSections(secs || []);
    setGames(gms || []);
    setLoading(false);
  }

  async function createSection() {
    if (!newSection.section_name) { toast.error("Name required"); return; }
    const { error } = await supabase.from("home_sections").insert({
      section_name: newSection.section_name,
      section_key: newSection.section_key || newSection.section_name.toLowerCase().replace(/\s+/g, "_"),
      sort_order: sections.length,
      is_active: true,
      game_ids: [],
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Section created!");
    setShowForm(false);
    setNewSection({ section_name: "", section_key: "" });
    loadData();
  }

  async function deleteSection(id: string) {
    if (!confirm("Delete this section?")) return;
    await supabase.from("home_sections").delete().eq("id", id);
    if (selectedSection?.id === id) setSelectedSection(null);
    loadData();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("home_sections").update({ is_active: !current }).eq("id", id);
    loadData();
  }

  async function updateGameIds(sectionId: string, gameIds: string[]) {
    await supabase.from("home_sections").update({ game_ids: gameIds, updated_at: new Date().toISOString() }).eq("id", sectionId);
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, game_ids: gameIds } : s));
    setSelectedSection(prev => prev?.id === sectionId ? { ...prev, game_ids: gameIds } : prev);
  }

  function toggleGame(gameId: string) {
    if (!selectedSection) return;
    const ids = selectedSection.game_ids || [];
    const updated = ids.includes(gameId) ? ids.filter(id => id !== gameId) : [...ids, gameId];
    updateGameIds(selectedSection.id, updated);
  }

  return (
    <AdminLayout>
      <div className="p-6 flex gap-5" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Sections list */}
        <div className="w-80 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-gray-900">Home Sections</h1>
            <div className="flex gap-1.5">
              <button onClick={loadData} className="text-gray-400 hover:text-gray-700 p-1.5"><RefreshCw size={14} /></button>
              <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-300">
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <input value={newSection.section_name} onChange={e => setNewSection(f => ({ ...f, section_name: e.target.value }))}
                placeholder="Section name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 mb-2" />
              <input value={newSection.section_key} onChange={e => setNewSection(f => ({ ...f, section_key: e.target.value }))}
                placeholder="Key (auto-generated)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 mb-2" />
              <div className="flex gap-2">
                <button onClick={createSection} className="flex-1 bg-yellow-400 text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-300">Create</button>
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
            ) : sections.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No sections yet</div>
            ) : sections.map(s => (
              <div key={s.id} className={`flex items-center gap-2 px-3 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedSection?.id === s.id ? "bg-yellow-50" : ""}`}
                onClick={() => setSelectedSection(s)}>
                <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.section_name}</p>
                  <p className="text-[10px] text-gray-400">{s.game_ids?.length || 0} games · {s.section_key}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleActive(s.id, s.is_active); }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.is_active ? "On" : "Off"}
                </button>
                <button onClick={e => { e.stopPropagation(); deleteSection(s.id); }} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Game picker */}
        <div className="flex-1">
          {selectedSection ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedSection.section_name}</h2>
              <p className="text-sm text-gray-400 mb-4">{selectedSection.game_ids?.length || 0} games selected — click to toggle</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {games.map(game => {
                  const selected = selectedSection.game_ids?.includes(game.game_id);
                  return (
                    <button key={game.game_id} onClick={() => toggleGame(game.game_id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${selected ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? "bg-yellow-400 border-yellow-400" : "border-gray-300"}`}>
                        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <p className="text-xs font-semibold text-gray-900 truncate">{game.game_name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <GripVertical size={24} className="text-gray-300" />
                </div>
                <p className="text-sm">Select a section to manage its games</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
