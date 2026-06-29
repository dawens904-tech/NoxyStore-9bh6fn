import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShoppingBag, Newspaper, Settings, ChevronRight, ArrowLeft, Package, CheckCircle, Gift, X, Home } from "lucide-react";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

type TabKey = "trade" | "news" | "system";
type SourceKey = "notification" | "game-kingdom";

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
  {
    id: "s4",
    title: "New device login notification",
    description: "Hi, your account was used to log in to a new device at Sat, 27 Jun 2026 09:44:06 GMT. Device: Other Edge Location: United States. If this is not you, please change your password. Do not share your account or asset information with anyone.",
    time: "Jun 27, 2026 05:44:06",
    read: false,
    type: "warning",
  },
  {
    id: "s5",
    title: "Important Notice: NoxyStore Has a New Brand Identity",
    description: "We've updated our logo and brand colors to better reflect our gaming community.",
    time: "May 25, 2026 06:15:23",
    read: true,
    type: "info",
  },
];

export function MessagesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, orders } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("trade");
  const [activeSource, setActiveSource] = useState<SourceKey>("notification");
  const [showPushBanner, setShowPushBanner] = useState(true);
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
    { key: "trade" as TabKey, label: "Trade Messages" },
    { key: "news" as TabKey, label: "New Game News" },
    { key: "system" as TabKey, label: "System messages" },
  ];

  const sources = [
    {
      key: "notification" as SourceKey,
      label: "Notification",
      icon: "https://placehold.co/40x40/1a1a1a/fbbf24?text=N",
      unread: tradeMessages.filter(m => !m.read).length + STATIC_SYSTEM.filter(s => !s.read).length,
    },
    {
      key: "game-kingdom" as SourceKey,
      label: "Game Kingdom",
      icon: "https://placehold.co/40x40/1e3a5f/fbbf24?text=G",
      unread: STATIC_NEWS.filter(n => !n.read).length,
    },
  ];

  const totalUnread = tradeMessages.filter(m => !m.read).length + STATIC_NEWS.filter(n => !n.read).length + STATIC_SYSTEM.filter(s => !s.read).length;

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

  // Filter content based on active source
  const getFilteredContent = () => {
    if (activeSource === "game-kingdom") {
      // Game Kingdom only shows news
      return { tabOverride: "news" as TabKey };
    }
    return { tabOverride: activeTab };
  };

  const { tabOverride } = getFilteredContent();
  const displayTab = activeSource === "game-kingdom" ? "news" : activeTab;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Headers */}
      <div className="hidden lg:block"><DesktopHeader /></div>
      <div className="lg:hidden"><Header /></div>

      <div className="max-w-6xl mx-auto px-0 lg:px-6 lg:py-6">
        {/* Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
          <Home size={14} />
          <span className="hover:text-gray-700 cursor-pointer" onClick={() => navigate("/")}>Home</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">Messages</span>
        </div>

        {/* Mobile Page Header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-600">
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

        {/* Push Notification Banner */}
        {showPushBanner && (
          <div className="mx-4 lg:mx-0 mt-4 lg:mt-0 mb-4 bg-[#fff8e1] border border-yellow-200 rounded-lg flex items-center justify-between px-4 py-3">
            <p className="text-sm text-gray-700 flex-1">
              Turn on push notifications to receive the order progress and seller messages
            </p>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold px-4 py-1.5 rounded-md transition-colors">
                Turn On
              </button>
              <button onClick={() => setShowPushBanner(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6 px-4 lg:px-0 pb-24 lg:pb-8">
          {/* Left Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {sources.map((source) => (
                <button
                  key={source.key}
                  onClick={() => setActiveSource(source.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    activeSource === source.key
                      ? "bg-[#fff8e1] border-l-4 border-yellow-400"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <img
                    src={source.icon}
                    alt={source.label}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${activeSource === source.key ? "text-gray-900" : "text-gray-700"}`}>
                      {source.label}
                    </p>
                  </div>
                  {source.unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {source.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Source Selector */}
          <div className="lg:hidden w-full">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
              {sources.map((source) => (
                <button
                  key={source.key}
                  onClick={() => setActiveSource(source.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    activeSource === source.key
                      ? "bg-[#fff8e1] border-l-4 border-yellow-400"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <img
                    src={source.icon}
                    alt={source.label}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${activeSource === source.key ? "text-gray-900" : "text-gray-700"}`}>
                      {source.label}
                    </p>
                  </div>
                  {source.unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {source.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[500px]">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                      displayTab === tab.key
                        ? "text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab.label}
                    {displayTab === tab.key && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* ── Trade Messages ── */}
                {displayTab === "trade" && (
                  <div>
                    {!isAuthenticated ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <ShoppingBag size={64} className="text-gray-200 mb-4" />
                        <p className="font-bold text-gray-800 mb-1">Login to see your trade messages</p>
                        <p className="text-sm text-gray-400 mb-6">Your order history and trade notifications will appear here.</p>
                        <button onClick={() => navigate("/login")} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                          Login / Sign Up
                        </button>
                      </div>
                    ) : tradeMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                          <Bell size={32} className="text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">No data</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tradeMessages.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => navigate(`/orders/${msg.id}`)}
                            className={`p-4 rounded-lg cursor-pointer transition-colors ${
                              !msg.read ? "bg-gray-50" : "bg-white border border-gray-100"
                            } hover:shadow-sm`}
                          >
                            <div className="flex items-start gap-3">
                              <TradeIcon type={msg.icon} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold text-gray-900 leading-tight">
                                    {msg.title}
                                  </p>
                                  {!msg.read && <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-1" />}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{msg.description}</p>
                                <p className="text-[11px] text-gray-400 mt-2">{msg.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Game News ── */}
                {displayTab === "news" && (
                  <div className="space-y-3">
                    {STATIC_NEWS.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg ${!item.read ? "bg-gray-50" : "bg-white border border-gray-100"}`}
                      >
                        <div className="flex items-start gap-3">
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
                            <p className="text-sm font-bold text-gray-900 mt-1.5 leading-tight">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.summary}</p>
                            <p className="text-[11px] text-gray-400 mt-2">{item.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── System Messages ── */}
                {displayTab === "system" && (
                  <div className="space-y-3">
                    {STATIC_SYSTEM.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${!msg.read ? "bg-gray-50" : "bg-white border border-gray-100"}`}
                      >
                        <div className="flex items-start gap-3">
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
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{msg.description}</p>
                            <p className="text-[11px] text-gray-400 mt-2">{msg.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Content Area (below source selector) */}
          <div className="lg:hidden w-full">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 text-xs font-semibold transition-colors relative ${
                      displayTab === tab.key
                        ? "text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab.label}
                    {displayTab === tab.key && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-3">
                {/* ── Trade Messages ── */}
                {displayTab === "trade" && (
                  <div>
                    {!isAuthenticated ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ShoppingBag size={48} className="text-gray-200 mb-4" />
                        <p className="font-bold text-gray-800 mb-1">Login to see your trade messages</p>
                        <p className="text-sm text-gray-400 mb-6">Your order history and trade notifications will appear here.</p>
                        <button onClick={() => navigate("/login")} className="bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm">
                          Login / Sign Up
                        </button>
                      </div>
                    ) : tradeMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                          <Bell size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">No data</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tradeMessages.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => navigate(`/orders/${msg.id}`)}
                            className={`p-3 rounded-lg cursor-pointer ${
                              !msg.read ? "bg-gray-50" : "bg-white border border-gray-100"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <TradeIcon type={msg.icon} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold text-gray-900 leading-tight">
                                    {msg.title}
                                  </p>
                                  {!msg.read && <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-1" />}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{msg.description}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{msg.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Game News ── */}
                {displayTab === "news" && (
                  <div className="space-y-2">
                    {STATIC_NEWS.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg ${!item.read ? "bg-gray-50" : "bg-white border border-gray-100"}`}
                      >
                        <div className="flex items-start gap-3">
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
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.summary}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{item.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── System Messages ── */}
                {displayTab === "system" && (
                  <div className="space-y-2">
                    {STATIC_SYSTEM.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${!msg.read ? "bg-gray-50" : "bg-white border border-gray-100"}`}
                      >
                        <div className="flex items-start gap-3">
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
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-3">{msg.description}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{msg.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
