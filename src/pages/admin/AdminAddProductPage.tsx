import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ArrowLeft } from "lucide-react";

// This page redirects users to the unified AdminProductsPage
export function AdminAddProductPage() {
  const navigate = useNavigate();
  return (
    <AdminLayout>
      <div className="p-6 max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/admin/products")} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-gray-900">Add Product</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-600 mb-4">Product management has been consolidated into the Products page.</p>
          <button onClick={() => navigate("/admin/products")}
            className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-300">
            Go to Products →
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
