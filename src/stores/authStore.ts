import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Order } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  orders: Order[];
  isLoading: boolean;

  login: (userData: Partial<User>) => void;
  logout: () => void;
  updateBalance: (amount: number) => void;
  addOrder: (order: Order) => void;
  updateOrderState: (referenceId: string, state: number) => void;
  setLoading: (loading: boolean) => void;
  syncOrdersFromDB: (email: string) => Promise<void>;
}

function mapSupabaseUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, any> }, role = "user"): User {
  const meta = supabaseUser.user_metadata || {};
  // Google OAuth sets `picture`, email OTP sets `avatar_url` — check both
  const avatar = meta.avatar_url || meta.picture || undefined;
  return {
    id: supabaseUser.id,
    nickname: meta.username || meta.full_name || meta.name || supabaseUser.email?.split("@")[0] || "Gamer",
    email: supabaseUser.email ?? "",
    balance: 0,
    points: 39,
    coupons: 0,
    role: role as "user" | "admin",
    avatar,
  };
}

export { mapSupabaseUser };

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      orders: [],
      isLoading: false,

      login: (userData) =>
        set((state) => ({
          user: {
            id: userData.id || state.user?.id || `user_${Date.now()}`,
            nickname: userData.nickname || state.user?.nickname || "Gamer",
            email: userData.email || state.user?.email || "",
            balance: userData.balance ?? state.user?.balance ?? 0,
            points: userData.points ?? state.user?.points ?? 39,
            coupons: userData.coupons ?? state.user?.coupons ?? 0,
            role: userData.role || state.user?.role || "user",
            // Preserve avatar: prefer incoming value, fallback to existing
            avatar: userData.avatar || state.user?.avatar || undefined,
          },
          isAuthenticated: true,
        })),

      logout: async () => {
        try { await supabase.auth.signOut(); } catch {}
        set({ user: null, isAuthenticated: false, orders: [] });
      },

      updateBalance: (amount) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, balance: Math.max(0, state.user.balance + amount) }
            : null,
        })),

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),

      updateOrderState: (referenceId, orderState) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.reference_id === referenceId ? { ...o, state: orderState as Order["state"] } : o
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      syncOrdersFromDB: async (email: string) => {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("user_email", email)
          .order("created_at", { ascending: false })
          .limit(50);
        if (data && data.length > 0) {
          set({ orders: data as Order[] });
        }
      },
    }),
    {
      name: "noxy-auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        orders: state.orders,
      }),
    }
  )
);
