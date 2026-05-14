/**
 * GameManagement — redirects to AdminProductsPage (Manual tab)
 * The old 'games' table no longer exists. All product management is done
 * via manual_products, manual_skus, and manual_product_regions tables
 * through the unified AdminProductsPage.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GameManagement() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/admin/products", { replace: true });
  }, [navigate]);
  return null;
}
