import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Package, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminSidebar from './AdminSidebar';
import { toast } from 'sonner';

interface RegionalProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  isAvailable: boolean;
}

interface Region {
  id: string;
  name: string;
}

// ── Malaysia Lootbar-style SKU examples ─────────────────────────────────────
const MALAYSIA_SKUS: RegionalProduct[] = [
  { id: 'my-1',  name: '5 Diamonds',    quantity: 5,    price: 0.09,  originalPrice: 0.11,  isAvailable: true },
  { id: 'my-2',  name: '12 Diamonds',   quantity: 12,   price: 0.21,  originalPrice: 0.26,  isAvailable: true },
  { id: 'my-3',  name: '19 Diamonds',   quantity: 19,   price: 0.33,  originalPrice: 0.40,  isAvailable: true },
  { id: 'my-4',  name: '25 Diamonds',   quantity: 25,   price: 0.43,  originalPrice: 0.53,  isAvailable: true },
  { id: 'my-5',  name: '36 Diamonds',   quantity: 36,   price: 0.61,  originalPrice: 0.76,  isAvailable: true },
  { id: 'my-6',  name: '50 Diamonds',   quantity: 50,   price: 0.85,  originalPrice: 1.05,  isAvailable: true },
  { id: 'my-7',  name: '65 Diamonds',   quantity: 65,   price: 1.09,  originalPrice: 1.37,  isAvailable: true },
  { id: 'my-8',  name: '86 Diamonds',   quantity: 86,   price: 1.45,  originalPrice: 1.81,  isAvailable: true },
  { id: 'my-9',  name: '109 Diamonds',  quantity: 109,  price: 1.83,  originalPrice: 2.29,  isAvailable: true },
  { id: 'my-10', name: '172 Diamonds',  quantity: 172,  price: 2.89,  originalPrice: 3.61,  isAvailable: true },
  { id: 'my-11', name: '257 Diamonds',  quantity: 257,  price: 4.30,  originalPrice: 5.38,  isAvailable: true },
  { id: 'my-12', name: '343 Diamonds',  quantity: 343,  price: 5.76,  originalPrice: 7.20,  isAvailable: true },
  { id: 'my-13', name: '429 Diamonds',  quantity: 429,  price: 7.19,  originalPrice: 8.99,  isAvailable: true },
  { id: 'my-14', name: '514 Diamonds',  quantity: 514,  price: 8.62,  originalPrice: 10.77, isAvailable: true },
  { id: 'my-15', name: '600 Diamonds',  quantity: 600,  price: 10.05, originalPrice: 12.56, isAvailable: true },
  { id: 'my-16', name: '706 Diamonds',  quantity: 706,  price: 11.83, originalPrice: 14.78, isAvailable: true },
  { id: 'my-17', name: '878 Diamonds',  quantity: 878,  price: 14.71, originalPrice: 18.38, isAvailable: true },
  { id: 'my-18', name: '963 Diamonds',  quantity: 963,  price: 16.13, originalPrice: 20.16, isAvailable: true },
  { id: 'my-19', name: '1100 Diamonds', quantity: 1100, price: 18.42, originalPrice: 23.02, isAvailable: true },
  { id: 'my-20', name: '1584 Diamonds', quantity: 1584, price: 26.52, originalPrice: 33.15, isAvailable: true },
  { id: 'my-21', name: '2195 Diamonds', quantity: 2195, price: 36.75, originalPrice: 45.93, isAvailable: true },
  { id: 'my-22', name: '2901 Diamonds', quantity: 2901, price: 48.59, originalPrice: 60.73, isAvailable: true },
  { id: 'my-23', name: '3668 Diamonds', quantity: 3668, price: 61.43, originalPrice: 76.78, isAvailable: true },
  { id: 'my-24', name: '4583 Diamonds', quantity: 4583, price: 76.76, originalPrice: 95.95, isAvailable: true },
  { id: 'my-25', name: '5765 Diamonds', quantity: 5765, price: 96.54, originalPrice: 120.67, isAvailable: true },
];

const DEFAULT_REGIONS: Region[] = [
  { id: 'malaysia', name: 'Malaysia / Singapore' },
  { id: 'usa',       name: 'USA & Latin America' },
  { id: 'brazil',    name: 'Brazil' },
  { id: 'indonesia', name: 'Indonesia' },
  { id: 'europe',    name: 'Europe & Russia' },
  { id: 'global',    name: 'Global' },
];

