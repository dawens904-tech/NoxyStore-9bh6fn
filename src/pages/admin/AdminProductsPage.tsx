import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon,
  ToggleLeft, ToggleRight, ChevronRight, Search, RefreshCw,
  Package, Server, Globe, Tag, DollarSign, Eye, EyeOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ManualProduct {
  id: string;
  product_name: string;
  game_category: string;
  photo_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  requires_server: boolean;
  requires_player_id: boolean;
  short_description: string;
  full_description: string;
  sort_order: number;
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
  is_hot: boolean;
  discount: number;
  min_price: number | null;
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

// ─── Admin Layout wrapper (reads from AdminLayout component) ──────────────────
function AdminProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Tabs
  const [activeTab, setActiveTab] = useState<"manual" | "lootbar">("manual");

  // ─── MANUAL PRODUCTS state ─────────────────────────────────────────────────
  const [products, setProducts] = useState<ManualProduct[]>([]);
  const [regions, setRegions] = useState<ManualRegion[]>([]);
  const [skus, setSkus] = useState<ManualSku[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ManualProduct | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<ManualRegion | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQ, setSearchQ] = useState("");

  // Forms
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManualProduct | null>(null);
  const [productForm, setProductForm] = useState({
    product_name: "",
    game_category: "Top Up",
    photo_url: "",
    requires_server: false,
    requires_player_id: true,
    short_description: "",
    full_description: "",
    is_featured: false,
  });

  const [showRegionForm, setShowRegionForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<ManualRegion | null>(null);
  const [regionName, setRegionName] = useState("");

  const [showSkuForm, setShowSkuForm] = useState(false);
  const [editingSku, setEditingSku] = useState<ManualSku | null>(null);
  const [skuForm, setSkuForm] = useState({
    sku_name: "",
    original_price: "",
    sale_price: "",
    photo_url: "",
  });

  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [uploadingSku, setUploadingSku] = useState(false);
  const productImgRef = useRef<HTMLInputElement>(null);
  const skuImgRef = useRef<HTMLInputElement>(null);

  // ─── LOOTBAR state ─────────────────────────────────────────────────────────
  const [lootbarGames, setLootbarGames] = useState<LootbarGame[]>([]);
  const [overrides, setOverrides] = useState<Record<string, GameOverride>>({});
  const [selectedLootbarGame, setSelectedLootbarGame] = useState<LootbarGame | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    custom_image_url: "",
    category_override: "",
    is_featured: false,
    is_hidden: false,
    sort_order: 0,
  });
  const [loadingLootbar, setLoadingLootbar] = useState(false);
  const [lootbarSearch, setLootbarSearch] = useState("");
  const [syncingCache, setSyncingCache] = useState(false);

  // ─── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "moderator") {
      navigate("/");
    }
  }, [user, navigate]);

  // ─── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchProducts();
    fetchLootbarGames();
  }, []);

  // ─── Manual Products data ──────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("manual_products")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load products"); console.error(error); }
    else setProducts(data as ManualProduct[]);
    setLoadingProducts(false);
  };

  const fetchRegions = async (productId: string) => {
    const { data } = await supabase
      .from("manual_product_regions")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    setRegions((data as ManualRegion[]) || []);
  };

  const fetchSkus = async (productId: string, regionId?: string | null) => {
    let q = supabase
      .from("manual_skus")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order")
      .order("original_price");
    if (regionId !== undefined) {
      q = regionId ? q.eq("region_id", regionId) : q.is("region_id", null);
    }
    const { data } = await q;
    setSkus((data as ManualSku[]) || []);
  };

  const handleSelectProduct = async (product: ManualProduct) => {
    setSelectedProduct(product);
    setSelectedRegion(null);
    setSkus([]);
    await fetchRegions(product.id);
    if (!product.requires_server) {
      await fetchSkus(product.id, null);
    }
  };

  const handleSelectRegion = async (region: ManualRegion) => {
    setSelectedRegion(region);
    if (selectedProduct) {
      await fetchSkus(selectedProduct.id, region.id);
    }
  };

  // ─── Image upload helpers ──────────────────────────────────────────────────
  const uploadImage = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProduct(true);
    const url = await uploadImage(file, "store-assets", "products");
    if (url) setProductForm((f) => ({ ...f, photo_url: url }));
    setUploadingProduct(false);
  };

  const handleSkuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSku(true);
    const url = await uploadImage(file, "store-assets", "skus");
    if (url) setSkuForm((f) => ({ ...f, photo_url: url }));
    setUploadingSku(false);
  };

  // ─── Product CRUD ──────────────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      product_name: "", game_category: "Top Up", photo_url: "",
      requires_server: false, requires_player_id: true,
      short_description: "", full_description: "", is_featured: false,
    });
    setShowProductForm(true);
  };

  const openEditProduct = (p: ManualProduct) => {
    setEditingProduct(p);
    setProductForm({
      product_name: p.product_name,
      game_category: p.game_category,
      photo_url: p.photo_url || "",
      requires_server: p.requires_server,
      requires_player_id: p.requires_player_id,
      short_description: p.short_description,
      full_description: p.full_description,
      is_featured: p.is_featured,
    });
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    if (!productForm.product_name.trim()) { toast.error("Product name is required"); return; }
    const payload: Partial<ManualProduct> = {
      product_name: productForm.product_name.trim(),
      game_category: productForm.game_category,
      photo_url: productForm.photo_url || null,
      requires_server: productForm.requires_server,
      requires_player_id: productForm.requires_player_id,
      short_description: productForm.short_description,
      full_description: productForm.full_description,
      is_featured: productForm.is_featured,
    };
    if (editingProduct) {
      const { error } = await supabase.from("manual_products").update(payload).eq("id", editingProduct.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("manual_products").insert({ ...payload, is_active: true, sort_order: 0 });
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Product created");
    }
    setShowProductForm(false);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? All servers and SKUs will also be deleted.")) return;
    await supabase.from("manual_products").delete().eq("id", id);
    setProducts((p) => p.filter((x) => x.id !== id));
    if (selectedProduct?.id === id) { setSelectedProduct(null); setRegions([]); setSkus([]); }
    toast.success("Product deleted");
  };

  const toggleProductActive = async (p: ManualProduct) => {
    await supabase.from("manual_products").update({ is_active: !p.is_active }).eq("id", p.id);
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  // ─── Region CRUD ───────────────────────────────────────────────────────────
  const openAddRegion = () => { setEditingRegion(null); setRegionName(""); setShowRegionForm(true); };
  const openEditRegion = (r: ManualRegion) => { setEditingRegion(r); setRegionName(r.region_name); setShowRegionForm(true); };

  const saveRegion = async () => {
    if (!regionName.trim() || !selectedProduct) return;
    const key = regionName.trim().toLowerCase().replace(/\s+/g, "-");
    if (editingRegion) {
      await supabase.from("manual_product_regions").update({ region_name: regionName.trim(), region_key: key }).eq("id", editingRegion.id);
      toast.success("Server updated");
    } else {
      await supabase.from("manual_product_regions").insert({
        product_id: selectedProduct.id, region_name: regionName.trim(), region_key: key,
        is_active: true, sort_order: regions.length,
      });
      toast.success("Server added");
    }
    setShowRegionForm(false);
    fetchRegions(selectedProduct.id);
  };

  const deleteRegion = async (id: string) => {
    if (!confirm("Delete this server? All products under it will also be deleted.")) return;
    await supabase.from("manual_product_regions").delete().eq("id", id);
    setRegions((r) => r.filter((x) => x.id !== id));
    if (selectedRegion?.id === id) { setSelectedRegion(null); setSkus([]); }
    toast.success("Server deleted");
  };

  // ─── SKU CRUD ──────────────────────────────────────────────────────────────
  const openAddSku = () => {
    setEditingSku(null);
    setSkuForm({ sku_name: "", original_price: "", sale_price: "", photo_url: "" });
    setShowSkuForm(true);
  };

  const openEditSku = (s: ManualSku) => {
    setEditingSku(s);
    setSkuForm({
      sku_name: s.sku_name,
      original_price: String(s.original_price),
      sale_price: s.sale_price != null ? String(s.sale_price) : "",
      photo_url: s.photo_url || "",
    });
    setShowSkuForm(true);
  };

  const saveSku = async () => {
    if (!skuForm.sku_name.trim() || !skuForm.original_price || !selectedProduct) return;
    const regionId = selectedProduct.requires_server ? (selectedRegion?.id ?? null) : null;
    const payload = {
      product_id: selectedProduct.id,
      region_id: regionId,
      sku_name: skuForm.sku_name.trim(),
      original_price: parseFloat(skuForm.original_price),
      sale_price: skuForm.sale_price ? parseFloat(skuForm.sale_price) : null,
      photo_url: skuForm.photo_url || null,
      is_active: true,
      sort_order: skus.length,
    };
    if (editingSku) {
      await supabase.from("manual_skus").update({
        sku_name: payload.sku_name,
        original_price: payload.original_price,
        sale_price: payload.sale_price,
        photo_url: payload.photo_url,
      }).eq("id", editingSku.id);
      toast.success("Product updated");
    } else {
      await supabase.from("manual_skus").insert(payload);
      toast.success("Product added");
    }
    setShowSkuForm(false);
    fetchSkus(selectedProduct.id, regionId);
  };

  const deleteSku = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("manual_skus").delete().eq("id", id);
    setSkus((s) => s.filter((x) => x.id !== id));
    toast.success("Product deleted");
  };

  // ─── Lootbar data ──────────────────────────────────────────────────────────
  const fetchLootbarGames = async () => {
    setLoadingLootbar(true);
    const { data: games } = await supabase.from("games_cache").select("*").order("sort_order").order("game_name");
    const { data: ovr } = await supabase.from("game_overrides").select("*");
    setLootbarGames((games as LootbarGame[]) || []);
    const map: Record<string, GameOverride> = {};
    (ovr as GameOverride[] || []).forEach((o) => { map[o.game_id] = o; });
    setOverrides(map);
    setLoadingLootbar(false);
  };

  const handleSelectLootbarGame = (g: LootbarGame) => {
    setSelectedLootbarGame(g);
    const o = overrides[g.game_id];
    setOverrideForm({
      custom_image_url: o?.custom_image_url || g.game_image || "",
      category_override: o?.category_override || g.category || "",
      is_featured: o?.is_featured ?? false,
      is_hidden: o?.is_hidden ?? false,
      sort_order: o?.sort_order ?? g.sort_order ?? 0,
    });
  };

  const saveLootbarOverride = async () => {
    if (!selectedLootbarGame) return;
    const gid = selectedLootbarGame.game_id;
    const payload: GameOverride = {
      game_id: gid,
      custom_image_url: overrideForm.custom_image_url || null,
      category_override: overrideForm.category_override || null,
      is_featured: overrideForm.is_featured,
      is_hidden: overrideForm.is_hidden,
      sort_order: overrideForm.sort_order,
      custom_price: overrides[gid]?.custom_price ?? null,
    };
    const { error } = await supabase.from("game_overrides").upsert(payload, { onConflict: "game_id" });
    if (error) { toast.error("Failed to save"); return; }

    // Also sync image and category to games_cache for immediate frontend effect
    const cacheUpdate: Record<string, unknown> = {};
    if (overrideForm.custom_image_url) cacheUpdate.game_image = overrideForm.custom_image_url;
    if (overrideForm.category_override) cacheUpdate.category = overrideForm.category_override;
    if (Object.keys(cacheUpdate).length) {
      await supabase.from("games_cache").update(cacheUpdate).eq("game_id", gid);
    }

    setOverrides((prev) => ({ ...prev, [gid]: payload }));
    toast.success("Saved");
  };

  const syncLootbarCache = async () => {
    setSyncingCache(true);
    try {
      const { error } = await supabase.functions.invoke("games-cache-refresh");
      if (error) throw error;
      toast.success("Cache synced");
      fetchLootbarGames();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sync failed";
      toast.error(msg);
    }
    setSyncingCache(false);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchQ.toLowerCase())
  );
  const filteredLootbar = lootbarGames.filter((g) =>
    g.game_name.toLowerCase().includes(lootbarSearch.toLowerCase())
  );
  const displaySkus = skus;

  const CATEGORIES = ["Top Up", "Gift Card", "Game Keys", "Voucher", "Best Seller"];

  // ─── Access guard ──────────────────────────────────────────────────────────
  if (user?.role !== "admin" && user?.role !== "moderator") return null;

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Page title + tabs */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Product Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your store products and Lootbar catalogue</p>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "manual" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              Manual Products
            </button>
            <button
              onClick={() => setActiveTab("lootbar")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "lootbar" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              Lootbar Catalogue
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MANUAL PRODUCTS TAB                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "manual" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

            {/* ── Column 1: Games Management ── */}
            <div className="xl:col-span-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="font-bold text-gray-800 text-sm">Games Management</h2>
                <button
                  onClick={openAddProduct}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add Game
                </button>
              </div>

              {/* Search */}
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search games..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 px-3 py-2 border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-5">Game</div>
                <div className="col-span-3 text-center">Category</div>
                <div className="col-span-2 text-center">Server</div>
                <div className="col-span-2 text-center">Action</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {loadingProducts ? (
                  <div className="text-center py-8 text-sm text-gray-400">Loading…</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">No games yet</div>
                ) : filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`grid grid-cols-12 items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${selectedProduct?.id === p.id ? "bg-blue-50 border-l-2 border-blue-500" : ""}`}
                  >
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-400" /></div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-800 truncate">{p.product_name}</span>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{p.game_category}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleProductActive(p); }}
                        className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${p.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {p.requires_server ? "Yes" : "No"}
                      </button>
                    </div>
                    <div className="col-span-2 flex justify-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEditProduct(p); }} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Column 2: Server Management ── */}
            <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Server Management</h2>
                  {selectedProduct && (
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">— {selectedProduct.product_name}</p>
                  )}
                </div>
                {selectedProduct?.requires_server && (
                  <button
                    onClick={openAddRegion}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add Server
                  </button>
                )}
              </div>

              {!selectedProduct ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <ChevronRight size={32} className="mb-2" />
                  <p className="text-xs text-gray-400">Select a game first</p>
                </div>
              ) : !selectedProduct.requires_server ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Globe size={28} className="mb-2" />
                  <p className="text-xs text-gray-400 text-center px-4">This game doesn't require server selection</p>
                </div>
              ) : regions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Server size={28} className="mb-2" />
                  <p className="text-xs text-gray-400">No servers yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {regions.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRegion(r)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedRegion?.id === r.id ? "bg-green-50 border-l-2 border-green-500" : ""}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{r.region_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {skus.filter((s) => s.region_id === r.id).length} products
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">Active</span>
                        <button onClick={(e) => { e.stopPropagation(); openEditRegion(r); }} className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteRegion(r.id); }} className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 size={12} />
                        </button>
                        <span className="text-gray-300 text-xs">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Column 3: Products Management ── */}
            <div className="xl:col-span-5 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Products Management</h2>
                  {selectedProduct && (
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                      {selectedProduct.product_name}
                      {selectedRegion && ` — ${selectedRegion.region_name}`}
                    </p>
                  )}
                </div>
                {selectedProduct && (!selectedProduct.requires_server || selectedRegion) && (
                  <button
                    onClick={openAddSku}
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add Product
                  </button>
                )}
              </div>

              {!selectedProduct ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Package size={32} className="mb-2" />
                  <p className="text-xs text-gray-400">Select a game to manage products</p>
                </div>
              ) : selectedProduct.requires_server && !selectedRegion ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Server size={28} className="mb-2" />
                  <p className="text-xs text-gray-400">Select a server to manage products</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid grid-cols-12 px-4 py-2 border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1">Img</div>
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Sale</div>
                    <div className="col-span-1 text-center">St.</div>
                    <div className="col-span-2 text-center">Action</div>
                  </div>

                  <div className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto">
                    {displaySkus.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-400">No products yet — click Add Product</div>
                    ) : displaySkus.map((s) => (
                      <div key={s.id} className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <div className="col-span-1">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-gray-100">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt={s.sku_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon size={11} className="text-gray-300" /></div>
                            )}
                          </div>
                        </div>
                        <div className="col-span-4 min-w-0 pr-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">{s.sku_name}</p>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-xs font-semibold text-gray-700">${s.original_price.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          {s.sale_price != null ? (
                            <span className="text-xs font-bold text-orange-600">${s.sale_price.toFixed(2)}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                        </div>
                        <div className="col-span-2 flex justify-center gap-1">
                          <button onClick={() => openEditSku(s)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => deleteSku(s.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LOOTBAR CATALOGUE TAB                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "lootbar" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Game list */}
            <div className="xl:col-span-7 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="font-bold text-gray-800 text-sm">Lootbar Games ({lootbarGames.length})</h2>
                <button
                  onClick={syncLootbarCache}
                  disabled={syncingCache}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={syncingCache ? "animate-spin" : ""} />
                  {syncingCache ? "Syncing…" : "Sync Cache"}
                </button>
              </div>

              <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={lootbarSearch}
                    onChange={(e) => setLootbarSearch(e.target.value)}
                    placeholder="Search games…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 px-3 py-2 border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-5">Game</div>
                <div className="col-span-2 text-center">Category</div>
                <div className="col-span-2 text-center">Min Price</div>
                <div className="col-span-2 text-center">Flags</div>
                <div className="col-span-1 text-center">Edit</div>
              </div>

              <div className="divide-y divide-gray-50 max-h-[560px] overflow-y-auto">
                {loadingLootbar ? (
                  <div className="text-center py-8 text-sm text-gray-400">Loading…</div>
                ) : filteredLootbar.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">No games in cache — click Sync Cache</div>
                ) : filteredLootbar.map((g) => {
                  const ovr = overrides[g.game_id];
                  return (
                    <div
                      key={g.game_id}
                      onClick={() => handleSelectLootbarGame(g)}
                      className={`grid grid-cols-12 items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${selectedLootbarGame?.game_id === g.game_id ? "bg-blue-50 border-l-2 border-blue-500" : ""}`}
                    >
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {(ovr?.custom_image_url || g.game_image) ? (
                            <img src={ovr?.custom_image_url || g.game_image!} alt={g.game_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{g.game_name}</p>
                          <p className="text-[10px] text-gray-400">ID: {g.game_id}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          {ovr?.category_override || g.category || "—"}
                        </span>
                      </div>
                      <div className="col-span-2 text-center text-xs text-gray-600 font-semibold">
                        {g.min_price != null ? `$${g.min_price.toFixed(2)}` : "—"}
                      </div>
                      <div className="col-span-2 flex justify-center gap-1">
                        {ovr?.is_featured && <span className="text-[9px] bg-yellow-50 text-yellow-700 px-1 rounded font-bold">⭐</span>}
                        {ovr?.is_hidden && <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded font-bold">Hidden</span>}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Edit2 size={12} className="text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Override form */}
            <div className="xl:col-span-5">
              {!selectedLootbarGame ? (
                <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-300">
                  <Edit2 size={32} className="mb-2" />
                  <p className="text-sm text-gray-400">Select a game to edit overrides</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-sm">Edit Game Override</h2>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">{selectedLootbarGame.game_name}</p>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Custom Image */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5"><ImageIcon size={12} /> Custom Image URL</label>
                      <input
                        value={overrideForm.custom_image_url}
                        onChange={(e) => setOverrideForm((f) => ({ ...f, custom_image_url: e.target.value }))}
                        placeholder="https://..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                      {overrideForm.custom_image_url && (
                        <img src={overrideForm.custom_image_url} alt="Preview" className="w-20 h-20 rounded-xl object-cover mt-2 border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                    </div>

                    {/* Category override */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5"><Tag size={12} /> Category Override</label>
                      <select
                        value={overrideForm.category_override}
                        onChange={(e) => setOverrideForm((f) => ({ ...f, category_override: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                      >
                        <option value="">Use default ({selectedLootbarGame.category || "—"})</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Sort order */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5"><DollarSign size={12} /> Sort Order</label>
                      <input
                        type="number"
                        value={overrideForm.sort_order}
                        onChange={(e) => setOverrideForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-1">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Eye size={14} /> Featured</span>
                        <button onClick={() => setOverrideForm((f) => ({ ...f, is_featured: !f.is_featured }))} className="text-blue-600">
                          {overrideForm.is_featured ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-300" />}
                        </button>
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><EyeOff size={14} /> Hidden from store</span>
                        <button onClick={() => setOverrideForm((f) => ({ ...f, is_hidden: !f.is_hidden }))} className="text-red-500">
                          {overrideForm.is_hidden ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-300" />}
                        </button>
                      </label>
                    </div>

                    <button
                      onClick={saveLootbarOverride}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Save size={14} /> Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* Add/Edit Game Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{editingProduct ? "Edit Game" : "Add New Game"}</h3>
              <button onClick={() => setShowProductForm(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Game Name *</label>
                <input
                  value={productForm.product_name}
                  onChange={(e) => setProductForm((f) => ({ ...f, product_name: e.target.value }))}
                  placeholder="e.g., Free Fire"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                <select
                  value={productForm.game_category}
                  onChange={(e) => setProductForm((f) => ({ ...f, game_category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Game Image</label>
                <div className="flex items-center gap-3">
                  <input
                    value={productForm.photo_url}
                    onChange={(e) => setProductForm((f) => ({ ...f, photo_url: e.target.value }))}
                    placeholder="https://... or upload below"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                  <button onClick={() => productImgRef.current?.click()} disabled={uploadingProduct}
                    className="flex items-center gap-1.5 border border-gray-200 hover:border-blue-400 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                    <Upload size={13} />{uploadingProduct ? "…" : "Upload"}
                  </button>
                  <input ref={productImgRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
                </div>
                {productForm.photo_url && (
                  <img src={productForm.photo_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover mt-2 border" />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Short Description</label>
                <textarea
                  value={productForm.short_description}
                  onChange={(e) => setProductForm((f) => ({ ...f, short_description: e.target.value }))}
                  rows={2}
                  placeholder="Brief description shown on the game page"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Full Description</label>
                <textarea
                  value={productForm.full_description}
                  onChange={(e) => setProductForm((f) => ({ ...f, full_description: e.target.value }))}
                  rows={4}
                  placeholder="Detailed description shown after 'Show All'"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>
              <div className="space-y-3 pt-1 border-t pt-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">Requires Server Selection</span>
                  <button onClick={() => setProductForm((f) => ({ ...f, requires_server: !f.requires_server }))} className="text-blue-600">
                    {productForm.requires_server ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-300" />}
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">Requires Player ID</span>
                  <button onClick={() => setProductForm((f) => ({ ...f, requires_player_id: !f.requires_player_id }))} className="text-blue-600">
                    {productForm.requires_player_id ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-300" />}
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">Featured (show in homepage)</span>
                  <button onClick={() => setProductForm((f) => ({ ...f, is_featured: !f.is_featured }))} className="text-yellow-500">
                    {productForm.is_featured ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-300" />}
                  </button>
                </label>
              </div>
              <button
                onClick={saveProduct}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save size={14} /> {editingProduct ? "Save Changes" : "Create Game"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Region Modal */}
      {showRegionForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{editingRegion ? "Edit Server" : "Add Server"}</h3>
              <button onClick={() => setShowRegionForm(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Server Name *</label>
                <input
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  placeholder="e.g., Asia, Global, Malaysia"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
                  onKeyDown={(e) => e.key === "Enter" && saveRegion()}
                />
              </div>
              <button onClick={saveRegion} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition-colors">
                {editingRegion ? "Save" : "Add Server"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit SKU Modal */}
      {showSkuForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{editingSku ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setShowSkuForm(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Product Name *</label>
                <input
                  value={skuForm.sku_name}
                  onChange={(e) => setSkuForm((f) => ({ ...f, sku_name: e.target.value }))}
                  placeholder="e.g., 100 Diamonds"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Original Price (USD) *</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={skuForm.original_price}
                    onChange={(e) => setSkuForm((f) => ({ ...f, original_price: e.target.value }))}
                    placeholder="0.99"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Sale Price (optional)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={skuForm.sale_price}
                    onChange={(e) => setSkuForm((f) => ({ ...f, sale_price: e.target.value }))}
                    placeholder="Leave blank if no sale"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  <input
                    value={skuForm.photo_url}
                    onChange={(e) => setSkuForm((f) => ({ ...f, photo_url: e.target.value }))}
                    placeholder="https://... or upload"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                  <button onClick={() => skuImgRef.current?.click()} disabled={uploadingSku}
                    className="flex items-center gap-1.5 border border-gray-200 hover:border-orange-400 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                    <Upload size={13} />{uploadingSku ? "…" : "Upload"}
                  </button>
                  <input ref={skuImgRef} type="file" accept="image/*" className="hidden" onChange={handleSkuImageUpload} />
                </div>
                {skuForm.photo_url && (
                  <img src={skuForm.photo_url} alt="Preview" className="w-14 h-14 rounded-xl object-cover mt-2 border" />
                )}
              </div>
              <button
                onClick={saveSku}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save size={14} /> {editingSku ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export { AdminProductsPage };
