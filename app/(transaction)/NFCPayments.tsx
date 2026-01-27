import { BankTransferService } from "@/components/services/BankTransferService";
import NFCService from "@/components/services/NFCService";

import BalanceCard from "@/components/ui/BalanceCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Transaction/TransactionPin";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import { ToastService } from "@/hooks/use-toast";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NFCPayments = () => {
  // NFCManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
  //   console.log("Discovered tag", tag);
  //   handleCardTap();
  // });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState("ENTER_DETAILS");
  const [merchantId, setMerchantId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [paymentType, setPaymentType] = useState<
    "CREDIT" | "DEBIT" | "PHONE_TAP"
  >("DEBIT");
  const [nfcReady, setNfcReady] = useState(false);

  useEffect(() => {
    const initPaymentMethod = async () => {
      const nfcInit = await NFCService.initialize();
      const nfcEnabled = await NFCService.isEnabled();
      setNfcReady(nfcInit && nfcEnabled);
    };

    initPaymentMethod();
  }, []);

  const handleCreditCard = () => {
    setPaymentType("CREDIT");
    setShowMerchantModal(true);
  };

  const handlePullPayment = () => {
    setPaymentType("DEBIT");
    setShowMerchantModal(true);
  };

  const handlePhoneTap = () => {
    setPaymentType("PHONE_TAP");
    setShowMerchantModal(true);
  };

  const handleStartPayment = async () => {
    if (
      paymentType === "DEBIT" &&
      (!merchantId || !amount || Number.parseFloat(amount) <= 0)
    ) {
      ToastService.error("Please Enter Valid merchant ID and amount");
      return;
    }

    if (
      (paymentType === "CREDIT" || paymentType === "PHONE_TAP") &&
      (!amount || Number.parseFloat(amount) <= 0)
    ) {
      ToastService.error("Please enter valid amount");
      return;
    }

    if (paymentType !== "PHONE_TAP" && !nfcReady) {
      Alert.alert(
        "NFC Not Available",
        "NFC is not available on this device or is disabled. Please enable NFC in settings.",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMerchantModal(false);
    setStep("ENTER_PIN");
  };

  const handleCardTap = async () => {
    try {
      setLoading(true);

      const cardInfo = await NFCService.readCardInfo();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (paymentType === "CREDIT") {
        const response = await NFCService.creditCard(
          Number.parseFloat(amount),
          "NGN",
        );

        if (response.success) {
          setPaymentResult({
            transaction: response.transaction,
            newBalance: response.newBalance,
          });
          setStep("SUCCESS");
        } else {
          setError("Credit failed");
          setStep("FAILURE");
        }
      } else {
        const transaction: Transaction = {
          version: 1,
          txId: "TXN" + Date.now(),
          status: "PENDING",
          timestamp: Math.floor(Date.now() / 1000),
          cardId: cardInfo.cardId,
          merchantId: merchantId,
          amount: Number.parseFloat(amount),
          currency: "NGN",
          counter: 1,
          fees: 0,
          txType: "DEBIT",
        };

        const response = await BankTransferService.MakeNFCPayment(transaction);

        if (response.success) {
          setPaymentResult({
            transaction: { txId: transaction.txId },
            newBalance: 50000,
          });
          setStep("SUCCESS");
        } else {
          setError("Payment failed: " + response.status);
          setStep("FAILURE");
        }
      }
    } catch (error) {
      ToastService.error("Payment processing failed");
      setError((error as Error).message);
      setStep("FAILURE");
    } finally {
      setLoading(false);
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
        title="NFC Payment"
        subtitle="Enter payment details to get started"
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
            className={`text-2xl font-bold mb-6 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Select Payment Type
          </Text>

          <TouchableOpacity
            onPress={handleCreditCard}
            className={`p-6 rounded-2xl mb-4 ${
              isDark ? "bg-indigo-600" : "bg-indigo-700"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                  <MaterialCommunityIcons name="card" size={28} color="white" />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Credit NFC Card
                  </Text>
                  <Text className="text-blue-100 text-sm">Add Money</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePhoneTap}
            className={`p-6 rounded-2xl mb-4 ${
              isDark ? "bg-lime-600" : "bg-lime-700"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="cellphone-nfc"
                    size={28}
                    color="white"
                  />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Phone Tap (BLE)
                  </Text>
                  <Text className="text-lime-100 text-sm">
                    Bluetooth Payment
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePullPayment}
            className={`p-6 rounded-2xl ${
              isDark ? "bg-emerald-600" : "bg-emerald-700"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                  <Ionicons name="arrow-down-circle" size={28} color="white" />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Pull Payment
                  </Text>
                  <Text className="text-green-100 text-lg">Request Money</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showMerchantModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          className={`flex-1 p-8 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
        >
          <Text
            className={`text-2xl font-bold mb-6 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {paymentType === "CREDIT"
              ? "Credit Card"
              : paymentType === "PHONE_TAP"
                ? "Phone Tap Payment"
                : "Payment Details"}
          </Text>

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
            onPress={() => setShowMerchantModal(false)}
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
      </Modal>
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <TransactionPin
      paymentMessage={
        paymentType === "CREDIT"
          ? "Enter PIN to Credit your card"
          : paymentType === "PHONE_TAP"
            ? "Enter PIN to authorize Bluetooth payment"
            : "Enter Transaction PIN to Authorize"
      }
      showPinModal={true}
      onSuccess={handlePinSuccess}
      onCancel={handlePinCancel}
    />
  );

  const renderTapCard = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="NFC Card Tap"
        subtitle="Hold your card near the device to complete payment"
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
          <View className="w-32 h-32 rounded-full bg-indigo-500 items-center justify-center mb-6">
            <Text className="text-6xl">📱</Text>
          </View>
          <Text
            className={`text-2xl font-bold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Ready to Scan
          </Text>
          <Text
            className={`text-lg text-center ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Position your NFC card against the back of your device
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
            {paymentType === "CREDIT" ? "Credit Summary" : "Payment Summary"}
          </Text>
          <View className="space-y-3">
            {paymentType === "DEBIT" && (
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
                  {merchantId}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-lg ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {paymentType === "CREDIT" ? "Credit Amount" : "Amount"}
              </Text>
              <Text className="text-2xl font-bold text-green-500">
                ₦{amount}
              </Text>
            </View>
          </View>
        </View>

        {!loading && (
          <TouchableOpacity
            className={`p-4 rounded-2xl mb-4 ${
              isDark ? "bg-emerald-600" : "bg-emerald-700"
            }`}
            onPress={handleCardTap}
          >
            <Text className="text-white text-lg font-bold text-center">
              ✓ I&apos;ve Tapped My Card
            </Text>
          </TouchableOpacity>
        )}

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
            <Text
              className={`text-sm mt-1 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Please keep your card close
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
      {step === "TAP_CARD" && renderTapCard()}
      {step === "SUCCESS" && (
        <TransactionSuccess
          data={{
            amount: amount,
            recipient:
              paymentType === "CREDIT"
                ? "Card Credit"
                : paymentType === "PHONE_TAP"
                  ? "BLE Payment"
                  : merchantId,
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
    </>
  );
};

export default NFCPayments;
