import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle, XCircle, Loader2, Edit2, Shield,
  ChevronRight, X, Plus, HelpCircle, Minus, CreditCard,
  Smartphone, Wallet as WalletIcon2, Tag, Gift as GiftLucide,
} from "lucide-react";
import { lootbarApi } from "@/lib/lootbar-api";
import { useAuthStore } from "@/stores/authStore";
import type { SkuItem, LootbarGame, Order } from "@/types";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

type CheckoutState = "review" | "processing" | "success" | "failed";

// ─── Device detection ────────────────────────────────────────────────────────
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);

// ─── Haiti detection (timezone-based) ────────────────────────────────────────
const isHaiti = (() => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === "America/Port-au-Prince";
  } catch {
    return false;
  }
})();

// ─── Logo components ──────────────────────────────────────────────────────────
const PayCard = ({ src, alt, w = "w-12" }: { src: string; alt: string; w?: string }) => (
  <img src={src} alt={alt} className={`${w} h-8 object-contain rounded`}
    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
);

const ApplePayBadge = () => (
  <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1 rounded-md">
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white flex-shrink-0">
      <path d="M17.7 9.7c-.1-1.5 1.2-2.2 1.3-2.3-1.4-2-3.5-1.7-4.3-1.7-1.8 0-3.6 1.1-4 2.2-.4 1-.1 2.4.7 3.8.6.8 1.3 1.8 2.3 1.8.9 0 1.3-.6 2.4-.6 1.1 0 1.4.6 2.3.6 1 0 1.6-.9 2.2-1.7.7-1 .9-2 .9-2-.1 0-1.8-.7-1.8-2.1zm-2.1-3.8c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.2.7-2.9 1.5-.7.8-1.2 2-1 3.2 1.1.1 2.1-.5 2.8-1.4z"/>
    </svg>
    <span className="text-sm font-semibold">Pay</span>
  </div>
);

const GooglePayBadge = () => (
  <div className="flex items-center gap-1 border border-gray-300 px-3 py-1 rounded-md bg-white">
    <span className="text-sm font-bold">
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
      <span className="text-[#5F6368] ml-0.5">Pay</span>
    </span>
  </div>
);

const MoncashBadge = () => (
  <div className="flex items-center gap-1.5">
    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">M</div>
    <span className="text-sm font-bold text-gray-800">MonCash</span>
  </div>
);

const NatcashBadge = () => (
  <div className="flex items-center gap-1.5">
    <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-black text-xs flex-shrink-0">N</div>
    <span className="text-sm font-bold text-gray-800">NatCash</span>
  </div>
);

