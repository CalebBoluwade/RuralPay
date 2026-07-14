import { useProfileHandlers } from "@/src/hooks/useProfileHandlers";
import { MenuItemBase, menuItemsStore } from "@/src/lib/menuItemsStore";
import { router, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  LucideIcon,
  MoreHorizontal,
  Power,
} from "lucide-react-native";
import React, { useCallback } from "react";
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

  useLargerTitle?: boolean; // New prop to control title size

  showLanguageSelector?: boolean; // New prop to control language selector visibility
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  goBack = true,
  onBack,
  menuItems,
  useLargerTitle = false,
  showLanguageSelector = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const nav = useRouter();
  let canGoBack = false;
  try {
    canGoBack = router.canGoBack();
  } catch {}
  const {
    isAuthenticated,
    logout,
    updateNativeAuthSettings,
    nativeAuthLogin,
    nativeAuthTransactions,
    user,
  } = useAuth();

  // Use profile handlers hook
  const { handleLogout } = useProfileHandlers({
    logout,
    updateNativeAuthSettings,
    nativeAuthLogin,
    nativeAuthTransactions,
    user,
  });

  const handleLogoutPress = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  return (
    <View className="px-2 mt-4 mb-3">
      <View className="flex-row items-center justify-between">
        {goBack && canGoBack && (
          <Pressable
            className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
            style={{ transform: [{ rotate: "180deg" }] }}
            onPress={() => (onBack ? onBack() : nav.back())}
          >
            <ArrowLeft size={18} color={isDark ? "white" : "black"} />
          </Pressable>
        )}

        <View className="flex-1">
          <Text
            className={`${subtitle ? "text-lg" : useLargerTitle ? "text-3xl" : "text-xl"} font-brand font-bold mb-1 ${
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
          <>
            <Pressable
              className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
              }`}
              onPress={() => router.push("/notifications")}
            >
              <Bell size={16} color={isDark ? "white" : "black"} />
            </Pressable>

            <Pressable
              className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
              }`}
              onPress={handleLogoutPress}
            >
              <Power size={16} color="#ef4444" />
            </Pressable>
          </>
        ) : null}

        {/* Language Selection */}
        {showLanguageSelector && <SelectLanguageModal />}

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
