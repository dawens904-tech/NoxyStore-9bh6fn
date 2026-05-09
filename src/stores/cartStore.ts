import { create } from "zustand";
import type { CartItem, SkuItem, LootbarGame } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (sku: SkuItem, game: LootbarGame, quantity?: number, extra_info?: Record<string, string>) => void;
  removeItem: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (sku, game, quantity = 1, extra_info = {}) =>
    set((state) => {
      const existing = state.items.find((i) => i.sku.sku_id === sku.sku_id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.sku.sku_id === sku.sku_id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, { sku, game, quantity, extra_info }] };
    }),

  removeItem: (skuId) =>
    set((state) => ({
      items: state.items.filter((i) => i.sku.sku_id !== skuId),
    })),

  updateQuantity: (skuId, quantity) =>
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((i) => i.sku.sku_id !== skuId)
        : state.items.map((i) =>
            i.sku.sku_id === skuId ? { ...i, quantity } : i
          ),
    })),

  clearCart: () => set({ items: [] }),

  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  getTotalPrice: () =>
    get().items.reduce((sum, i) => sum + (i.sku.price || 0) * i.quantity, 0),
}));
