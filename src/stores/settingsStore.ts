import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/constants/translations";
import { CURRENCY_RATES } from "@/constants/translations";

interface SettingsState {
  language: Language;
  currency: string;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: string) => void;
  formatPrice: (usdPrice: number) => string;
  currencySymbol: () => string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", IDR: "Rp", MYR: "RM",
  SGD: "S$", THB: "฿", VND: "₫", PHP: "₱", BRL: "R$",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "en",
      currency: "USD",

      setLanguage: (lang) => set({ language: lang }),
      setCurrency: (currency) => set({ currency }),

      formatPrice: (usdPrice: number) => {
        const { currency } = get();
        const rate = CURRENCY_RATES[currency] || 1;
        const converted = usdPrice * rate;
        const symbol = CURRENCY_SYMBOLS[currency] || "$";

        if (currency === "IDR" || currency === "VND") {
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
