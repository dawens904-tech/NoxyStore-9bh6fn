import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/constants/translations";
import { CURRENCY_RATES } from "@/constants/translations";

export type Provider = "lootbar" | "item4gamer";

interface SettingsState {
  language: Language;
  currency: string;
  provider: Provider;
  isHaitiMode: boolean;
  isTransitioning: boolean;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: string) => void;
  setProvider: (provider: Provider) => void;
  setHaitiMode: (enabled: boolean) => void;
  setTransitioning: (v: boolean) => void;
  formatPrice: (usdPrice: number) => string;
  currencySymbol: () => string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", IDR: "Rp", MYR: "RM",
  SGD: "S$", THB: "฿", VND: "₫", PHP: "₱", BRL: "R$",
  HTG: "G",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "en",
      currency: "USD",
      provider: "lootbar",
      isHaitiMode: false,
      isTransitioning: false,

      setLanguage: (lang) => set({ language: lang }),
      setCurrency: (currency) => set({ currency }),
      setProvider: (provider) => set({ provider }),
      setHaitiMode: (enabled) => set({ isHaitiMode: enabled }),
      setTransitioning: (v) => set({ isTransitioning: v }),

      formatPrice: (usdPrice: number) => {
        const { currency } = get();
        const rate = CURRENCY_RATES[currency] || 1;
        const converted = usdPrice * rate;
        const symbol = CURRENCY_SYMBOLS[currency] || "$";

        if (currency === "IDR" || currency === "VND" || currency === "HTG") {
          return `${symbol}${Math.round(converted).toLocaleString()}`;
        }
        return `${symbol}${converted.toFixed(2)}`;
      },

      currencySymbol: () => {
        const { currency } = get();
        return CURRENCY_SYMBOLS[currency] || "$";
      },
    }),
    { name: "noxy-settings" }
  )
);
