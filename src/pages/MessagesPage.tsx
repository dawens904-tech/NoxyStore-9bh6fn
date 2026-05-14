import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShoppingBag, Newspaper, Settings, ChevronRight, ArrowLeft, Package, CheckCircle, Gift } from "lucide-react";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

type TabKey = "trade" | "news" | "system";

interface TradeMessage {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: "success" | "pending" | "gift";
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  time: string;
  read: boolean;
  tag: string;
}

interface SystemMessage {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

const STATIC_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "New Game Added: Honor of Kings",
    summary: "Honor of Kings top-up is now available on NoxyStore. Get tokens faster than ever.",
    time: "2 hours ago",
    read: false,
    tag: "New Game",
  },
  {
    id: "n2",
    title: "Free Fire MAX Top-Up Now Live",
    summary: "We've expanded our Free Fire lineup — FF MAX diamonds now available.",
    time: "1 day ago",
    read: true,
    tag: "Update",
  },
  {
    id: "n3",
    title: "NoxyStore VIP V3 Perks Upgraded",
    summary: "VIP V3 members now enjoy 3% bonus on every top-up. Check your VIP status.",
    time: "3 days ago",
    read: true,
    tag: "VIP",
  },
  {
    id: "n4",
    title: "Steam Game Keys Now Available",
    summary: "Browse and purchase Steam game keys directly on NoxyStore at competitive prices.",
    time: "5 days ago",
    read: true,
    tag: "New Feature",
  },
];

const STATIC_SYSTEM: SystemMessage[] = [
  {
    id: "s1",
    title: "Welcome to NoxyStore!",
    description: "Your account is ready. Complete your profile to unlock exclusive rewards.",
    time: "Account created",
    read: false,
    type: "success",
  },
  {
    id: "s2",
    title: "Security Tip",
    description: "Enable passkey authentication for faster and safer logins.",
    time: "System",
    read: true,
    type: "info",
  },
  {
    id: "s3",
    title: "Referral Program Available",
    description: "Invite friends and earn bonus points when they place their first order.",
    time: "System",
    read: true,
    type: "info",
  },
];

