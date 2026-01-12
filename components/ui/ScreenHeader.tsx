import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  goBack?: boolean;
  onBack?: () => void;
  isDark?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  goBack = true,
  onBack,
  isDark = false,
}) => {
  return (
    <View className="px-6 pt-4 pb-3 mb-3">
      <View className="flex-row justify-between items-center mb-3">
        {goBack && (
          <TouchableOpacity
            className={` w-10 h-10 rounded-2xl items-center justify-center border mr-4 ${
              isDark
                ? "bg-white/10 backdrop-blur border-white/20"
                : "bg-white/50 backdrop-blur border-white/50"
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
