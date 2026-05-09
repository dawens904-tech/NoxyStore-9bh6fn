import { useLocation, useNavigate } from "react-router-dom";
import { Home, Layers, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useTranslation } from "@/hooks/useTranslation";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const totalItems = useCartStore((s) => s.getTotalItems());

  const NAV_ITEMS = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/categories", label: t("categories"), icon: Layers },
    { path: "/cart", label: t("cart"), icon: ShoppingCart },
    { path: "/account", label: t("myAccount"), icon: User },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path ||
            (path === "/" && location.pathname === "/");
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative transition-colors ${
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
              aria-label={label}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {path === "/cart" && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
