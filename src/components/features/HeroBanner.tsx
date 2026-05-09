import { useState, useEffect, useCallback } from "react";
import { BANNER_IMAGES } from "@/constants/mockData";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface DBBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link: string;
}

export function HeroBanner() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<DBBanner[]>([]);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("home_banners").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => { if (data && data.length > 0) setBanners(data as DBBanner[]); });
  }, []);

  const items = banners.length > 0 ? banners : BANNER_IMAGES.map((b, i) => ({
    id: String(i),
    title: b.title,
    subtitle: b.subtitle,
    image_url: (b as any).fallback || (b as any).image || "",
    link: "/",
  }));

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative mx-3 rounded-2xl overflow-hidden h-44 bg-gray-900">
      {items.map((banner, idx) => {
        const src = imgErrors[banner.id] ? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=300&fit=crop" : banner.image_url;
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? "opacity-100" : "opacity-0"}`}
            onClick={() => banner.link && banner.link !== "/" && navigate(banner.link)}
            style={{ cursor: banner.link && banner.link !== "/" ? "pointer" : "default" }}
          >
            <img
              src={src}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={() => setImgErrors((p) => ({ ...p, [banner.id]: true }))}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">{banner.subtitle}</p>
              <h3 className="text-base font-bold mt-0.5">{banner.title}</h3>
            </div>
          </div>
        );
      })}

      {/* Dots */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 items-center">
        {items.map((_, idx) => (
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
