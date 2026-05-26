import { create } from 'zustand';
import { Product } from '@/types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ProductState {
  products: Product[];
  loading: boolean;
  loadProducts: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: 'game' | 'gift-card') => Product[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,

  loadProducts: async () => {
    set({ loading: true });
    try {
      // Load games as products
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform games to Product format
      const transformedProducts: Product[] = (games || []).map(game => ({
        id: game.id,
        name: game.name,
        category: 'top-up',
        image: game.image || 'https://via.placeholder.com/400x300?text=Game',
        discount: game.discount_percent || 0,
        rating: game.rating || 5.0,
        reviewCount: game.total_reviews || 0,
        soldCount: game.total_sold?.toString() || '100k+',
        originalPrice: 0,
        salePrice: 0,
        sku: game.slug,
        isInstant: true,
        shortDescription: game.short_description || '',
        fullDescription: game.full_description || '',
        howToUse: game.how_to_topup || '',
        requiresPlayerId: game.requires_player_id || false,
        requiresServer: game.requires_server || false,
        requiresRegion: false,
        pricingType: 'quantity',
        isActive: game.is_active,
        visibilityTags: [],
        createdAt: game.created_at,
        updatedAt: game.updated_at
      }));

      set({ products: transformedProducts, loading: false });
    } catch (error) {
      console.error('Failed to load products:', error);
      set({ loading: false });
    }
  },

  addProduct: (product) => {
    set((state) => ({
      products: [...state.products, product],
    }));
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  getProductsByCategory: (category) => {
    return get().products.filter((p) => p.category === category && p.isActive);
  },
}));