// ─── Haiti Payment Modal ──────────────────────────────────────────────────────
function HaitiPaymentModal({
  selectedMethod,
  onClose,
  onContinue,
  isProcessing,
}: {
  selectedMethod: "moncash" | "natcash";
  onClose: () => void;
  onContinue: (method: "moncash" | "natcash", phone: string) => void;
  isProcessing: boolean;
}) {
  const [phone, setPhone] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 ${selectedMethod === "moncash" ? "bg-red-600" : "bg-blue-700"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xl">
                {selectedMethod === "moncash" ? "M" : "N"}
              </div>
              <div>
                <h3 className="text-white font-black text-lg">
                  {selectedMethod === "moncash" ? "MonCash" : "NatCash"}
                </h3>
                <p className="text-white/80 text-xs">Haiti Local Payment</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <Smartphone size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 leading-relaxed">
              You will be redirected to {selectedMethod === "moncash" ? "MonCash" : "NatCash"} to complete the payment securely on your phone.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="+509 XXXX XXXX"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">Enter your {selectedMethod === "moncash" ? "Digicel" : "Natcom"} number for faster checkout</p>
          </div>

          <button
            onClick={() => onContinue(selectedMethod, phone)}
            disabled={isProcessing}
            className={`w-full text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-70 ${
              selectedMethod === "moncash" ? "bg-red-600 hover:bg-red-700" : "bg-blue-700 hover:bg-blue-800"
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Processing...
              </span>
            ) : (
              `Continue with ${selectedMethod === "moncash" ? "MonCash" : "NatCash"}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethodId =
  | "stripe_card"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "paylater"
  | "cashapp"
  | "crypto"
  | "balance"
  | "haiti_moncash"
  | "haiti_natcash";

interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  description?: string;
  fee: number;
  tag?: string;
  isBalance?: boolean;
  renderLeft: () => React.ReactNode;
}

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, addOrder, balance, points } = useAuthStore();

  const state = location.state as {
    sku: SkuItem;
    game: LootbarGame;
    quantity: number;
    extraInfo: Record<string, string>;
  };

  const [checkoutState, setCheckoutState] = useState<CheckoutState>("review");
  const [orderId, setOrderId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>("stripe_card");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [couponTab, setCouponTab] = useState<"valid" | "invalid">("valid");
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [ticketCategory, setTicketCategory] = useState("Submit payment method suggestions");
  const [ticketContent, setTicketContent] = useState("");
  const [liveBalance, setLiveBalance] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(state?.quantity || 1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyValues, setModifyValues] = useState<Record<string, string>>({});
  const [showHaitiModal, setShowHaitiModal] = useState(false);
  const [haitiMethod, setHaitiMethod] = useState<"moncash" | "natcash">("moncash");

  useEffect(() => {
    if (!state?.sku) return;
    setModifyValues(state.extraInfo || {});
    const pending = sessionStorage.getItem("pending_coupon");
    if (pending) {
      const coupon = JSON.parse(pending);
      const bp = (state.sku.price || 0) * quantity;
      if (coupon.type === "percent") {
        const discount = Math.min(bp * (coupon.discount_value / 100), coupon.max_discount || Infinity);
        setCouponDiscount(discount);
        setCouponCode(coupon.code);
        setAppliedCouponId(coupon.id);
      }
      sessionStorage.removeItem("pending_coupon");
    }
    loadUserCoupons();
    lootbarApi.getBalance().then(setLiveBalance).catch(() => {});
  }, []);

  const loadUserCoupons = async () => {
    if (!user?.email) return;
    const { data } = await supabase
      .from("user_coupons")
      .select("*")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false });
    if (data) setUserCoupons(data);
  };

  if (!state?.sku) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-gray-500 mb-4">Invalid checkout session</p>
          <button onClick={() => navigate("/")} className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl">Go Home</button>
        </div>
      </div>
    );
  }

  const { sku, game, extraInfo } = state;
  const basePrice = (sku.price || 0) * quantity;

  // Build payment methods list
  const PAYMENT_METHODS: PaymentMethod[] = [
    // Credit/Debit card via Stripe
    {
      id: "stripe_card",
      label: "Credit / Debit Card",
      description: "Visa, Mastercard, Amex, JCB & more",
      fee: 0,
      tag: "Secure",
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Credit / Debit Card</p>
            <p className="text-xs text-gray-400">Visa, Mastercard, Amex, JCB</p>
          </div>
        </div>
      ),
    },
    // Apple Pay (iOS only)
    ...(isIOS ? [{
      id: "apple_pay" as PaymentMethodId,
      label: "Apple Pay",
      fee: 0,
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <ApplePayBadge />
          <p className="text-xs text-gray-400 ml-1">Touch / Face ID</p>
        </div>
      ),
    }] : []),
    // Google Pay (Android only)
    ...(isAndroid ? [{
      id: "google_pay" as PaymentMethodId,
      label: "Google Pay",
      fee: 0,
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <GooglePayBadge />
          <p className="text-xs text-gray-400 ml-1">One-tap pay</p>
        </div>
      ),
    }] : []),
    // PayPal
    {
      id: "paypal",
      label: "PayPal",
      fee: 0.19,
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/images/IMG_8726.webp" alt="PayPal" className="h-7 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">PayPal</p>
            <p className="text-xs text-gray-400">+$0.19 fee</p>
          </div>
        </div>
      ),
    },
    // Pay Later
    {
      id: "paylater",
      label: "Pay Later",
      fee: 0.19,
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/images/IMG_8729.webp" alt="Pay Later" className="h-7 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Pay Later</p>
            <p className="text-xs text-gray-400">Buy now, pay later</p>
          </div>
        </div>
      ),
    },
    // Cash App
    {
      id: "cashapp",
      label: "Cash App",
      fee: 0.25,
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/images/IMG_8727.webp" alt="Cash App" className="h-7 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Cash App Pay</p>
            <p className="text-xs text-gray-400">+$0.25 fee</p>
          </div>
        </div>
      ),
    },
    // Crypto
    {
      id: "crypto",
      label: "Crypto",
      fee: -0.57,
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/images/IMG_8728.webp" alt="Crypto" className="h-7 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Cryptocurrency</p>
            <p className="text-xs text-green-600 font-semibold">Save $0.57</p>
          </div>
        </div>
      ),
    },
    // Balance
    {
      id: "balance",
      label: "My Balance",
      fee: -0.70,
      isBalance: true,
      renderLeft: () => (
        <div className="flex items-center gap-2">
          <WalletIcon2 size={20} className="text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">My Balance</p>
            <p className="text-xs text-gray-400">${liveBalance || "0.00"} available</p>
          </div>
        </div>
      ),
    },
    // Haiti local methods
    ...(isHaiti ? [
      {
        id: "haiti_moncash" as PaymentMethodId,
        label: "MonCash",
        fee: 0,
        renderLeft: () => <MoncashBadge />,
      },
      {
        id: "haiti_natcash" as PaymentMethodId,
        label: "NatCash",
        fee: 0,
        renderLeft: () => <NatcashBadge />,
      },
    ] : []),
  ];

  const paymentMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);
  const paymentFee = paymentMethod?.fee ?? 0;
  const totalPrice = Math.max(0, basePrice - couponDiscount + paymentFee);
  const userRealPoints = points ?? 0;

  const validCoupons = userCoupons.filter(c => !c.is_used && new Date(c.expires_at) > new Date());
  const invalidCoupons = userCoupons.filter(c => c.is_used || new Date(c.expires_at) <= new Date());

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);
    if (appliedCouponId && couponDiscount > 0) {
      const coupon = userCoupons.find(c => c.id === appliedCouponId);
      if (coupon) {
        const newBasePrice = (sku.price || 0) * newQty;
        const newDiscount = Math.min(newBasePrice * (coupon.discount_value / 100), coupon.max_discount || Infinity);
        setCouponDiscount(newDiscount);
      }
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsLoadingCoupon(true);
    const { data: userCouponsDb } = await supabase
      .from("user_coupons")
      .select("*")
      .eq("user_email", user?.email)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString());
    const matched = userCouponsDb?.find((c: any) => c.code === couponCode.trim().toUpperCase());
    if (matched) {
      const discount = Math.min(basePrice * (matched.discount_value / 100), matched.max_discount || Infinity);
      setCouponDiscount(discount);
      setAppliedCouponId(matched.id);
      toast.success(`Coupon applied! ${matched.discount_value}% off`);
    } else {
      toast.error("Invalid or expired coupon code");
    }
    setIsLoadingCoupon(false);
  };

  const handleApplyCouponFromModal = (coupon: any) => {
    const discount = Math.min(basePrice * (coupon.discount_value / 100), coupon.max_discount || Infinity);
    setCouponDiscount(discount);
    setAppliedCouponId(coupon.id);
    setCouponCode(coupon.code);
    setSelectedCouponId(coupon.id);
    setShowCouponModal(false);
    toast.success(`${coupon.discount_value}% coupon applied`);
  };

  // Generate reference ID once
  const generateRefId = () =>
    `NOXY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // ── Stripe Checkout (card / Apple Pay / Google Pay) ─────────────────────
  const handleStripeCheckout = async () => {
    if (!isAuthenticated) { toast.error("Please login to continue"); navigate("/login"); return; }
    setIsProcessingPayment(true);
    setCheckoutState("processing");

    const refId = generateRefId();
    setReferenceId(refId);

    const { data, error } = await supabase.functions.invoke("stripe-checkout", {
      body: {
        gameName: game.game_name,
        skuName: sku.sku_name,
        quantity,
        totalPrice,
        userEmail: user?.email,
        referenceId: refId,
        successUrl: `${window.location.origin}/checkout/success?ref=${refId}`,
        cancelUrl: `${window.location.origin}/checkout`,
      },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { msg = await error.context?.text(); } catch { /* ignore */ }
      }
      toast.error(`Payment error: ${msg}`);
      setCheckoutState("review");
      setIsProcessingPayment(false);
      return;
    }

    // Save order locally as pending (state=1) before redirect
    const order: Order = {
      id: `local_${Date.now()}`,
      reference_id: refId,
      order_id: "",
      game_id: game.game_id,
      game_name: game.game_name,
      sku_name: sku.sku_name,
      price: totalPrice,
      state: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      extra_info: extraInfo,
    };
    addOrder(order);

    // Redirect to Stripe Checkout
    if (data?.url) {
      window.location.href = data.url;
    } else {
      toast.error("No checkout URL returned from Stripe");
      setCheckoutState("review");
      setIsProcessingPayment(false);
    }
  };

  // ── Haiti local payment ────────────────────────────────────────────────────
  const handleHaitiPayment = async (method: "moncash" | "natcash", phone: string) => {
    if (!isAuthenticated) { toast.error("Please login to continue"); navigate("/login"); return; }
    setIsProcessingPayment(true);

    const refId = generateRefId();
    setReferenceId(refId);
    const ordId = `ORD-${Date.now()}`;

    const fnName = method === "moncash" ? "moncash-payment" : "natcash-payment";
    const { data, error } = await supabase.functions.invoke(fnName, {
      body: {
        amount: totalPrice,
        orderId: ordId,
        referenceId: refId,
        userEmail: user?.email,
        phoneNumber: phone,
        returnUrl: `${window.location.origin}/checkout/success?ref=${refId}`,
      },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { msg = await error.context?.text(); } catch { /* ignore */ }
      }
      toast.error(`${method === "moncash" ? "MonCash" : "NatCash"} error: ${msg}`);
      setIsProcessingPayment(false);
      setShowHaitiModal(false);
      return;
    }

    // Save order locally as pending
    const order: Order = {
      id: `local_${Date.now()}`,
      reference_id: refId,
      order_id: ordId,
      game_id: game.game_id,
      game_name: game.game_name,
      sku_name: sku.sku_name,
      price: totalPrice,
      state: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      extra_info: extraInfo,
    };
    addOrder(order);
    setShowHaitiModal(false);

    if (data?.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      toast.success("Payment initiated. Redirecting...");
      setCheckoutState("success");
    }
    setIsProcessingPayment(false);
  };

  // ── Standard checkout (balance / crypto / etc.) ──────────────────────────
  const handlePayNow = async () => {
    if (!isAuthenticated) { toast.error("Please login to continue"); navigate("/login"); return; }
    if (isProcessingPayment) return;

    // Route to Stripe for card / Apple Pay / Google Pay
    if (["stripe_card", "apple_pay", "google_pay"].includes(selectedPayment)) {
      await handleStripeCheckout();
      return;
    }

    // Open Haiti modal
    if (selectedPayment === "haiti_moncash") {
      setHaitiMethod("moncash");
      setShowHaitiModal(true);
      return;
    }
    if (selectedPayment === "haiti_natcash") {
      setHaitiMethod("natcash");
      setShowHaitiModal(true);
      return;
    }

    // Legacy / balance flow
    setIsProcessingPayment(true);
    setCheckoutState("processing");
    const refId = generateRefId();
    setReferenceId(refId);

    const result = await lootbarApi.createOrder(
      game.game_id, game.game_name, sku.sku_id, sku.sku_name,
      quantity, totalPrice, extraInfo, user?.email, user?.id
    );

    if (result?.order_id) {
      setOrderId(result.order_id);
      const order: Order = {
        id: `local_${Date.now()}`,
        reference_id: result.reference_id || refId,
        order_id: result.order_id,
        game_id: game.game_id,
        game_name: game.game_name,
        sku_name: sku.sku_name,
        price: totalPrice,
        state: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        extra_info: extraInfo,
      };
      addOrder(order);
      setCheckoutState("success");
      toast.success("Order created successfully!");
    } else {
      setCheckoutState("failed");
      toast.error("Order failed. Please try again.");
    }
    setIsProcessingPayment(false);
  };

  // ── State screens ──────────────────────────────────────────────────────────
  if (checkoutState === "success") {
    return (
      <div className="min-h-screen bg-white">
        <div className="hidden lg:block"><DesktopHeader /></div>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Created!</h1>
          <p className="text-gray-500 mb-1">{sku.sku_name} — {game.game_name}</p>
          <div className="w-full max-w-sm bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-semibold text-xs">{orderId || referenceId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-green-600">${totalPrice.toFixed(2)}</span>
            </div>
            {Object.entries(extraInfo).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500 capitalize">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <div className="w-full max-w-sm space-y-3">
            <button onClick={() => navigate(`/orders/${referenceId}`)}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl">Track Order</button>
            <button onClick={() => navigate("/account")}
              className="w-full border border-gray-200 text-gray-700 font-semibold py-4 rounded-xl">Order History</button>
          </div>
        </div>
      </div>
    );
  }

  if (checkoutState === "failed") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Failed</h1>
        <p className="text-gray-500 mb-6">Something went wrong. Please try again.</p>
        <button onClick={() => setCheckoutState("review")} className="bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl w-full max-w-xs">Try Again</button>
        <button onClick={() => navigate(-1)} className="border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl w-full max-w-xs mt-3">Go Back</button>
      </div>
    );
  }

  if (checkoutState === "processing") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
        </div>
        <h1 className="text-xl font-bold mb-2">Preparing Checkout...</h1>
        <p className="text-gray-500 text-sm">Connecting to secure payment page</p>
      </div>
    );
  }

  // ── Payment Row Renderer ──────────────────────────────────────────────────
  const renderPaymentRow = (method: PaymentMethod) => {
    const price = Math.max(0, basePrice - couponDiscount + method.fee);
    const isSelected = selectedPayment === method.id;
    const isInsufficient = method.isBalance && Number(liveBalance || 0) < totalPrice;

    return (
      <div key={method.id}
        className={`border-2 rounded-xl mb-2 transition-all ${isSelected ? "border-yellow-400 bg-yellow-50/50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
        <button
          onClick={() => {
            if (isInsufficient) { navigate("/balance"); return; }
            setSelectedPayment(method.id);
          }}
          className="w-full flex items-center justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            {/* Radio */}
            <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "border-yellow-500" : "border-gray-300"}`}>
              {isSelected && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
            </div>
            {method.renderLeft()}
          </div>

          <div className="flex flex-col items-end ml-2">
            <span className="text-sm font-bold text-gray-800">USD ${price.toFixed(2)}</span>
            {method.tag && <span className="text-[10px] text-blue-500 font-semibold mt-0.5">{method.tag}</span>}
            {method.fee < 0 && <span className="text-[10px] text-green-600 font-semibold">Save ${Math.abs(method.fee).toFixed(2)}</span>}
            {isInsufficient && <span className="text-[10px] text-red-500 font-semibold">Insufficient</span>}
          </div>
        </button>
      </div>
    );
  };

  // ── Payment Details Panel (right side on desktop) ─────────────────────────
  const PaymentDetailsPanel = () => (
    <div className="w-[340px] flex-shrink-0">
      <div className="sticky top-[76px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Order Summary</h3>
        </div>

        {/* Coupon section */}
        <div className="border-b border-gray-100">
          <div className="flex items-center border-b border-gray-100">
            <div className="flex items-center gap-2 flex-1 px-4 py-3">
              <Tag size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent min-w-0"
              />
            </div>
            <button
              onClick={handleRedeemCoupon}
              disabled={isLoadingCoupon || !couponCode.trim()}
              className="h-full px-4 py-3 border-l border-gray-100 text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-40 flex-shrink-0"
            >
              {isLoadingCoupon ? "..." : "Redeem"}
            </button>
          </div>

          <button
            onClick={() => setShowCouponModal(true)}
            className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2 text-gray-700">
              <GiftLucide size={15} className="text-gray-400" />
              <span className="text-sm font-medium">
                {couponDiscount > 0 ? `${couponCode} Applied` : "Use a coupon"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {couponDiscount > 0 && <span className="text-sm text-orange-500 font-bold">−${couponDiscount.toFixed(2)}</span>}
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          </button>
        </div>

        {/* Price breakdown */}
        <div className="px-5 py-4 space-y-2.5 border-b border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Price × {quantity}</span>
            <span className="text-gray-900">${basePrice.toFixed(2)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Coupon</span>
              <span className="text-orange-500 font-bold">−${couponDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500 flex items-center gap-1">
              Payment fee
              <HelpCircle size={11} className="text-gray-400" />
            </span>
            <span className="text-gray-700">
              {paymentFee === 0 ? "Free" : paymentFee > 0 ? `+$${paymentFee.toFixed(2)}` : `−$${Math.abs(paymentFee).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-orange-500">USD ${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay button */}
        <div className="px-5 py-4 space-y-3">
          <button
            onClick={handlePayNow}
            disabled={isProcessingPayment}
            className="w-full bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-black py-4 rounded-xl text-base transition-colors disabled:opacity-70 shadow-sm"
          >
            {isProcessingPayment ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Processing...
              </span>
            ) : (
              selectedPayment === "stripe_card" ? "Pay with Card →" :
              selectedPayment === "apple_pay" ? " Pay →" :
              selectedPayment === "google_pay" ? "Google Pay →" :
              selectedPayment === "haiti_moncash" ? "Pay with MonCash →" :
              selectedPayment === "haiti_natcash" ? "Pay with NatCash →" :
              "Pay Now →"
            )}
          </button>

          {/* Accepted payment logos */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <img src="/images/IMG_8408.webp" alt="Visa/MC" className="h-5 object-contain opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
            <img src="/images/IMG_8725.webp" alt="JCB/Amex" className="h-5 object-contain opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
            <img src="/images/IMG_8726.webp" alt="PayPal" className="h-5 object-contain opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
            {isIOS && <div className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded">Apple Pay</div>}
            {isAndroid && <div className="border border-gray-300 text-[9px] font-bold px-2 py-0.5 rounded text-gray-600">G Pay</div>}
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-green-500" />
            <span className="text-xs text-gray-400">256-bit SSL · PCI DSS Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Modify Order Info Modal ───────────────────────────────────────────────
  const ModifyModal = () => {
    const fields = state?.sku?.extra_info || [];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowModifyModal(false)} />
        <div className="relative bg-white w-full max-w-md shadow-2xl rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Modify Order Info</h3>
            <button onClick={() => setShowModifyModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No fields to modify.</p>
            ) : fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {field.required && <span className="text-red-500 mr-0.5">*</span>}
                  {field.title}
                </label>
                {field.type === "select" && field.options?.length > 0 ? (
                  <select
                    value={modifyValues[field.name] || ""}
                    onChange={(e) => setModifyValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 bg-white"
                  >
                    <option value="">Select {field.title}</option>
                    {field.options.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={modifyValues[field.name] || ""}
                    onChange={(e) => setModifyValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder || `Enter ${field.title}`}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={() => setShowModifyModal(false)}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 text-sm rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => { Object.assign(extraInfo, modifyValues); setShowModifyModal(false); }}
              className="flex-1 bg-yellow-400 text-black font-bold py-3 text-sm rounded-xl hover:bg-yellow-300">
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Coupons Modal ─────────────────────────────────────────────────────────
  const CouponModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => setShowCouponModal(false)} />
      <div className="relative bg-white w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">My Coupons</h3>
          <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="flex border-b border-gray-200">
          <button onClick={() => setCouponTab("valid")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${couponTab === "valid" ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400"}`}>
            Valid ({validCoupons.length})
          </button>
          <button onClick={() => setCouponTab("invalid")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${couponTab === "invalid" ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400"}`}>
            Invalid ({invalidCoupons.length})
          </button>
        </div>
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2">
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 bg-gray-50" />
            <button onClick={handleRedeemCoupon} disabled={isLoadingCoupon || !couponCode.trim()}
              className="bg-yellow-400 text-black font-bold px-5 py-2.5 text-sm rounded-xl hover:bg-yellow-300 disabled:opacity-50">
              {isLoadingCoupon ? "..." : "Redeem"}
            </button>
          </div>
        </div>
        <div className="px-6 py-3 max-h-[300px] overflow-y-auto space-y-3">
          {(couponTab === "valid" ? validCoupons : invalidCoupons).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {couponTab === "valid" ? "No valid coupons" : "No invalid coupons"}
            </div>
          ) : (couponTab === "valid" ? validCoupons : invalidCoupons).map((coupon) => {
            const isApplied = selectedCouponId === coupon.id;
            return (
              <div key={coupon.id}
                onClick={() => couponTab === "valid" && handleApplyCouponFromModal(coupon)}
                className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${couponTab === "invalid" ? "border-gray-200 opacity-60 cursor-default" : isApplied ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-yellow-300"}`}>
                <p className="text-orange-500 font-bold text-sm">{coupon.discount_value}% OFF <span className="text-gray-400 font-normal text-xs">(Max ${coupon.max_discount || "∞"})</span></p>
                <p className="text-xs text-gray-500 mt-0.5">Min. order ${coupon.min_order || 1.00}</p>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Discount</span>
            <span className="text-base font-bold text-orange-500">−${couponDiscount.toFixed(2)}</span>
          </div>
          <button onClick={() => setShowCouponModal(false)}
            className="w-full bg-yellow-400 text-black font-bold py-3.5 text-sm rounded-xl hover:bg-yellow-300">Confirm</button>
        </div>
      </div>
    </div>
  );

  // ── Ticket Modal ──────────────────────────────────────────────────────────
  const TicketModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => setShowTicketModal(false)} />
      <div className="relative bg-white w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Request Payment Method</h3>
          <button onClick={() => setShowTicketModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 bg-white">
              <option>Submit payment method suggestions</option>
              <option>Report a payment issue</option>
              <option>Request a refund</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea value={ticketContent} onChange={(e) => setTicketContent(e.target.value.slice(0, 400))}
              placeholder="Describe your question or suggestion..."
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 resize-none bg-gray-50" />
            <p className="text-xs text-gray-400 text-right mt-1">{ticketContent.length}/400</p>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={() => {
              if (!ticketContent.trim()) { toast.error("Please describe your question"); return; }
              toast.success("Ticket submitted! We'll review your suggestion.");
              setShowTicketModal(false);
              setTicketContent("");
            }}
            className="w-full bg-yellow-400 text-black font-bold py-3.5 text-sm rounded-xl hover:bg-yellow-300">
            Submit
          </button>
        </div>
      </div>
    </div>
  );

  // ── Desktop layout ─────────────────────────────────────────────────────────
  const DesktopCheckout = () => (
    <div className="hidden lg:flex min-h-screen bg-[#f5f5f5]">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DesktopHeader />
      </div>

      <div className="flex w-full pt-[76px] max-w-[1160px] mx-auto gap-6 px-6 pb-6 items-start">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-4" style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto", scrollbarWidth: "none" }}>

          {/* ── Product Card (large) ── */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Order Details</h3>
              <div className="flex items-start gap-5">
                {/* Large product image */}
                <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow">
                  <img
                    src={sku.image || game.game_image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop"}
                    alt={sku.sku_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop"; }}
                  />
                  {(game.discount ?? 0) > 0 && (
                    <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      -{game.discount}%
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-lg leading-tight">{sku.sku_name}</p>
                  <p className="text-gray-500 text-sm mt-1">{game.game_name}</p>
                  <p className="text-2xl font-black text-orange-500 mt-2">USD ${basePrice.toFixed(2)}</p>
                </div>

                {/* Quantity control */}
                <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                  <button onClick={() => handleQuantityChange(-1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Extra info */}
              {Object.entries(extraInfo).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    {Object.entries(extraInfo).map(([k, v]) => (
                      <span key={k} className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800 capitalize">{k}:</span>{" "}
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{v}</span>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => { setModifyValues({ ...extraInfo }); setShowModifyModal(true); }}
                    className="flex items-center gap-1.5 text-blue-500 text-sm font-semibold hover:text-blue-600">
                    <Edit2 size={13} /> Modify
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Payment Method ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Payment Method</h3>
              {isHaiti && (
                <p className="text-xs text-blue-500 mt-0.5 font-medium">🇭🇹 Haiti local payment methods available</p>
              )}
            </div>
            <div className="p-4">
              {PAYMENT_METHODS.map((method) => renderPaymentRow(method))}
            </div>
            <div className="px-6 py-3 border-t border-gray-100">
              <button onClick={() => setShowTicketModal(true)}
                className="text-sm text-blue-500 font-medium hover:text-blue-600 flex items-center gap-1">
                Don't see your preferred method? <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Payment Details Panel */}
        <PaymentDetailsPanel />
      </div>
    </div>
  );

  // ── Mobile layout ──────────────────────────────────────────────────────────
  const MobileCheckout = () => (
    <div className="lg:hidden min-h-screen bg-gray-50 pb-36">
      <Header showMenu />

      {/* Large product card */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 shadow">
            <img
              src={sku.image || game.game_image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop"}
              alt={sku.sku_name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop"; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 text-base leading-tight">{sku.sku_name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{game.game_name}</p>
            <p className="text-xl font-black text-orange-500 mt-1.5">USD ${basePrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Quantity + extra info */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => handleQuantityChange(-1)} className="w-9 h-9 flex items-center justify-center text-gray-500">
              <Minus size={14} />
            </button>
            <span className="w-9 text-center font-bold text-sm text-gray-900">{quantity}</span>
            <button onClick={() => handleQuantityChange(1)} className="w-9 h-9 flex items-center justify-center text-gray-500">
              <Plus size={14} />
            </button>
          </div>
          {Object.entries(extraInfo).length > 0 && (
            <button
              onClick={() => navigate("/verify-player", { state: { sku: state.sku, game: state.game, quantity } })}
              className="flex items-center gap-1 text-blue-500 text-xs font-semibold">
              <Edit2 size={11} /> Modify Info
            </button>
          )}
        </div>
      </div>

      {/* Coupon section */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 mt-2">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Tag size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="flex-1 text-sm outline-none text-gray-700" />
          <button onClick={handleRedeemCoupon} disabled={isLoadingCoupon} className="text-sm text-gray-500 font-bold">
            {isLoadingCoupon ? "..." : "Redeem"}
          </button>
        </div>
        <button onClick={() => setShowCouponModal(true)} className="flex items-center justify-between w-full pt-3">
          <div className="flex items-center gap-2 text-gray-700">
            <GiftLucide size={15} className="text-gray-400" />
            <span className="text-sm font-medium">{couponDiscount > 0 ? `${couponCode} Applied` : "Use a coupon"}</span>
          </div>
          <div className="flex items-center gap-1">
            {couponDiscount > 0 && <span className="text-sm text-orange-500 font-bold">−${couponDiscount.toFixed(2)}</span>}
            <ChevronRight size={14} className="text-gray-400" />
          </div>
        </button>
      </div>

      {/* Payment methods */}
      <div className="bg-white mt-2 px-4 py-4">
        <h3 className="font-bold text-gray-900 mb-1">Payment Method</h3>
        {isHaiti && (
          <p className="text-xs text-blue-500 mb-3 font-medium">🇭🇹 Haiti local payment methods available</p>
        )}
        <div className="space-y-0">
          {PAYMENT_METHODS.map((method) => renderPaymentRow(method))}
        </div>
        <button onClick={() => setShowTicketModal(true)}
          className="w-full text-center text-sm text-blue-500 font-medium py-3">
          Don't see your method? &gt;
        </button>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-40 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-2xl font-black text-orange-500">USD ${totalPrice.toFixed(2)}</span>
        </div>
        <button
          onClick={handlePayNow}
          disabled={isProcessingPayment}
          className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl disabled:opacity-70 text-base active:bg-yellow-500 shadow">
          {isProcessingPayment ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Processing...
            </span>
          ) : "Pay Now →"}
        </button>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Shield size={11} className="text-green-500" />
          <span className="text-xs text-gray-400">SSL Secured · PCI DSS</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DesktopCheckout />
      <MobileCheckout />

      {showHaitiModal && (
        <HaitiPaymentModal
          selectedMethod={haitiMethod}
          onClose={() => { setShowHaitiModal(false); setIsProcessingPayment(false); }}
          onContinue={handleHaitiPayment}
          isProcessing={isProcessingPayment}
        />
      )}
      {showCouponModal && <CouponModal />}
      {showTicketModal && <TicketModal />}
      {showModifyModal && <ModifyModal />}
    </>
  );
}
