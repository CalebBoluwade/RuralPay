import { getNestedTranslation, Language, translations } from "@/i18n";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = SecureStore.getItem("app_language");
      if (
        saved &&
        (saved === "en" || saved === "yo" || saved === "ig" || saved === "ha")
      ) {
        setLanguageState(saved as Language);
      }
    } catch (error) {
      if (__DEV__) console.error("Failed to load language:", error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      SecureStore.setItem("app_language", lang);
      setLanguageState(lang);
    } catch (error) {
      if (__DEV__) console.error("Failed to save language:", error);
    }
  };

  const t = (key: string): string => {
    return getNestedTranslation(translations[language], key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
