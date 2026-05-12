import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Edit2, Shield, CreditCard, Ticket } from "lucide-react";
import { lootbarApi } from "@/lib/lootbar-api";
import { useAuthStore } from "@/stores/authStore";
import { ORDER_STATE_MAP } from "@/types";
import type { SkuItem, LootbarGame, Order } from "@/types";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { toast } from "sonner";

type CheckoutState = "review" | "processing" | "success" | "failed";

// ─── SVG Logo Components ───────────────────────────────────────────────────

const VisaLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <path d="M18.5 1.5L16 14.5H19.5L22 1.5H18.5Z" fill="#1A1F71"/>
    <path d="M30.5 1.5C29.5 1.5 28.5 2 28 2.5L23.5 14.5H27.5L28 13H32.5L33 14.5H37L33.5 1.5H30.5ZM29.5 10L31 5.5L32 10H29.5Z" fill="#1A1F71"/>
    <path d="M13.5 1.5L9.5 10L9 7C8 4 5 2 5 2L8.5 14.5H12.5L18 1.5H13.5Z" fill="#1A1F71"/>
    <path d="M6.5 1.5H0.5L0 2C4.5 3 7.5 5.5 8.5 7.5L7.5 2.5C7.5 2 7 1.5 6.5 1.5Z" fill="#F7B600"/>
    <path d="M43.5 1.5C42 1.5 40.5 2 40 2.5L39.5 3L39 1.5H36L38.5 14.5H42L41 9.5C41 6.5 43 4.5 45 4.5C46 4.5 46.5 4.5 47 4.5L47.5 1.5C47 1.5 46 1.5 43.5 1.5Z" fill="#1A1F71"/>
  </svg>
);

const MastercardLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 20" className={className} fill="none">
    <circle cx="10" cy="10" r="10" fill="#EB001B"/>
    <circle cx="22" cy="10" r="10" fill="#F79E1B"/>
    <path d="M16 3C18.5 5 20 7.5 20 10C20 12.5 18.5 15 16 17C13.5 15 12 12.5 12 10C12 7.5 13.5 5 16 3Z" fill="#FF5F00"/>
  </svg>
);

const PayPalLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 80 20" className={className} fill="none">
    <path d="M10 2H4C3.5 2 3 2.5 3 3L0 17C0 17.5 0.5 18 1 18H3.5L4.5 12H7.5C11.5 12 14 10 14.5 6.5C15 4 13 2 10 2Z" fill="#003087"/>
    <path d="M25 2H19C18.5 2 18 2.5 18 3L15 17C15 17.5 15.5 18 16 18H18.5L19.5 12H22.5C26.5 12 29 10 29.5 6.5C30 4 28 2 25 2Z" fill="#0070E0"/>
    <text x="32" y="14" fontSize="12" fontWeight="bold" fill="#003087" fontFamily="Arial, sans-serif">PayPal</text>
  </svg>
);

const JCBLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <rect x="0" y="0" width="14" height="16" rx="2" fill="#0066B3"/>
    <rect x="17" y="0" width="14" height="16" rx="2" fill="#00A650"/>
    <rect x="34" y="0" width="14" height="16" rx="2" fill="#EF4123"/>
    <text x="2" y="12" fontSize="9" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">JCB</text>
  </svg>
);

const AmexLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <rect x="0" y="0" width="48" height="16" rx="2" fill="#016FD0"/>
    <path d="M0 8L6 0H14L10 5H16L20 0H28L24 5H30L34 0H42L48 8L42 16H34L30 11H24L28 16H20L16 11H10L14 16H6L0 8Z" fill="white"/>
    <text x="18" y="11" fontSize="7" fontWeight="bold" fill="#016FD0" fontFamily="Arial, sans-serif">AMEX</text>
  </svg>
);

const DiscoverLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 80 20" className={className} fill="none">
    <text x="0" y="15" fontSize="14" fontWeight="bold" fill="#FF6000" fontFamily="Arial, sans-serif">Discover</text>
    <circle cx="72" cy="10" r="6" fill="#FF6000"/>
  </svg>
);

const DinersLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <rect x="0" y="0" width="48" height="16" rx="8" fill="#004E94"/>
    <text x="6" y="11" fontSize="7" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">DINERS</text>
    <text x="30" y="11" fontSize="5" fill="white" fontFamily="Arial, sans-serif">CLUB</text>
  </svg>
);

const CashAppLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <rect x="0" y="0" width="16" height="16" rx="4" fill="#00D632"/>
    <text x="4" y="12" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">$</text>
    <text x="20" y="12" fontSize="10" fontWeight="bold" fill="#00D632" fontFamily="Arial, sans-serif">Cash App</text>
  </svg>
);

const BitcoinLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <circle cx="8" cy="8" r="7" fill="#F7931A"/>
    <text x="5" y="12" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">B</text>
    <text x="18" y="12" fontSize="10" fontWeight="bold" fill="#F7931A" fontFamily="Arial, sans-serif">Bitcoin</text>
  </svg>
);

const EthereumLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <polygon points="8,0 16,8 8,12 0,8" fill="#627EEA"/>
    <polygon points="8,12 16,8 8,16 0,8" fill="#627EEA" opacity="0.6"/>
    <text x="18" y="12" fontSize="10" fontWeight="bold" fill="#627EEA" fontFamily="Arial, sans-serif">Ethereum</text>
  </svg>
);

const USDTLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <circle cx="8" cy="8" r="7" fill="#26A17B"/>
    <text x="5" y="12" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">T</text>
    <text x="18" y="12" fontSize="10" fontWeight="bold" fill="#26A17B" fontFamily="Arial, sans-serif">USDT</text>
  </svg>
);

