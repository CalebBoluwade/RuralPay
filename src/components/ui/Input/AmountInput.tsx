import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

interface AmountInputProps {
  onAmountChange: (amount: string) => void;
  error?: string;
}

const AmountInput = ({ onAmountChange, error }: AmountInputProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [amount, setAmount] = useState<string>("");

  const handleAmountChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    let numericValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      numericValue = parts[0] + "." + parts.slice(1).join("");
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap);
    }

    setAmount(numericValue);
    onAmountChange(numericValue);
  };

  return (
    <View className="mb-6">
      <View
        className={`rounded-3xl p-4 mx-1 ${
          isDark
            ? "bg-emerald-500/20 border-2 border-lime-500/40"
            : "bg-emerald-50 border-2 border-lime-400"
        }`}
      >
        {/* <Text
          className={`text-sm font-medium pb-2 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Amount
        </Text> */}
        <View className="flex-row items-center justify-center">
          <Text
            className={`text-4xl font-bold mr-2 ${
              isDark ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            ₦
          </Text>
          <TextInput
            className={`text-4xl font-brand font-bold flex-1 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
            placeholder="0.00"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            style={{ minWidth: 120 }}
          />
        </View>

        <View className="pt-4 border-t border-emerald-500/20">
          <View className="flex-row flex-wrap gap-3 items-center">
            {["500", "1000", "2000", "5000", "10000", "20000", "50000"].map(
              (preset) => (
                <Pressable
                  key={preset}
                  onPress={() => handleAmountChange(preset)}
                  className={`px-3 py-1 rounded-full ${
                    isDark ? "bg-emerald-500/30" : "bg-emerald-100"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      isDark ? "text-emerald-300" : "text-emerald-700"
                    }`}
                  >
                    ₦{preset.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </View>
        {error && (
          <Text className="text-red-500 text-lg mt-2 text-center">{error}</Text>
        )}
      </View>
    </View>
  );
};

export default AmountInput;
