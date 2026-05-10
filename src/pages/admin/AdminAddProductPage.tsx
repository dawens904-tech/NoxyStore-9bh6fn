import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Upload, RefreshCw, ChevronDown, ChevronUp, Edit2, X } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { CATEGORIES } from "@/constants/mockData";
import { toast } from "sonner";

interface ManualProduct {
  id: string;
  product_name: string;
  game_category: string;
  description?: string;
  photo_url?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

interface ManualSku {
  id: string;
  product_id: string;
  sku_name: string;
  original_price: number;
  sale_price?: number;
  photo_url?: string;
  is_active: boolean;
  sort_order: number;
}

interface ManualRegion {
  id: string;
  product_id: string;
  region_name: string;
  region_key: string;
  sort_order: number;
  is_active: boolean;
}

export function AdminAddProductPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<ManualProduct[]>([]);
  const [skusByProduct, setSkusByProduct] = useState<Record<string, ManualSku[]>>({});
  const [regionsByProduct, setRegionsByProduct] = useState<Record<string, ManualRegion[]>>({});
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<"skus" | "regions" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New product form
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Top Up");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductPhoto, setNewProductPhoto] = useState("");
  const [newProductFile, setNewProductFile] = useState<File | null>(null);
  const [newProductPreview, setNewProductPreview] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit product
  const [editProduct, setEditProduct] = useState<ManualProduct | null>(null);

  // New SKU form
  const [skuForms, setSkuForms] = useState<Record<string, { name: string; orig: string; sale: string; url: string; file?: File; preview?: string }>>({});

