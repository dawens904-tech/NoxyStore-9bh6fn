import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Plus, Trash2, RefreshCw, Upload, Search, Edit2,
  ChevronDown, ChevronUp, X, Check, Star, EyeOff, Eye
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ManualProduct {
  id: string;
  product_name: string;
  game_category: string;
  photo_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  requires_server: boolean;
  requires_player_id: boolean;
  short_description: string;
  full_description: string;
  lootbar_game_id: string | null;
  created_at: string;
}

interface ManualRegion {
  id: string;
  product_id: string;
  region_name: string;
  region_key: string;
  sort_order: number;
  is_active: boolean;
}

interface ManualSku {
  id: string;
  product_id: string;
  region_id: string | null;
  sku_name: string;
  original_price: number;
  sale_price: number | null;
  photo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface LootbarGame {
  game_id: string;
  game_name: string;
  game_image: string | null;
  category: string | null;
  is_featured: boolean | null;
  is_hidden: boolean | null;
  sort_order: number;
}

interface GameOverride {
  game_id: string;
  custom_price: number | null;
  category_override: string | null;
  is_featured: boolean;
  is_hidden: boolean;
  sort_order: number;
  custom_image_url: string | null;
}

const CATEGORIES = ["Top Up", "Gift Card", "Game Pass", "CD Key", "Voucher", "Subscription", "Other"];
const EMPTY_PRODUCT = {
  product_name: "", game_category: "Top Up", photo_url: "", is_active: true, is_featured: false,
  sort_order: 0, requires_server: false, requires_player_id: true, short_description: "", full_description: "", lootbar_game_id: "",
};

export function AdminProductsPage() {
  const [tab, setTab] = useState<"manual" | "lootbar">("manual");

  // ── Manual products state ──────────────────────────────────────────────────
  const [products, setProducts] = useState<ManualProduct[]>([]);
  const [regions, setRegions] = useState<ManualRegion[]>([]);
  const [skus, setSkus] = useState<ManualSku[]>([]);
  const [loadingManual, setLoadingManual] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ManualProduct | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<ManualRegion | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManualProduct | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [uploadingSku, setUploadingSku] = useState(false);
  const [skuForm, setSkuForm] = useState({ sku_name: "", original_price: "", sale_price: "", photo_url: "" });
  const [showSkuForm, setShowSkuForm] = useState(false);
  const [regionForm, setRegionForm] = useState({ region_name: "", region_key: "" });
  const [showRegionForm, setShowRegionForm] = useState(false);
  const productFileRef = useRef<HTMLInputElement>(null);
  const skuFileRef = useRef<HTMLInputElement>(null);

  // ── Lootbar state ──────────────────────────────────────────────────────────
  const [lootbarGames, setLootbarGames] = useState<LootbarGame[]>([]);
  const [lootbarSearch, setLootbarSearch] = useState("");
  const [loadingLootbar, setLoadingLootbar] = useState(false);
  const [selectedLootbarGame, setSelectedLootbarGame] = useState<LootbarGame | null>(null);
  const [override, setOverride] = useState<GameOverride | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    custom_image_url: "", category_override: "", sort_order: "0", is_featured: false, is_hidden: false,
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [syncingCache, setSyncingCache] = useState(false);

  useEffect(() => { loadManualProducts(); }, []);

  // ── Manual Products ────────────────────────────────────────────────────────
  async function loadManualProducts() {
    setLoadingManual(true);
    const [{ data: prods }, { data: regs }, { data: sk }] = await Promise.all([
      supabase.from("manual_products").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("manual_product_regions").select("*").order("sort_order"),
      supabase.from("manual_skus").select("*").order("sort_order"),
    ]);
    setProducts(prods || []);
    setRegions(regs || []);
    setSkus(sk || []);
    setLoadingManual(false);
  }

  async function uploadProductImage(file: File) {
    setUploadingProduct(true);
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploadingProduct(false); return; }
    const { data: url } = supabase.storage.from("store-assets").getPublicUrl(path);
    setProductForm(f => ({ ...f, photo_url: url.publicUrl }));
    setUploadingProduct(false);
  }

