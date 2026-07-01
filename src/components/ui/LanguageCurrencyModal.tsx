import { useState } from "react";
import { X } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { LANGUAGES, CURRENCIES } from "@/constants/translations";
import { useTranslation } from "@/hooks/useTranslation";
import { ProviderTransitionScreen } from "@/components/features/ProviderTransitionScreen";
import { toast } from "sonner";
import type { Language } from "@/constants/translations";

interface LanguageCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageCurrencyModal({ isOpen, onClose }: LanguageCurrencyModalProps) {
  const { language, currency, setLanguage, setCurrency, setProvider, setHaitiMode } = useSettingsStore();
  const { t } = useTranslation();

  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [transitioning, setTransitioning] = useState(false);
  const [targetProvider, setTargetProvider] = useState<"lootbar" | "item4gamer">("lootbar");

  const isHaitiSelection = (lang: Language, cur: string) =>
    lang === "ht" || cur === "HTG";

  const wasHaiti = isHaitiSelection(language, currency);
  const willBeHaiti = isHaitiSelection(selectedLang, selectedCurrency);

  const handleConfirm = () => {
    const needsTransition = wasHaiti !== willBeHaiti;
    const newProvider = willBeHaiti ? "item4gamer" : "lootbar";

    // Apply language & currency immediately
    setLanguage(selectedLang);
    setCurrency(selectedCurrency);

    if (needsTransition) {
      setTargetProvider(newProvider);
      setTransitioning(true);
      onClose();
    } else {
      setProvider(newProvider);
      setHaitiMode(willBeHaiti);
      toast.success("Settings updated!");
      onClose();
    }
  };

  const handleTransitionComplete = () => {
    setProvider(targetProvider);
    setHaitiMode(targetProvider === "item4gamer");
    setTransitioning(false);
    // Reload page to apply new provider
    setTimeout(() => window.location.reload(), 100);
  };

  if (transitioning) {
    return (
      <ProviderTransitionScreen
        targetProvider={targetProvider}
        onComplete={handleTransitionComplete}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{t("languageAndCurrency")}</h2>
          <div className="w-7" />
        </div>

        {/* Language */}
        <div className="mb-5">
          <label className="text-sm text-gray-500 mb-2 block font-medium">{t("language")}</label>
          <div className="relative">
            <select
              value={selectedLang}
              onChange={(e) => {
                const lang = e.target.value as Language;
                setSelectedLang(lang);
                // Auto-set HTG when Haitian Creole is selected
                if (lang === "ht") setSelectedCurrency("HTG");
              }}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="mb-6">
          <label className="text-sm text-gray-500 mb-2 block font-medium">{t("displayCurrency")}</label>
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Haiti hint */}
        {willBeHaiti && (
          <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-lg">🇭🇹</span>
            <div>
              <p className="text-xs font-bold text-blue-800">Haiti Mode</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Products will switch to Item4Gamer with HTG pricing. A smooth transition will be applied.
              </p>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-bold text-base rounded-lg py-4 transition-colors"
        >
          {t("confirm")}
        </button>
      </div>
    </div>
  );
}
