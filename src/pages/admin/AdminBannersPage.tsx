import { useEffect, useState } from "react";
import { RefreshCw, Plus, Edit2, Trash2, Save, Upload, X } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Banner {
  id: string; title: string; subtitle: string;
  image_url: string; link: string; sort_order: number; is_active: boolean;
}

export function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("home_banners").select("*").order("sort_order");
    if (data) setBanners(data);
  };

  const save = async () => {
    if (!editing?.title || (!editing?.image_url && !file)) { toast.error("Title and image required"); return; }
    setIsSaving(true);
    let imageUrl = editing.image_url || "";
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `banner_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) { toast.error("Upload failed: " + upErr.message); setIsSaving(false); return; }
      imageUrl = supabase.storage.from("banners").getPublicUrl(path).data.publicUrl;
    }
    if (editing.id) {
      await supabase.from("home_banners").update({ title: editing.title, subtitle: editing.subtitle || "", image_url: imageUrl, link: editing.link || "/", sort_order: editing.sort_order || 1, updated_at: new Date().toISOString() }).eq("id", editing.id);
    } else {
      await supabase.from("home_banners").insert({ title: editing.title, subtitle: editing.subtitle || "", image_url: imageUrl, link: editing.link || "/", sort_order: editing.sort_order || banners.length + 1, is_active: true });
    }
    toast.success(editing.id ? "Banner updated!" : "Banner created!");
    setEditing(null); setFile(null); setPreview(""); setIsSaving(false); load();
  };

  const del = async (id: string) => {
    await supabase.from("home_banners").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const toggle = async (id: string, current: boolean) => {
    await supabase.from("home_banners").update({ is_active: !current }).eq("id", id);
    load();
  };

  return (
    <AdminLayout title="Home Banners">
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-end">
          <button
            onClick={() => { setEditing({ title: "", subtitle: "", image_url: "", link: "/", sort_order: banners.length + 1 }); setFile(null); setPreview(""); }}
            className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl hover:bg-yellow-300"
          >
            <Plus size={16} /> Add Banner
          </button>
        </div>

        {/* Form */}
        {editing !== null && (
          <div className="bg-[#1a1a1a] border border-yellow-400/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">{editing.id ? "Edit Banner" : "New Banner"}</h3>
              <button onClick={() => { setEditing(null); setFile(null); setPreview(""); }} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Banner Image</label>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-xl text-sm mb-2">
                <Upload size={14} /> {file ? file.name : "Upload Image"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return; setFile(f);
                  const r = new FileReader(); r.onload = (ev) => setPreview(ev.target?.result as string); r.readAsDataURL(f);
                }} />
              </label>
              <span className="text-gray-500 text-sm ml-2">or paste URL:</span>
              {!file && (
                <input type="text" value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  placeholder="https://..." className="w-full mt-2 bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
              )}
              {(preview || editing.image_url) && (
                <img src={preview || editing.image_url} alt="preview" className="w-full h-36 object-cover rounded-xl mt-2 bg-gray-800" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Title</label>
                <input type="text" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Banner title" className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Subtitle</label>
                <input type="text" value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  placeholder="Optional subtitle" className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Link</label>
                <input type="text" value={editing.link || "/"} onChange={(e) => setEditing({ ...editing, link: e.target.value })}
                  placeholder="/games" className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Sort Order</label>
                <input type="number" value={editing.sort_order || 1} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={isSaving} className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-300">
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} {editing.id ? "Save Changes" : "Create Banner"}
              </button>
              <button onClick={() => { setEditing(null); setFile(null); setPreview(""); }} className="bg-white/10 text-white font-semibold px-6 py-3 rounded-xl">Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex gap-4 p-4">
                <img src={b.image_url} alt={b.title} className="w-40 h-24 object-cover rounded-xl flex-shrink-0 bg-gray-800"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&h=96&fit=crop"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold">{b.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{b.subtitle}</p>
                  <p className="text-gray-600 text-xs mt-1 font-mono truncate">{b.link}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button onClick={() => toggle(b.id, b.is_active)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${b.is_active ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                    {b.is_active ? "Active" : "Hidden"}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing({ id: b.id, title: b.title, subtitle: b.subtitle, image_url: b.image_url, link: b.link, sort_order: b.sort_order }); setFile(null); setPreview(""); }}
                      className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => del(b.id)} className="p-2 text-red-500 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-gray-400">No banners yet. Click "Add Banner" to create one.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
