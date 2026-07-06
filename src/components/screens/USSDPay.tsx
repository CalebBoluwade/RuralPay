import BalanceCard from "@/src/components/ui/BalanceCard";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import PaymentService from "@/src/lib/services/PaymentService";
import ToastService from "@/src/lib/services/ToastService";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const USSDPay = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [paymentType, setPaymentType] = useState<"Send" | "Receive" | null>(
    null,
  );
  const [ussdCode, setUssdCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("");
  const [showAmountInput, setShowAmountInput] = useState<boolean>(false);

  const startPayment = async (
    type: "Send" | "Receive",
    paymentAmount?: number,
  ) => {
    setIsLoading(true);
    try {
      const response = await PaymentService.generateUSSDCode({
        type,
        currency: "NGN",
        amount: paymentAmount || 0,
      });

      if (response.success) {
        setPaymentType(type);
        setUssdCode(response.ussdCode);
        setTimeLeft(response.expiresIn || 300);
        setIsActive(true);
        setIsExpired(false);
      }
    } catch {
      ToastService.error("Failed to Generate USSD Code");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentType(null);
    setUssdCode("");
    setTimeLeft(300);
    setIsActive(false);
    setIsExpired(false);
    setAmount("");
    setShowAmountInput(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isActive && !isExpired) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        <ScreenHeader
          title="USSD Payments"
          subtitle="Generate Dynamic Codes for Secure Payments"
          onBack={() => router.back()}
        />

        <View className="flex-1 px-6">
          <View
            className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50 shadow-sm"
            }`}
          >
            <Text
              className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Select Payment Type
            </Text>

            <Pressable
              onPress={() => setShowAmountInput(true)}
              disabled={isLoading}
              className={`p-6 rounded-2xl mb-4 ${isLoading ? "opacity-50" : ""} ${
                isDark ? "bg-lime-600" : "bg-lime-700"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                    <Ionicons name="arrow-up-circle" size={28} color="white" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">
                      Send Payment
                    </Text>
                    <Text className="text-emerald-100 text-base">
                      Send Money
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </Pressable>

            {showAmountInput && (
              <View className="mb-4">
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter Amount (NGN)"
                  keyboardType="numeric"
                  className={`p-4 rounded-2xl text-lg font-semibold mb-4 backdrop-blur-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-gray-50 border border-gray-200 text-gray-900"
                  }`}
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  autoFocus
                />
                <Pressable
                  onPress={() =>
                    startPayment("Send", Number.parseFloat(amount) || 0)
                  }
                  disabled={isLoading || !amount}
                  className={`p-4 rounded-2xl ${isLoading || !amount ? "opacity-50" : ""} ${
                    isDark ? "bg-green-600" : "bg-green-700"
                  }`}
                >
                  <Text className="text-white font-bold text-lg text-center">
                    Generate Code
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => startPayment("Receive", 0)}
              disabled={isLoading}
              className={`p-6 rounded-2xl ${isLoading ? "opacity-50" : ""} ${
                isDark ? "bg-emerald-600" : "bg-emerald-700"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                    <Ionicons
                      name="arrow-down-circle"
                      size={28}
                      color="white"
                    />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">
                      Receive Payment
                    </Text>
                    <Text className="text-green-100 text-lg">
                      Request Money
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </Pressable>
          </View>

          <View
            className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50 shadow-sm"
            }`}
          >
            <Text
              className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Payment History
            </Text>
            <Pressable
              onPress={() => router.push("/ussd")}
              disabled={isLoading}
              className={`p-6 rounded-2xl mb-4 ${isLoading ? "opacity-50" : ""} ${
                isDark ? "bg-lime-600" : "bg-lime-700"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                    <AntDesign name="history" size={24} color="white" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">
                      View History
                    </Text>
                    <Text className="text-blue-100 text-base">
                      Previously Generated Codes
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isExpired) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        <ScreenHeader
          title="Code Expired"
          subtitle="The Payment Code Timed Out"
          onBack={() => router.back()}
        />

        <View className="flex-1 justify-center px-6">
          <View
            className={`rounded-2xl p-8 items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50 shadow-sm"
            }`}
          >
            <View className="w-24 h-24 rounded-full bg-pink-500 items-center justify-center mb-6">
              <Ionicons name="time" size={48} color="white" />
            </View>
            <Text
              className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Code Expired
            </Text>
            <Text
              className={`text-lg text-center mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              The payment code has timed out. Generate a new code to continue.
            </Text>
            <Pressable
              onPress={resetPayment}
              className={`px-8 py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
            >
              <Text className="text-white font-bold text-lg">
                Generate New Code
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={`${paymentType === "Send" ? "Send" : "Receive"} Payment`}
          subtitle="Your Dynamic Payment Code is Ready"
          onBack={() => router.back()}
        />

        {paymentType === "Send" ? <BalanceCard /> : null}

        {/* Timer Card */}
        <View
          className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <View className="flex-row items-center justify-center mb-4">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                timeLeft < 60
                  ? "bg-red-500"
                  : isDark
                    ? "bg-gray-600"
                    : "bg-gray-500"
              }`}
            >
              <Ionicons name="time-outline" size={20} color="white" />
            </View>
            <Text
              className={`font-semibold text-lg ${
                timeLeft < 60
                  ? "text-red-500"
                  : isDark
                    ? "text-white"
                    : "text-gray-700"
              }`}
            >
              Time Remaining
            </Text>
          </View>
          <Text
            className={`text-center text-4xl font-bold ${
              timeLeft < 60
                ? "text-red-500"
                : isDark
                  ? "text-white"
                  : "text-gray-900"
            }`}
          >
            {formatTime(timeLeft)}
          </Text>
          {timeLeft < 60 && (
            <Text className="text-center text-red-500 font-medium mt-2">
              Code expires soon!
            </Text>
          )}
        </View>

        {/* USSD Code Display */}
        <View
          className={`rounded-2xl p-8 mb-6 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          {paymentType === "Send" && amount && (
            <>
              <Text
                className={`text-center font-semibold mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Amount
              </Text>
              <Text
                className={`text-center text-3xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                ₦{Number.parseFloat(amount).toLocaleString()}
              </Text>
            </>
          )}
          <Text
            className={`text-center font-semibold mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Dial this code:
          </Text>
          <View
            className={`p-6 rounded-2xl border-2 border-dashed ${
              isDark ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <Text
              className={`text-center text-3xl font-mono font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {ussdCode}
            </Text>
          </View>
          <View className="flex-row items-center justify-center mt-4">
            <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center mr-2">
              <Ionicons name="shield-checkmark" size={14} color="white" />
            </View>
            <Text className="text-green-500 font-semibold text-md">
              Secure • Single Use
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View
          className={`rounded-2xl p-6 mb-6 backdrop-blur-xl border-l-4 border-l-amber-400 ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center mr-3 mt-1">
              <Ionicons name="information-circle" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text
                className={`font-bold text-lg mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Instructions:
              </Text>
              <Text
                className={`leading-8 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                1. Dial the code above on your phone{"\n"}
                2. Follow the prompts to complete payment{"\n"}
                3. Code expires automatically after use
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        <Pressable
          onPress={resetPayment}
          className={`p-4 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/40 border-2 border-gray-300"
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text className="text-red-500 font-bold text-lg ml-2">
              Cancel Payment
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default USSDPay;