  // New Region form
  const [regionForms, setRegionForms] = useState<Record<string, { name: string; key: string }>>({});

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from("manual_products").select("*").order("sort_order");
    if (data) setProducts(data);
  };

  const loadSkus = async (productId: string) => {
    const { data } = await supabase.from("manual_skus").select("*").eq("product_id", productId).order("sort_order");
    if (data) setSkusByProduct(prev => ({ ...prev, [productId]: data }));
  };

  const loadRegions = async (productId: string) => {
    const { data } = await supabase.from("manual_product_regions").select("*").eq("product_id", productId).order("sort_order");
    if (data) setRegionsByProduct(prev => ({ ...prev, [productId]: data }));
  };

  const expandProduct = async (id: string) => {
    if (expandedProduct === id) { setExpandedProduct(null); setExpandedSection(null); return; }
    setExpandedProduct(id);
    setExpandedSection("skus");
    await Promise.all([loadSkus(id), loadRegions(id)]);
  };

  const uploadPhoto = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
  };

  const createProduct = async () => {
    if (!newProductName.trim()) { toast.error("Product name required"); return; }
    setIsCreating(true);
    let photoUrl = newProductPhoto;
    if (newProductFile) {
      photoUrl = await uploadPhoto(newProductFile, "manual_product");
    }
    const { error } = await supabase.from("manual_products").insert({
      product_name: newProductName.trim(),
      game_category: newProductCategory,
      description: newProductDesc,
      photo_url: photoUrl || null,
      is_active: true, is_featured: false,
      sort_order: products.length + 1,
      created_by: user?.email,
    });
    if (error) { toast.error("Failed: " + error.message); setIsCreating(false); return; }
    toast.success("Product created!");
    setNewProductName(""); setNewProductCategory("Top Up"); setNewProductDesc(""); setNewProductPhoto(""); setNewProductFile(null); setNewProductPreview("");
    setIsCreating(false);
    loadProducts();
  };

  const saveEditProduct = async () => {
    if (!editProduct) return;
    await supabase.from("manual_products").update({
      product_name: editProduct.product_name,
      game_category: editProduct.game_category,
      description: editProduct.description,
      photo_url: editProduct.photo_url,
      is_active: editProduct.is_active,
      is_featured: editProduct.is_featured,
      updated_at: new Date().toISOString(),
    }).eq("id", editProduct.id);
    toast.success("Product updated!");
    setEditProduct(null);
    loadProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("manual_products").delete().eq("id", id);
    toast.success("Product deleted");
    loadProducts();
  };

  const addSku = async (productId: string) => {
    const form = skuForms[productId];
    if (!form?.name || !form?.orig) { toast.error("SKU name and original price required"); return; }
    let photoUrl = form.url || null;
    if (form.file) { photoUrl = await uploadPhoto(form.file, "manual_sku"); }
    const skus = skusByProduct[productId] || [];
    await supabase.from("manual_skus").insert({
      product_id: productId, sku_name: form.name,
      original_price: parseFloat(form.orig), sale_price: form.sale ? parseFloat(form.sale) : null,
      photo_url: photoUrl, is_active: true, sort_order: skus.length + 1,
    });
    toast.success("SKU added!");
    setSkuForms(prev => ({ ...prev, [productId]: { name: "", orig: "", sale: "", url: "" } }));
    loadSkus(productId);
  };

  const deleteSku = async (skuId: string, productId: string) => {
    await supabase.from("manual_skus").delete().eq("id", skuId);
    toast.success("SKU deleted");
    loadSkus(productId);
  };

  const toggleSkuActive = async (skuId: string, current: boolean, productId: string) => {
    await supabase.from("manual_skus").update({ is_active: !current }).eq("id", skuId);
    loadSkus(productId);
  };

  const moveSku = async (skuId: string, dir: "up" | "down", productId: string) => {
    const skus = skusByProduct[productId] || [];
    const idx = skus.findIndex(s => s.id === skuId);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= skus.length) return;
    const a = skus[idx]; const b = skus[swapIdx];
    await Promise.all([
      supabase.from("manual_skus").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("manual_skus").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    loadSkus(productId);
  };

  const addRegion = async (productId: string) => {
    const form = regionForms[productId];
    if (!form?.name) { toast.error("Region name required"); return; }
    const regions = regionsByProduct[productId] || [];
    await supabase.from("manual_product_regions").insert({
      product_id: productId, region_name: form.name,
      region_key: form.key || form.name.toLowerCase().replace(/\s+/g, "_"),
      sort_order: regions.length + 1, is_active: true,
    });
    toast.success("Region added!");
    setRegionForms(prev => ({ ...prev, [productId]: { name: "", key: "" } }));
    loadRegions(productId);
  };

  const deleteRegion = async (regionId: string, productId: string) => {
    await supabase.from("manual_product_regions").delete().eq("id", regionId);
    loadRegions(productId);
  };

  const toggleProductActive = async (id: string, current: boolean) => {
    await supabase.from("manual_products").update({ is_active: !current }).eq("id", id);
    loadProducts();
  };

  return (
    <AdminLayout title="Add / Manage Products">
      <div className="space-y-6 max-w-4xl">
        {/* Create new product */}
        <div className="bg-[#1a1a1a] border border-yellow-400/20 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Create New Manual Product</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Product Name</label>
              <input type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g. Free Fire Diamonds"
                className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Category</label>
              <select value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400">
                {CATEGORIES.filter(c => c !== "All").map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Photo</label>
              <label className="flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/15 text-white font-semibold px-3 py-2.5 rounded-xl text-sm w-full">
                <Upload size={14} /> {newProductFile ? newProductFile.name.slice(0, 20) : "Upload Photo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return; setNewProductFile(f);
                  const r = new FileReader(); r.onload = ev => setNewProductPreview(ev.target?.result as string); r.readAsDataURL(f);
                }} />
              </label>
            </div>
            {!newProductFile && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Or Photo URL</label>
                <input type="text" value={newProductPhoto} onChange={(e) => setNewProductPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
              </div>
            )}
            {newProductPreview && <img src={newProductPreview} alt="preview" className="col-span-2 w-32 h-32 object-cover rounded-xl bg-gray-800" />}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Description (optional)</label>
              <textarea value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)}
                rows={2} placeholder="Product description..."
                className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 resize-none" />
            </div>
          </div>
          <button onClick={createProduct} disabled={isCreating}
            className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-300">
            {isCreating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Create Product
          </button>
        </div>

        {/* Products list */}
        <div className="space-y-3">
          <h3 className="font-bold text-white">Manual Products ({products.length})</h3>
          {products.map((product) => (
            <div key={product.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
              {/* Product header */}
              {editProduct?.id === product.id ? (
                <div className="p-4 space-y-3">
                  <input type="text" value={editProduct.product_name} onChange={(e) => setEditProduct({ ...editProduct, product_name: e.target.value })}
                    className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
                  <select value={editProduct.game_category} onChange={(e) => setEditProduct({ ...editProduct, game_category: e.target.value })}
                    className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400">
                    {CATEGORIES.filter(c => c !== "All").map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <input type="text" value={editProduct.photo_url || ""} onChange={(e) => setEditProduct({ ...editProduct, photo_url: e.target.value })}
                    placeholder="Photo URL" className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
                  <textarea value={editProduct.description || ""} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    rows={2} placeholder="Description" className="w-full bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 resize-none" />
                  <div className="flex gap-3">
                    <button onClick={saveEditProduct} className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm"><Save size={12} /> Save</button>
                    <button onClick={() => setEditProduct(null)} className="text-gray-400 hover:text-white text-sm px-4 py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4">
                  {product.photo_url && (
                    <img src={product.photo_url} alt={product.product_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-800"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-white">{product.product_name}</p>
                    <p className="text-xs text-gray-500">{product.game_category}{product.description ? ` · ${product.description.slice(0, 40)}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleProductActive(product.id, product.is_active)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${product.is_active ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                      {product.is_active ? "Active" : "Paused"}
                    </button>
                    <button onClick={() => setEditProduct(product)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-red-500 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 size={14} /></button>
                    <button onClick={() => expandProduct(product.id)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg">
                      {expandedProduct === product.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded: SKUs & Regions */}
              {expandedProduct === product.id && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Section tabs */}
                  <div className="flex gap-2">
                    {(["skus", "regions"] as const).map(sec => (
                      <button key={sec} onClick={() => setExpandedSection(sec)}
                        className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${expandedSection === sec ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                        {sec === "skus" ? "SKUs / Prices" : "Servers / Regions"}
                      </button>
                    ))}
                  </div>

                  {/* SKUs */}
                  {expandedSection === "skus" && (
                    <div className="space-y-3">
                      {(skusByProduct[product.id] || []).map((sku, idx, arr) => (
                        <div key={sku.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                          {sku.photo_url && <img src={sku.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{sku.sku_name}</p>
                            <p className="text-xs text-gray-500">
                              ${sku.original_price}{sku.sale_price ? ` → $${sku.sale_price}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveSku(sku.id, "up", product.id)} disabled={idx === 0} className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30"><ChevronUp size={12} /></button>
                            <button onClick={() => moveSku(sku.id, "down", product.id)} disabled={idx === arr.length - 1} className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30"><ChevronDown size={12} /></button>
                            <button onClick={() => toggleSkuActive(sku.id, sku.is_active, product.id)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${sku.is_active ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                              {sku.is_active ? "On" : "Off"}
                            </button>
                            <button onClick={() => deleteSku(sku.id, product.id)} className="p-1.5 text-red-500 hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                      {/* Add SKU form */}
                      <div className="bg-white/5 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Add SKU</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="SKU name (e.g. 100 Diamonds)"
                            value={skuForms[product.id]?.name || ""} onChange={(e) => setSkuForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], name: e.target.value } }))}
                            className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                          <input type="number" placeholder="Original price ($)"
                            value={skuForms[product.id]?.orig || ""} onChange={(e) => setSkuForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], orig: e.target.value } }))}
                            className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                          <input type="number" placeholder="Sale price (optional)"
                            value={skuForms[product.id]?.sale || ""} onChange={(e) => setSkuForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], sale: e.target.value } }))}
                            className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                          <input type="text" placeholder="Photo URL (optional)"
                            value={skuForms[product.id]?.url || ""} onChange={(e) => setSkuForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], url: e.target.value } }))}
                            className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                        </div>
                        <button onClick={() => addSku(product.id)} className="flex items-center gap-1.5 bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300">
                          <Plus size={12} /> Add SKU
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Regions */}
                  {expandedSection === "regions" && (
                    <div className="space-y-3">
                      {(regionsByProduct[product.id] || []).map((region) => (
                        <div key={region.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{region.region_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{region.region_key}</p>
                          </div>
                          <button onClick={() => deleteRegion(region.id, product.id)} className="p-1.5 text-red-500 hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                      ))}
                      <div className="bg-white/5 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Add Region / Server</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Region name (e.g. USA & Latam)"
                            value={regionForms[product.id]?.name || ""} onChange={(e) => setRegionForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], name: e.target.value } }))}
                            className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                          <input type="text" placeholder="Region key (e.g. usa_latam)"
                            value={regionForms[product.id]?.key || ""} onChange={(e) => setRegionForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], key: e.target.value } }))}
                            className="bg-[#0f0f0f] border border-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                        </div>
                        <button onClick={() => addRegion(product.id)} className="flex items-center gap-1.5 bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300">
                          <Plus size={12} /> Add Region
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-12 text-center">
              <Plus size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No manual products yet. Create your first product above.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
