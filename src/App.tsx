import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, Component, ReactNode } from "react";
import { Toaster } from "sonner";
import { HomePage } from "@/pages/HomePage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { AllGamesPage } from "@/pages/AllGamesPage";
import { GameDetailPage } from "@/pages/GameDetailPage";
import { VerifyPlayerPage } from "@/pages/VerifyPlayerPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { AccountPage } from "@/pages/AccountPage";
import { LoginPage } from "@/pages/LoginPage";
import { OrderTrackingPage } from "@/pages/OrderTrackingPage";
import { CartPage } from "@/pages/CartPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SupportPage } from "@/pages/SupportPage";
import { AiSupportPage } from "@/pages/AiSupportPage";
import { VipServicePage } from "@/pages/VipServicePage";
import { BalancePage } from "@/pages/BalancePage";
import { PasskeyPage } from "@/pages/PasskeyPage";
import { FeedbackPage } from "@/pages/FeedbackPage";
import { AboutPage } from "@/pages/AboutPage";
import { CouponsPage } from "@/pages/CouponsPage";
import { InvitePage } from "@/pages/InvitePage";
import { AffiliatePage } from "@/pages/AffiliatePage";
import { ShopPage } from "@/pages/ShopPage";
import { SearchPage } from "@/pages/SearchPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";
import { CookiePage } from "@/pages/CookiePage";
// Admin pages — each is its own dedicated page
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminLiveChatPage } from "@/pages/admin/AdminLiveChatPage";
import { AdminMarkupPage } from "@/pages/admin/AdminMarkupPage";
import { AdminCouponsPage } from "@/pages/admin/AdminCouponsPage";
import { AdminBannersPage } from "@/pages/admin/AdminBannersPage";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";
import { AdminAddProductPage } from "@/pages/admin/AdminAddProductPage";
import { AdminHomeSectionsPage } from "@/pages/admin/AdminHomeSectionsPage";
import { AdminRolesPage } from "@/pages/admin/AdminRolesPage";
import { AdminCategoriesPage } from "@/pages/admin/AdminCategoriesPage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { AdminApiStatusPage } from "@/pages/admin/AdminApiStatusPage";
import { supabase } from "@/lib/supabase";
import { useAuthStore, mapSupabaseUser } from "@/stores/authStore";
import { trackEvent } from "@/lib/analytics";

// ─── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 rounded-xl">
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthInitializer() {
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted && session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", session.user.email)
          .single();
        const role = roleData?.role || "user";
        const authUser = mapSupabaseUser(session.user, role);
        login(authUser);
        useAuthStore.getState().syncOrdersFromDB(session.user.email!);
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", session.user.email)
          .single();
        const role = roleData?.role || "user";
        const authUser = mapSupabaseUser(session.user, role);
        login(authUser);
        useAuthStore.getState().syncOrdersFromDB(session.user.email!);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        useAuthStore.getState().logout();
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        login(mapSupabaseUser(session.user));
      }
    });

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
      <ErrorBoundary>
        <AuthInitializer />
        <div className="min-h-screen bg-[#f5f5f5]">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/games" element={<AllGamesPage />} />
          <Route path="/game/:gameId" element={<GameDetailPage />} />
          <Route path="/verify-player" element={<VerifyPlayerPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:referenceId" element={<OrderTrackingPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/ai" element={<AiSupportPage />} />
          <Route path="/support/vip" element={<VipServicePage />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/passkeys" element={<PasskeyPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />
          <Route path="/shop/:storeName" element={<ShopPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiePage />} />

          {/* Admin routes — each section is its own page */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/livechat" element={<AdminLiveChatPage />} />
          <Route path="/admin/markup" element={<AdminMarkupPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/banners" element={<AdminBannersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/add-product" element={<AdminAddProductPage />} />
          <Route path="/admin/sections" element={<AdminHomeSectionsPage />} />
          <Route path="/admin/roles" element={<AdminRolesPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/api-status" element={<AdminApiStatusPage />} />

          {/* Legacy admin route redirect compatibility */}
          <Route path="/secure-dashboard-92x2011" element={<AdminDashboardPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      </ErrorBoundary>
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
