import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="page-container bg-white min-h-screen pb-20">
        <div className="bg-[#0a0a0a] px-4 py-4">
          <h1 className="text-white font-bold text-lg">My Cart</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart size={40} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Browse games and add items to top-up</p>
          <button onClick={() => navigate("/")} className="btn-primary px-10">
            Browse Games
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleCheckout = () => {
    if (items.length === 1) {
      const item = items[0];
      navigate("/checkout", {
        state: {
          sku: item.sku,
          game: item.game,
          quantity: item.quantity,
          extraInfo: item.extra_info,
        },
      });
    } else {
      toast.info("Please checkout items one at a time for now");
    }
  };

  return (
    <div className="page-container bg-[#f8f8f8] min-h-screen pb-32">
      <div className="bg-[#0a0a0a] px-4 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">My Cart</h1>
        <button
          onClick={() => { clearCart(); toast.success("Cart cleared"); }}
          className="text-white/50 text-xs font-medium hover:text-white/80"
        >
          Clear All
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {items.map((item) => (
          <div key={item.sku.sku_id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <img
                src={item.game.game_image}
                alt={item.game.game_name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop"; }}
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">{item.game.game_name}</h3>
                <p className="text-xs text-gray-500">{item.sku.sku_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sku.attribute[0]?.value_text}</p>
                {Object.entries(item.extra_info).map(([k, v]) => (
                  <p key={k} className="text-xs text-gray-400">{k}: {v}</p>
                ))}
              </div>
              <button
                onClick={() => { removeItem(item.sku.sku_id); toast.success("Item removed"); }}
                className="text-gray-300 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.sku.sku_id, item.quantity - 1)}
                  className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.sku.sku_id, item.quantity + 1)}
                  className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ${((item.sku.price || 0) * item.quantity).toFixed(2)}
                </p>
                {item.sku.discount_amount && item.sku.discount_amount > 0 ? (
                  <p className="text-xs text-green-500">
                    Save ${(item.sku.discount_amount * item.quantity).toFixed(2)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 font-medium">Total ({items.length} item{items.length > 1 ? "s" : ""})</span>
          <span className="text-xl font-bold text-gray-900">${getTotalPrice().toFixed(2)}</span>
        </div>
        <button onClick={handleCheckout} className="btn-primary w-full">
          Proceed to Checkout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
