import BLEService from "@/components/services/BLEService";
import BalanceCard from "@/components/ui/BalanceCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Transaction/TransactionPin";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import { ToastService } from "@/hooks/use-toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BluetoothPayments = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [bleReady, setBleReady] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("ENTER_DETAILS");
  const [paymentType, setPaymentType] = useState<
    "CREDIT" | "DEBIT" | "PHONE_TAP"
  >("DEBIT");

  const [merchantId, setMerchantId] = useState("");

  useEffect(() => {
    const initPaymentMethod = async () => {
      const bleResult = await BLEService.initialize();
      const bleStatus = await BLEService.isAvailable();
      setBleReady(bleResult.success && bleStatus.enabled);
    };

    initPaymentMethod();
  }, []);

  const handleStartPayment = async () => {
    if (
      paymentType === "DEBIT" &&
      (!merchantId || !amount || Number.parseFloat(amount) <= 0)
    ) {
      ToastService.error("Please Enter Valid merchant ID and Amount");
      return;
    }

    if (
      (paymentType === "CREDIT" || paymentType === "PHONE_TAP") &&
      (!amount || Number.parseFloat(amount) <= 0)
    ) {
      ToastService.error("Please Enter Valid Amount");
      return;
    }

    if (paymentType === "PHONE_TAP" && !bleReady) {
      ToastService.warning(
        // "Bluetooth Not Available",
        "Bluetooth is not available. Please enable Bluetooth in settings.",
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep("ENTER_PIN");
      return;
    }
  };

  const handleBLEPayment = async () => {
    try {
      setLoading(true);
      const result = await BLEService.startPaymentAdvertising(
        amount,
        merchantId || "Merchant",
      );

      if (result.success) {
        ToastService.info("Broadcasting payment via Bluetooth...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const payment = await BLEService.acceptPayment(result.paymentId!, {
          type: "Visa",
          lastFourDigits: "4242",
        });

        if (payment.success) {
          setPaymentResult({
            transaction: { txId: payment.transactionId },
            newBalance: 50000,
          });
          setStep("SUCCESS");
        } else {
          ToastService.error("Bluetooth Payment Failed");
          setError("Bluetooth Payment Failed");
          setStep("FAILURE");
        }
      } else {
        setError("Failed to start Bluetooth payment");
        setStep("FAILURE");
      }
    } catch (error) {
      setError((error as Error).message);
      setStep("FAILURE");
    } finally {
      setLoading(false);
      BLEService.stopAdvertising();
    }
  };

  const handlePinSuccess = () => {
    if (paymentType === "PHONE_TAP") {
      setStep("BLE_PAYMENT");
    } else {
      setStep("TAP_CARD");
    }
  };

  const handlePinCancel = () => {
    setStep("ENTER_DETAILS");
  };

  const handleRetry = () => {
    if (paymentType === "PHONE_TAP") {
      setStep("ENTER_PIN");
    } else {
      setStep("TAP_CARD");
    }
    setError("");
  };

  const handleClose = () => {
    router.back();
  };

  const renderEnterDetails = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Bluetooth Payment"
        subtitle="Enter Payment Details"
        onBack={() => router.back()}
      />

      <View
        className={`flex-1 p-8 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        {paymentType === "DEBIT" && <BalanceCard />}

        {(paymentType === "DEBIT" || paymentType === "PHONE_TAP") && (
          <View className="mb-6">
            <Text
              className={`text-lg font-semibold mb-3 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Merchant ID
            </Text>
            <TextInput
              className={`p-4 rounded-2xl text-lg backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20 text-white"
                  : "bg-white/60 border border-gray-200/50 text-gray-900"
              }`}
              placeholder="Enter merchant identifier"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={merchantId}
              onChangeText={setMerchantId}
            />
          </View>
        )}

        <View className="mb-8">
          <Text
            className={`text-lg font-semibold mb-3 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Amount (NGN)
          </Text>
          <View
            className={`flex-row items-center rounded-2xl backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
          >
            <View className="bg-green-600 px-4 py-4 rounded-l-2xl">
              <Text className="text-white font-bold text-xl">₦</Text>
            </View>
            <TextInput
              className={`flex-1 p-4 text-xl font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
              placeholder="0.00"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          className={`p-4 rounded-2xl mb-4 ${
            isDark ? "bg-emerald-600" : "bg-emerald-700"
          }`}
          onPress={handleStartPayment}
        >
          <Text className="text-white text-lg font-bold text-center">
            {paymentType === "CREDIT"
              ? "Continue to Credit →"
              : paymentType === "PHONE_TAP"
                ? "Continue to Phone Tap →"
                : "Continue to Payment →"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`p-4 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/40 border border-gray-200/30"
          }`}
          onPress={handleClose}
        >
          <Text
            className={`text-lg font-semibold text-center ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* <View className="flex-1 px-6">
        <View
          className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <TouchableOpacity
            onPress={handleStartPayment}
            className={`p-6 rounded-2xl mb-4 ${
              isDark ? "bg-lime-600" : "bg-lime-700"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="bluetooth"
                    size={28}
                    color="white"
                  />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Phone Payment (BLE)
                  </Text>
                  <Text className="text-lime-100 text-sm">
                    Bluetooth Payment
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View> */}

      {/* <Modal
        visible={showMerchantModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
    
      </Modal> */}
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <TransactionPin
      paymentMessage={`Enter PIN to Confirm Bluetooth Payment of ₦${amount} to (${merchantId}) [{bankName}]`}
      showPinModal={true}
      onSuccess={handlePinSuccess}
      onCancel={handlePinCancel}
    />
  );

  const renderBLEPayment = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Bluetooth Payment"
        subtitle="Broadcasting payment request"
        onBack={() => setStep("ENTER_DETAILS")}
      />

      <View className="flex-1 justify-center px-6">
        <View
          className={`rounded-2xl p-8 items-center mb-8 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <View className="w-32 h-32 rounded-full bg-lime-500 items-center justify-center mb-6">
            <MaterialCommunityIcons name="bluetooth" size={64} color="white" />
          </View>
          <Text
            className={`text-2xl font-bold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Waiting for Connection
          </Text>
          <Text
            className={`text-lg text-center ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Customer device will connect via Bluetooth
          </Text>
        </View>

        <View
          className={`rounded-2xl p-6 mb-8 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Payment Summary
          </Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-lg ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Merchant
              </Text>
              <Text
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {merchantId || "Merchant"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-lg ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Amount
              </Text>
              <Text className="text-2xl font-bold text-green-500">
                ₦{amount}
              </Text>
            </View>
          </View>
        </View>

        {loading && (
          <View
            className={`rounded-2xl p-6 items-center mb-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50 shadow-sm"
            }`}
          >
            <ActivityIndicator
              size="large"
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
            <Text
              className={`text-lg font-semibold mt-3 ${
                isDark ? "text-white" : "text-gray-700"
              }`}
            >
              Processing payment...
            </Text>
          </View>
        )}

        <TouchableOpacity
          className={`p-4 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/40 border border-gray-200/30"
          }`}
          onPress={() => setStep("ENTER_DETAILS")}
        >
          <Text
            className={`text-lg font-semibold text-center ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Cancel Payment
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <>
      {step === "ENTER_DETAILS" && renderEnterDetails()}
      {step === "ENTER_PIN" && renderEnterPin()}
      {step === "BLE_PAYMENT" && renderBLEPayment()}
      {step === "SUCCESS" && (
        <TransactionSuccess
          data={{
            amount: amount,
            recipient: paymentType === "DEBIT" ? "BLE Payment" : merchantId,
            reference: paymentResult?.transaction?.txId || "",
            date: new Date().toLocaleDateString(),
            type:
              paymentType === "CREDIT"
                ? "NFC Card Credit"
                : paymentType === "PHONE_TAP"
                  ? "Bluetooth Payment"
                  : "NFC Payment",
          }}
          onClose={handleClose}
          onDownloadReceipt={() => {}}
        />
      )}
      {step === "FAILURE" && (
        <TransactionFailure
          error={error}
          onRetry={handleRetry}
          onClose={handleClose}
        />
      )}

      {/* {!loading && (
                      <TouchableOpacity
                        className={`p-4 rounded-2xl mb-4 ${
                          isDark ? "bg-emerald-600" : "bg-emerald-700"
                        }`}
                        onPress={handleBLEPayment}
                      >
                        <Text className="text-white text-lg font-bold text-center">
                          ✓ Start Broadcasting
                        </Text>
                      </TouchableOpacity>
                    )} */}
    </>
  );
};

export default BluetoothPayments;
