import { useSettingsStore } from "@/stores/settingsStore";
import { T } from "@/constants/translations";

export function useTranslation() {
  const { language } = useSettingsStore();
  const translations = T[language];

  const t = (key: keyof typeof translations) => translations[key] ?? key;

  return { t, language };
}
