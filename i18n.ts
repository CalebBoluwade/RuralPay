import en from "./locales/en.json";
import ha from "./locales/ha.json";
import ig from "./locales/ig.json";
import yo from "./locales/yo.json";

export type Language = "en" | "yo" | "ig" | "ha";

export const translations: Record<Language, typeof en> = {
  en,
  yo,
  ig,
  ha,
};

export const languageNames: Record<Language, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  yo: { label: "Yoruba", flag: "🇳🇬" },
  ig: { label: "Igbo", flag: "🇳🇬" },
  ha: { label: "Hausa", flag: "🇳🇬" },
};

export function getNestedTranslation(obj: any, path: string): string {
  return path.split(".").reduce((acc, part) => acc?.[part], obj) || path;
}
