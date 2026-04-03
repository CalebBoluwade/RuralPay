import en from "./src/locales/en.json";

export type Language = "en" | "gZ" | "yo" | "ig" | "ha";

const localeLoaders: Record<Exclude<Language, "en">, () => Promise<typeof en>> = {
  gZ: () => import("./src/locales/gZ.json"),
  ha: () => import("./src/locales/ha.json"),
  ig: () => import("./src/locales/ig.json"),
  yo: () => import("./src/locales/yo.json"),
};

const cache: Partial<Record<Language, typeof en>> = { en };

export async function getTranslations(lang: Language): Promise<typeof en> {
  if (cache[lang]) return cache[lang]!;
  const mod = await localeLoaders[lang as Exclude<Language, "en">]();
  cache[lang] = (mod as any).default ?? mod;
  return cache[lang]!;
}

// Kept for backwards compat — synchronous access returns cached or falls back to en
export const translations: Record<Language, typeof en> = new Proxy({} as any, {
  get(_, lang: Language) {
    return cache[lang] ?? en;
  },
});

export const languageNames: Record<Language, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  gZ: { label: "Gen Z", flag: "🇬🇧" },
  yo: { label: "Yoruba", flag: "🇳🇬" },
  ig: { label: "Igbo", flag: "🇳🇬" },
  ha: { label: "Hausa", flag: "🇳🇬" },
};

export function getNestedTranslation(obj: any, path: string): string {
  return path.split(".").reduce((acc, part) => acc?.[part], obj) || path;
}
