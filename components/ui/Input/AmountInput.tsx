import React, { useState } from "react";
import { Pressable, Text, TextInput, useColorScheme, View } from "react-native";

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

    setAmount(numericValue);
    onAmountChange(numericValue);
  };

  return (
    <View className="mb-8">
      <Text
        className={`text-base font-medium mb-2 p-2 ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Amount
      </Text>
      <View
        className={`rounded-3xl p-6 ${
          isDark
            ? "bg-emerald-500/20 border-2 border-emerald-500/40"
            : "bg-emerald-50 border-2 border-emerald-400"
        }`}
      >
        <View className="flex-row items-center justify-center">
          <Text
            className={`text-4xl font-bold mr-2 ${
              isDark ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            ₦
          </Text>
          <TextInput
            className={`text-4xl font-bold flex-1 ${
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

        <View className="mt-4 pt-4 border-t border-emerald-500/20">
          <View className="flex-row flex-wrap gap-3 items-center">
            <Pressable
              onPress={() => handleAmountChange("1000")}
              className={`px-4 py-2 rounded-full ${
                isDark ? "bg-emerald-500/30" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                ₦1,000
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAmountChange("2000")}
              className={`px-4 py-2 rounded-full ${
                isDark ? "bg-emerald-500/30" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                ₦2,000
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAmountChange("5000")}
              className={`px-4 py-2 rounded-full ${
                isDark ? "bg-emerald-500/30" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                ₦5,000
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAmountChange("10000")}
              className={`px-4 py-2 rounded-full ${
                isDark ? "bg-emerald-500/30" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                ₦10,000
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAmountChange("20000")}
              className={`px-4 py-2 rounded-full ${
                isDark ? "bg-emerald-500/30" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                ₦20,000
              </Text>
            </Pressable>
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
