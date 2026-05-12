import type { SkuItem } from "@/types";
import { Info } from "lucide-react";

interface SKUCardProps {
  sku: SkuItem;
  selected: boolean;
  onSelect: (sku: SkuItem) => void;
}

export function SKUCard({ sku, selected, onSelect }: SKUCardProps) {
  return (
    <button
      onClick={() => onSelect(sku)}
      className={`sku-card w-full text-left transition-all duration-200 ${
        selected ? "selected" : ""
      }`}
    >
      <div className="flex flex-col gap-2">
        {/* SKU Image */}
        {sku.image && (
          <div className="relative rounded-lg overflow-hidden aspect-video bg-gray-800">
            <img
              src={sku.image}
              alt={sku.sku_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <button
              className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Info size={12} className="text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-white text-xs font-bold line-clamp-2 leading-tight">
                {sku.sku_name}
              </p>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-base font-bold text-[hsl(var(--color-discount))]">
              ${sku.price?.toFixed(2)}
            </span>
            {sku.discount_amount && sku.discount_amount > 0 ? (
              <span className="text-xs text-gray-400 line-through ml-1.5">
                ${sku.original_price?.toFixed(2)}
              </span>
            ) : null}
          </div>
          {sku.discount_amount && sku.discount_amount > 0 ? (
            <span className="bg-[hsl(var(--color-discount))] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -${sku.discount_amount.toFixed(2)}
            </span>
          ) : null}
        </div>

        {!sku.image && (
          <p className="text-sm font-semibold text-gray-800">{sku.sku_name}</p>
        )}
      </div>

      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}
    </button>
  );
}
add real image real price real name.
