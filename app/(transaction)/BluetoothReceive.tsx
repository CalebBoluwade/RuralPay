import { useAuth } from "@/components/context/AuthProvider";
import BalanceCard from "@/components/ui/BalanceCard";
import AmountInput from "@/components/ui/Input/AmountInput";
import TransactionFailure from "@/components/ui/Modals/Transaction/TransactionFailure";
import TransactionSuccess from "@/components/ui/Modals/Transaction/TransactionSuccess";
import ScreenHeader from "@/components/ui/ScreenHeader";
import BLEService from "@/lib/services/BLEService";
import ToastService from "@/lib/services/ToastService";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BluetoothReceive = () => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [amount, setAmount] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState<any>(null);
  const [step, setStep] = useState<"SETUP" | "WAITING" | "SUCCESS" | "TIMEOUT">(
    "SETUP",
  );
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      BLEService.stopPaymentServer();
    };
  }, []);

  const handleTimeout = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await BLEService.stopPaymentServer();
    setIsReceiving(false);
    setStep("TIMEOUT");
  };

  const handleStartReceiving = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      ToastService.error("Please enter a valid amount");
      return;
    }

    try {
      setIsReceiving(true);
      setStep("WAITING");
      setTimeLeft(120);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start advertising and payment server
      const advertiseResult = await BLEService.startAdvertising({
        amount,
        currency: "NGN",
        merchantName: user?.merchant?.businessName || "Merchant",
      });

      if (!advertiseResult.success) {
        throw new Error(
          ("error" in advertiseResult ? advertiseResult.error : undefined) ||
            "Failed to start terminal",
        );
      }

      ToastService.success("Terminal ready - waiting for customer");

      // Start payment server to listen for connections
      const serverResult = await BLEService.startPaymentServer((payment) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPaymentReceived({
          ...payment,
          amount: payment.amount || amount,
        });
        setStep("SUCCESS");
        setIsReceiving(false);
        BLEService.stopPaymentServer();
      });

      if (!serverResult.success) {
        throw new Error(
          ("error" in serverResult ? serverResult.error : undefined) ||
            "Failed to start server",
        );
      }
    } catch (error: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      ToastService.error(error.message || "Failed to start receiving");
      setIsReceiving(false);
      setStep("SETUP");
      BLEService.stopAdvertising();
    }
  };

  const handleStopReceiving = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await BLEService.stopPaymentServer();
    setIsReceiving(false);
    setStep("SETUP");
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    BLEService.stopPaymentServer();
    router.back();
  };

  const renderSetup = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Receive Payment"
        subtitle="Setup Bluetooth Terminal"
        onBack={handleClose}
      />

      <BalanceCard />

      <View className="flex-1 p-6">
        <AmountInput onAmountChange={setAmount} />

        <Pressable
          className={`p-4 rounded-2xl mt-6 ${
            isDark ? "bg-emerald-600" : "bg-emerald-700"
          }`}
          onPress={handleStartReceiving}
          disabled={isReceiving}
        >
          <View className="flex-row items-center justify-center">
            <MaterialCommunityIcons
              name="bluetooth"
              size={24}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white text-lg font-bold">
              Start Receiving
            </Text>
          </View>
        </Pressable>

        <View
          className={`mt-6 p-4 rounded-xl ${
            isDark ? "bg-blue-500/10" : "bg-blue-50"
          }`}
        >
          <Text
            className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}
          >
            💡 Your device will advertise as a payment terminal. Customers can
            scan and connect to complete the payment.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderWaiting = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Receiving Payment"
        subtitle="Waiting for customer"
        onBack={handleStopReceiving}
      />

      <View className="flex-1 justify-center px-6">
        <View
          className={`rounded-2xl p-8 items-center mb-8 ${
            isDark ? "bg-white/10" : "bg-white"
          }`}
        >
          <View className="w-32 h-32 rounded-full bg-emerald-500 items-center justify-center mb-6">
            <MaterialCommunityIcons
              name="bluetooth-audio"
              size={64}
              color="white"
            />
          </View>

          <ActivityIndicator
            size="large"
            color={isDark ? "#10b981" : "#059669"}
            style={{ marginBottom: 16 }}
          />

          <Text
            className={`text-2xl font-bold mb-2 text-center ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Terminal Active
          </Text>
          <Text
            className={`text-lg text-center ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Waiting for customer to connect...
          </Text>
          <Text
            className={`text-sm mt-2 font-medium text-center ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Timeout in {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </Text>
        </View>

        <View
          className={`rounded-2xl p-6 mb-6 ${
            isDark ? "bg-white/10" : "bg-white"
          }`}
        >
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Payment Details
          </Text>
          <View className="flex-row justify-between items-center">
            <Text
              className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Amount
            </Text>
            <Text className="text-2xl font-bold text-emerald-500">
              ₦{amount}
            </Text>
          </View>
        </View>

        <Pressable
          className={`p-4 rounded-2xl ${isDark ? "bg-red-600" : "bg-red-700"}`}
          onPress={handleStopReceiving}
        >
          <Text className="text-white text-lg font-bold text-center">
            Stop Receiving
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <>
      {step === "SETUP" && renderSetup()}
      {step === "WAITING" && renderWaiting()}
      {step === "SUCCESS" && (
        <TransactionSuccess
          visible
          data={{
            amount: paymentReceived?.amount || amount,
            recipient: "Bluetooth Payment",
            reference: paymentReceived?.transactionId || "",
            date: new Date().toLocaleDateString(),
            type: "Payment Received",
          }}
          onClose={handleClose}
          onDownloadReceipt={() => {}}
        />
      )}
      {step === "TIMEOUT" && (
        <TransactionFailure
          visible
          error="Payment request timed out. No device connected."
          onRetry={() => {
            setStep("SETUP");
          }}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default BluetoothReceive;
