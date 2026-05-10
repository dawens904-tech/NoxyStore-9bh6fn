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
