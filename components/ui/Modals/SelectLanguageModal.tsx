import { useLanguage } from "@/components/context/LanguageContext";
import { languageNames } from "@/i18n";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, Text, useColorScheme, View } from "react-native";

const SelectLanguageModal = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  return (
    <>
      {/* Language Button */}
      <View>
        <Pressable
          onPress={() => setShowLanguageModal(true)}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-black/20 border border-gray-200/50"
          } backdrop-blur`}
        >
          <Text className="text-xl">{languageNames[language].flag}</Text>
        </Pressable>
      </View>

      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View
            className={`rounded-t-3xl p-6 ${isDark ? "bg-[#1a1a2e]" : "bg-white"} border-t border-white/20`}
          >
            <View className="items-center mb-6">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
              >
                <Ionicons
                  name="language"
                  size={32}
                  color={isDark ? "#84cc16" : "#65a30d"}
                />
              </View>
              <Text
                className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Select Language
              </Text>
            </View>

            {Object.entries(languageNames).map(([key, { label, flag }]) => (
              <Pressable
                key={key}
                onPress={async () => {
                  await setLanguage(key as any);
                  setShowLanguageModal(false);
                }}
                className={`p-4 rounded-2xl mb-3 backdrop-blur-xl ${
                  language === key
                    ? isDark
                      ? "bg-lime-600 border-2 border-lime-400"
                      : "bg-lime-100 border-2 border-lime-400"
                    : isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-50 border border-gray-200"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{flag}</Text>
                    <Text
                      className={`text-lg font-semibold ${
                        language === key
                          ? isDark
                            ? "text-white"
                            : "text-lime-700"
                          : isDark
                            ? "text-white"
                            : "text-gray-900"
                      }`}
                    >
                      {label}
                    </Text>
                  </View>
                  {language === key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={isDark ? "#84cc16" : "#65a30d"}
                    />
                  )}
                </View>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setShowLanguageModal(false)}
              className={`py-4 rounded-2xl mt-2 ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-100 border border-gray-200"}`}
            >
              <Text
                className={`text-center font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SelectLanguageModal;