const DEFAULT_PRODUCTS: Record<string, RegionalProduct[]> = {
  malaysia: MALAYSIA_SKUS,
  usa: [
    { id: 'us-1', name: '86 Diamonds',  quantity: 86,  price: 1.50, originalPrice: 1.99, isAvailable: true },
    { id: 'us-2', name: '172 Diamonds', quantity: 172, price: 2.80, originalPrice: 3.50, isAvailable: true },
    { id: 'us-3', name: '257 Diamonds', quantity: 257, price: 4.20, originalPrice: 5.25, isAvailable: true },
    { id: 'us-4', name: '514 Diamonds', quantity: 514, price: 8.20, originalPrice: 10.25, isAvailable: true },
  ],
  brazil: [
    { id: 'br-1', name: '86 Diamonds',  quantity: 86,  price: 0.90, originalPrice: 1.20, isAvailable: true },
    { id: 'br-2', name: '172 Diamonds', quantity: 172, price: 1.70, originalPrice: 2.10, isAvailable: true },
  ],
  indonesia: [],
  europe: [
    { id: 'eu-1', name: '86 Diamonds',  quantity: 86,  price: 2.10, originalPrice: 2.50, isAvailable: true },
    { id: 'eu-2', name: '172 Diamonds', quantity: 172, price: 4.00, originalPrice: 4.75, isAvailable: true },
  ],
  global: [],
};

