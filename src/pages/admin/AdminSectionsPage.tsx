/**
 * AdminSectionsPage — Manage homepage sections stored in `home_sections` table.
 * Features: view all sections, add/edit (name, section_key, sort_order, is_active),
 * toggle active/inactive, reorder (up/down), game ID search picker for curating
 * which games appear in each section (Featured, Hot Games, New Arrivals, etc.).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import AdminSidebar from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Loader2,
  ChevronUp, ChevronDown, RefreshCw, Layout, Search, Check, Package,
} from "lucide-react";
import { toast } from "sonner";

interface HomeSection {
  id: string;
  section_name: string;
  section_key: string;
  sort_order: number;
  is_active: boolean;
  game_ids: string[];
  created_at: string;
  updated_at: string;
}

interface GameOption {
  game_id: string;
  game_name: string;
  game_image: string | null;
  category: string | null;
  source: "lootbar" | "manual";
}

const EMPTY_FORM = {
  section_name: "",
  section_key: "",
  is_active: true,
  game_ids: [] as string[],
};

// ── Game Picker Component ─────────────────────────────────────────────────────
function GamePicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<GameOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGames = useCallback(async (q: string) => {
    setIsLoading(true);
    const [lootbarRes, manualRes] = await Promise.all([
      supabase.from("games_cache").select("game_id, game_name, game_image, category")
        .ilike("game_name", `%${q}%`).order("game_name").limit(30),
      supabase.from("manual_products").select("id, product_name, photo_url, game_category")
        .ilike("product_name", `%${q}%`).eq("is_active", true).order("product_name").limit(20),
    ]);
    const lootbar: GameOption[] = (lootbarRes.data || []).map((g: any) => ({
      game_id: g.game_id, game_name: g.game_name, game_image: g.game_image, category: g.category, source: "lootbar",
    }));
    const manual: GameOption[] = (manualRes.data || []).map((p: any) => ({
      game_id: p.id, game_name: p.product_name, game_image: p.photo_url, category: p.game_category, source: "manual",
    }));
    setGames([...lootbar, ...manual]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadGames(search);
  }, [search]);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...selectedIds];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  };

  const moveDown = (idx: number) => {
    if (idx >= selectedIds.length - 1) return;
    const arr = [...selectedIds];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  };

  const selectedGames = selectedIds
    .map((id) => games.find((g) => g.game_id === id))
    .filter(Boolean) as GameOption[];

  return (
    <div className="space-y-3">
      {/* Selected games list */}
      {selectedIds.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
            Selected ({selectedIds.length}) — drag/reorder
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto bg-yellow-50 border border-yellow-100 rounded-xl p-2">
            {selectedIds.map((id, idx) => {
              const g = games.find((x) => x.game_id === id);
              return (
                <div key={id} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-yellow-100">
                  {g?.game_image ? (
                    <img src={g.game_image} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <Package size={10} className="text-gray-400" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-gray-800 flex-1 truncate">{g?.game_name || id}</span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0}
                      className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">
                      <ChevronUp size={10} />
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === selectedIds.length - 1}
                      className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">
                      <ChevronDown size={10} />
                    </button>
                    <button onClick={() => toggle(id)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-red-100 hover:bg-red-200 text-red-600">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games to add…"
          className="pl-8 text-sm rounded-xl"
        />
      </div>

      {/* Game list */}
      <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-gray-300" />
          </div>
        ) : games.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6">No games found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {games.map((g) => {
              const isSelected = selectedIds.includes(g.game_id);
              return (
                <button key={g.game_id} onClick={() => toggle(g.game_id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${isSelected ? "bg-yellow-50" : ""}`}>
                  {g.game_image ? (
                    <img src={g.game_image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{g.game_name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{g.category || "Top Up"} · {g.source === "manual" ? "Manual" : "Lootbar"}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section Edit/Create Modal ─────────────────────────────────────────────────
function SectionModal({
  section,
  onClose,
  onSaved,
}: {
  section: HomeSection | null;
  onClose: () => void;
  onSaved: (s: HomeSection) => void;
}) {
  const [form, setForm] = useState(
    section
      ? {
          section_name: section.section_name,
          section_key: section.section_key,
          is_active: section.is_active,
          game_ids: section.game_ids || [],
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  // Auto-generate section_key from name (if creating new)
  const handleNameChange = (name: string) => {
    const key = !section
      ? name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
      : form.section_key;
    setForm((f) => ({ ...f, section_name: name, section_key: !section ? key : f.section_key }));
  };

  const handleSave = async () => {
    if (!form.section_name.trim()) { toast.error("Section name is required"); return; }
    if (!form.section_key.trim()) { toast.error("Section key is required"); return; }
    setSaving(true);

    if (section) {
      const { data, error } = await supabase
        .from("home_sections")
        .update({
          section_name: form.section_name.trim(),
          section_key: form.section_key.trim(),
          is_active: form.is_active,
          game_ids: form.game_ids,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id)
        .select()
        .single();
      setSaving(false);
      if (error) { toast.error("Save failed: " + error.message); return; }
      toast.success("Section updated");
      onSaved(data as HomeSection);
    } else {
      const { data: countData } = await supabase.from("home_sections").select("sort_order")
        .order("sort_order", { ascending: false }).limit(1).single();
      const nextOrder = (countData?.sort_order ?? -1) + 1;
      const { data, error } = await supabase
        .from("home_sections")
        .insert({
          section_name: form.section_name.trim(),
          section_key: form.section_key.trim(),
          is_active: form.is_active,
          game_ids: form.game_ids,
          sort_order: nextOrder,
        })
        .select()
        .single();
      setSaving(false);
      if (error) { toast.error("Create failed: " + error.message); return; }
      toast.success("Section created");
      onSaved(data as HomeSection);
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layout size={15} /> {section ? "Edit Section" : "Add Section"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Name */}
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1 block">Section Name *</Label>
            <Input
              value={form.section_name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Featured Games, Hot Deals, New Arrivals"
              className="text-sm rounded-xl"
            />
          </div>

          {/* Key */}
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1 block">Section Key *</Label>
            <Input
              value={form.section_key}
              onChange={(e) => setForm((f) => ({ ...f, section_key: e.target.value }))}
              placeholder="e.g. featured_games"
              className="text-sm rounded-xl font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">Unique identifier used internally. Auto-generated from name.</p>
          </div>

          {/* Active toggle */}
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Active (visible on homepage)</span>
            </div>
            <div
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form.is_active ? "bg-yellow-400" : "bg-gray-300"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </label>

          {/* Game Picker */}
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-2 block">Curated Games</Label>
            <GamePicker
              selectedIds={form.game_ids}
              onChange={(ids) => setForm((f) => ({ ...f, game_ids: ids }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0 gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving…" : "Save Section"}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSectionsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editSection, setEditSection] = useState<HomeSection | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    loadSections();
  }, [user]);

  const loadSections = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("home_sections")
      .select("*")
      .order("sort_order");
    if (error) toast.error("Failed to load sections");
    else setSections((data || []) as HomeSection[]);
    setIsLoading(false);
  };

  const handleSaved = (updated: HomeSection) => {
    setSections((prev) => {
      const existing = prev.find((s) => s.id === updated.id);
      if (existing) return prev.map((s) => (s.id === updated.id ? updated : s));
      return [...prev, updated];
    });
  };

  const handleToggleActive = async (section: HomeSection) => {
    const { error } = await supabase
      .from("home_sections")
      .update({ is_active: !section.is_active, updated_at: new Date().toISOString() })
      .eq("id", section.id);
    if (error) { toast.error(error.message); return; }
    setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, is_active: !s.is_active } : s));
    toast.success(section.is_active ? "Section hidden" : "Section shown");
  };

  const handleDelete = async (section: HomeSection) => {
    if (!confirm(`Delete section "${section.section_name}"? This cannot be undone.`)) return;
    setDeleting(section.id);
    const { error } = await supabase.from("home_sections").delete().eq("id", section.id);
    setDeleting(null);
    if (error) { toast.error(error.message); return; }
    setSections((prev) => prev.filter((s) => s.id !== section.id));
    toast.success("Section deleted");
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    const reordered = [...sections];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const updates = reordered.map((s, i) => ({ id: s.id, sort_order: i }));
    setSections(reordered.map((s, i) => ({ ...s, sort_order: i })));
    await Promise.all(
      updates.map((u) =>
        supabase.from("home_sections").update({ sort_order: u.sort_order }).eq("id", u.id)
      )
    );
    toast.success("Order updated");
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <main className="ml-64 flex-1 py-8">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Homepage Sections</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {sections.length} sections · manage display order and game curation
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadSections} variant="outline" className="gap-2 rounded-xl" disabled={isLoading}>
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                Reload
              </Button>
              <Button
                onClick={() => setEditSection(null)}
                className="gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0"
              >
                <Plus size={14} /> Add Section
              </Button>
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-5 text-xs text-blue-700 flex items-center gap-2">
            <Layout size={13} className="text-blue-500 flex-shrink-0" />
            <span>
              Sections appear on the homepage in order. Each section can contain a curated list of games from both
              Lootbar and manual products. Active sections are visible to all users.
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
              <Layout size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No sections yet</p>
              <p className="text-gray-400 text-sm mt-1 mb-5">
                Create homepage sections to curate game collections for your users
              </p>
              <Button
                onClick={() => setEditSection(null)}
                className="gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0"
              >
                <Plus size={14} /> Create First Section
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`bg-white rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${
                    section.is_active ? "border-gray-100" : "border-gray-100 opacity-60"
                  }`}
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === sections.length - 1}
                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  {/* Order badge */}
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-gray-600">#{idx + 1}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">{section.section_name}</p>
                      {!section.is_active && (
                        <span className="text-[9px] bg-gray-200 text-gray-600 font-bold px-1.5 py-0.5 rounded">HIDDEN</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{section.section_key}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {section.game_ids?.length || 0} game{(section.game_ids?.length || 0) !== 1 ? "s" : ""} curated
                      </span>
                      {(section.game_ids?.length || 0) > 0 && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 font-semibold px-1.5 py-0.5 rounded">
                          Curated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(section)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        section.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      title={section.is_active ? "Hide section" : "Show section"}
                    >
                      {section.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => setEditSection(section)}
                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-700 flex items-center justify-center transition-colors"
                      title="Edit section"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(section)}
                      disabled={deleting === section.id}
                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Delete section"
                    >
                      {deleting === section.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview link */}
          {sections.filter((s) => s.is_active).length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => window.open("/", "_blank")}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Preview homepage →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit / Create Modal */}
      {editSection !== undefined && (
        <SectionModal
          section={editSection}
          onClose={() => setEditSection(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
