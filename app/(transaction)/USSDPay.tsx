import { BankTransferService } from "@/components/services/BankTransferService";
import BalanceCard from "@/components/ui/BalanceCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const USSDPay = () => {
  const router = useRouter();
  const [paymentType, setPaymentType] = useState<"Send" | "Receive" | null>(
    null
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
    paymentAmount?: number
  ) => {
    setIsLoading(true);
    try {
      const response = await BankTransferService.generateUSSDCode({
        type,
        currency: "NGN",
        amount: paymentAmount || 0,
      });

      console.log(response);
      if (response.success) {
        setPaymentType(type);
        setUssdCode(response.ussdCode);
        setTimeLeft(response.expiresIn || 300);
        setIsActive(true);
        setIsExpired(false);
      }
    } catch (error) {
      console.error("Failed to generate USSD code:", error);
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
    let interval: number;
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
      <SafeAreaView className="flex-1">
        <ScreenHeader
          title="USSD Payments"
          subtitle="Generate Dynamic Codes for Secure Payments"
          onBack={() => router.back()}
        />

        <View className="flex-1 px-6">
          <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-6">
              Select Payment Type
            </Text>

            <TouchableOpacity
              onPress={() => setShowAmountInput(true)}
              disabled={isLoading}
              className={`bg-indigo-700 p-6 rounded-2xl mb-4 shadow-lg ${
                isLoading ? "opacity-50" : ""
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
                    <Text className="text-emerald-100 text-sm">Send Money</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </TouchableOpacity>

            {showAmountInput && (
              <View className="mb-4">
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount (NGN)"
                  keyboardType="numeric"
                  className="bg-gray-50 p-4 rounded-2xl text-lg font-semibold mb-4 border border-gray-200"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => startPayment("Send", parseFloat(amount) || 0)}
                  disabled={isLoading || !amount}
                  className={`bg-green-600 p-4 rounded-2xl shadow-lg ${
                    isLoading || !amount ? "opacity-50" : ""
                  }`}
                >
                  <Text className="text-white font-bold text-lg text-center">
                    Generate Code
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => startPayment("Receive", 0)}
              disabled={isLoading}
              className={`bg-emerald-700 p-6 rounded-2xl shadow-lg ${
                isLoading ? "opacity-50" : ""
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
            </TouchableOpacity>
          </View>

          <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-6">
              Payment History
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/USSDHistory")}
              disabled={isLoading}
              className={`bg-indigo-700 p-6 rounded-2xl mb-4 shadow-lg ${
                isLoading ? "opacity-50" : ""
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
                    <Text className="text-blue-100 text-sm">
                      Previously Generated Codes
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isExpired) {
    return (
      <SafeAreaView className="flex-1">
        <ScreenHeader
          title="Code Expired"
          subtitle="The Payment Code Timed Out"
          onBack={() => router.back()}
        />

        <View className="flex-1 justify-center px-6">
          <View className="bg-white/80 backdrop-blur rounded-3xl p-8 items-center shadow-lg border border-white/50">
            <View className="w-24 h-24 rounded-full bg-pink-500 items-center justify-center mb-6">
              <Ionicons name="time" size={48} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Code Expired
            </Text>
            <Text className="text-lg text-gray-600 text-center mb-8">
              The payment code has timed out. Generate a new code to continue.
            </Text>
            <TouchableOpacity
              onPress={resetPayment}
              className="bg-indigo-700 px-8 py-4 rounded-2xl shadow-lg"
            >
              <Text className="text-white font-bold text-lg">
                Generate New Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={`${paymentType === "Send" ? "Send" : "Receive"} Payment`}
          subtitle="Your Dynamic Payment Code is Ready"
          onBack={() => router.back()}
        />

        {/* Timer Card */}
        <View className="bg-white/80 backdrop-blur rounded-3xl p-6 mb-6 shadow-lg border border-white/50">
          <View className="flex-row items-center justify-center mb-4">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                timeLeft < 60 ? "bg-red-500" : "bg-gray-500"
              }`}
            >
              <Ionicons name="time-outline" size={20} color="white" />
            </View>
            <Text
              className={`font-semibold text-lg ${
                timeLeft < 60 ? "text-red-600" : "text-gray-700"
              }`}
            >
              Time Remaining
            </Text>
          </View>
          <Text
            className={`text-center text-4xl font-bold ${
              timeLeft < 60 ? "text-red-500" : "text-gray-900"
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

        {paymentType === "Send" ? <BalanceCard /> : null}

        {/* USSD Code Display */}
        <View className="bg-white/80 backdrop-blur rounded-3xl p-8 mb-6 shadow-lg border border-white/50">
          <Text className="text-center text-gray-600 font-semibold mb-4">
            Dial this code:
          </Text>
          <View className="p-6 rounded-2xl border-2 border-dashed border-gray-300">
            <Text className="text-center text-3xl font-mono font-bold text-gray-900">
              {ussdCode}
            </Text>
          </View>
          <View className="flex-row items-center justify-center mt-4">
            <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center mr-2">
              <Ionicons name="shield-checkmark" size={14} color="white" />
            </View>
            <Text className="text-green-600 font-semibold text-md">
              Secure • Single Use
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View className="bg-white/80 backdrop-blur rounded-3xl p-6 mb-6 shadow-lg border border-white/50 border-l-4 border-l-amber-400">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center mr-3 mt-1">
              <Ionicons name="information-circle" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-lg mb-2">
                Instructions:
              </Text>
              <Text className="text-gray-700 leading-8">
                1. Dial the code above on your phone{"\n"}
                2. Follow the prompts to complete payment{"\n"}
                3. Code expires automatically after use
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={resetPayment}
          className="bg-white/50 p-4 rounded-2xl border-2 border-gray-300 shadow-lg"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="close-circle" size={20} color="#B91C1C" />
            <Text className="text-red-700 font-bold text-lg ml-2">
              Cancel Payment
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default USSDPay;