// ── Single product row (memoized for performance) ────────────────────────────
const ProductRow = ({ product, onUpdate, onRemove }: {
  product: RegionalProduct;
  onUpdate: (id: string, field: keyof RegionalProduct, value: string | number | boolean) => void;
  onRemove: (id: string) => void;
}) => {
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
      {/* Name */}
      <div className="col-span-3">
        <Input
          value={product.name}
          onChange={(e) => onUpdate(product.id, 'name', e.target.value)}
          placeholder="e.g., 109 Diamonds"
          className="text-sm h-8 rounded-lg"
        />
      </div>
      {/* Qty */}
      <div className="col-span-2">
        <Input
          type="number"
          value={product.quantity}
          onChange={(e) => onUpdate(product.id, 'quantity', parseInt(e.target.value) || 0)}
          className="text-sm h-8 rounded-lg"
        />
      </div>
      {/* Sale price */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          value={product.price}
          onChange={(e) => onUpdate(product.id, 'price', parseFloat(e.target.value) || 0)}
          className="text-sm h-8 rounded-lg font-semibold"
        />
      </div>
      {/* Original price */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          value={product.originalPrice}
          onChange={(e) => onUpdate(product.id, 'originalPrice', parseFloat(e.target.value) || 0)}
          className="text-sm h-8 rounded-lg text-gray-400"
        />
      </div>
      {/* Discount badge */}
      <div className="col-span-1 flex justify-center">
        {discount > 0 ? (
          <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
            -{discount}%
          </span>
        ) : (
          <span className="text-[10px] text-gray-300">—</span>
        )}
      </div>
      {/* Available toggle */}
      <div className="col-span-1 flex justify-center">
        <div
          onClick={() => onUpdate(product.id, 'isAvailable', !product.isAvailable)}
          className={`w-8 h-4 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${
            product.isAvailable ? 'bg-green-400' : 'bg-gray-300'
          }`}
        >
          <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${product.isAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </div>
      {/* Delete */}
      <div className="col-span-1 flex justify-end">
        <button
          onClick={() => onRemove(product.id)}
          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

export default function EditRegionalPricing() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('malaysia');
  const [regionalProducts, setRegionalProducts] = useState<Record<string, RegionalProduct[]>>(DEFAULT_PRODUCTS);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    if (productId) loadRegionalPricing();
  }, [user, productId]);

  const loadRegionalPricing = useCallback(async () => {
    if (!productId) return;
    try {
      const { data } = await supabase
        .from('regional_pricing')
        .select('*')
        .eq('product_id', productId);

      if (data && data.length > 0) {
        const organized: Record<string, RegionalProduct[]> = {};
        data.forEach((item: any) => {
          if (!organized[item.region_id]) organized[item.region_id] = [];
          organized[item.region_id].push({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.original_price,
            isAvailable: item.is_available,
          });
        });
        setRegionalProducts(prev => ({ ...DEFAULT_PRODUCTS, ...organized }));
      }
    } catch (err) {
      console.error('Load regional pricing error:', err);
    }
  }, [productId]);

  const currentProducts = useMemo(
    () => regionalProducts[selectedRegion] || [],
    [regionalProducts, selectedRegion]
  );

  const addProduct = useCallback(() => {
    const newProduct: RegionalProduct = {
      id: `new-${Date.now()}`,
      name: '',
      quantity: 0,
      price: 0,
      originalPrice: 0,
      isAvailable: true,
    };
    setRegionalProducts(prev => ({
      ...prev,
      [selectedRegion]: [...(prev[selectedRegion] || []), newProduct],
    }));
  }, [selectedRegion]);

  const removeProduct = useCallback((id: string) => {
    setRegionalProducts(prev => ({
      ...prev,
      [selectedRegion]: (prev[selectedRegion] || []).filter(p => p.id !== id),
    }));
  }, [selectedRegion]);

  const updateProduct = useCallback((id: string, field: keyof RegionalProduct, value: string | number | boolean) => {
    setRegionalProducts(prev => ({
      ...prev,
      [selectedRegion]: (prev[selectedRegion] || []).map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  }, [selectedRegion]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const allPricing = Object.entries(regionalProducts).flatMap(([regionId, products]) =>
        products.map(p => ({
          product_id: productId,
          region_id: regionId,
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          original_price: p.originalPrice,
          is_available: p.isAvailable,
          updated_at: new Date().toISOString(),
        }))
      );

      const { error } = await supabase
        .from('regional_pricing')
        .upsert(allPricing, { onConflict: 'id' });

      if (error) throw error;
      toast.success('Regional pricing saved successfully');
      navigate('/secure-dashboard-92x2011/products');
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <main className="ml-64 flex-1 py-8">
        <div className="max-w-6xl mx-auto px-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/secure-dashboard-92x2011/products')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900">Regional Pricing</h1>
              <p className="text-sm text-gray-500 mt-0.5">Configure SKU prices per region</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="flex gap-5 items-start">
            {/* ── Region selector ── */}
            <div className="w-48 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 p-3 sticky top-20">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-2 mb-2">Regions</p>
                <div className="space-y-0.5">
                  {DEFAULT_REGIONS.map(region => {
                    const count = regionalProducts[region.id]?.length ?? 0;
                    const isSelected = selectedRegion === region.id;
                    return (
                      <button
                        key={region.id}
                        onClick={() => setSelectedRegion(region.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                          isSelected
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{region.name}</span>
                        <span className={`text-xs font-bold ml-2 px-1.5 py-0.5 rounded-lg flex-shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Products table ── */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="font-black text-gray-900 text-base">
                    {DEFAULT_REGIONS.find(r => r.id === selectedRegion)?.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{currentProducts.length} SKUs</p>
                </div>
                <div className="flex gap-2">
                  {selectedRegion === 'malaysia' && currentProducts.length === 0 && (
                    <button
                      onClick={() => setRegionalProducts(prev => ({ ...prev, malaysia: MALAYSIA_SKUS }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all"
                    >
                      <RefreshCw size={12} /> Load Malaysia SKUs
                    </button>
                  )}
                  <Button
                    onClick={addProduct}
                    size="sm"
                    className="gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold border-0 text-xs h-8 px-3"
                  >
                    <Plus size={13} /> Add SKU
                  </Button>
                </div>
              </div>

              {/* Column headers */}
              {currentProducts.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Sale Price</div>
                  <div className="col-span-2">Original</div>
                  <div className="col-span-1 text-center">Disc.</div>
                  <div className="col-span-1 text-center">Active</div>
                  <div className="col-span-1" />
                </div>
              )}

              {/* Rows */}
              <div className="px-4 py-2">
                {currentProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Package size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold text-sm">No SKUs for this region</p>
                    <p className="text-gray-400 text-xs mt-1 mb-4">
                      {selectedRegion === 'malaysia'
                        ? 'Load the pre-built Malaysia SKU list or add manually'
                        : 'Click "Add SKU" to create one'}
                    </p>
                    {selectedRegion === 'malaysia' && (
                      <button
                        onClick={() => setRegionalProducts(prev => ({ ...prev, malaysia: MALAYSIA_SKUS }))}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold transition-all"
                      >
                        <RefreshCw size={14} /> Load {MALAYSIA_SKUS.length} Malaysia SKUs
                      </button>
                    )}
                  </div>
                ) : (
                  currentProducts.map(product => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onUpdate={updateProduct}
                      onRemove={removeProduct}
                    />
                  ))
                )}
              </div>

              {/* Footer summary */}
              {currentProducts.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {currentProducts.filter(p => p.isAvailable).length} active ·{' '}
                    {currentProducts.filter(p => !p.isAvailable).length} hidden
                  </p>
                  <p className="text-xs text-gray-400">
                    Price range: ${Math.min(...currentProducts.map(p => p.price)).toFixed(2)} — ${Math.max(...currentProducts.map(p => p.price)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
