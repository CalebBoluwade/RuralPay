import en from "./src/locales/en.json";
import gZ from "./src/locales/gZ.json";
import ha from "./src/locales/ha.json";
import ig from "./src/locales/ig.json";
import yo from "./src/locales/yo.json";

export type Language = "en" | "gZ" | "yo" | "ig" | "ha";

export const translations: Record<Language, typeof en> = {
  en,
  gZ,
  yo,
  ig,
  ha,
};

export const languageNames: Record<Language, { label: string; flag: string }> =
  {
    en: { label: "English", flag: "🇬🇧" },
    gZ: { label: "Gen Z", flag: "🇬🇧" },
    yo: { label: "Yoruba", flag: "🇳🇬" },
    ig: { label: "Igbo", flag: "🇳🇬" },
    ha: { label: "Hausa", flag: "🇳🇬" },
  };

export function getNestedTranslation(obj: any, path: string): string {
  return path.split(".").reduce((acc, part) => acc?.[part], obj) || path;
}
