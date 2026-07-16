import BalanceCard from "@/src/components/ui/BalanceCard";
import AmountInput from "@/src/components/ui/Input/AmountInput";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import BLEService from "@/src/lib/services/BLEService";
import ToastService from "@/src/lib/services/ToastService";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    Text,
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
  const [paymentType, setPaymentType] = useState<"CREDIT" | "DEBIT">("DEBIT");

  const [availableTerminals, setAvailableTerminals] = useState<any[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const initPaymentMethod = async () => {
      const bleResult = await BLEService.initialize();
      setBleReady(bleResult.success);
    };

    initPaymentMethod();
  }, []);

  const handleStartPayment = async () => {
    if (
      paymentType === "DEBIT" &&
      (!amount || Number.parseFloat(amount) <= 0)
    ) {
      try {
        ToastService.error("Please Enter Valid merchant ID and Amount");
      } catch {}
      return;
    }

    if (
      paymentType === "CREDIT" &&
      (!amount || Number.parseFloat(amount) <= 0)
    ) {
      try {
        ToastService.error("Please Enter Valid Amount");
      } catch {}
      return;
    }

    if (!bleReady) {
      try {
        ToastService.warning(
          // "Bluetooth Not Available",
          "Bluetooth is not available. Please enable Bluetooth in settings.",
        );
      } catch {}

      // await handleBLEPayment();
      // await BLEService.

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep("ENTER_PIN");
      // return;
    }
  };

  const handleBLEPayment = async () => {
    try {
      setLoading(true);

      if (paymentType === "DEBIT") {
        // Customer mode: Scan for merchant terminals
        setScanning(true);
        setShowDeviceModal(true);
        try {
          ToastService.info("Scanning For Payment Terminals...");
        } catch {}
        const scanResult = await BLEService.scanForPaymentTerminals();

        if (__DEV__) console.log(scanResult);

        if (!scanResult.success || !scanResult.terminals?.length) {
          setShowDeviceModal(false);
          throw new Error("No Payment Terminals Found nearby");
        }

        setAvailableTerminals(scanResult.terminals);
        setScanning(false);
      } else {
        // Merchant mode: Advertise terminal
        ToastService.info("Starting Payment Terminal...");
        const advertiseResult = await BLEService.startAdvertising({
          amount,
          currency: "NGN",
        });

        if (!advertiseResult.success) {
          throw new Error(
            ("error" in advertiseResult ? advertiseResult.error : undefined) ||
              "Failed to start terminal",
          );
        }

        ToastService.info("Waiting for Customer...");
        await new Promise((resolve) => setTimeout(resolve, 10000));

        const paymentId =
          "paymentId" in advertiseResult ? advertiseResult.paymentId : "";
        const payment = await BLEService.acceptPayment(paymentId, {
          type: "Visa",
          lastFourDigits: "4242",
        });

        if (payment.success && "transactionId" in payment) {
          setPaymentResult({
            transaction: { txId: payment.transactionId },
            newBalance: 50000,
          });
          setStep("SUCCESS");
        } else {
          throw new Error(
            "error" in payment
              ? String(payment.error)
              : "Payment acceptance failed",
          );
        }
      }
    } catch (error) {
      setScanning(false);
      setShowDeviceModal(false);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      try {
        ToastService.error(errorMessage);
      } catch (toastError) {
        if (__DEV__) console.error("Toast error:", toastError);
      }
      setError(errorMessage);
      setStep("FAILURE");
    } finally {
      setLoading(false);
      BLEService.stopAdvertising();
    }
  };

  const handleDeviceSelect = async (terminal: any) => {
    setShowDeviceModal(false);
    try {
      setLoading(true);
      try {
        ToastService.info(
          `Connecting to ${terminal.name || "Unknown Device"}...`,
        );
      } catch {}

      const paymentResult = await BLEService.connectAndPay(
        terminal.id,
        terminal.amount || amount,
      );

      if (paymentResult.success && "transactionId" in paymentResult) {
        setPaymentResult({
          transaction: { txId: paymentResult.transactionId },
          newBalance: 50000,
        });
        setStep("SUCCESS");
      } else {
        throw new Error(
          "error" in paymentResult ? paymentResult.error : "Payment Failed",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      try {
        ToastService.error(errorMessage);
      } catch {}
      setError(errorMessage);
      setStep("FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const handlePinSuccess = async (
    TwoFA_VerificationCode: string,
  ): Promise<boolean> => {
    setStep("TAP_CARD");

    return true;
  };

  const handlePinCancel = () => {
    setStep("ENTER_DETAILS");
  };

  const handleRetry = () => {
    setStep("ENTER_PIN");

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

      {paymentType === "DEBIT" && <BalanceCard />}

      <View
        className={`flex-1 p-8 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        <AmountInput onAmountChange={(amount) => setAmount(amount)} />

        {/* 
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
        </View> */}

        <Pressable
          className={`p-4 rounded-2xl mb-4 ${
            isDark ? "bg-emerald-600" : "bg-emerald-700"
          }`}
          onPress={handleBLEPayment}
        >
          <Text className="text-white text-lg font-bold text-center">
            {paymentType === "CREDIT"
              ? "Continue to Credit"
              : "Continue to Payment"}
          </Text>
        </Pressable>

        <Pressable
          className={`p-4 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/40 border border-gray-200/30"
          }`}
          onPress={() => router.push("/(merchant)/BluetoothReceive")}
        >
          <View className="flex-row items-center justify-center">
            <MaterialCommunityIcons
              name="bluetooth-audio"
              size={24}
              color={isDark ? "#d1d5db" : "#374151"}
              style={{ marginRight: 8 }}
            />
            <Text
              className={`text-lg font-semibold ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Receive Payment
            </Text>
          </View>
        </Pressable>
      </View>

      {/* <View className="flex-1 px-6">
        <View
          className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <Pressable
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
                  <Text className="text-lime-100 text-base">
                    Bluetooth Payment
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </Pressable>
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
      paymentMessage={`Enter PIN to Confirm Bluetooth Payment of ₦${amount} to [{bankName}]`}
      showPinModal={true}
      isLoading={false}
      setIsLoading={() => {}}
      error={"errorMessage"}
      initiateTransaction={handlePinSuccess}
      // transactionResult={transactionResult}
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

        <Pressable
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
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <>
      {step === "ENTER_DETAILS" && renderEnterDetails()}
      {step === "ENTER_PIN" && renderEnterPin()}
      {step === "BLE_PAYMENT" && renderBLEPayment()}

      <Modal
        visible={showDeviceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeviceModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className={`rounded-t-3xl p-6 max-h-[70%] ${
              isDark ? "bg-[#1a1a1f]" : "bg-white"
            }`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {scanning ? "Scanning..." : "Select Payment Terminal"}
              </Text>
              <Pressable onPress={() => setShowDeviceModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={isDark ? "white" : "black"}
                />
              </Pressable>
            </View>

            {scanning ? (
              <View className="items-center py-12">
                <ActivityIndicator
                  size="large"
                  color={isDark ? "#10b981" : "#059669"}
                />
                <Text
                  className={`mt-4 text-lg ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Searching for payment terminals...
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableTerminals}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    className={`p-4 rounded-xl mb-3 border ${
                      isDark
                        ? "bg-white/5 border-white/10"
                        : "bg-gray-50 border-gray-200"
                    }`}
                    onPress={() => handleDeviceSelect(item)}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text
                          className={`font-semibold text-lg ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {item.name || "Unknown Device"}
                        </Text>
                        <Text
                          className={`text-base ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {item.id}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className={`text-base font-medium ${
                            item.rssi > -70
                              ? "text-green-500"
                              : item.rssi > -85
                                ? "text-yellow-500"
                                : "text-red-500"
                          }`}
                        >
                          {item.rssi} dBm
                        </Text>
                        <Text
                          className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {item.distance}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default BluetoothPayments;
