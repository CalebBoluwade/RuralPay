import { MenuItemBase, menuItemsStore } from "@/src/lib/menuItemsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import SelectLanguageModal from "./Modals/SelectLanguageModal";

export interface MenuItem extends MenuItemBase {
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  goBack?: boolean;
  onBack?: () => void;
  menuItems?: MenuItem[];
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  goBack = true,
  onBack,
  menuItems,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="px-6 mb-3">
      <View className="flex-row items-center justify-between">
        {goBack && (
          <Pressable
            className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
            onPress={() => onBack?.()}
          >
            <Ionicons
              name="arrow-back-outline"
              size={18}
              className={`${isDark ? "text-white" : "text-gray-700"}`}
              color={isDark ? "white" : "black"}
            />
          </Pressable>
        )}

        <View className="flex-1">
          <Text
            className={`${subtitle ? "text-xl" : "text-2xl"} font-bold mb-1 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className={`text-lg ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <Pressable
          className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50"
          }`}
          onPress={() => router.push("/common/Notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={16}
            className={`${isDark ? "text-white" : "text-gray-700"}`}
            color={isDark ? "white" : "black"}
          />
        </Pressable>

        {/* Language Selection */}
        <SelectLanguageModal />

        {menuItems && menuItems.length > 0 && (
          <Pressable
            className={`w-12 h-12 rounded-2xl items-center justify-center ml-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
            onPress={() => {
              menuItemsStore.set(menuItems);
              router.push("/screen-menu");
            }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={isDark ? "white" : "black"}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default ScreenHeader;
