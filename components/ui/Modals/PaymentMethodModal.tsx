import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  onPaymentMethodSelected: (method: string) => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  visible,
  onClose,
  amount,
  onPaymentMethodSelected,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedMethod, setSelectedMethod] = useState("");

  const paymentMethods = [
    {
      id: "nfc",
      name: "Tap to Pay (NFC)",
      description: "Pay using Contactless NFC",
      icon: "phone-portrait-outline",
      color: isDark ? "#a78bfa" : "#7c3aed",
    },
    {
      id: "bluetooth",
      name: "Bluetooth Payment",
      description: "Pay via Bluetooth connection",
      icon: "bluetooth",
      color: isDark ? "#60a5fa" : "#2563eb",
    },
    {
      id: "card",
      name: "Card Balance",
      description: "Pay using your card balance",
      icon: "card-outline",
      color: isDark ? "#34d399" : "#059669",
    },
  ];

  const handleProceed = () => {
    if (selectedMethod) {
      onPaymentMethodSelected(selectedMethod);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
      >
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Select Payment Method
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            >
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#fff" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View
            className={`p-6 rounded-2xl mb-6 ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
          >
            <Text
              className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Amount to Pay
            </Text>
            <Text
              className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              ₦{amount.toLocaleString()}
            </Text>
          </View>

          <Text
            className={`text-sm font-semibold mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Choose Payment Method
          </Text>

          <View className="gap-3 mb-8">
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                className={`p-5 rounded-2xl ${
                  selectedMethod === method.id
                    ? isDark
                      ? "bg-white/20 border-2 border-white/40"
                      : "bg-gray-100 border-2 border-gray-400"
                    : isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-50 border border-gray-200"
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className={`w-14 h-14 rounded-full items-center justify-center ${isDark ? "bg-white/10" : "bg-white"}`}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={28}
                      color={method.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {method.name}
                    </Text>
                    <Text
                      className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {method.description}
                    </Text>
                  </View>
                  {selectedMethod === method.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={method.color}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleProceed}
            disabled={!selectedMethod}
            className={`py-4 rounded-xl mb-6 ${
              selectedMethod
                ? "bg-indigo-600"
                : isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-bold ${selectedMethod ? "text-white" : isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Proceed to Payment
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default PaymentMethodModal;
