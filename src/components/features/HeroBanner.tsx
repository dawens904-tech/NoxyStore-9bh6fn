import { useState, useEffect, useCallback } from "react";
import { BANNER_IMAGES } from "@/constants/mockData";

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % BANNER_IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next]);

  const handleImgError = (id: number) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="relative mx-3 rounded-2xl overflow-hidden h-44 bg-gray-900">
      {BANNER_IMAGES.map((banner, idx) => {
        const src = imgErrors[banner.id] ? banner.fallback : banner.image;
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={src}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={() => handleImgError(banner.id)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                {banner.subtitle}
              </p>
              <h3 className="text-base font-bold mt-0.5">{banner.title}</h3>
            </div>
          </div>
        );
      })}

      {/* Dots */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 items-center">
        {BANNER_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`banner-dot ${idx === current ? "active" : ""}`}
            aria-label={`Banner ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
