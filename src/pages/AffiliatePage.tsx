import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Search, Star, Trash2, Check, Plus, Copy, ChevronRight, Info } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { MOCK_GAMES, CATEGORIES } from "@/constants/mockData";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { toast } from "sonner";

type AffiliateStep =
  | "agreement" | "gameType" | "selectFeatured" | "confirmFeatured"
  | "addMoreGames" | "selectSocials" | "addSocialLinks" | "shopDetails"
  | "preview" | "myStore";

const GAME_TYPES = [
  { key: "Top Up", label: "Top Up", icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#FEF3C7"/><path d="M24 32V16M24 16l-6 6M24 16l6 6" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><rect x="12" y="33" width="24" height="4" rx="2" fill="#F59E0B"/></svg>, bg: "from-yellow-50 to-orange-50", border: "border-yellow-300" },
  { key: "Game Coins", label: "Game Coins", icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#FEF9C3"/><circle cx="24" cy="24" r="12" fill="#EAB308"/><path d="M24 18v12M20 22l4-4 4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>, bg: "from-yellow-50 to-yellow-100", border: "border-yellow-300" },
  { key: "Gift Card", label: "Gift Card", icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#FEE2E2"/><rect x="10" y="16" width="28" height="20" rx="3" fill="#EF4444"/><path d="M22 16c0-2 4-4 4-4s4 2 4 4" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M10 22h28M22 22v14" stroke="white" strokeWidth="2"/></svg>, bg: "from-red-50 to-pink-50", border: "border-red-200" },
  { key: "Game Keys", label: "Game Keys", icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#EDE9FE"/><rect x="12" y="20" width="24" height="14" rx="3" fill="#7C3AED"/><circle cx="20" cy="27" r="2" fill="white"/><circle cx="28" cy="27" r="2" fill="white"/><circle cx="24" cy="27" r="2" fill="white"/></svg>, bg: "from-purple-50 to-violet-50", border: "border-purple-200" },
  { key: "Game Items", label: "Game Items", icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#DBEAFE"/><path d="M16 24l8-8 8 8-8 8-8-8z" fill="#3B82F6"/><path d="M20 24l4-4 4 4-4 4-4-4z" fill="white"/></svg>, bg: "from-blue-50 to-sky-50", border: "border-blue-200" },
];

const SOCIALS = [
  { key: "youtube", label: "YouTube", color: "#FF0000", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { key: "tiktok", label: "TikTok", color: "#000000", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.79 1.52V6.69a4.85 4.85 0 0 1-1.02 0z"/></svg> },
  { key: "twitch", label: "Twitch", color: "#9146FF", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg> },
  { key: "twitter", label: "X", color: "#000000", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.257 5.629L18.244 2.25z"/></svg> },
  { key: "facebook", label: "Facebook", color: "#1877F2", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { key: "instagram", label: "Instagram", color: "#E1306C", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg> },
  { key: "discord", label: "Discord", color: "#5865F2", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> },
  { key: "telegram", label: "Telegram", color: "#26A5E4", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  { key: "whatsapp", label: "WhatsApp", color: "#25D366", icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
];

// Share with code modal
function ShareCodeModal({ referralCode, onClose }: { referralCode: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shortCode = referralCode ? `#${referralCode.slice(-4).toLowerCase()}` : "#------";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true); toast.success("Code copied!"); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-yellow-50 rounded-t-3xl w-full max-w-lg mx-auto shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={onClose}><X size={20} className="text-gray-700" /></button>
          <h3 className="font-black text-gray-900 text-base">Share with code</h3>
          <div className="w-6" />
        </div>

        {/* Hero */}
        <div className="bg-yellow-400 mx-4 rounded-2xl h-36 flex items-center justify-center mb-5 overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="200" height="80" viewBox="0 0 200 80" className="opacity-20">
              <text x="0" y="60" fontSize="72" fontWeight="900" fill="white" fontFamily="Arial">NOXYSTORE</text>
            </svg>
          </div>
          <div className="relative z-10 w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
        </div>

        {/* Code */}
        <div className="mx-4 flex gap-2 mb-5">
          <div className="flex-1 bg-white rounded-xl px-5 py-4 flex items-center justify-center">
            <span className="text-2xl font-black text-gray-900 font-mono">{shortCode}</span>
          </div>
          <button onClick={handleCopy} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-4 rounded-xl flex items-center gap-2 transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />} Copy
          </button>
        </div>

        {/* Instructions */}
        <div className="px-4 pb-8 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>1. Copy your code to share in-game or in other scenarios. Invitees can enter the code in the search box on the NoxyStore site to receive a coupon or points.</p>
          <p>2. New users using the code will receive a 5% coupon and be considered as your referral. All their orders completed within 30 days of their registration will earn you the commission. Existing users can receive point rewards but will not establish a referral relationship with you.</p>
          <p>3. Please note that you will bear one-fifth of the cost of the 5% coupon obtained by new users. The corresponding amount will be deducted when settling the order income using the coupon with you.</p>
        </div>
      </div>
    </div>
  );
}

// Income Details page (modal)
function IncomeDetailsModal({ onClose }: { onClose: () => void }) {
  const [incomeTab, setIncomeTab] = useState<"promote" | "invite" | "task">("promote");
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button onClick={onClose}><ArrowLeft size={20} className="text-gray-700" /></button>
        <h2 className="font-bold text-gray-900 flex-1 text-center">Affiliate Program</h2>
        <div className="w-6" />
      </div>
      <div className="flex border-b border-gray-100">
        {[
          { key: "promote", label: "Promote Income" },
          { key: "invite", label: "Invite Income" },
          { key: "task", label: "Task Reward" },
        ].map(t => (
          <button key={t.key} onClick={() => setIncomeTab(t.key as any)} className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ${incomeTab === t.key ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400"}`}>{t.label}</button>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 flex items-center justify-center mb-4 opacity-25">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <rect x="20" y="10" width="80" height="90" rx="8" fill="#9ca3af"/>
            <rect x="30" y="25" width="60" height="6" rx="3" fill="#d1d5db"/>
            <rect x="30" y="38" width="45" height="6" rx="3" fill="#d1d5db"/>
            <rect x="30" y="51" width="52" height="6" rx="3" fill="#d1d5db"/>
            <rect x="60" y="75" width="40" height="12" rx="4" fill="#6b7280" transform="rotate(-45 80 81)"/>
          </svg>
        </div>
        <p className="text-gray-400 font-medium">No income record yet</p>
      </div>
    </div>
  );
}

// Clients/Promoters modal
function ClientsModal({ tab, onClose }: { tab: "clients" | "promoters"; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(tab);
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button onClick={onClose}><ArrowLeft size={20} className="text-gray-700" /></button>
        <h2 className="font-bold text-gray-900 flex-1 text-center">Affiliate Program</h2>
        <div className="w-6" />
      </div>
      <div className="flex border-b border-gray-100">
        {[{ key: "clients", label: "My Clients" }, { key: "promoters", label: "My Promoters" }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === t.key ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400"}`}>{t.label}</button>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-6">
        <div className="w-24 h-24 flex items-center justify-center mb-4 opacity-25">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <rect x="20" y="10" width="80" height="90" rx="8" fill="#9ca3af"/>
            <rect x="30" y="25" width="60" height="6" rx="3" fill="#d1d5db"/>
            <rect x="30" y="38" width="45" height="6" rx="3" fill="#d1d5db"/>
            <rect x="60" y="75" width="40" height="12" rx="4" fill="#6b7280" transform="rotate(-45 80 81)"/>
          </svg>
        </div>
        <p className="text-gray-400 font-medium text-center">
          {activeTab === "clients" ? "Haven't shared your referral link yet?" : "Haven't invited promoters yet? Come and invite and get up to $100 income"}
        </p>
        <button onClick={onClose} className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 rounded-2xl">
          {activeTab === "clients" ? "Promote Now" : "Go Invite"}
        </button>
      </div>
    </div>
  );
}

export function AffiliatePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<AffiliateStep>("agreement");
  const [gameType, setGameType] = useState("Top Up");
  const [featuredGame, setFeaturedGame] = useState<typeof MOCK_GAMES[0] | null>(null);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [selectedSocials, setSelectedSocials] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [customLinks, setCustomLinks] = useState(["", "", ""]);
  const [shopName, setShopName] = useState("");
  const [shopTagline, setShopTagline] = useState("");
  const [shopLink, setShopLink] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [gameSearch, setGameSearch] = useState("");
  const [showGameSelectModal, setShowGameSelectModal] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [existingStore, setExistingStore] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [useCustomLink, setUseCustomLink] = useState(false);
  const [customLinkSlug, setCustomLinkSlug] = useState("");
  const [showShareCode, setShowShareCode] = useState(false);
  const [showIncomeDetails, setShowIncomeDetails] = useState(false);
  const [showClients, setShowClients] = useState<"clients" | "promoters" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [affiliatePromoTab, setAffiliatePromoTab] = useState<"promotion" | "growth">("promotion");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    checkExistingStore();
    loadReferralCode();
  }, [isAuthenticated]);

  const checkExistingStore = async () => {
    if (!user?.email) return;
    const { data } = await supabase.from("affiliate_stores").select("*").eq("user_email", user.email).single();
    if (data) { setExistingStore(data); setStep("myStore"); }
  };

  const loadReferralCode = async () => {
    if (!user?.email || !user?.id) return;
    const { data } = await supabase.from("referral_codes").select("*").eq("user_email", user.email).single();
    if (data) { setReferralCode(data.code); setShortCode(data.short_code); return; }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const seed = user.id.replace(/-/g, "").slice(0, 8);
    let code = "";
    for (let i = 0; i < 8; i++) { const idx = parseInt(seed[i] || "0", 16) % chars.length; code += chars[idx]; }
    const sc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let short = "";
    for (let i = 0; i < 6; i++) short += sc[Math.floor(Math.random() * sc.length)];
    const { data: created } = await supabase.from("referral_codes").insert({ user_id: user.id, user_email: user.email, code, short_code: short, users_invited: 0, orders_completed: 0, total_spending: 0 }).select().single();
    if (created) { setReferralCode(created.code); setShortCode(created.short_code); }
  };

  const filteredGames = MOCK_GAMES.filter(g => g.game_name.toLowerCase().includes(gameSearch.toLowerCase()) && (gameType === "All" || g.category === gameType));

  const handleShopNameChange = (name: string) => {
    setShopName(name);
    setShopLink(name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleCompleteSetup = async () => {
    if (!shopName || !shopLink) { toast.error("Shop name and link are required"); return; }
    setIsSaving(true);
    let avatarUrl = "";
    let bannerUrl = "";
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${user?.id}_${Date.now()}.${ext}`;
      const { data: up } = await supabase.storage.from("store-assets").upload(path, avatarFile, { upsert: true });
      if (up) { const { data: urlD } = supabase.storage.from("store-assets").getPublicUrl(path); avatarUrl = urlD.publicUrl; }
    }
    if (bannerFile) {
      const ext = bannerFile.name.split(".").pop();
      const path = `banners/${user?.id}_${Date.now()}.${ext}`;
      const { data: up } = await supabase.storage.from("store-assets").upload(path, bannerFile, { upsert: true });
      if (up) { const { data: urlD } = supabase.storage.from("store-assets").getPublicUrl(path); bannerUrl = urlD.publicUrl; }
    }
    const socialLinksData: Record<string, string> = { ...socialLinks };
    customLinks.filter(Boolean).forEach((l, i) => { socialLinksData[`custom_${i}`] = l; });
    const { data, error } = await supabase.from("affiliate_stores").upsert({
      user_id: user?.id, user_email: user?.email, store_name: shopName, store_link: shopLink, tagline: shopTagline, avatar_url: avatarUrl, banner_url: bannerUrl,
      featured_game_id: featuredGame?.game_id || "", game_ids: [featuredGame?.game_id || "", ...selectedGameIds].filter(Boolean), social_links: socialLinksData, game_type: gameType, is_active: true, updated_at: new Date().toISOString(),
    }).select().single();
    setIsSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    setExistingStore(data); toast.success("Your store is live!"); setStep("myStore");
  };

  const defaultLink = `https://noxystore.gg?share_token=${referralCode}&utm_source=copy&utm_campaign=p_affiliate`;
  const currentLink = useCustomLink && customLinkSlug ? `https://noxystore.gg/a/${customLinkSlug}` : defaultLink;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(currentLink);
    setCopiedLink(true); toast.success("Link copied!"); setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLink = (p: string) => {
    const enc = encodeURIComponent(`Join NoxyStore and earn rewards! ${currentLink}`);
    const urls: Record<string, string> = { twitter: `https://twitter.com/intent/tweet?text=${enc}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentLink)}`, whatsapp: `https://wa.me/?text=${enc}`, discord: "https://discord.com/channels/@me" };
    if (urls[p]) window.open(urls[p], "_blank");
  };

  const totalSteps = 9;
  const currentStepNum = ["agreement","gameType","selectFeatured","confirmFeatured","addMoreGames","selectSocials","addSocialLinks","shopDetails","preview"].indexOf(step) + 1;
  const ProgressBar = () => <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-6"><div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${(currentStepNum / totalSteps) * 100}%` }} /></div>;

  // ── MY STORE (Affiliate Program Dashboard) ────────────────────────────────
  if (step === "myStore" && existingStore) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <div className="hidden lg:block"><DesktopHeader /></div>
        <div className="lg:hidden"><Header showBack title="Affiliate Program" /></div>

        <div className="max-w-lg mx-auto px-0 lg:px-4 pt-0 lg:pt-4 pb-24">

          {/* Profile Header */}
          <div className="bg-white px-4 pt-4 pb-4 mb-2">
            <div className="flex items-center justify-between mb-3">
              <button className="text-orange-500 font-semibold text-sm">Announcement &gt;</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              {existingStore.avatar_url ? (
                <img src={existingStore.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-black">{existingStore.store_name[0]?.toUpperCase()}</div>
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900">{user?.nickname || "U" + user?.id?.slice(-10)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
                    Promotion Rookie
                  </span>
                </div>
              </div>
              <button onClick={() => navigate("/account")} className="text-gray-600 font-semibold text-sm flex items-center gap-1">Task Center <ChevronRight size={14} /></button>
            </div>

            {/* Income row */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <p className="text-orange-500 font-black text-2xl">$0.00</p>
                <div className="flex items-center gap-1">
                  <p className="text-gray-500 text-xs">Pending settlement amount</p>
                  <Info size={12} className="text-gray-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-orange-500 font-black text-2xl">$0.00</p>
                <p className="text-gray-500 text-xs">Cumulative Amount</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={() => setShowIncomeDetails(true)} className="flex-1 border border-gray-300 rounded-xl py-2.5 font-semibold text-gray-700 text-sm">Income Details</button>
              <button onClick={() => toast.info("Withdrawal feature coming soon")} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl py-2.5 text-sm">Withdraw</button>
            </div>
          </div>

          {/* Promotion Center / Growth Center tabs */}
          <div className="bg-white flex border-b border-gray-100 mb-2">
            {[{ key: "promotion", label: "Promotion Center" }, { key: "growth", label: "Growth Center" }].map(t => (
              <button key={t.key} onClick={() => setAffiliatePromoTab(t.key as any)} className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ${affiliatePromoTab === t.key ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400"}`}>{t.label}</button>
            ))}
          </div>

          {affiliatePromoTab === "promotion" && (
            <div className="space-y-2">
              {/* My Clients / My Promoters */}
              <div className="bg-white px-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setShowClients("clients")} className="flex items-center gap-3 p-3 border border-gray-100 rounded-2xl hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-500 text-xs">My Clients</p>
                      <p className="font-black text-gray-900 text-xl">{existingStore.orders_30d || 0} <span className="text-gray-400 text-sm font-normal ml-1">&gt;</span></p>
                    </div>
                  </button>
                  <button onClick={() => setShowClients("promoters")} className="flex items-center gap-3 p-3 border border-gray-100 rounded-2xl hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-500 text-xs">My Promoters</p>
                      <p className="font-black text-gray-900 text-xl">0 <span className="text-gray-400 text-sm font-normal ml-1">&gt;</span></p>
                    </div>
                  </button>
                </div>
              </div>

              {/* My promotion link */}
              <div className="bg-white px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.56 3.42C1.5 2.18 2.43 1 3.67.97h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.61a16 16 0 0 0 6.29 6.29l1-1 a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <p className="font-bold text-gray-900 text-sm">My promotion link</p>
                  </div>
                  <button onClick={() => setShowShareCode(true)} className="text-orange-500 font-semibold text-sm flex items-center gap-1">Share with code &gt;</button>
                </div>
                <p className="text-xs text-gray-400 mb-2">Default Link</p>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-500 font-mono truncate">{defaultLink}</div>
                  <button onClick={handleCopyLink} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm whitespace-nowrap transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <button onClick={() => setUseCustomLink(!useCustomLink)} className="flex items-center gap-1.5 text-sm text-blue-500 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Customized link
                </button>
                {useCustomLink && (
                  <div className="mt-2 flex gap-2">
                    <div className="flex bg-gray-100 rounded-xl overflow-hidden flex-1">
                      <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-200 whitespace-nowrap">noxystore.gg/a/</span>
                      <input type="text" value={customLinkSlug} onChange={(e) => setCustomLinkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="your-link" className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-700 outline-none" />
                    </div>
                    <button onClick={() => toast.success("Custom link saved!")} className="bg-yellow-400 text-black font-bold px-3 py-2.5 rounded-xl text-sm">Save</button>
                  </div>
                )}
              </div>

              {/* My Store */}
              <div className="bg-white px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <p className="font-bold text-gray-900 text-sm">My Store</p>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-500 font-mono truncate">https://noxystore.gg/shop/{existingStore.store_link}</div>
                  <button onClick={() => navigate(`/shop/${existingStore.store_link}`)} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm whitespace-nowrap transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Visit
                  </button>
                </div>
                <button onClick={() => navigate(`/shop/${existingStore.store_link}`)} className="w-full flex items-center justify-between py-2 text-sm text-gray-700 font-medium hover:text-gray-900">
                  Manage My Store <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Invite to Earn More */}
              <div className="bg-white px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700"><polyline points="9 18 15 12 9 6"/></svg>
                    <p className="font-bold text-gray-900 text-sm">Invite to Earn More</p>
                  </div>
                  <button className="text-blue-500 font-semibold text-sm">Rules</button>
                </div>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                  Invite Other Promoters, Earned <span className="text-orange-500 font-bold">1%</span> of promoter order income, <span className="text-orange-500 font-bold">up to $100</span>.
                </p>

                {/* Diagram */}
                <div className="bg-orange-50 rounded-2xl p-4 mb-4">
                  <div className="flex flex-col items-center">
                    {/* Inviter at top */}
                    <div className="bg-orange-400 text-white rounded-full px-4 py-2 text-xs font-bold mb-2 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7"/></svg>
                      Inviter
                    </div>
                    {/* Arrow + income badge */}
                    <div className="relative flex flex-col items-center mb-2">
                      <div className="absolute -right-12 top-0 bg-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded">1% income</div>
                      <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-orange-400 mb-1" />
                    </div>
                    {/* New Affiliate center */}
                    <div className="bg-orange-400 text-white rounded-full px-4 py-2 text-xs font-bold mb-2 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
                      New Affiliate
                    </div>
                    {/* Bottom users */}
                    <div className="flex gap-6 mt-2">
                      <div className="text-center"><div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center mx-auto mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg></div><p className="text-xs text-gray-500">Coins buyer</p></div>
                      <div className="text-center"><div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center mx-auto mb-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg></div><p className="text-xs text-gray-500">Top-up user</p></div>
                    </div>
                  </div>
                </div>

                {/* Share socials */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  {[
                    { key: "twitter", label: "X", bg: "#000", icon: <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.257 5.629L18.244 2.25z"/></svg> },
                    { key: "facebook", label: "Facebook", bg: "#1877F2", icon: <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                    { key: "whatsapp", label: "WhatsApp", bg: "#25D366", icon: <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
                    { key: "discord", label: "Discord", bg: "#5865F2", icon: <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> },
                  ].map(p => (
                    <button key={p.key} onClick={() => handleShareLink(p.key)} className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform" style={{ backgroundColor: p.bg }}>{p.icon}</div>
                      <span className="text-xs text-gray-600 font-medium">{p.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-500 font-mono truncate">https://noxystore.gg/affiliate/guid?ref={referralCode?.slice(0, 8)}</div>
                  <button onClick={handleCopyLink} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm whitespace-nowrap transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    Copy Link
                  </button>
                </div>

                {/* Top earner banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black text-sm flex-shrink-0">1</div>
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-xs">U</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-mono">1***0</p>
                    <p className="text-sm">Earned <span className="text-orange-500 font-black">$1494</span> This Week</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {affiliatePromoTab === "growth" && (
            <div className="bg-white px-4 py-6 text-center">
              <div className="w-24 h-24 flex items-center justify-center mb-4 opacity-25 mx-auto">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <rect x="20" y="10" width="80" height="90" rx="8" fill="#9ca3af"/>
                  <rect x="30" y="25" width="60" height="6" rx="3" fill="#d1d5db"/>
                  <rect x="30" y="38" width="45" height="6" rx="3" fill="#d1d5db"/>
                </svg>
              </div>
              <p className="text-gray-400 font-medium">Growth Center coming soon</p>
            </div>
          )}
        </div>

        <div className="lg:hidden"><BottomNav /></div>

        {showShareCode && <ShareCodeModal referralCode={referralCode} onClose={() => setShowShareCode(false)} />}
        {showIncomeDetails && <IncomeDetailsModal onClose={() => setShowIncomeDetails(false)} />}
        {showClients && <ClientsModal tab={showClients} onClose={() => setShowClients(null)} />}
      </div>
    );
  }

  // ── SETUP WIZARD ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="hidden lg:block"><DesktopHeader /></div>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {step !== "agreement" && (
          <button onClick={() => {
            const steps: AffiliateStep[] = ["agreement","gameType","selectFeatured","confirmFeatured","addMoreGames","selectSocials","addSocialLinks","shopDetails","preview"];
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }} className="flex items-center gap-2 text-gray-600 mb-4 text-sm font-medium">
            <ArrowLeft size={16} /> Back
          </button>
        )}

        {/* AGREEMENT */}
        {step === "agreement" && (
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">Traffic Alliance Agreement</h1>
            <hr className="border-gray-200 mb-4" />
            <div className="space-y-6 text-gray-700 text-sm leading-relaxed overflow-y-auto max-h-[65vh] pr-2">
              <div><h2 className="text-lg font-bold text-gray-900 mb-2">1. Introduction</h2><p>This Traffic Alliance Agreement is between you ("Partner") and NoxyStore ("Platform"). It sets out terms for the Traffic Alliance Program, allowing Partners to earn commissions by promoting NoxyStore products and services through their unique store link and referral code.</p></div>
              <div><h2 className="text-lg font-bold text-gray-900 mb-2">2. Advertising Campaign Opportunities</h2><p>NoxyStore will propose and set up advertising campaign opportunities for Partners ("Campaigns") and invite Partners to participate. Each Campaign's details will be communicated via the Platform's messaging system or email.</p></div>
              <div><h2 className="text-lg font-bold text-gray-900 mb-2">3. Commission Structure</h2><p>Partners earn commissions based on completed orders made through their unique store link. Commission rates range from 5% to 10% depending on the product category and Partner tier. Commissions are credited to your NoxyStore balance within 7 business days after order completion.</p></div>
              <div><h2 className="text-lg font-bold text-gray-900 mb-2">4. Partner Obligations</h2><p>Partners agree to promote NoxyStore products truthfully and in compliance with applicable laws. Partners must not engage in fraudulent activities, spam, or misleading advertising. NoxyStore reserves the right to terminate the Partnership and withhold commissions for policy violations.</p></div>
              <div><h2 className="text-lg font-bold text-gray-900 mb-2">5. Intellectual Property</h2><p>Partners are granted a limited, non-exclusive license to use NoxyStore branding materials solely for the purpose of promoting the Platform under this Agreement.</p></div>
            </div>
            <button onClick={() => setStep("gameType")} className="w-full mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl text-base transition-colors">Agree to the agreement and activate</button>
          </div>
        )}

        {/* GAME TYPE */}
        {step === "gameType" && (
          <div>
            <ProgressBar />
            <h1 className="text-2xl font-black text-gray-900 mb-1 text-center">Select Game Type</h1>
            <p className="text-gray-500 text-center text-sm mb-6">Choose the type of games you want to sell</p>
            <div className="grid grid-cols-2 gap-3">
              {GAME_TYPES.map(type => (
                <button key={type.key} onClick={() => { setGameType(type.key); setStep("selectFeatured"); }} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 bg-gradient-to-br ${type.bg} ${type.border} hover:scale-105 transition-transform`}>
                  {type.icon}
                  <span className="font-bold text-gray-900 text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SELECT FEATURED */}
        {step === "selectFeatured" && (
          <div>
            <ProgressBar />
            <h1 className="text-xl font-black text-gray-900 mb-1 text-center">What products do you want to sell most?</h1>
            <p className="text-gray-500 text-center text-sm mb-4">Please select a featured game</p>
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mb-4">
              <Search size={16} className="text-gray-400" />
              <input type="text" value={gameSearch} onChange={(e) => setGameSearch(e.target.value)} placeholder="Search Games" className="flex-1 bg-transparent text-sm text-gray-700 outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {filteredGames.map(game => (
                <button key={game.game_id} onClick={() => { setFeaturedGame(game); setStep("confirmFeatured"); }} className="flex flex-col items-center gap-1">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                    {game.discount ? <span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">-{game.discount}%</span> : null}
                    <img src={game.game_image} alt={game.game_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop"; }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 text-center leading-tight">{game.game_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONFIRM FEATURED */}
        {step === "confirmFeatured" && featuredGame && (
          <div>
            <ProgressBar />
            <h1 className="text-xl font-black text-gray-900 mb-1 text-center">Confirm the priority game</h1>
            <p className="text-gray-500 text-center text-sm mb-6">You can change this anytime.</p>
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Featured Game</h3>
                <div className="flex items-center gap-3">
                  <img src={featuredGame.game_image} alt={featuredGame.game_name} className="w-20 h-20 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop"; }} />
                  <div>
                    <p className="font-bold text-gray-900">{featuredGame.game_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded">{featuredGame.rating}</span>
                      <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= Math.floor(featuredGame.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />)}</div>
                    </div>
                    {featuredGame.discount ? <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block">-{featuredGame.discount}%</span> : null}
                  </div>
                </div>
              </div>
              <div><h3 className="font-bold text-gray-900 mb-2">Guarantees</h3>{["24/7 Availability","24/7 Customer Support","Full Refund Guarantee"].map(g => <p key={g} className="flex items-center gap-2 text-sm text-gray-600 mb-1"><span className="text-gray-400">·</span>{g}</p>)}</div>
              <div><h3 className="font-bold text-gray-900 mb-2">Reputation</h3><p className="text-sm text-gray-600">{featuredGame.sold_count} Sold</p></div>
              <div><h3 className="font-bold text-gray-900 mb-2">Commission</h3><span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">Up to 10%</span></div>
            </div>
            <button onClick={() => setStep("addMoreGames")} className="w-full mt-8 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl text-base transition-colors">Continue</button>
          </div>
        )}

        {/* ADD MORE GAMES */}
        {step === "addMoreGames" && (
          <div>
            <ProgressBar />
            <h1 className="text-xl font-black text-gray-900 mb-1 text-center">Besides {featuredGame?.game_name || "your featured game"}, what other games would you like to sell?</h1>
            <div className="mt-5 space-y-3 mb-4">
              {selectedGameIds.map(id => {
                const game = MOCK_GAMES.find(g => g.game_id === id);
                if (!game) return null;
                return (
                  <div key={id} className="flex items-center gap-3 border border-gray-200 rounded-2xl p-4">
                    <img src={game.game_image} alt={game.game_name} className="w-16 h-16 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=64&h=64&fit=crop"; }} />
                    <div className="flex-1"><p className="font-bold text-gray-900">{game.game_name}</p><div className="flex items-center gap-2 mt-1"><Star size={11} className="text-yellow-400 fill-yellow-400" /><span className="text-orange-500 font-bold text-sm">{game.rating}</span><span className="text-gray-400 text-xs">| {game.sold_count}</span></div><span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block">{game.category}</span></div>
                    {game.discount ? <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">-{game.discount}%</span> : null}
                    <button onClick={() => setSelectedGameIds(ids => ids.filter(i => i !== id))} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 3 - selectedGameIds.length) }).map((_, i) => (
                <button key={i} onClick={() => { setTempSelectedIds(selectedGameIds); setShowGameSelectModal(true); }} className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-4 text-gray-400 hover:border-yellow-400 hover:text-yellow-500 transition-colors">
                  <Plus size={20} /><span className="font-semibold">Add Games</span>
                </button>
              ))}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 border-dashed rounded-2xl p-4 flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg></div>
              <div className="flex-1"><p className="font-bold text-gray-900 text-sm">Add popular products to boost revenue</p><p className="text-gray-500 text-xs mt-0.5">Popular Gift Cards and Game keys added</p></div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <button onClick={() => setStep("selectSocials")} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl text-base transition-colors">Continue</button>
          </div>
        )}

        {/* SELECT SOCIALS */}
        {step === "selectSocials" && (
          <div>
            <ProgressBar />
            <h1 className="text-xl font-black text-gray-900 mb-1 text-center">Feature your socials in your shop</h1>
            <p className="text-gray-500 text-center text-sm mb-6">Turn influence into revenue and grow every channel while you sell</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {SOCIALS.map(s => (
                <button key={s.key} onClick={() => setSelectedSocials(prev => prev.includes(s.key) ? prev.filter(k => k !== s.key) : [...prev, s.key])} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedSocials.includes(s.key) ? "border-yellow-400 bg-yellow-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color }}>{s.icon}</div>
                  <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                  {selectedSocials.includes(s.key) && <Check size={14} className="text-yellow-500" />}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(selectedSocials.length > 0 ? "addSocialLinks" : "shopDetails")} className={`w-full py-4 rounded-2xl text-base font-bold transition-colors ${selectedSocials.length > 0 ? "bg-yellow-400 hover:bg-yellow-300 text-black" : "bg-gray-100 text-gray-400"}`}>Continue</button>
          </div>
        )}

        {/* ADD SOCIAL LINKS */}
        {step === "addSocialLinks" && (
          <div>
            <ProgressBar />
            <h1 className="text-xl font-black text-gray-900 mb-1 text-center">Add social links to display your accounts and follower counts in your shop.</h1>
            <p className="text-gray-500 text-center text-sm mb-5">This can be disabled at any time</p>
            {selectedSocials.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-bold text-gray-700 mb-2"><span className="text-red-500">*</span> Social Media</p>
                {selectedSocials.map(key => {
                  const social = SOCIALS.find(s => s.key === key);
                  if (!social) return null;
                  const prefix = key === "youtube" ? "https://youtube.com/@" : key === "twitter" ? "https://x.com/" : key === "instagram" ? "https://instagram.com/" : key === "facebook" ? "https://facebook.com/" : key === "discord" ? "https://discord.gg/" : key === "twitch" ? "https://twitch.tv/" : key === "tiktok" ? "https://tiktok.com/@" : key === "telegram" ? "https://t.me/" : "https://wa.me/";
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl p-4 mb-3">
                      <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: social.color }}><div className="scale-[0.4]">{social.icon}</div></div><span className="font-semibold text-gray-800 text-sm">{social.label}</span></div>
                      <div className="flex bg-gray-100 rounded-xl overflow-hidden"><span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-200 whitespace-nowrap">{prefix}</span><input type="text" value={socialLinks[key] || ""} onChange={(e) => setSocialLinks(p => ({ ...p, [key]: e.target.value }))} placeholder="username" className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-700 outline-none" /></div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-sm font-bold text-gray-700 mb-2">Custom Link</p>
            {customLinks.map((link, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div><span className="font-semibold text-gray-800 text-sm">Custom Link</span></div>
                <div className="flex bg-gray-100 rounded-xl overflow-hidden"><span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-200 whitespace-nowrap">https://</span><input type="text" value={link} onChange={(e) => setCustomLinks(p => { const n = [...p]; n[i] = e.target.value; return n; })} placeholder="www.example.com" className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-700 outline-none" /></div>
              </div>
            ))}
            <button onClick={() => setStep("shopDetails")} className="w-full mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl text-base transition-colors">Continue</button>
          </div>
        )}

        {/* SHOP DETAILS */}
        {step === "shopDetails" && (
          <div>
            <ProgressBar />
            <h1 className="text-xl font-black text-gray-900 mb-1 text-center">Add Shop Details</h1>
            <p className="text-gray-500 text-center text-sm mb-5">Final step — almost done!</p>
            <p className="text-sm font-bold text-gray-700 mb-2"><span className="text-red-500">*</span> Shop Avatar</p>
            <div className="flex flex-col items-center mb-5">
              <label className="cursor-pointer">
                <div className={`w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:border-yellow-400 transition-colors overflow-hidden ${avatarPreview ? "border-solid border-yellow-400" : ""}`}>
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" /> : <Plus size={28} className="text-gray-400" />}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setAvatarFile(f); const r = new FileReader(); r.onload = (ev) => setAvatarPreview(ev.target?.result as string); r.readAsDataURL(f); }} />
              </label>
              <p className="text-xs text-gray-400 mt-2">Avatar ratio: 1:1 (recommended 300×300px)</p>
            </div>
            <p className="text-sm font-bold text-gray-700 mb-2"><span className="text-red-500">*</span> Shop Name</p>
            <input type="text" value={shopName} onChange={(e) => handleShopNameChange(e.target.value)} placeholder="Please enter a shop name" className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 ring-yellow-400 mb-4" />
            <p className="text-sm font-bold text-gray-700 mb-2"><span className="text-red-500">*</span> Shop Tagline</p>
            <input type="text" value={shopTagline} onChange={(e) => setShopTagline(e.target.value)} placeholder="Please enter a shop tagline" className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 ring-yellow-400 mb-4" />
            <p className="text-sm font-bold text-gray-700 mb-2"><span className="text-red-500">*</span> Shop Link</p>
            <div className="flex bg-gray-100 rounded-xl overflow-hidden mb-4"><span className="px-3 py-3 text-xs text-gray-400 bg-gray-200 whitespace-nowrap">https://noxystore.gg/shop/</span><input type="text" value={shopLink} onChange={(e) => setShopLink(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} placeholder="your-shop-name" className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-700 outline-none" /></div>
            <p className="text-sm font-bold text-gray-700 mb-1">Shop Banner</p>
            <p className="text-xs text-gray-400 mb-2">Recommended size: 1440 × 560 px</p>
            <label className="cursor-pointer block">
              <div className={`w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 hover:border-yellow-400 transition-colors overflow-hidden mb-5 ${bannerPreview ? "border-solid border-yellow-400" : ""}`}>
                {bannerPreview ? <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" /> : <div className="text-center"><Plus size={24} className="text-gray-400 mx-auto" /><span className="text-xs text-gray-400 mt-1 block">Upload Banner</span></div>}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setBannerFile(f); const r = new FileReader(); r.onload = (ev) => setBannerPreview(ev.target?.result as string); r.readAsDataURL(f); }} />
            </label>
            <button onClick={() => setStep("preview")} disabled={!shopName || !shopLink} className={`w-full py-4 rounded-2xl text-base font-bold transition-colors ${shopName && shopLink ? "bg-yellow-400 hover:bg-yellow-300 text-black" : "bg-gray-200 text-gray-400"}`}>Continue</button>
          </div>
        )}

        {/* PREVIEW */}
        {step === "preview" && (
          <div>
            <ProgressBar />
            <h1 className="text-xl font-black text-gray-900 text-center mb-4">Looks good!</h1>
            <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
              <div className="relative h-32 bg-gradient-to-br from-purple-700 to-blue-700">
                {bannerPreview && <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />}
                <div className="absolute bottom-0 left-4 translate-y-1/2">
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-16 h-16 rounded-full border-4 border-white object-cover" /> : <div className="w-16 h-16 rounded-full border-4 border-white bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-black">{shopName[0]?.toUpperCase() || "S"}</div>}
                </div>
              </div>
              <div className="pt-10 px-4 pb-3">
                <p className="font-black text-gray-900 text-base">{shopName || "My Store"}</p>
                <div className="flex items-center gap-3 mt-2">
                  {selectedSocials.slice(0, 3).map(key => { const s = SOCIALS.find(s => s.key === key); return s ? <div key={key} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: s.color }}><div className="scale-[0.5]">{s.icon}</div></div> : null; })}
                </div>
              </div>
              <div className="px-4 pb-4">
                <p className="font-bold text-gray-900 mb-2 text-sm">Best Sellers</p>
                <div className="grid grid-cols-3 gap-2">
                  {[featuredGame, ...MOCK_GAMES.filter(g => selectedGameIds.includes(g.game_id))].filter(Boolean).slice(0, 3).map(game => game && (
                    <div key={game.game_id} className="relative">
                      {game.discount ? <span className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded z-10">-{game.discount}%</span> : null}
                      <img src={game.game_image} alt={game.game_name} className="w-full aspect-square rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop"; }} />
                      <p className="text-[10px] font-semibold text-gray-800 mt-1 truncate">{game.game_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleCompleteSetup} disabled={isSaving} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl text-base transition-colors disabled:opacity-50">{isSaving ? "Creating Store..." : "Complete Setup"}</button>
          </div>
        )}
      </div>

      {/* Game select modal */}
      {showGameSelectModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowGameSelectModal(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={() => setShowGameSelectModal(false)}><X size={20} className="text-gray-700" /></button>
              <h3 className="font-black text-gray-900">Select Games</h3>
              <div className="w-6" />
            </div>
            <div className="px-4 py-3 border-b border-gray-100"><div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2"><Search size={16} className="text-gray-400" /><input type="text" value={gameSearch} onChange={(e) => setGameSearch(e.target.value)} placeholder="Search Games" className="flex-1 bg-transparent text-sm text-gray-700 outline-none" /></div></div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {MOCK_GAMES.filter(g => g.game_name.toLowerCase().includes(gameSearch.toLowerCase())).map(game => {
                const selected = tempSelectedIds.includes(game.game_id);
                return (
                  <button key={game.game_id} onClick={() => setTempSelectedIds(prev => prev.includes(game.game_id) ? prev.filter(id => id !== game.game_id) : [...prev, game.game_id])} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? "bg-yellow-400 border-yellow-400" : "border-gray-300"}`}>{selected && <Check size={12} className="text-black" />}</div>
                    <img src={game.game_image} alt={game.game_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=48&h=48&fit=crop"; }} />
                    <span className="font-semibold text-gray-900">{game.game_name}</span>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-4 border-t border-gray-100">
              <button onClick={() => { setSelectedGameIds(tempSelectedIds); setShowGameSelectModal(false); }} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl">Add ({tempSelectedIds.length})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