export function MessagesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, orders } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("trade");
  const [tradeMessages, setTradeMessages] = useState<TradeMessage[]>([]);

  // Build trade messages from user orders
  useEffect(() => {
    if (!orders || orders.length === 0) {
      setTradeMessages([]);
      return;
    }
    const msgs: TradeMessage[] = orders.slice(0, 20).map((order: any) => ({
      id: order.id || order.reference_id,
      title: order.state === 2
        ? `Order Successful — ${order.game_name}`
        : order.state === 1
        ? `Order Processing — ${order.game_name}`
        : `Order Update — ${order.game_name}`,
      description: order.state === 2
        ? `${order.sku_name} has been delivered successfully. Reference: ${order.reference_id}`
        : order.state === 1
        ? `${order.sku_name} is being processed. Reference: ${order.reference_id}`
        : `${order.sku_name} — Status: ${order.state}. Reference: ${order.reference_id}`,
      time: order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Recently",
      read: order.state === 2,
      icon: order.state === 2 ? "success" : "pending",
    }));
    setTradeMessages(msgs);
  }, [orders]);

  const tabs = [
    { key: "trade" as TabKey, label: "Trade Messages", icon: ShoppingBag, count: tradeMessages.filter(m => !m.read).length },
    { key: "news" as TabKey, label: "Game News", icon: Newspaper, count: STATIC_NEWS.filter(n => !n.read).length },
    { key: "system" as TabKey, label: "System", icon: Settings, count: STATIC_SYSTEM.filter(s => !s.read).length },
  ];

  const totalUnread = tabs.reduce((acc, t) => acc + t.count, 0);

  function TradeIcon({ type }: { type: TradeMessage["icon"] }) {
    if (type === "success") return (
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <CheckCircle size={20} className="text-green-600" />
      </div>
    );
    if (type === "gift") return (
      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
        <Gift size={20} className="text-yellow-600" />
      </div>
    );
    return (
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Package size={20} className="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Headers */}
      <div className="hidden lg:block"><DesktopHeader /></div>
      <div className="lg:hidden"><Header /></div>

      <div className="max-w-2xl lg:max-w-3xl mx-auto px-0 lg:px-6 lg:py-8">
        {/* Page Header */}
        <div className="bg-white border-b lg:rounded-2xl lg:border lg:mb-6 sticky top-[56px] lg:top-[72px] z-30">
          {/* Mobile back row */}
          <div className="flex items-center gap-3 px-4 py-3 border-b lg:border-b-0 lg:px-6 lg:pt-6 lg:pb-0">
            <button onClick={() => navigate(-1)} className="lg:hidden p-1 -ml-1 text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5 flex-1">
              <div className="relative">
                <Bell size={22} className="text-gray-900" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-black text-gray-900">Messages</h1>
            </div>
            {!isAuthenticated && (
              <button onClick={() => navigate("/login")} className="text-sm font-semibold text-yellow-600">
                Login
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-colors relative ${
                    activeTab === tab.key
                      ? "text-yellow-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Icon size={15} />
                    {tab.count > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1 rounded-full">{tab.count}</span>
                    )}
                  </div>
                  <span className="hidden sm:block">{tab.label}</span>
                  <span className="sm:hidden">{tab.key === "trade" ? "Trade" : tab.key === "news" ? "News" : "System"}</span>
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-yellow-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white lg:rounded-2xl lg:border overflow-hidden">
          {/* ── Trade Messages ── */}
          {activeTab === "trade" && (
            <div>
              {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <ShoppingBag size={48} className="text-gray-200 mb-4" />
                  <p className="font-bold text-gray-800 mb-1">Login to see your trade messages</p>
                  <p className="text-sm text-gray-400 mb-6">Your order history and trade notifications will appear here.</p>
                  <button onClick={() => navigate("/login")} className="bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm">
                    Login / Sign Up
                  </button>
                </div>
              ) : tradeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <ShoppingBag size={48} className="text-gray-200 mb-4" />
                  <p className="font-bold text-gray-800 mb-1">No trade messages yet</p>
                  <p className="text-sm text-gray-400 mb-6">Your order confirmations and trade notifications will appear here.</p>
                  <button onClick={() => navigate("/categories")} className="bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm">
                    Browse Games
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tradeMessages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => navigate(`/orders/${msg.id}`)}
                      className={`w-full flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left ${!msg.read ? "bg-yellow-50/40" : ""}`}
                    >
                      <TradeIcon type={msg.icon} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-bold text-gray-900 leading-tight ${!msg.read ? "text-gray-900" : "text-gray-700"}`}>
                            {msg.title}
                          </p>
                          {!msg.read && <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{msg.description}</p>
                        <p className="text-[11px] text-gray-300 mt-1">{msg.time}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Game News ── */}
          {activeTab === "news" && (
            <div className="divide-y divide-gray-50">
              {STATIC_NEWS.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 px-4 py-4 ${!item.read ? "bg-yellow-50/40" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Newspaper size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        {item.tag}
                      </span>
                      {!item.read && <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.summary}</p>
                    <p className="text-[11px] text-gray-300 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── System Messages ── */}
          {activeTab === "system" && (
            <div className="divide-y divide-gray-50">
              {/* NoxyStore branding header */}
              <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-[#0a0a0a] to-gray-900">
                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-black text-sm">N</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white">NoxyStore</p>
                  <p className="text-xs text-gray-400">Official System Notifications</p>
                </div>
              </div>
              {STATIC_SYSTEM.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 px-4 py-4 ${!msg.read ? "bg-yellow-50/40" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === "success" ? "bg-green-100" : msg.type === "warning" ? "bg-orange-100" : "bg-blue-100"
                  }`}>
                    <Bell size={18} className={
                      msg.type === "success" ? "text-green-600" : msg.type === "warning" ? "text-orange-600" : "text-blue-600"
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{msg.title}</p>
                      {!msg.read && <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{msg.description}</p>
                    <p className="text-[11px] text-gray-300 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-24 lg:h-8" />
      </div>

      <BottomNav />
    </div>
  );
}
