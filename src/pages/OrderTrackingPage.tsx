/**
 * Order Tracking Page — polls Lootbar API every 10 seconds for real-time status.
 * Sends browser notification when top-up completes.
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Clock, ArrowLeft, RefreshCw, Package, Zap, Shield } from "lucide-react";
import { lootbarApi } from "@/lib/lootbar-api";
import { useAuthStore } from "@/stores/authStore";
import { ORDER_STATE_MAP } from "@/types";
import type { OrderState } from "@/types";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { toast } from "sonner";

const STATE_TIMELINE = [
  { state: 1, label: "In Transaction", icon: Loader2, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  { state: 2, label: "Success", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-200" },
  { state: 3, label: "Failed", icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  { state: 4, label: "Settlement", icon: Package, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
  { state: 5, label: "Partially Successful", icon: Zap, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  { state: 6, label: "Cancelled", icon: XCircle, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
];

export function OrderTrackingPage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const navigate = useNavigate();
  const { orders, updateOrderState } = useAuthStore();

  const [state, setState] = useState<OrderState>(1);
  const [orderId, setOrderId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [pollCount, setPollCount] = useState(0);
  const [notified, setNotified] = useState(false);

  const order = orders.find((o) => o.reference_id === referenceId || o.order_id === referenceId);

  const fetchStatus = useCallback(async () => {
    if (!referenceId) return;
    setIsLoading(true);
    try {
      const res = await lootbarApi.queryOrder(referenceId);
      const newState = res.state as OrderState;
      setState(newState);
      if (res.order_id) setOrderId(res.order_id);
      setLastCheck(new Date());
      setPollCount((c) => c + 1);
      updateOrderState(referenceId, newState);

      // Browser notification on completion
      if (!notified && (newState === 2 || newState === 4 || newState === 5)) {
        setNotified(true);
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("NoxyStore — Top-up Complete!", {
              body: `Your top-up has been delivered successfully!`,
              icon: "/favicon.svg",
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((perm) => {
              if (perm === "granted") {
                new Notification("NoxyStore — Top-up Complete!", {
                  body: "Your top-up has been delivered!",
                  icon: "/favicon.svg",
                });
              }
            });
          }
        }
        toast.success("Top-up completed! Delivered to your account.");
      }
    } catch (err) {
      console.error("[OrderTracking] Error:", err);
      toast.error("Could not fetch order status");
    } finally {
      setIsLoading(false);
    }
  }, [referenceId, notified, updateOrderState]);

  // Initial load + polling
  useEffect(() => {
    if (order) setState(order.state);
    fetchStatus();

    // Poll every 10 seconds if still in-progress
    const interval = setInterval(() => {
      if (state !== 1) return; // Stop polling if resolved
      fetchStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [referenceId]);

  const stateInfo = ORDER_STATE_MAP[state] || ORDER_STATE_MAP[1];
  const currentStep = STATE_TIMELINE.find((s) => s.state === state);
  const isResolved = state !== 1;

  const StatusIcon = currentStep?.icon || Loader2;

  const TimelineStep = ({ step, active, done }: { step: typeof STATE_TIMELINE[0]; active: boolean; done: boolean }) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? `${step.bg} ${step.border}` : "bg-gray-50 border-gray-100"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${active ? step.bg : "bg-gray-200"}`}>
        {active ? (
          <step.icon size={16} className={`${step.color} ${step.state === 1 && active ? "animate-spin" : ""}`} />
        ) : done ? (
          <CheckCircle size={16} className="text-green-500" />
        ) : (
          <Clock size={16} className="text-gray-400" />
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? step.color.replace("text-", "text-").replace("-500", "-700") : "text-gray-400"}`}>
          {step.label}
        </p>
        {active && <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastCheck.toLocaleTimeString()}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Main status card */}
        <div className={`rounded-3xl p-6 mb-4 text-center ${currentStep?.bg || "bg-blue-50"} border ${currentStep?.border || "border-blue-200"}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-white shadow-sm`}>
            <StatusIcon
              size={40}
              className={`${currentStep?.color || "text-blue-500"} ${state === 1 ? "animate-spin" : ""}`}
            />
          </div>

          <h1 className="text-xl font-black text-gray-900 mb-1">{stateInfo.label}</h1>
          {order && <p className="text-gray-600 text-sm">{order.game_name} — {order.sku_name}</p>}
          {orderId && <p className="text-xs text-gray-400 font-mono mt-2">Order ID: {orderId}</p>}
          <p className="text-xs text-gray-400 font-mono mt-1">Ref: {referenceId}</p>

          {state === 1 && (
            <p className="text-sm text-blue-600 mt-3 font-medium">Auto-refreshing every 10 seconds...</p>
          )}
          {state === 2 && (
            <div className="mt-3 bg-green-100 rounded-2xl px-4 py-2">
              <p className="text-sm text-green-700 font-semibold">Delivered to your account!</p>
            </div>
          )}
        </div>

        {/* Order details */}
        {order && (
          <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Order Details</h3>
            <div className="space-y-2">
              {[
                { label: "Game", value: order.game_name },
                { label: "Package", value: order.sku_name },
                { label: "Amount", value: `$${order.price.toFixed(2)}` },
                { label: "Date", value: new Date(order.created_at).toLocaleString() },
                ...Object.entries(order.extra_info || {}).map(([k, v]) => ({
                  label: k.charAt(0).toUpperCase() + k.slice(1),
                  value: String(v),
                })),
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Order Timeline</h3>
          <div className="space-y-2">
            {STATE_TIMELINE.slice(0, 3).map((step) => (
              <TimelineStep
                key={step.state}
                step={step}
                active={state === step.state}
                done={state > step.state && step.state === 1}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh ({pollCount} checks)
          </button>

          {isResolved && (
            <button
              onClick={() => navigate("/")}
              className="flex-1 btn-primary"
            >
              Back to Store
            </button>
          )}

          {!isResolved && (
            <button
              onClick={() => {
                if ("Notification" in window && Notification.permission !== "granted") {
                  Notification.requestPermission();
                  toast.success("You will be notified when your top-up completes!");
                }
              }}
              className="flex-1 bg-blue-50 border border-blue-200 rounded-2xl py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Notify Me
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
