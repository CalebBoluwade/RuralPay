import { languageNames } from "@/i18n";
import { useLanguage } from "@/src/components/context/LanguageContext";
import { router } from "expo-router";
import { Pressable, Text, useColorScheme } from "react-native";

const SelectLanguageModal = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { language } = useLanguage();

  return (
    <Pressable
      onPress={() => router.push("/select-language")}
      className={`w-10 h-10 rounded-full items-center justify-center ${
        isDark
          ? "bg-white/10 border border-white/20"
          : "bg-black/20 border border-gray-200/50"
      } backdrop-blur`}
    >
      <Text className="text-xl">{languageNames[language].flag}</Text>
    </Pressable>
  );
};

export default SelectLanguageModal;
