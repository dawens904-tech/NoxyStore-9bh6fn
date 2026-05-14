import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, Upload, Image as ImageIcon, GripVertical } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM = { title: "", subtitle: "", image_url: "", link: "/", sort_order: 0, is_active: true };

export function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBanners(); }, []);

  async function loadBanners() {
    setLoading(true);
    const { data } = await supabase.from("home_banners").select("*").order("sort_order", { ascending: true });
    setBanners(data || []);
    setLoading(false);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: url } = supabase.storage.from("banners").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: url.publicUrl }));
    setUploading(false);
  }

  async function saveBanner() {
    if (!form.title || !form.image_url) { toast.error("Title and image are required"); return; }
    const { error } = await supabase.from("home_banners").insert({ ...form, updated_at: new Date().toISOString() });
    if (error) { toast.error(error.message); return; }
    toast.success("Banner created!");
    setShowForm(false);
    setForm(EMPTY_FORM);
    loadBanners();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("home_banners").update({ is_active: !current }).eq("id", id);
    loadBanners();
  }

  async function deleteBanner(id: string) {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("home_banners").delete().eq("id", id);
    toast.success("Banner deleted");
    loadBanners();
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">Banners</h1>
          <div className="flex gap-2">
            <button onClick={loadBanners} className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg hover:text-gray-800">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300">
              <Plus size={15} /> Add Banner
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <h3 className="font-bold text-gray-900 mb-4">New Banner</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Banner title" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Link</label>
                <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="/game/123" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Subtitle</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Optional subtitle" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-600 mb-1 block">Banner Image *</label>
              {form.image_url ? (
                <div className="relative">
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  <button onClick={() => setForm(f => ({ ...f, image_url: "" }))} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-yellow-400 transition-colors">
                  {uploading ? <RefreshCw size={20} className="animate-spin" /> : <><Upload size={20} /><span className="text-sm">Upload image</span></>}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              <p className="text-xs text-gray-400 mt-1">Or paste URL:</p>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 mt-1" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveBanner} className="bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-300">Save Banner</button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="border border-gray-200 text-gray-600 font-semibold px-5 py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No banners yet. Add your first banner above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map(banner => (
              <div key={banner.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden flex items-center gap-4 p-3 hover:shadow-sm transition-shadow">
                <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                <img src={banner.image_url} alt={banner.title} className="w-24 h-14 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{banner.title}</p>
                  {banner.subtitle && <p className="text-xs text-gray-400 truncate">{banner.subtitle}</p>}
                  <p className="text-xs text-gray-400 font-mono">{banner.link} · order {banner.sort_order}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(banner.id, banner.is_active)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {banner.is_active ? "Active" : "Hidden"}
                  </button>
                  <button onClick={() => deleteBanner(banner.id)} className="text-red-400 hover:text-red-600 p-1.5">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
