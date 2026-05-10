import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Save, Server, Package, Layers, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ManualSku {
  sku_name: string;
  original_price: string;
  sale_price: string;
  photo_url: string;
}

interface ManualRegion {
  region_name: string;
  region_key: string;
}

export function AdminAddProductPage() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    product_name: "",
    game_category: "Top Up",
    description: "",
    photo_url: "",
    is_active: true,
    is_featured: false,
  });

  const [skus, setSkus] = useState<ManualSku[]>([
    { sku_name: "", original_price: "", sale_price: "", photo_url: "" },
  ]);

  const [regions, setRegions] = useState<ManualRegion[]>([]);
  const [requiresRegion, setRequiresRegion] = useState(false);

  // ── SKU helpers ──────────────────────────────────────────────────────────
  const addSku = () =>
    setSkus((prev) => [...prev, { sku_name: "", original_price: "", sale_price: "", photo_url: "" }]);

  const updateSku = (index: number, field: keyof ManualSku, value: string) =>
    setSkus((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  const removeSku = (index: number) =>
    setSkus((prev) => prev.filter((_, i) => i !== index));

  // ── Region helpers ───────────────────────────────────────────────────────
  const addRegion = () =>
    setRegions((prev) => [...prev, { region_name: "", region_key: "" }]);

  const updateRegion = (index: number, field: keyof ManualRegion, value: string) =>
    setRegions((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const removeRegion = (index: number) =>
    setRegions((prev) => prev.filter((_, i) => i !== index));

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    const validSkus = skus.filter((s) => s.sku_name.trim());
    if (validSkus.length === 0) {
      toast.error("Add at least one SKU / denomination");
      return;
    }

    setSaving(true);

    // 1. Insert product
    const { data: product, error: productError } = await supabase
      .from("manual_products")
      .insert({
        product_name: formData.product_name.trim(),
        game_category: formData.game_category,
        description: formData.description || null,
        photo_url: formData.photo_url || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        sort_order: 0,
      })
      .select("id")
      .single();

    if (productError || !product) {
      toast.error("Failed to create product: " + productError?.message);
      setSaving(false);
      return;
    }

    const pid = product.id;

    // 2. Insert SKUs
    const skuRows = validSkus.map((s, i) => ({
      product_id: pid,
      sku_name: s.sku_name.trim(),
      original_price: parseFloat(s.original_price) || 0,
      sale_price: parseFloat(s.sale_price) || parseFloat(s.original_price) || 0,
      photo_url: s.photo_url || null,
      sort_order: i,
      is_active: true,
    }));
    await supabase.from("manual_skus").insert(skuRows);

    // 3. Insert regions if enabled
    if (requiresRegion && regions.length > 0) {
      const regionRows = regions
        .filter((r) => r.region_name.trim())
        .map((r, i) => ({
          product_id: pid,
          region_name: r.region_name.trim(),
          region_key: r.region_key.toLowerCase().trim() || r.region_name.toLowerCase().replace(/\s+/g, "_"),
          sort_order: i,
          is_active: true,
        }));
      if (regionRows.length > 0) await supabase.from("manual_product_regions").insert(regionRows);
    }

    toast.success(`${formData.product_name} created successfully`);
    navigate("/admin/products");
  };

  return (
    <AdminLayout title="Add Manual Product">
      <div className="max-w-3xl space-y-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Products
        </button>

        {/* ── Basic Info ── */}
        <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-5 flex items-center gap-2">
            <Package size={18} className="text-yellow-400" /> Basic Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Product Name *</label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="e.g., Free Fire, Call of Duty"
                className="bg-[#111] border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category</label>
              <select
                value={formData.game_category}
                onChange={(e) => setFormData({ ...formData, game_category: e.target.value })}
                className="w-full bg-[#111] border border-white/10 text-white rounded-xl px-3 py-2 text-sm"
              >
                {["Top Up", "Gift Card", "Game Key", "Game Coins", "Lifestyle"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Cover Photo URL</label>
              <Input
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                placeholder="https://..."
                className="bg-[#111] border-white/10 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short product description..."
                rows={3}
                className="w-full bg-[#111] border border-white/10 text-white rounded-xl px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Active (visible to users)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Featured
              </label>
            </div>
          </div>
        </section>

        {/* ── SKUs ── */}
        <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-purple-400" /> SKUs / Denominations
            </h3>
            <Button size="sm" onClick={addSku} className="bg-yellow-400 text-black hover:bg-yellow-300 text-xs h-8">
              <Plus size={14} className="mr-1" /> Add SKU
            </Button>
          </div>

          <div className="space-y-4">
            {skus.map((sku, i) => (
              <div key={i} className="bg-[#111] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold">SKU #{i + 1}</span>
                  {skus.length > 1 && (
                    <button onClick={() => removeSku(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Name *</label>
                    <Input
                      value={sku.sku_name}
                      onChange={(e) => updateSku(i, "sku_name", e.target.value)}
                      placeholder="e.g., 100 Diamonds, $10 Gift Card"
                      className="bg-[#0f0f0f] border-white/10 text-white text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Original Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sku.original_price}
                      onChange={(e) => updateSku(i, "original_price", e.target.value)}
                      placeholder="0.00"
                      className="bg-[#0f0f0f] border-white/10 text-white text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sale Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sku.sale_price}
                      onChange={(e) => updateSku(i, "sale_price", e.target.value)}
                      placeholder="0.00"
                      className="bg-[#0f0f0f] border-white/10 text-white text-sm h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Photo URL (optional)</label>
                    <Input
                      value={sku.photo_url}
                      onChange={(e) => updateSku(i, "photo_url", e.target.value)}
                      placeholder="https://..."
                      className="bg-[#0f0f0f] border-white/10 text-white text-sm h-9"
                    />
                  </div>
                </div>
                {sku.original_price && sku.sale_price && parseFloat(sku.original_price) > parseFloat(sku.sale_price) && (
                  <p className="text-xs text-green-400">
                    Discount: {Math.round(((parseFloat(sku.original_price) - parseFloat(sku.sale_price)) / parseFloat(sku.original_price)) * 100)}% off
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Regions ── */}
        <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Server size={18} className="text-blue-400" /> Server / Region (Optional)
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
              <input
                type="checkbox"
                checked={requiresRegion}
                onChange={(e) => setRequiresRegion(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Enable regions
            </label>
          </div>

          {requiresRegion && (
            <div className="space-y-3">
              {regions.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    value={r.region_name}
                    onChange={(e) => updateRegion(i, "region_name", e.target.value)}
                    placeholder="Region Name (e.g., USA & Latam)"
                    className="bg-[#111] border-white/10 text-white text-sm h-9 flex-1"
                  />
                  <Input
                    value={r.region_key}
                    onChange={(e) => updateRegion(i, "region_key", e.target.value)}
                    placeholder="Key (e.g., usa)"
                    className="bg-[#111] border-white/10 text-white text-sm h-9 w-32"
                  />
                  <button onClick={() => removeRegion(i)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={addRegion}
                className="border-white/10 text-gray-300 hover:bg-white/5 text-xs h-8"
              >
                <Plus size={13} className="mr-1" /> Add Region
              </Button>
            </div>
          )}
        </section>

        {/* ── Save ── */}
        <div className="flex gap-3 pb-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold h-12 text-base"
          >
            <Save size={18} className="mr-2" />
            {saving ? "Saving…" : "Create Product"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/products")}
            className="border-white/10 text-gray-300 hover:bg-white/5 h-12 px-6"
          >
            Cancel
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