  async function uploadSkuImage(file: File) {
    setUploadingSku(true);
    const ext = file.name.split(".").pop();
    const path = `skus/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploadingSku(false); return; }
    const { data: url } = supabase.storage.from("store-assets").getPublicUrl(path);
    setSkuForm(f => ({ ...f, photo_url: url.publicUrl }));
    setUploadingSku(false);
  }

  async function saveProduct() {
    if (!productForm.product_name.trim()) { toast.error("Product name required"); return; }
    const payload = {
      product_name: productForm.product_name,
      game_category: productForm.game_category,
      photo_url: productForm.photo_url || null,
      is_active: productForm.is_active,
      is_featured: productForm.is_featured,
      sort_order: Number(productForm.sort_order) || 0,
      requires_server: productForm.requires_server,
      requires_player_id: productForm.requires_player_id,
      short_description: productForm.short_description,
      full_description: productForm.full_description,
      lootbar_game_id: productForm.lootbar_game_id || null,
      updated_at: new Date().toISOString(),
    };
    if (editingProduct) {
      const { error } = await supabase.from("manual_products").update(payload).eq("id", editingProduct.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated!");
    } else {
      const { error } = await supabase.from("manual_products").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Product created!");
    }
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    loadManualProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("manual_products").delete().eq("id", id);
    toast.success("Deleted");
    if (selectedProduct?.id === id) setSelectedProduct(null);
    loadManualProducts();
  }

  async function addRegion() {
    if (!selectedProduct || !regionForm.region_name.trim()) return;
    const { error } = await supabase.from("manual_product_regions").insert({
      product_id: selectedProduct.id,
      region_name: regionForm.region_name,
      region_key: regionForm.region_key || regionForm.region_name.toLowerCase().replace(/\s+/g, "_"),
      sort_order: regions.filter(r => r.product_id === selectedProduct.id).length,
    });
    if (error) { toast.error(error.message); return; }
    setRegionForm({ region_name: "", region_key: "" });
    setShowRegionForm(false);
    loadManualProducts();
  }

  async function deleteRegion(id: string) {
    if (!confirm("Delete this region and all its SKUs?")) return;
    await supabase.from("manual_skus").delete().eq("region_id", id);
    await supabase.from("manual_product_regions").delete().eq("id", id);
    if (selectedRegion?.id === id) setSelectedRegion(null);
    loadManualProducts();
  }

  async function addSku() {
    if (!selectedProduct || !skuForm.sku_name.trim() || !skuForm.original_price) {
      toast.error("SKU name and price required"); return;
    }
    const { error } = await supabase.from("manual_skus").insert({
      product_id: selectedProduct.id,
      region_id: selectedProduct.requires_server ? selectedRegion?.id || null : null,
      sku_name: skuForm.sku_name,
      original_price: parseFloat(skuForm.original_price),
      sale_price: skuForm.sale_price ? parseFloat(skuForm.sale_price) : null,
      photo_url: skuForm.photo_url || null,
      sort_order: skus.filter(s => s.product_id === selectedProduct.id).length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("SKU added!");
    setSkuForm({ sku_name: "", original_price: "", sale_price: "", photo_url: "" });
    setShowSkuForm(false);
    loadManualProducts();
  }

  async function deleteSku(id: string) {
    await supabase.from("manual_skus").delete().eq("id", id);
    loadManualProducts();
  }

  // ── Lootbar ────────────────────────────────────────────────────────────────
  async function loadLootbarGames() {
    setLoadingLootbar(true);
    const [{ data: games }, { data: overrides }] = await Promise.all([
      supabase.from("games_cache").select("game_id, game_name, game_image, category, sort_order").order("sort_order").order("game_name").limit(500),
      supabase.from("game_overrides").select("*"),
    ]);
    const overrideMap = new Map((overrides || []).map(o => [o.game_id, o]));
    setLootbarGames((games || []).map(g => {
      const ov = overrideMap.get(g.game_id);
      return { ...g, is_featured: ov?.is_featured ?? false, is_hidden: ov?.is_hidden ?? false, sort_order: ov?.sort_order ?? g.sort_order ?? 0 };
    }));
    setLoadingLootbar(false);
  }

  async function selectLootbarGame(game: LootbarGame) {
    setSelectedLootbarGame(game);
    const { data } = await supabase.from("game_overrides").select("*").eq("game_id", game.game_id).single();
    if (data) {
      setOverride(data);
      setOverrideForm({
        custom_image_url: data.custom_image_url || "",
        category_override: data.category_override || "",
        sort_order: String(data.sort_order || 0),
        is_featured: data.is_featured || false,
        is_hidden: data.is_hidden || false,
      });
    } else {
      setOverride(null);
      setOverrideForm({ custom_image_url: game.game_image || "", category_override: game.category || "", sort_order: "0", is_featured: false, is_hidden: false });
    }
  }

  async function saveOverride() {
    if (!selectedLootbarGame) return;
    setSavingOverride(true);
    const payload = {
      game_id: selectedLootbarGame.game_id,
      custom_image_url: overrideForm.custom_image_url || null,
      category_override: overrideForm.category_override || null,
      sort_order: parseInt(overrideForm.sort_order) || 0,
      is_featured: overrideForm.is_featured,
      is_hidden: overrideForm.is_hidden,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("game_overrides").upsert(payload);
    // Sync to games_cache so frontend sees changes immediately
    const cacheUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (overrideForm.custom_image_url) cacheUpdate.game_image = overrideForm.custom_image_url;
    if (overrideForm.category_override) cacheUpdate.category = overrideForm.category_override;
    await supabase.from("games_cache").update(cacheUpdate).eq("game_id", selectedLootbarGame.game_id);
    toast.success("Override saved!");
    setSavingOverride(false);
    loadLootbarGames();
  }

  async function syncCache() {
    setSyncingCache(true);
    const { error } = await supabase.functions.invoke("games-cache-refresh", { body: {} });
    if (error) { toast.error("Sync failed"); } else { toast.success("Cache synced!"); loadLootbarGames(); }
    setSyncingCache(false);
  }

  useEffect(() => { if (tab === "lootbar" && lootbarGames.length === 0) loadLootbarGames(); }, [tab]);

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => !productSearch || p.product_name.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredLootbar = lootbarGames.filter(g => !lootbarSearch || g.game_name.toLowerCase().includes(lootbarSearch.toLowerCase()));
  const productRegions = selectedProduct ? regions.filter(r => r.product_id === selectedProduct.id) : [];
  const relevantSkus = selectedProduct
    ? skus.filter(s => s.product_id === selectedProduct.id && (
        !selectedProduct.requires_server || selectedRegion === null || s.region_id === selectedRegion?.id
      ))
    : [];

  return (
    <AdminLayout>
      <div className="p-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {(["manual", "lootbar"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
              {t === "manual" ? "Manual Products" : "Lootbar Games"}
            </button>
          ))}
        </div>

        {/* ── MANUAL TAB ────────────────────────────────────────────────────── */}
        {tab === "manual" && (
          <div className="grid grid-cols-12 gap-4 min-h-[80vh]">
            {/* Panel 1: Games list */}
            <div className="col-span-3 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Games</h3>
                <button onClick={() => { setShowProductForm(true); setEditingProduct(null); setProductForm(EMPTY_PRODUCT); }}
                  className="w-6 h-6 bg-yellow-400 rounded-md flex items-center justify-center hover:bg-yellow-300">
                  <Plus size={13} className="text-black" />
                </button>
              </div>
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search…"
                    className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {loadingManual ? (
                  <div className="p-4 text-center text-xs text-gray-400">Loading…</div>
                ) : filteredProducts.map(p => (
                  <button key={p.id} onClick={() => { setSelectedProduct(p); setSelectedRegion(null); setShowSkuForm(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${selectedProduct?.id === p.id ? "bg-yellow-50 border-l-2 border-yellow-400" : ""}`}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.product_name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{p.product_name}</p>
                      <p className="text-[10px] text-gray-400">{p.game_category} {p.requires_server ? "· Server" : ""}</p>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.is_active ? "bg-green-400" : "bg-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Panel 2: Product form / Server management */}
            <div className="col-span-3 flex flex-col gap-3">
              {/* Product form */}
              {showProductForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">{editingProduct ? "Edit Product" : "New Product"}</h3>
                    <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }}><X size={15} className="text-gray-400" /></button>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Name *</label>
                      <input value={productForm.product_name} onChange={e => setProductForm(f => ({ ...f, product_name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Category</label>
                      <select value={productForm.game_category} onChange={e => setProductForm(f => ({ ...f, game_category: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Image</label>
                      {productForm.photo_url ? (
                        <div className="relative">
                          <img src={productForm.photo_url} className="w-full h-20 object-cover rounded-lg" />
                          <button onClick={() => setProductForm(f => ({ ...f, photo_url: "" }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => productFileRef.current?.click()}
                          className="w-full h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 text-xs text-gray-400 hover:border-yellow-400">
                          {uploadingProduct ? <RefreshCw size={14} className="animate-spin" /> : <><Upload size={14} /> Upload</>}
                        </button>
                      )}
                      <input ref={productFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadProductImage(e.target.files[0])} />
                      <input value={productForm.photo_url} onChange={e => setProductForm(f => ({ ...f, photo_url: e.target.value }))}
                        placeholder="Or paste URL…" className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs outline-none mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Short Description</label>
                      <input value={productForm.short_description} onChange={e => setProductForm(f => ({ ...f, short_description: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                    </div>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={productForm.requires_server} onChange={e => setProductForm(f => ({ ...f, requires_server: e.target.checked }))} className="rounded" />
                        Server-based
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={productForm.requires_player_id} onChange={e => setProductForm(f => ({ ...f, requires_player_id: e.target.checked }))} className="rounded" />
                        Player ID
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={productForm.is_featured} onChange={e => setProductForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
                        Featured
                      </label>
                    </div>
                    <button onClick={saveProduct} className="w-full bg-yellow-400 text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-300">
                      {editingProduct ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              )}

              {/* Server management */}
              {selectedProduct && (
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden" style={{ minHeight: 0, flex: 1 }}>
                  <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{selectedProduct.product_name}</h3>
                      <p className="text-[10px] text-gray-400">{selectedProduct.requires_server ? "Server Regions" : "No server needed"}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditingProduct(selectedProduct); setProductForm({ ...selectedProduct, photo_url: selectedProduct.photo_url || "", lootbar_game_id: selectedProduct.lootbar_game_id || "", short_description: selectedProduct.short_description || "", full_description: selectedProduct.full_description || "" }); setShowProductForm(true); }}
                        className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center hover:bg-gray-200">
                        <Edit2 size={11} className="text-gray-600" />
                      </button>
                      <button onClick={() => deleteProduct(selectedProduct.id)}
                        className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center hover:bg-red-100">
                        <Trash2 size={11} className="text-red-500" />
                      </button>
                    </div>
                  </div>

                  {selectedProduct.requires_server && (
                    <>
                      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {productRegions.map(r => (
                          <button key={r.id} onClick={() => setSelectedRegion(selectedRegion?.id === r.id ? null : r)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 ${selectedRegion?.id === r.id ? "bg-yellow-50" : ""}`}>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{r.region_name}</p>
                              <p className="text-[10px] text-gray-400">{r.region_key}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{skus.filter(s => s.region_id === r.id).length} SKUs</span>
                              <button onClick={e => { e.stopPropagation(); deleteRegion(r.id); }} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="p-3 border-t border-gray-100">
                        {showRegionForm ? (
                          <div className="space-y-2">
                            <input value={regionForm.region_name} onChange={e => setRegionForm(f => ({ ...f, region_name: e.target.value }))}
                              placeholder="Region name (e.g. Asia)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-yellow-400" />
                            <input value={regionForm.region_key} onChange={e => setRegionForm(f => ({ ...f, region_key: e.target.value }))}
                              placeholder="Key (e.g. asia) — optional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-yellow-400" />
                            <div className="flex gap-1.5">
                              <button onClick={addRegion} className="flex-1 bg-yellow-400 text-black font-bold py-1.5 rounded-lg text-xs hover:bg-yellow-300">Add</button>
                              <button onClick={() => setShowRegionForm(false)} className="flex-1 border border-gray-200 text-gray-500 py-1.5 rounded-lg text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowRegionForm(true)}
                            className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 rounded-lg py-2 text-xs text-gray-400 hover:border-yellow-400 hover:text-yellow-600">
                            <Plus size={12} /> Add Region
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Panel 3 & 4: SKU list + add form */}
            <div className="col-span-6 flex flex-col gap-3">
              {selectedProduct ? (
                <>
                  <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden flex-1">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Products / SKUs</h3>
                        {selectedProduct.requires_server && (
                          <p className="text-[10px] text-gray-400">{selectedRegion ? selectedRegion.region_name : "All regions"}</p>
                        )}
                      </div>
                      <button onClick={() => setShowSkuForm(!showSkuForm)}
                        className="flex items-center gap-1.5 bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-300">
                        <Plus size={12} /> Add SKU
                      </button>
                    </div>

                    {showSkuForm && (
                      <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="col-span-2">
                            <input value={skuForm.sku_name} onChange={e => setSkuForm(f => ({ ...f, sku_name: e.target.value }))}
                              placeholder="SKU name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                          </div>
                          <input type="number" value={skuForm.original_price} onChange={e => setSkuForm(f => ({ ...f, original_price: e.target.value }))}
                            placeholder="Price ($) *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                          <input type="number" value={skuForm.sale_price} onChange={e => setSkuForm(f => ({ ...f, sale_price: e.target.value }))}
                            placeholder="Sale price (opt)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
                        </div>
                        {skuForm.photo_url ? (
                          <div className="relative mb-2 w-16 h-16">
                            <img src={skuForm.photo_url} className="w-16 h-16 object-cover rounded-lg" />
                            <button onClick={() => setSkuForm(f => ({ ...f, photo_url: "" }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => skuFileRef.current?.click()}
                              className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:border-yellow-400">
                              {uploadingSku ? <RefreshCw size={12} className="animate-spin" /> : <><Upload size={12} /> Image</>}
                            </button>
                            <input value={skuForm.photo_url} onChange={e => setSkuForm(f => ({ ...f, photo_url: e.target.value }))}
                              placeholder="Or URL" className="flex-1 border border-gray-100 rounded-lg px-2 py-1.5 text-xs outline-none" />
                            <input ref={skuFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadSkuImage(e.target.files[0])} />
                          </div>
                        )}
                        {selectedProduct.requires_server && !selectedRegion && (
                          <p className="text-xs text-orange-600 font-semibold mb-2">⚠ Select a region first</p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={addSku} className="bg-yellow-400 text-black font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-yellow-300">Add</button>
                          <button onClick={() => setShowSkuForm(false)} className="border border-gray-200 text-gray-500 px-4 py-1.5 rounded-lg text-sm">Cancel</button>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                      {relevantSkus.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400">No SKUs yet. Click "Add SKU" to create one.</div>
                      ) : relevantSkus.map(sku => (
                        <div key={sku.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                          {sku.photo_url ? (
                            <img src={sku.photo_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{sku.sku_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-black text-orange-500">${Number(sku.original_price).toFixed(2)}</span>
                              {sku.sale_price && <span className="text-xs text-gray-400 line-through">${Number(sku.sale_price).toFixed(2)}</span>}
                            </div>
                          </div>
                          <button onClick={() => deleteSku(sku.id)} className="text-red-400 hover:text-red-600 p-1.5">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Search size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm">Select a product to manage SKUs</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LOOTBAR TAB ───────────────────────────────────────────────────── */}
        {tab === "lootbar" && (
          <div className="grid grid-cols-12 gap-4 min-h-[80vh]">
            {/* Games list */}
            <div className="col-span-5 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Lootbar Games ({lootbarGames.length})</h3>
                <button onClick={syncCache} disabled={syncingCache}
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 disabled:opacity-50">
                  <RefreshCw size={12} className={syncingCache ? "animate-spin" : ""} />
                  {syncingCache ? "Syncing…" : "Sync Cache"}
                </button>
              </div>
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={lootbarSearch} onChange={e => setLootbarSearch(e.target.value)} placeholder="Search games…"
                    className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {loadingLootbar ? (
                  <div className="p-4 text-center text-xs text-gray-400">Loading…</div>
                ) : filteredLootbar.map(game => (
                  <button key={game.game_id} onClick={() => selectLootbarGame(game)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${selectedLootbarGame?.game_id === game.game_id ? "bg-yellow-50 border-l-2 border-yellow-400" : ""} ${game.is_hidden ? "opacity-50" : ""}`}>
                    {game.game_image ? (
                      <img src={game.game_image} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{game.game_name}</p>
                      <p className="text-[10px] text-gray-400">{game.category || "Top Up"}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {game.is_featured && <Star size={10} fill="#FFD200" stroke="none" />}
                      {game.is_hidden && <EyeOff size={10} className="text-gray-300" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Override panel */}
            <div className="col-span-7">
              {selectedLootbarGame ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-4 mb-5">
                    {selectedLootbarGame.game_image && (
                      <img src={selectedLootbarGame.game_image} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedLootbarGame.game_name}</h3>
                      <p className="text-xs text-gray-400">ID: {selectedLootbarGame.game_id}</p>
                      <p className="text-xs text-gray-400">{selectedLootbarGame.category}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase mb-1.5 block">Custom Image URL</label>
                      <input value={overrideForm.custom_image_url} onChange={e => setOverrideForm(f => ({ ...f, custom_image_url: e.target.value }))}
                        placeholder="Leave blank to use cached image" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
                      {overrideForm.custom_image_url && (
                        <img src={overrideForm.custom_image_url} alt="Preview" className="w-full h-32 object-cover rounded-xl mt-2" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase mb-1.5 block">Category Override</label>
                      <select value={overrideForm.category_override} onChange={e => setOverrideForm(f => ({ ...f, category_override: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                        <option value="">Use default: {selectedLootbarGame.category}</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase mb-1.5 block">Sort Order</label>
                      <input type="number" value={overrideForm.sort_order} onChange={e => setOverrideForm(f => ({ ...f, sort_order: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={overrideForm.is_featured} onChange={e => setOverrideForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                        <span className="text-sm font-semibold text-gray-700">Featured</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={overrideForm.is_hidden} onChange={e => setOverrideForm(f => ({ ...f, is_hidden: e.target.checked }))} className="w-4 h-4 accent-red-400" />
                        <span className="text-sm font-semibold text-gray-700">Hidden</span>
                      </label>
                    </div>
                    <button onClick={saveOverride} disabled={savingOverride}
                      className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl text-sm disabled:opacity-50">
                      {savingOverride ? "Saving…" : "Save Override"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Search size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm">Select a game to edit override</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
