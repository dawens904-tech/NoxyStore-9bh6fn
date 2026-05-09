import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { HomePage } from "@/pages/HomePage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { AllGamesPage } from "@/pages/AllGamesPage";
import { GameDetailPage } from "@/pages/GameDetailPage";
import { VerifyPlayerPage } from "@/pages/VerifyPlayerPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { AccountPage } from "@/pages/AccountPage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { OrderTrackingPage } from "@/pages/OrderTrackingPage";
import { CartPage } from "@/pages/CartPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { supabase } from "@/lib/supabase";
import { useAuthStore, mapSupabaseUser } from "@/stores/authStore";
import { trackEvent } from "@/lib/analytics";

// ─── Auth Initializer ──────────────────────────────────────────────────────────
function AuthInitializer() {
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // Safety #1: check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted && session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", session.user.email)
          .single();
        const role = roleData?.role || "user";
        login(mapSupabaseUser(session.user, role));
        useAuthStore.getState().syncOrdersFromDB(session.user.email!);
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", session.user.email)
          .single();
        const role = roleData?.role || "user";
        login(mapSupabaseUser(session.user, role));
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        login(mapSupabaseUser(session.user));
      }
    });

    // Track page view
    trackEvent("page_view", { page: window.location.pathname });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <div className="min-h-screen bg-[#f5f5f5]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/games" element={<AllGamesPage />} />
          <Route path="/game/:gameId" element={<GameDetailPage />} />
          <Route path="/verify-player" element={<VerifyPlayerPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:referenceId" element={<OrderTrackingPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Secure admin only */}
          <Route path="/secure-dashboard-92x2011" element={<AdminDashboardPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: { maxWidth: "420px", borderRadius: "16px", fontFamily: "Inter, sans-serif" },
          classNames: { toast: "font-semibold text-sm" },
        }}
        richColors
      />
    </BrowserRouter>
  );
}

export default App;
