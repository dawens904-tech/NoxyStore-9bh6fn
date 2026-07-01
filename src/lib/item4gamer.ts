/**
 * item4gamer.ts — Client for Item4Gamer reseller API.
 * All calls are proxied through the `item4gamer-proxy` edge function
 * so the API key stays server-side.
 */
import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";

async function proxyCall<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  method: "GET" | "POST" = "GET",
  orderBody?: unknown
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("item4gamer-proxy", {
    body: { endpoint, params, method, orderBody },
  });

  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const status = error.context?.status ?? 500;
        const text = await error.context?.text();
        msg = `[${status}] ${text || msg}`;
      } catch { /* ignore */ }
    }
    throw new Error(`Item4Gamer: ${msg}`);
  }
  return data as T;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface I4GCategory {
  category_id: number;
  category_name: string;
  category_slug: string;
  parent_id: number | null;
}

export interface I4GProduct {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  thumbnail: string;
  description: string;
  short_description: string;
  min_price: number;
  max_price: number;
  stock: string;
}

export interface I4GProductDetail {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  thumbnail: string;
  description: string;
  short_description: string;
  required_fields: Array<{ field: string; label: string; type: string }>;
  variations: I4GVariation[];
}

export interface I4GVariation {
  variation_id: number;
  variation_name: string;
  price: number;
  original_price: number;
  stock: string;
  attributes: Record<string, string>;
}

export interface I4GOrder {
  order_id: number;
  status: string;
  product_name: string;
  variation_name: string;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface I4GBalance {
  balance: number;
  currency: string;
}

// ── API Methods ───────────────────────────────────────────────────────────────

export const item4gamerApi = {
  /** Get all categories */
  getCategories(): Promise<I4GCategory[]> {
    return proxyCall<I4GCategory[]>("product/get-categories");
  },

  /** Get products for a category */
  getProducts(categoryId?: number): Promise<I4GProduct[]> {
    return proxyCall<I4GProduct[]>("product/get-products", categoryId ? { category_id: categoryId } : {});
  },

  /** Get single product detail with variations */
  getProduct(productId: number | string): Promise<I4GProductDetail> {
    return proxyCall<I4GProductDetail>("product/get-product", { product_id: productId });
  },

  /** Get variation detail */
  getVariation(variationId: number | string): Promise<I4GVariation> {
    return proxyCall<I4GVariation>("product/get-variation", { variation_id: variationId });
  },

  /** Place an order */
  createOrder(body: {
    variation_id: string | number;
    quantity?: number;
    customer?: { first_name: string; last_name: string; email: string; phone?: string };
    data?: Record<string, string>;
  }): Promise<I4GOrder> {
    return proxyCall<I4GOrder>("order/add-order", {}, "POST", body);
  },

  /** Get order status */
  getOrder(orderId: number | string): Promise<I4GOrder> {
    return proxyCall<I4GOrder>("order/get-order", { order_id: orderId });
  },

  /** Get reseller balance */
  getBalance(): Promise<I4GBalance> {
    return proxyCall<I4GBalance>("get-balance");
  },

  /** Convert I4G product list to LootbarGame format for reuse in existing UI */
  productsToGames(products: I4GProduct[]): Array<{
    game_id: string;
    game_name: string;
    game_image: string;
    category: string;
    rating: number;
    sold_count: string;
    is_hot: boolean;
    discount: number;
    min_price: number | null;
  }> {
    return products.map((p) => ({
      game_id: `i4g_${p.product_id}`,
      game_name: p.product_name,
      game_image: p.thumbnail,
      category: p.category_name || "Top Up",
      rating: 5.0,
      sold_count: "",
      is_hot: false,
      discount: 0,
      min_price: p.min_price || null,
    }));
  },
};
