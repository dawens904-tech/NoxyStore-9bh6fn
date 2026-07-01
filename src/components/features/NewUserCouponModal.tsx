import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import couponChest from "@/assets/coupon-chest.png";
import coupon10off from "@/assets/coupon-10off.png";
import coupon6off from "@/assets/coupon-6off.png";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ── localStorage keys ────────────────────────────────────────────────────────
const MODAL_FIRST_SHOWN_KEY = "noxy_coupon_first_shown";   // timestamp of first display
const MODAL_DISMISSED_KEY   = "noxy_coupon_dismissed_at";  // timestamp of last dismiss
const MODAL_CLAIMED_KEY     = "noxy_coupon_claimed";       // "true" once user claimed

const CYCLE_MS    = 14 * 24 * 60 * 60 * 1000; // 14-day visibility window
const COOLDOWN_MS =  1 * 60 * 60 * 1000;      // 1-hour cooldown after dismiss

// ── Helpers ──────────────────────────────────────────────────────────────────
function getCountdownToMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { h, m, s };
}

/** Days remaining in the current 14-day cycle */
function daysRemaining(firstShownAt: number): number {
  const elapsed = Date.now() - firstShownAt;
  const remaining = CYCLE_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

// ── Issue coupons for a freshly-registered user ──────────────────────────────
async function issueNewUserCoupons(email: string): Promise<boolean> {
  // Check if this is a "new" account — registered within the last 30 days
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  const isNewAccount = (Date.now() - createdAt) < 30 * 24 * 60 * 60 * 1000;
  if (!isNewAccount) return false;

  // Check if coupons already exist for this user
  const { data: existing } = await supabase
    .from("user_coupons")
    .select("id")
    .eq("user_email", email)
    .in("code", ["WELCOME10", "WELCOME6"]);

  if (existing && existing.length > 0) return false; // already issued

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("user_coupons").insert([
    {
      user_id: user.id,
      user_email: email,
      code: "WELCOME10",
      type: "percent",
      discount_value: 10,
      max_discount: 10,
      min_order: 0.01,
      description: "New User 10% OFF Coupon",
      is_used: false,
      expires_at: expiresAt,
    },
    {
      user_id: user.id,
      user_email: email,
      code: "WELCOME6",
      type: "percent",
      discount_value: 6,
      max_discount: 6,
      min_order: 0.01,
      description: "New User 6% OFF Coupon",
      is_used: false,
      expires_at: expiresAt,
    },
  ]);

  return !error;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface NewUserCouponModalProps {
  isAuthenticated: boolean;
}

export function NewUserCouponModal({ isAuthenticated }: NewUserCouponModalProps) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(getCountdownToMidnight());
  const [daysLeft, setDaysLeft] = useState(14);
  const [isIssuing, setIsIssuing] = useState(false);

  // ── Decide whether to show the modal ──────────────────────────────────────
  useEffect(() => {
    // Never show to logged-in users (they already have or can get coupons via their account)
    if (isAuthenticated) return;

    // Already claimed during this session
    if (localStorage.getItem(MODAL_CLAIMED_KEY) === "true") return;

    const now = Date.now();
    const firstShown = parseInt(localStorage.getItem(MODAL_FIRST_SHOWN_KEY) || "0", 10);
    const dismissedAt = parseInt(localStorage.getItem(MODAL_DISMISSED_KEY) || "0", 10);

    if (firstShown) {
      const cycleElapsed = now - firstShown;

      if (cycleElapsed >= CYCLE_MS) {
        // 14-day cycle complete — reset for a new cycle
        localStorage.removeItem(MODAL_FIRST_SHOWN_KEY);
        localStorage.removeItem(MODAL_DISMISSED_KEY);
        // Fall through — will show after delay
      } else {
        // Within the 14-day window
        const days = daysRemaining(firstShown);
        setDaysLeft(days);

        if (dismissedAt && (now - dismissedAt) < COOLDOWN_MS) {
          // Dismissed within the last hour — respect cooldown
          return;
        }
        // Cooldown passed or never dismissed — show again
      }
    }

    const timer = setTimeout(() => {
      setShow(true);
      if (!localStorage.getItem(MODAL_FIRST_SHOWN_KEY)) {
        localStorage.setItem(MODAL_FIRST_SHOWN_KEY, String(Date.now()));
        setDaysLeft(14);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // ── Issue coupons when user just logged in after clicking Collect ─────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const shouldIssue = sessionStorage.getItem("noxy_pending_coupon_issue");
    if (shouldIssue !== "true") return;

    sessionStorage.removeItem("noxy_pending_coupon_issue");

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user?.email) return;
      setIsIssuing(true);
      const issued = await issueNewUserCoupons(user.email);
      setIsIssuing(false);
      if (issued) {
        localStorage.setItem(MODAL_CLAIMED_KEY, "true");
        toast.success("🎉 Coupons added to your account! Check My Coupons.", {
          duration: 5000,
          action: { label: "View", onClick: () => navigate("/coupons") },
        });
      }
    });
  }, [isAuthenticated]);

  // ── Midnight countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : getCountdownToMidnight()));
    }, 1000);
    return () => clearInterval(interval);
  }, [show]);

  const dismiss = useCallback(() => {
    localStorage.setItem(MODAL_DISMISSED_KEY, String(Date.now()));
    setShow(false);
  }, []);

  const handleCollect = () => {
    // Mark that we want to issue coupons after login
    sessionStorage.setItem("noxy_pending_coupon_issue", "true");
    dismiss();
    navigate("/login");
  };

  if (!show || isAuthenticated) return null;

  const { h, m, s } = formatTime(countdown);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xs mx-5">
        {/* Chest image floating at top-right */}
        <div className="absolute -top-16 -right-2 w-32 h-28 pointer-events-none z-20">
          <img
            src={couponChest}
            alt="Reward chest"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>

        {/* Main card */}
        <div className="bg-[#FEF3C7] overflow-hidden shadow-2xl">
          {/* Days remaining banner */}
          <div className="bg-orange-500 text-white text-center py-1.5 text-xs font-bold tracking-wide">
            🎁 EXCLUSIVE NEW USER OFFER — {daysLeft} DAYS LEFT
          </div>

          {/* Coupons */}
          <div className="px-3 pt-3 space-y-2 pb-3">
            {/* 10% Coupon */}
            <div className="bg-white overflow-hidden shadow-sm border border-yellow-100">
              <div className="flex items-center gap-3 p-3">
                <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-orange-50 flex items-center justify-center">
                  <img
                    src={coupon10off}
                    alt="10% OFF"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-orange-500 font-black text-base leading-none">
                    10% OFF{" "}
                    <span className="text-xs font-semibold text-gray-500">(Max: $10)</span>
                  </p>
                  <p className="text-gray-500 text-[11px] mt-0.5">Valid for orders over $0.01</p>
                  <p className="text-gray-900 font-bold text-xs mt-0.5 truncate">
                    New User 10% OFF Coupon
                  </p>
                </div>
              </div>
              <div className="border-t border-dashed border-yellow-200 mx-3" />
              <div className="px-3 py-2 flex items-center justify-between bg-yellow-50/50">
                <p className="text-gray-400 text-xs">Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</p>
                <div className="w-5 h-5 bg-[#FEF3C7] border border-yellow-200" />
              </div>
            </div>

            {/* 6% Coupon */}
            <div className="bg-white overflow-hidden shadow-sm border border-yellow-100">
              <div className="flex items-center gap-3 p-3">
                <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-yellow-50 flex items-center justify-center">
                  <img
                    src={coupon6off}
                    alt="6% OFF"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-orange-500 font-black text-base leading-none">
                    6% OFF{" "}
                    <span className="text-xs font-semibold text-gray-500">(Max: $6)</span>
                  </p>
                  <p className="text-gray-500 text-[11px] mt-0.5">Valid for orders over $0.01</p>
                  <p className="text-gray-900 font-bold text-xs mt-0.5 truncate">
                    New User 6% OFF Coupon
                  </p>
                </div>
              </div>
              <div className="border-t border-dashed border-yellow-200 mx-3" />
              <div className="px-3 py-2 flex items-center justify-between bg-yellow-50/50">
                <p className="text-gray-400 text-xs">Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</p>
                <div className="w-5 h-5 bg-[#FEF3C7] border border-yellow-200" />
              </div>
            </div>
          </div>

          {/* Midnight countdown */}
          <div className="flex items-center justify-center gap-2 py-2.5 bg-white/60">
            <span className="text-gray-600 text-xs font-medium">Ends tonight in</span>
            {[
              { val: String(h).padStart(2, "0") },
              { val: String(m).padStart(2, "0") },
              { val: String(s).padStart(2, "0") },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {idx > 0 && <span className="text-gray-700 font-bold text-base">:</span>}
                <div className="bg-gray-900 text-white font-black text-base w-9 h-8 flex items-center justify-center tabular-nums">
                  {item.val}
                </div>
              </div>
            ))}
          </div>

          {/* Sign up hint */}
          <p className="text-center text-gray-600 text-xs py-1.5 font-medium">
            New accounts only · Sign up to claim
          </p>

          {/* CTA */}
          <button
            onClick={handleCollect}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-sm py-4 transition-colors flex items-center justify-center gap-2"
            style={{ borderRadius: 0 }}
          >
            COLLECT COUPON
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/20 border-2 border-white/40 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
