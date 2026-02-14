import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import SelectLanguageModal from "./Modals/SelectLanguageModal";

export interface MenuItem {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

{
  /* <ScreenHeader 
  title="Settings" 
  subtitle="Manage your account"
  menuItems={[
    { label: "Edit", icon: "create-outline", onPress: () => console.log("Edit") },
    { label: "Share", icon: "share-outline", onPress: () => console.log("Share") },
    { label: "Delete", icon: "trash-outline", onPress: () => console.log("Delete") }
  ]}
/> */
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
  const [showMenu, setShowMenu] = useState(false);

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
            className={`text-xl font-bold mb-1 ${
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
          onPress={() => {}}
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
          <View>
            <Pressable
              className={`w-12 h-12 rounded-2xl items-center justify-center ml-4 backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
              }`}
              onPress={() => setShowMenu(true)}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={isDark ? "white" : "black"}
              />
            </Pressable>

            <Modal
              visible={showMenu}
              transparent
              animationType="fade"
              onRequestClose={() => setShowMenu(false)}
            >
              <Pressable className="flex-1" onPress={() => setShowMenu(false)}>
                <View className="absolute top-16 right-6 min-w-[200px]">
                  <View
                    className={`rounded-2xl overflow-hidden backdrop-blur-xl ${
                      isDark
                        ? "bg-gray-800/95 border border-white/20"
                        : "bg-white/95 border border-gray-200"
                    }`}
                  >
                    {menuItems.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        className={`flex-row items-center px-4 py-3 ${
                          index !== menuItems.length - 1
                            ? isDark
                              ? "border-b border-white/10"
                              : "border-b border-gray-200"
                            : ""
                        }`}
                        onPress={() => {
                          setShowMenu(false);
                          item.onPress();
                        }}
                      >
                        {item.icon && (
                          <Ionicons
                            name={item.icon}
                            size={20}
                            color={isDark ? "white" : "black"}
                            style={{ marginRight: 12 }}
                          />
                        )}
                        <Text
                          className={`text-base ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Pressable>
            </Modal>
          </View>
        )}
      </View>
    </View>
  );
};

export default ScreenHeader;
