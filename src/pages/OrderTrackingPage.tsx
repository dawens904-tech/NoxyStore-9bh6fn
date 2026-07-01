import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { item4gamerApi } from "@/lib/item4gamer";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileFooter } from "@/components/layout/MobileFooter";
import {
  CheckCircle, Clock, XCircle, RefreshCw, ChevronRight,
  Package, ArrowLeft, Copy, Check
} from "lucide-react";

interface Order {
  id: string;
  reference_id: string;
  order_id: string | null;
  game_name: string;
  sku_name: string;
  quantity: number;
  price: number;
  state: number;
  user_email: string | null;
  extra_info: Record<string, string>;
  created_at: string;
  updated_at: string;
  callback_received_at: string | null;
}

const STATE_CONFIG: Record<number, {
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  step: number;
}> = {
  1: {
    label: "Pending",
    description: "Your order has been received and is awaiting processing.",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: <Clock size={22} className="text-yellow-500" />,
    step: 1,
  },
  2: {
    label: "Processing",
    description: "Your order is being processed. Items will be delivered shortly.",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <RefreshCw size={22} className="text-blue-500 animate-spin" />,
    step: 2,
  },
  3: {
    label: "Completed",
    description: "Your order has been fulfilled successfully. Enjoy your items!",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle size={22} className="text-green-500" />,
    step: 3,
  },
  4: {
    label: "Failed",
    description: "Your order could not be processed. Please contact support.",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <XCircle size={22} className="text-red-500" />,
    step: 0,
  },
};

// Map Item4Gamer status strings to our state numbers
function i4gStatusToState(status: string): number {
  const s = status?.toLowerCase() || "";
  if (s === "completed" || s === "success" || s === "delivered") return 3;
  if (s === "processing" || s === "pending_fulfillment" || s === "in_progress") return 2;
  if (s === "failed" || s === "cancelled" || s === "refunded") return 4;
  return 1; // default: pending
}

const STEPS = ["Order Placed", "Processing", "Completed"];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

