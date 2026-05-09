import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings, Globe, HelpCircle, MessageSquare, MessageCircle, Gift, DollarSign, User,
  ChevronRight, LogOut, LayoutDashboard, Package, Wallet, Tag, Users, Camera,
  ShoppingBag
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ORDER_STATE_MAP } from "@/types";
import { toast } from "sonner";

type AccountTab = "overview" | "orders" | "profile" | "activity";
type DesktopSection = "buyHistory" | "coupon" | "settings" | "helpCenter" | "feedback" | "invite" | "earn";

export function AccountPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, orders } = useAuthStore();
  const { t } = useTranslation();
  const { currency, language } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<AccountTab>("overview");
  const [desktopSection, setDesktopSection] = useState<DesktopSection>("settings");

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // ─── Not Logged In ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <div className="hidden lg:block">
          <DesktopHeader />
        </div>
        <div className="lg:hidden">
          <Header showMenu />
        </div>

        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User size={40} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-6">{t("login")} to view your account</p>
          <button onClick={() => navigate("/login")} className="btn-primary px-12">
            {t("loginSignup")}
          </button>
        </div>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    );
  }

  // ─── Desktop Layout ───────────────────────────────────────────────────────
  const DesktopAccountContent = () => (
    <div className="hidden lg:block min-h-screen bg-[#f5f5f5]">
      <DesktopHeader />

      {/* Breadcrumb */}
      <div className="max-w-[1280px] mx-auto px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate("/")} className="hover:text-gray-700">🏠 {t("home")}</button>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">{t("settings")}</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-12">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.nickname?.[0]?.toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-black text-[8px] font-bold">V1</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{user?.nickname}</p>
                  <button className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
                    Check VIP Benefits <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              {/* Balance + Points */}
              <div className="flex items-center gap-4 mb-1 py-3 border-y border-gray-100">
                <div>
                  <p className="text-lg font-bold text-gray-900">${user?.balance?.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{t("balance")}</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                    <span className="text-yellow-500">●</span> {user?.points ?? 39}
                  </p>
                  <p className="text-xs text-gray-500">{t("points")}</p>
                </div>
              </div>
            </div>

            {/* Sidebar Menu */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {[
                { key: "buyHistory" as DesktopSection, icon: ShoppingBag, label: t("buyHistory") },
                { key: "coupon" as DesktopSection, icon: Tag, label: t("coupons"), badge: "1397" },
                { key: "settings" as DesktopSection, icon: Settings, label: t("settings") },
                { key: "helpCenter" as DesktopSection, icon: HelpCircle, label: t("helpCenter") },
                { key: "feedback" as DesktopSection, icon: MessageSquare, label: t("feedback") },
                { key: "invite" as DesktopSection, icon: Gift, label: t("inviteForCoupons"), dot: true },
                { key: "earn" as DesktopSection, icon: DollarSign, label: t("affiliateProgram"), highlight: true },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setDesktopSection(item.key)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                    desktopSection === item.key
                      ? "bg-yellow-50 text-yellow-700 border-l-4 border-l-yellow-400"
                      : item.highlight
                      ? "text-yellow-500 hover:bg-yellow-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={18} className={item.highlight ? "text-yellow-500" : "text-gray-400"} />
                    {item.label}
                  </span>
                  <span className="flex items-center gap-2">
                    {item.badge && <span className="text-gray-500 text-xs">{item.badge}</span>}
                    {item.dot && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              {desktopSection === "settings" && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t("accountInfo")}</h2>
                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                      <span className="w-36 text-sm text-gray-500">{t("avatar")}</span>
                      <div className="relative group cursor-pointer">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                          {user?.nickname?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={16} className="text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info rows */}
                    {[
                      { label: t("nickname"), value: user?.nickname, editable: true },
                      { label: "Birthday", value: "07-17", extra: <button className="text-orange-500 text-sm hover:underline">Check my birthday benefit</button> },
                      { label: "Age Range", value: "You need to set your age in accordance with NoxyStore's User Agreement.", action: "Set" },
                      { label: t("email"), value: user?.email?.replace(/(.{3}).*(@)/, "$1***$2") },
                      { label: t("password"), value: "already set" },
                      { label: "Passkey", value: "Create a Passkey for faster, safer login with Face ID, Fingerprint, or PIN.", action: null, hasButton: true },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-6 py-4 border-b border-gray-50 last:border-0">
                        <span className="w-36 text-sm text-gray-500 flex-shrink-0 pt-0.5">{item.label}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{item.value}</p>
                          {item.extra && <div className="mt-1">{item.extra}</div>}
                          {item.hasButton && (
                            <button className="mt-2 border border-gray-300 rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                              Create a Passkey
                            </button>
                          )}
                        </div>
                        {item.editable && (
                          <button className="text-sm text-gray-400 hover:text-gray-600 font-medium flex-shrink-0">
                            Modify
                          </button>
                        )}
                        {item.action && (
                          <button className="text-sm text-gray-400 hover:text-gray-600 font-medium flex-shrink-0">
                            {item.action}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {desktopSection === "buyHistory" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t("buyHistory")}</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-16">
                      <Package size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500">{t("noOrdersYet")}</p>
                      <button onClick={() => navigate("/")} className="btn-primary mt-4 px-8">
                        {t("browseGames")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => {
                        const stateInfo = ORDER_STATE_MAP[order.state] || ORDER_STATE_MAP[1];
                        return (
                          <div key={order.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{order.game_name}</p>
                              <p className="text-sm text-gray-500">{order.sku_name}</p>
                              <p className="text-xs text-gray-400 font-mono mt-1">{order.order_id}</p>
                            </div>
                            <span className={`tag-badge ${stateInfo.color} ${stateInfo.bg}`}>{stateInfo.label}</span>
                            <p className="font-bold text-gray-900">${order.price.toFixed(2)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {(desktopSection === "coupon" || desktopSection === "helpCenter" || desktopSection === "feedback" || desktopSection === "invite" || desktopSection === "earn") && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🚀</div>
                  <p className="text-gray-500 font-medium">Coming Soon</p>
                  <p className="text-sm text-gray-400 mt-1">This feature is under development</p>
                </div>
              )}
            </div>

            {/* Logout + Admin */}
            <div className="flex gap-4 mt-4">
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/secure-dashboard-92x2011")}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  {t("adminDashboard")}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex-1 bg-white text-red-500 border border-red-200 rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-red-50"
              >
                <LogOut size={18} />
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Mobile Layout ────────────────────────────────────────────────────────
  const MobileAccountContent = () => (
    <div className="lg:hidden bg-[#f8f8f8] min-h-screen pb-20">
      <div className="px-4 pt-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("myAccount")}</h1>

        {/* Tabs */}
        <div className="grid grid-cols-4 mb-4">
          {(["overview", "orders", "profile", "activity"] as AccountTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 text-sm font-semibold capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t(tab as any)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-3 right-4 text-white/60 text-xs font-medium">Notifications</div>
              <div className="flex items-center gap-3 mb-5 mt-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                  {user?.nickname?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{user?.nickname}</h2>
                  <p className="text-white/70 text-sm">ID: {user?.id?.slice(-12)}</p>
                  <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 inline-block">
                    {user?.role === "admin" ? "Admin" : "Member"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: t("balance"), value: `$${user?.balance?.toFixed(2)}` },
                  { label: t("points"), value: user?.points ?? 0 },
                  { label: t("coupons"), value: user?.coupons ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                    <p className="text-lg font-bold">{item.value}</p>
                    <p className="text-white/70 text-xs">{item.label}</p>
                  </div>
                ))}
              </div>
              <button className="w-full bg-white/20 hover:bg-white/30 rounded-2xl py-2.5 text-sm font-bold flex items-center justify-center gap-2">
                <span>↗</span> Earn Points
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Package, label: t("orders"), value: `${orders.length} orders`, path: null },
                { icon: Wallet, label: t("balance"), value: `$${user?.balance?.toFixed(2)}`, path: null },
                { icon: Tag, label: t("coupons"), value: `${user?.coupons ?? 0} available`, path: null },
                { icon: Users, label: "Referrals", value: "Earn 10%", path: null },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.path && navigate(item.path)}
                  className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all text-left"
                >
                  <item.icon size={22} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.value}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {[
                { icon: Settings, label: t("settings"), sub: null },
                { icon: Globe, label: t("languageAndCurrency"), sub: `$ ${currency}  ${language.toUpperCase()}` },
                { icon: HelpCircle, label: t("helpCenter"), sub: null },
                { icon: MessageSquare, label: t("feedback"), sub: null },
                { icon: MessageCircle, label: "Live Chat Support", sub: <span className="text-blue-500 text-xs">Get instant help</span> },
                { icon: Gift, label: t("inviteForCoupons"), sub: <span className="text-orange-500 text-xs">Unlock rich coupon rewards</span> },
                { icon: DollarSign, label: t("affiliateProgram"), sub: <span className="text-orange-500 text-xs">Earn up to 10% money</span> },
                { icon: User, label: t("aboutUs"), sub: null },
              ].map((item, idx) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 text-left ${idx < 7 ? "border-b border-gray-100" : ""}`}
                >
                  <item.icon size={20} className="text-gray-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    {typeof item.sub === "string" ? <p className="text-xs text-gray-400">{item.sub}</p> : item.sub}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>

            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/secure-dashboard-92x2011")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <LayoutDashboard size={18} />
                {t("adminDashboard")}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-4 text-red-500 font-bold flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              {t("logout")}
            </button>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-gray-500 font-medium">{t("noOrdersYet")}</p>
                <button onClick={() => navigate("/")} className="btn-primary mt-6 px-8">{t("browseGames")}</button>
              </div>
            ) : (
              orders.map((order) => {
                const stateInfo = ORDER_STATE_MAP[order.state] || ORDER_STATE_MAP[1];
                return (
                  <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{order.game_name}</h3>
                        <p className="text-xs text-gray-500">{order.sku_name}</p>
                      </div>
                      <span className={`tag-badge ${stateInfo.color} ${stateInfo.bg}`}>{stateInfo.label}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 font-mono">{order.order_id}</p>
                      <p className="font-bold text-gray-900">${order.price.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {user?.nickname?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{user?.nickname}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: t("nickname"), value: user?.nickname },
                { label: t("email"), value: user?.email },
                { label: "User ID", value: user?.id?.slice(-12) },
                { label: "Member Since", value: "May 2025" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-500 font-medium">Activity tracking coming soon</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );

  return (
    <>
      <DesktopAccountContent />
      <MobileAccountContent />
    </>
  );
}