const CryptoLogo = ({ className = "w-8 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 16" className={className} fill="none">
    <circle cx="8" cy="8" r="7" fill="#F7931A"/>
    <text x="5" y="12" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">B</text>
    <text x="18" y="12" fontSize="10" fontWeight="bold" fill="#F7931A" fontFamily="Arial, sans-serif">Crypto</text>
  </svg>
);

const PointsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const DiscountIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

// ─── Payment Methods Config ────────────────────────────────────────────────

type PaymentMethodConfig = {
  id: string;
  label: string;
  logo: React.FC<{ className?: string }>;
  fee: number;
  tag?: string;
};

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: "visa", label: "VISA / Mastercard", logo: VisaLogo, fee: 0, tag: "Last used" },
  { id: "jcb", label: "JCB / AmEx / Discover / Diners", logo: JCBLogo, fee: -0.01 },
  { id: "paypal", label: "PayPal", logo: PayPalLogo, fee: 0.14 },
  { id: "paylater", label: "Pay Later", logo: CreditCard, fee: 0.14 },
  { id: "cashapp", label: "Cash App", logo: CashAppLogo, fee: 0.14 },
  { id: "crypto", label: "Bitcoin / Ethereum / USDT", logo: CryptoLogo, fee: -0.57 },
];

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, addOrder } = useAuthStore();

  const state = location.state as {
    sku: SkuItem;
    game: LootbarGame;
    quantity: number;
    extraInfo: Record<string, string>;
  };

  const [checkoutState, setCheckoutState] = useState<CheckoutState>("review");
  const [orderId, setOrderId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("visa");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Auto-apply pending coupon from coupons page
  useEffect(() => {
    if (!state?.sku) return;
    const pending = sessionStorage.getItem("pending_coupon");
    if (pending) {
      const coupon = JSON.parse(pending);
      const bp = (state.sku.price || 0) * (state.quantity || 1);
      if (coupon.type === "percent") {
        const discount = Math.min(
          bp * (coupon.discount_value / 100),
          coupon.max_discount || Infinity
        );
        setCouponDiscount(discount);
        setCouponCode(coupon.code);
        setAppliedCouponId(coupon.id);
      }
      sessionStorage.removeItem("pending_coupon");
    }
  }, []);

  if (!state?.sku) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-gray-500 mb-4">Invalid checkout session</p>
          <button onClick={() => navigate("/")} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const { sku, game, quantity, extraInfo } = state;
  const basePrice = (sku.price || 0) * quantity;
  const savings = (sku.discount_amount || 0) * quantity;
  const paymentMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);
  const paymentFee = paymentMethod ? paymentMethod.fee : 0;
  const totalPrice = Math.max(0, basePrice - couponDiscount + paymentFee);

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsLoadingCoupon(true);
    // Check user coupons in DB
    const { data: userCoupons } = await (await import("@/lib/supabase")).supabase
      .from("user_coupons")
      .select("*")
      .eq("user_email", user?.email)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString());

    const matched = userCoupons?.find((c: any) => c.code === couponCode.trim().toUpperCase());
    if (matched) {
      const discount = Math.min(
        basePrice * (matched.discount_value / 100),
        matched.max_discount || Infinity
      );
      setCouponDiscount(discount);
      setAppliedCouponId(matched.id);
      (await import("sonner")).toast.success(`Coupon applied! ${matched.discount_value}% discount`);
    } else {
      (await import("sonner")).toast.error("Invalid or expired coupon code");
    }
    setIsLoadingCoupon(false);
  };

  const handlePayNow = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }
    setCheckoutState("processing");

    const refId = `NOXY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setReferenceId(refId);

    try {
      // Create real Lootbar order
      const result = await lootbarApi.createOrder(
        game.game_id,
        game.game_name,
        sku.sku_id,
        sku.sku_name,
        quantity,
        totalPrice,
        extraInfo,
        user?.email,
        user?.id
      );

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
      toast.success("Order created! Your top-up is being processed.");
    } catch {
      setCheckoutState("failed");
      toast.error("Order failed. Please try again.");
    }
  };

  // ======== SUCCESS STATE ========
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
          <p className="text-gray-400 text-sm mb-6">Your top-up is being processed</p>

          <div className="w-full max-w-sm bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-semibold text-gray-700 text-xs">{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-green-600">${totalPrice.toFixed(2)}</span>
            </div>
            {Object.entries(extraInfo).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500 capitalize">{k}</span>
                <span className="font-semibold text-gray-700">{v}</span>
              </div>
            ))}
          </div>

          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => navigate(`/orders/${referenceId}`)}
              className="btn-primary w-full"
            >
              Track Order Status
            </button>
            <button onClick={() => navigate("/account")} className="btn-secondary w-full">
              View Order History
            </button>
            <button onClick={() => navigate("/")} className="text-sm text-gray-400 hover:text-gray-600 py-2 w-full">
              Back to Home
            </button>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Failed</h1>
        <p className="text-gray-500 mb-6">Something went wrong. Please try again.</p>
        <button onClick={() => setCheckoutState("review")} className="btn-primary w-full max-w-xs">Try Again</button>
        <button onClick={() => navigate(-1)} className="btn-secondary w-full max-w-xs mt-3">Go Back</button>
      </div>
    );
  }

  if (checkoutState === "processing") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Creating Your Order...</h1>
        <p className="text-gray-500 text-sm">Please wait while we send your top-up request</p>
      </div>
    );
  }

  // ======== Shared content ========
  const SKUHeader = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className={`flex items-center gap-3 ${collapsed ? "cursor-pointer" : ""}`}
      onClick={() => collapsed && setShowOrderDetails(!showOrderDetails)}>
      <img
        src={sku.image || game.game_image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop"}
        alt={sku.sku_name}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop"; }}
      />
      <div className="flex-1">
        <p className="font-bold text-gray-900 text-sm leading-tight">{sku.sku_name}</p>
        <p className="text-sm text-gray-500">{game.game_name}</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">USD ${basePrice.toFixed(2)}</p>
      </div>
      {collapsed && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-gray-400 transition-transform ${showOrderDetails ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
    </div>
  );

  const PaymentDetails = () => (
    <div>
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <PointsIcon className="w-4 h-4 text-gray-400" />
          39 Points
        </div>
        <span className="text-xs text-gray-400">Available when over 100</span>
      </div>
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-1">
          <Ticket size={16} className="text-gray-400" />
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon Code"
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
          />
        </div>
        <button
          onClick={handleRedeemCoupon}
          disabled={isLoadingCoupon}
          className="text-sm text-yellow-600 font-semibold hover:text-yellow-700"
        >
          {isLoadingCoupon ? "..." : "Redeem"}
        </button>
      </div>
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-sm flex items-center gap-2 text-gray-600">
          <DiscountIcon className="w-4 h-4 text-orange-500" /> 5% OFF
        </span>
        <button className="text-sm text-orange-500 font-semibold flex items-center gap-1">
          -{couponDiscount > 0 ? `$${couponDiscount.toFixed(2)}` : "$0.70"} 
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <div className="pt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Price</span>
          <span className="text-gray-800">${basePrice.toFixed(2)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Coupon</span>
            <span className="text-orange-500 font-semibold">-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 flex items-center gap-1">
            Payment Fee (3.5%+$0.15) <span className="text-gray-400">?</span>
          </span>
          <span className="text-gray-800">{paymentFee >= 0 ? `+$${paymentFee.toFixed(2)}` : `-$${Math.abs(paymentFee).toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
          <span>Total Amount</span>
          <span className="text-orange-500">USD ${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const PaymentMethodsList = () => (
    <div className="space-y-2">
      {PAYMENT_METHODS.map((method) => {
        const price = totalPrice + method.fee - (paymentMethod?.fee || 0);
        const isSelected = selectedPayment === method.id;
        const LogoComponent = method.logo;
        return (
          <button
            key={method.id}
            onClick={() => setSelectedPayment(method.id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
              isSelected ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-yellow-500" : "border-gray-300"}`}>
                {isSelected && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
              </div>
              <LogoComponent className="w-8 h-5 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">{method.label}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700">USD ${Math.max(0, price).toFixed(2)}</span>
              {method.tag && <span className="text-[10px] text-orange-500 font-semibold">{method.tag}</span>}
            </div>
          </button>
        );
      })}
      <button className="w-full text-center text-sm text-blue-500 font-medium py-2">
        Not the payment method you prefer? &gt;
      </button>
    </div>
  );

  // ─── Desktop layout ────────────────────────────────────────────────────────
  const DesktopCheckout = () => (
    <div className="hidden lg:block min-h-screen bg-[#f5f5f5]">
      <DesktopHeader />
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex gap-6">
          {/* Left */}
          <div className="flex-1 space-y-4">
            {/* Product */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <SKUHeader />
              <div className="mt-4 pt-4 border-t border-gray-100">
                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Quantity</span>
                  <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-2">
                    <button className="py-2 px-1 text-gray-500">−</button>
                    <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                    <button className="py-2 px-1 text-gray-500">+</button>
                  </div>
                </div>
              </div>
              {Object.entries(extraInfo).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-start justify-between">
                  <div>
                    {Object.entries(extraInfo).map(([k, v]) => (
                      <p key={k} className="text-sm text-gray-500">
                        <span className="capitalize font-medium">{k}</span>: <span className="text-gray-800 font-semibold">{v}</span>
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-blue-500 text-sm font-semibold"
                  >
                    <Edit2 size={12} /> Modify
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Payment Method</h3>
              <PaymentMethodsList />
            </div>
          </div>

          {/* Right: Payment details */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-4">Payment Details</h3>
              <PaymentDetails />
              <button
                onClick={handlePayNow}
                className="w-full mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl text-base transition-colors"
              >
                Pay Now
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <Shield size={12} className="text-green-500" />
                <span className="text-xs text-gray-400">Secure payment powered by NoxyStore</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Mobile layout ─────────────────────────────────────────────────────────
  const MobileCheckout = () => (
    <div className="lg:hidden min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-40">
        <button onClick={() => navigate(-1)} className="text-gray-700"><ArrowLeft size={20} /></button>
        <span className="font-bold text-gray-900 text-base flex-1 text-center">Payment</span>
        <div className="w-8" />
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Collapsed product */}
        <div className="border border-gray-200 rounded-2xl p-4">
          <SKUHeader collapsed />
          {showOrderDetails && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {/* Quantity row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Quantity</span>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-2">
                  <button className="py-1.5 px-1 text-gray-500 text-sm">−</button>
                  <span className="text-sm font-bold">{quantity}</span>
                  <button className="py-1.5 px-1 text-gray-500 text-sm">+</button>
                </div>
              </div>
              {Object.entries(extraInfo).map(([k, v]) => (
                <div key={k} className="flex justify-between mt-1.5">
                  <span className="text-sm text-gray-500 capitalize">{k}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{v}</span>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-0.5 text-xs text-blue-500">
                      <Edit2 size={10} /> Modify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Points + Coupon + Discount */}
        <div className="border border-gray-200 rounded-2xl p-4">
          <PaymentDetails />
        </div>

        {/* Payment methods */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
          <PaymentMethodsList />
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm text-gray-500">Total Amount </span>
            <button className="text-sm text-blue-500 font-medium">Details&gt;</button>
          </div>
          <span className="text-xl font-black text-orange-500">USD ${totalPrice.toFixed(2)}</span>
        </div>
        <button
          onClick={handlePayNow}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-2xl text-base transition-colors"
        >
          Pay Now
        </button>
      </div>
    </div>
  );

  return (
    <>
      <DesktopCheckout />
      <MobileCheckout />
    </>
  );
}