export function OrderTrackingPage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [polling, setPolling] = useState(false);

  // Check if this is an Item4Gamer order
  const isI4GOrder = !!(referenceId?.startsWith("i4g_"));

  const fetchOrder = async () => {
    if (!referenceId) return;

    if (isI4GOrder) {
      // Extract numeric order_id from reference like "i4g_12345"
      const orderId = referenceId.replace("i4g_", "");
      try {
        const i4gOrder = await item4gamerApi.getOrder(orderId);
        const state = i4gStatusToState(i4gOrder.status);
        setOrder({
          id: referenceId,
          reference_id: referenceId,
          order_id: String(i4gOrder.order_id),
          game_name: i4gOrder.product_name || "Item4Gamer Product",
          sku_name: i4gOrder.variation_name || "—",
          quantity: i4gOrder.quantity ?? 1,
          price: i4gOrder.total_price ?? 0,
          state,
          user_email: null,
          extra_info: {},
          created_at: i4gOrder.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          callback_received_at: state === 3 ? (i4gOrder.created_at || null) : null,
        });
        setPolling(state === 1 || state === 2);
        setNotFound(false);
      } catch {
        // Fall back to local DB
        const { data } = await supabase.from("orders").select("*").eq("reference_id", referenceId).single();
        if (data) {
          setOrder(data as Order);
          setPolling(data.state === 1 || data.state === 2);
        } else {
          setNotFound(true);
        }
      }
      setIsLoading(false);
      return;
    }

    // Standard LootBar order
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("reference_id", referenceId)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setOrder(data as Order);
      setPolling(data.state === 1 || data.state === 2);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [referenceId]);

  // Poll every 10 seconds while pending/processing
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [polling]);

  const stateInfo = order ? (STATE_CONFIG[order.state] ?? STATE_CONFIG[1]) : null;
  const currentStep = stateInfo?.step ?? 0;

  const renderSkeleton = () => (
    <div className="space-y-4 max-w-xl mx-auto px-4 pt-8">
      <div className="shimmer h-8 w-48 rounded-xl" />
      <div className="shimmer h-32 rounded-2xl" />
      <div className="shimmer h-48 rounded-2xl" />
    </div>
  );

  const renderNotFound = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <Package size={56} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
      <p className="text-gray-500 text-sm mb-6">
        No order found with reference ID <span className="font-mono font-semibold text-gray-700">{referenceId}</span>.
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-yellow-400 text-black font-bold px-8 py-3 rounded-2xl hover:bg-yellow-300 transition"
      >
        Back to Home
      </button>
    </div>
  );

  const OrderContent = () => (
    <div className="max-w-xl mx-auto px-4 pb-12 pt-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-xl font-black text-gray-900 mb-1">Order Tracking</h1>
      <div className="flex items-center gap-1 text-sm text-gray-400 mb-6 font-mono">
        #{order!.reference_id}
        <CopyButton text={order!.reference_id} />
        {isI4GOrder && (
          <span className="ml-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            🇭🇹 Item4Gamer
          </span>
        )}
      </div>

      {/* Status banner */}
      <div className={`flex items-start gap-4 p-5 rounded-2xl border mb-6 ${stateInfo!.bg} ${stateInfo!.border}`}>
        <div className="flex-shrink-0 mt-0.5">{stateInfo!.icon}</div>
        <div>
          <p className={`font-bold text-base ${stateInfo!.color}`}>{stateInfo!.label}</p>
          <p className={`text-sm mt-0.5 ${stateInfo!.color} opacity-80`}>{stateInfo!.description}</p>
        </div>
      </div>

      {/* Progress steps (only for non-failed orders) */}
      {order!.state !== 4 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : isCurrent
                          ? "bg-yellow-400 border-yellow-400"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={14} className="text-white" />
                      ) : (
                        <span className={`text-xs font-bold ${isCurrent ? "text-black" : "text-gray-400"}`}>
                          {stepNum}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 text-center whitespace-nowrap ${
                      isCompleted ? "text-green-600" : isCurrent ? "text-yellow-700" : "text-gray-400"
                    }`}>{step}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${isCompleted ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order details */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Order Details</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: "Game", value: order!.game_name },
            { label: "Package", value: order!.sku_name },
            { label: "Quantity", value: String(order!.quantity ?? 1) },
            { label: "Amount Paid", value: `$${Number(order!.price).toFixed(2)}` },
            { label: "Order Date", value: new Date(order!.created_at).toLocaleString() },
            ...(order!.order_id ? [{ label: "Provider Order ID", value: order!.order_id }] : []),
            ...(order!.callback_received_at ? [{ label: "Fulfilled At", value: new Date(order!.callback_received_at).toLocaleString() }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] break-all">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Extra info (player details) */}
      {order!.extra_info && Object.keys(order!.extra_info).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Player Information</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(order!.extra_info).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-sm font-semibold text-gray-900">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {(order!.state === 1 || order!.state === 2) && (
          <button
            onClick={fetchOrder}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition text-sm"
          >
            <RefreshCw size={15} /> Refresh Status
          </button>
        )}
        {order!.state === 4 && (
          <button
            onClick={() => navigate("/support")}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl transition text-sm"
          >
            Contact Support
          </button>
        )}
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-2xl transition text-sm"
        >
          Continue Shopping <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex flex-col min-h-screen bg-[#f5f5f5]">
        <DesktopHeader />
        <div className="flex-1">
          {isLoading ? renderSkeleton() : notFound ? renderNotFound() : <OrderContent />}
        </div>
        <Footer />
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col min-h-screen bg-[#f5f5f5]">
        <Header showMenu />
        <div className="flex-1 pb-20">
          {isLoading ? renderSkeleton() : notFound ? renderNotFound() : <OrderContent />}
        </div>
        <MobileFooter />
      </div>
    </>
  );
}
