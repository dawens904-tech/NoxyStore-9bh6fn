// GameCard component — supports sm, md, lg sizes + desktop
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LootbarGame } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";

interface GameCardProps {
  game: LootbarGame;
  size?: "sm" | "md" | "lg";
}

export function GameCard({ game, size = "md" }: GameCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/game/${game.game_id}`);
  };

  if (size === "sm") {
    return (
      <button
        onClick={handleClick}
        className="game-card flex flex-col w-full"
      >
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-200">
          <img
            src={game.game_image}
            alt={game.game_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop";
            }}
          />
          {game.discount && game.discount > 0 ? (
            <div className="absolute top-2 left-2 bg-discount text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              -{game.discount}%
            </div>
          ) : null}
        </div>
        <div className="mt-2 px-0.5">
          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
            {game.game_name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} fill="#FFD200" stroke="none" />
            <span className="text-xs font-semibold text-gray-700">{game.rating?.toFixed(1)}</span>
            <span className="text-xs text-gray-400">| {game.sold_count} Sold</span>
          </div>
        </div>
      </button>
    );
  }

  // List item style
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 w-full bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99]"
    >
      <div className="relative flex-shrink-0">
        <img
          src={game.game_image}
          alt={game.game_name}
          className="w-14 h-14 rounded-xl object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop";
          }}
        />
        {game.discount && game.discount > 0 ? (
          <div className="absolute -top-1 -right-1 bg-discount text-white text-[9px] font-bold px-1 py-0.5 rounded-md">
            -{game.discount}%
          </div>
        ) : null}
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-sm font-bold text-gray-900">{game.game_name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{game.category}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={11} fill="#FFD200" stroke="none" />
          <span className="text-xs font-semibold text-gray-700">{game.rating?.toFixed(1)}</span>
          <span className="text-xs text-gray-400">| {game.sold_count} Sold</span>
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

// Grid of skeleton loading cards
export function GameCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="shimmer aspect-square w-full rounded-xl" />
          <div className="mt-2 space-y-1.5">
            <div className="shimmer h-4 w-3/4 rounded" />
            <div className="shimmer h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
