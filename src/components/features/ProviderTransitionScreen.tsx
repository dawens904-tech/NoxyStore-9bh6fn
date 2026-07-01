/**
 * ProviderTransitionScreen — Full-screen white loading overlay shown when
 * switching between LootBar and Item4Gamer providers (Haiti mode toggle).
 * Progress speed is driven by network probing rather than a fixed timer.
 */
import { useEffect, useState, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

interface Props {
  targetProvider: "lootbar" | "item4gamer";
  onComplete: () => void;
}

export function ProviderTransitionScreen({ targetProvider, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(Date.now());
  const networkSpeedRef = useRef<number>(1); // multiplier based on measured speed
  const completedRef = useRef(false);

  const isHaiti = targetProvider === "item4gamer";

  // Status messages keyed by progress milestone
  const getStatusText = (p: number): string => {
    if (isHaiti) {
      if (p < 15) return "Pweparasyon koneksyon...";
      if (p < 30) return "Chanje pwovizè a...";
      if (p < 50) return "Chaje pwodui Item4Gamer...";
      if (p < 70) return "Konfigirasyon pri HTG...";
      if (p < 85) return "Prese-w...";
      if (p < 95) return "Prèske fini...";
      return "Kounye a ap aktyalize...";
    } else {
      if (p < 15) return "Preparing connection...";
      if (p < 30) return "Switching provider...";
      if (p < 50) return "Loading LootBar games...";
      if (p < 70) return "Restoring settings...";
      if (p < 85) return "Almost there...";
      if (p < 95) return "Finalizing...";
      return "Refreshing now...";
    }
  };

  useEffect(() => {
    // Probe network speed with a small fetch
    const probeStart = performance.now();
    fetch(`https://lcfbkgryqwjlbtowlcfb.backend.onspace.ai/`, {
      method: "HEAD",
      cache: "no-cache",
    })
      .then(() => {
        const ms = performance.now() - probeStart;
        // Fast (<200ms) = speed 2x, slow (>1s) = 0.5x
        networkSpeedRef.current = ms < 200 ? 2 : ms < 600 ? 1.5 : ms < 1000 ? 1 : 0.7;
      })
      .catch(() => {
        networkSpeedRef.current = 0.8;
      });

    // Animate progress
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const speed = networkSpeedRef.current;

      // Non-linear easing: fast start, slow near 95%
      let target = 0;
      if (elapsed < 500) target = 20 * speed;
      else if (elapsed < 1500) target = 20 + (elapsed - 500) * 0.03 * speed;
      else if (elapsed < 3000) target = 50 + (elapsed - 1500) * 0.02 * speed;
      else if (elapsed < 5000) target = 80 + (elapsed - 3000) * 0.0075 * speed;
      else target = 95;

      const capped = Math.min(target, 95);
      setProgress((prev) => {
        const next = Math.max(prev, capped);
        setStatusText(getStatusText(next));
        return next;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    // After probing completes (min 1.5s, max 6s depending on speed), push to 100
    const finishDelay = Math.max(1500, Math.min(6000, 3000 / networkSpeedRef.current));

    const completeTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setProgress(100);
      setStatusText(isHaiti ? "Kounye a ap aktyalize!" : "Done! Refreshing...");
      setTimeout(onComplete, 400);
    }, finishDelay);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center px-8">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-4xl font-black text-gray-900 tracking-tight mb-1">
          <span className="text-yellow-400">N</span>oxyStore
        </div>
        <p className="text-sm text-gray-400 font-medium">
          {isHaiti ? "🇭🇹 Chanje ak Item4Gamer" : "🌐 Retounen ak LootBar"}
        </p>
      </div>

      {/* Provider switch visual */}
      <div className="flex items-center gap-4 mb-10">
        <div className={`flex flex-col items-center gap-1 transition-opacity ${isHaiti ? "opacity-40" : "opacity-100"}`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">L</div>
          <span className="text-xs font-semibold text-gray-500">LootBar</span>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-1">
          <div className="w-8 h-0.5 bg-gray-200 rounded" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>

        <div className={`flex flex-col items-center gap-1 transition-opacity ${isHaiti ? "opacity-100" : "opacity-40"}`}>
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-md">I</div>
          <span className="text-xs font-semibold text-gray-500">Item4Gamer</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">{statusText}</span>
          <span className="text-sm font-black text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
        {isHaiti
          ? "Nou ap chanje tout pwodui yo pou sèvi ak Item4Gamer pou kliyan Ayiti yo."
          : "Switching back to LootBar. All product data will be refreshed."}
      </p>
    </div>
  );
}
