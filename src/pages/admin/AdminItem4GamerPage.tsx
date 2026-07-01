/**
 * AdminItem4GamerPage — Item4Gamer reseller balance and product overview.
 * Shows current balance, last refreshed time, and a refresh button.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, DollarSign, Package, AlertCircle, Loader2 } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { useAuthStore } from "@/stores/authStore";
import { item4gamerApi, type I4GBalance, type I4GCategory, type I4GProduct } from "@/lib/item4gamer";
import { toast } from "sonner";

export default function AdminItem4GamerPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [balance, setBalance] = useState<I4GBalance | null>(null);
  const [categories, setCategories] = useState<I4GCategory[]>([]);
  const [products, setProducts] = useState<I4GProduct[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/"); return; }
    fetchBalance();
    fetchCategories();
  }, []);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    setError(null);
    const data = await item4gamerApi.getBalance().catch((e) => {
      setError(e.message);
      return null;
    });
    if (data) {
      setBalance(data);
      setLastRefreshed(new Date());
    }
    setIsLoadingBalance(false);
  };

  const fetchCategories = async () => {
    const data = await item4gamerApi.getCategories().catch(() => []);
    setCategories(data);
  };

  const fetchProductsForCategory = async (categoryId: number) => {
    setIsLoadingProducts(true);
    const data = await item4gamerApi.getProducts(categoryId).catch(() => []);
    setProducts(data);
    setIsLoadingProducts(false);
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <main className="ml-64 flex-1 py-8">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Item4Gamer</h1>
              <p className="text-sm text-gray-500 mt-0.5">Reseller balance & product management</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleTimeString()}` : "Not fetched yet"}
              </span>
              <button
                onClick={fetchBalance}
                disabled={isLoadingBalance}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoadingBalance ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">API Error</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
                <p className="text-xs text-red-400 mt-1">Make sure ITEM4GAMER_API_KEY is configured in Edge Function secrets.</p>
              </div>
            </div>
          )}

          {/* Balance Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Reseller Balance</p>
                <p className="text-xs text-gray-400">Item4Gamer API</p>
              </div>
            </div>

            {isLoadingBalance ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Fetching balance...</span>
              </div>
            ) : balance ? (
              <div>
                <p className="text-4xl font-black text-gray-900">
                  {balance.currency || "$"}{Number(balance.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">Available for orders</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">Click Refresh to fetch balance</p>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Categories</p>
                  <p className="text-xs text-gray-400">{categories.length} categories available</p>
                </div>
              </div>
              <button
                onClick={fetchCategories}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RefreshCw size={13} /> Reload
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No categories loaded. Click Refresh Balance to initialize.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    onClick={() => fetchProductsForCategory(cat.category_id)}
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-yellow-50 border border-gray-100 hover:border-yellow-200 rounded-xl text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-500 w-6 text-center">{cat.category_id}</span>
                    <span className="text-sm font-semibold text-gray-800 truncate">{cat.category_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Products */}
          {(products.length > 0 || isLoadingProducts) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Products in Category</h3>
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-gray-300" />
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.product_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.product_name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center">
                          <Package size={18} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{product.product_name}</p>
                        <p className="text-xs text-gray-400">{product.category_name} · ID: {product.product_id}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {product.min_price > 0 && (
                          <p className="text-sm font-black text-orange-500">
                            ${Number(product.min_price).toFixed(2)}
                            {product.max_price > product.min_price ? ` – $${Number(product.max_price).toFixed(2)}` : ""}
                          </p>
                        )}
                        <p className={`text-xs font-semibold ${product.stock === "in_stock" || product.stock === "available" ? "text-green-600" : "text-red-500"}`}>
                          {product.stock || "unknown"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* API Info */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">API Configuration</p>
            <p>Base URL: <span className="font-mono">https://item4gamer.com/wp-json/reseller/v1</span></p>
            <p className="mt-0.5">Auth: <span className="font-mono">api-key</span> header (set via ITEM4GAMER_API_KEY secret)</p>
            <p className="mt-0.5">Proxy: <span className="font-mono">item4gamer-proxy</span> edge function</p>
          </div>
        </div>
      </main>
    </div>
  );
}
