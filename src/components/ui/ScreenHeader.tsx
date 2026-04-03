import { MenuItemBase, menuItemsStore } from "@/src/lib/menuItemsStore";
import { router } from "expo-router";
import {
  ArrowLeft,
  Bell,
  LucideIcon,
  MoreHorizontal,
} from "lucide-react-native";
import React from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { useAuth } from "../context/AuthSessionProvider";
import SelectLanguageModal from "./Modals/SelectLanguageModal";

export interface MenuItem extends MenuItemBase {
  icon?: LucideIcon;
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
  const { user, isAuthenticated } = useAuth();

  return (
    <View className="px-6 mt-2 mb-3">
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
            <ArrowLeft size={18} color={isDark ? "white" : "black"} />
          </Pressable>
        )}

        <View className="flex-1">
          <Text
            className={`${subtitle ? "text-lg" : "text-xl"} font-brand font-bold mb-1 ${
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

        {isAuthenticated ? (
          <Pressable
            className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
            onPress={() => router.push("/notifications")}
          >
            <Bell size={16} color={isDark ? "white" : "black"} />
          </Pressable>
        ) : null}

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
            <MoreHorizontal size={18} color={isDark ? "white" : "black"} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default ScreenHeader;
