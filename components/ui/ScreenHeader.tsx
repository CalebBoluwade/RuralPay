import React from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  goBack?: boolean;
  onBack?: () => void;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  goBack = true,
  onBack,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="px-3 mb-3 pt-3">
      <View className="flex-row justify-between items-center">
        {goBack && (
          <TouchableOpacity
            className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
            onPress={() => onBack?.()}
          >
            <Text
              className={`text-xl ${isDark ? "text-white" : "text-gray-700"}`}
            >
              ←
            </Text>
          </TouchableOpacity>
        )}

        <View className="flex-1">
          <Text
            className={`text-2xl font-bold mb-1 ${
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
      </View>
    </View>
  );
};

export default ScreenHeader;
