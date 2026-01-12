import { BankTransferService } from "@/components/services/BankTransferService";
import NFCPaymentService from "@/components/services/NFCPaymentService";
import BalanceCard from "@/components/ui/BalanceCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Transaction/TransactionPin";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NFCPayments = () => {
  const [step, setStep] = useState("ENTER_DETAILS");
  const [merchantId, setMerchantId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"CREDIT" | "DEBIT">("DEBIT");

  useEffect(() => {
    NFCPaymentService.initialize();
  }, []);

  const handleCreditCard = () => {
    setPaymentType("CREDIT");
    setShowMerchantModal(true);
  };

  const handlePullPayment = () => {
    setPaymentType("DEBIT");
    setShowMerchantModal(true);
  };

  const handleStartPayment = async () => {
    if (
      paymentType === "DEBIT" &&
      (!merchantId || !amount || Number.parseFloat(amount) <= 0)
    ) {
      Alert.alert("Error", "Please enter valid merchant ID and amount");
      return;
    }

    if (
      paymentType === "CREDIT" &&
      (!amount || Number.parseFloat(amount) <= 0)
    ) {
      Alert.alert("Error", "Please enter valid amount to credit");
      return;
    }

    setShowMerchantModal(false);
    setStep("ENTER_PIN");
  };

  const handleCardTap = async () => {
    try {
      setLoading(true);

      if (paymentType === "CREDIT") {
        const response = await NFCPaymentService.creditCard(
          Number.parseFloat(amount),
          "NGN"
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
          cardId: "card_4829",
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
      setError((error as Error).message);
      setStep("FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPayment = () => {
    setStep("ENTER_DETAILS");
    setMerchantId("");
    setAmount("");
    setPaymentResult(null);
    setError("");
    setPaymentType("DEBIT");
  };

  const handlePinSuccess = () => {
    setStep("TAP_CARD");
  };

  const handlePinCancel = () => {
    setStep("ENTER_DETAILS");
  };

  const handleRetry = () => {
    setStep("TAP_CARD");
    setError("");
  };

  const handleClose = () => {
    router.back();
  };

  const renderEnterDetails = () => (
    <SafeAreaView className="flex-1">
      <ScreenHeader
        title="NFC Payment"
        subtitle="Enter payment details to get started"
        onBack={() => router.back()}
      />

      <View className="flex-1 px-6">
        <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Select Payment Type
          </Text>

          <TouchableOpacity
            onPress={handleCreditCard}
            className="bg-indigo-700 p-6 rounded-2xl mb-4 shadow-lg"
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
            onPress={handlePullPayment}
            className="bg-emerald-700 p-6 rounded-2xl shadow-lg"
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
        presentationStyle="formSheet"
        className="flex-1"
      >
        <View className="flex-1 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            {paymentType === "CREDIT" ? "Credit Card" : "Payment Details"}
          </Text>

          {paymentType === "DEBIT" && <BalanceCard />}

          {paymentType === "DEBIT" && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Merchant ID
              </Text>
              <TextInput
                className="bg-gray-50/80 border-2 border-gray-200 p-4 rounded-2xl text-gray-900 text-lg"
                placeholder="Enter merchant identifier"
                placeholderTextColor="#9CA3AF"
                value={merchantId}
                onChangeText={setMerchantId}
              />
            </View>
          )}

          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Amount (NGN)
            </Text>
            <View className="flex-row items-center bg-gray-50/80 rounded-2xl border-2 border-gray-200">
              <View className="bg-green-600 px-4 py-4 rounded-l-2xl">
                <Text className="text-white font-bold text-xl">N</Text>
              </View>
              <TextInput
                className="flex-1 p-4 text-gray-900 text-xl font-semibold"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-emerald-700 p-4 rounded-2xl shadow-lg mb-4"
            onPress={handleStartPayment}
          >
            <Text className="text-white text-lg font-bold text-center">
              {paymentType === "CREDIT"
                ? "Continue to Credit →"
                : "Continue to Payment →"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white/50 p-4 rounded-2xl border-2 border-gray-300"
            onPress={() => setShowMerchantModal(false)}
          >
            <Text className="text-gray-700 text-lg font-semibold text-center">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <View className="flex-1">
      <View className="flex-1 --bg-black/40 justify-center">
        {/* <ScreenHeader
          title={paymentType === "CREDIT" ? "Credit Card" : "Enter PIN"}
          subtitle={
            paymentType === "CREDIT"
              ? "Enter PIN to credit your card"
              : "Enter your secure transaction PIN to authorize payment"
          }
          onBack={handlePinCancel}
          // isDark
        /> */}

        <View className="px-5">
          <Text className="text-2xl font-bold mb-4 text-center">
            Enter PIN
          </Text>
          <Text className="text-base text-center font-semibold mb-8">
            Confirm Transfer of ₦{amount}
            {/* to{" "}{transferData?.bankName} */}
          </Text>
          <Text className="font-semibold text-center text-xl mb-12">
            {paymentType === "CREDIT"
              ? "Enter PIN to credit your card"
              : "Enter Transaction PIN to Authorize"}
          </Text>

          <View className="items-center">
            <TransactionPin
              onSuccess={handlePinSuccess}
              onCancel={handlePinCancel}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderTapCard = () => (
    <SafeAreaView className="flex-1">
      <ScreenHeader
        title="NFC Card Tap"
        subtitle="Hold your card near the device to complete payment"
        onBack={() => setStep("ENTER_DETAILS")}
      />

      <View className="flex-1 justify-center px-6">
        <View className="bg-white/80 backdrop-blur rounded-3xl p-8 items-center mb-8 shadow-lg border border-white/50">
          <View className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 items-center justify-center mb-6 shadow-xl">
            <Text className="text-6xl text-white">📱</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Scan
          </Text>
          <Text className="text-lg text-gray-600 text-center">
            Position your NFC card against the back of your device
          </Text>
        </View>

        <View className="bg-white/80 backdrop-blur rounded-3xl p-6 mb-8 shadow-lg border border-white/50">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            {paymentType === "CREDIT" ? "Credit Summary" : "Payment Summary"}
          </Text>
          <View className="space-y-3">
            {paymentType === "DEBIT" && (
              <View className="flex-row justify-between items-center">
                <Text className="text-lg text-gray-600">Merchant</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {merchantId}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between items-center">
              <Text className="text-lg text-gray-600">
                {paymentType === "CREDIT" ? "Credit Amount" : "Amount"}
              </Text>
              <Text className="text-2xl font-bold text-green-600">
                ₦{amount}
              </Text>
            </View>
          </View>
        </View>

        {!loading && (
          <TouchableOpacity
            className="bg-emerald-700 p-4 rounded-2xl shadow-lg mb-4"
            onPress={handleCardTap}
          >
            <Text className="text-white text-lg font-bold text-center">
              ✓ I&apos;ve Tapped My Card
            </Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View className="bg-white/80 backdrop-blur rounded-2xl p-6 items-center mb-4 shadow-lg border border-white/50">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-lg font-semibold text-gray-700 mt-3">
              Processing payment...
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Please keep your card close
            </Text>
          </View>
        )}

        <TouchableOpacity
          className="bg-white/50 p-4 rounded-2xl border-2 border-gray-300"
          onPress={() => setStep("ENTER_DETAILS")}
        >
          <Text className="text-gray-700 text-lg font-semibold text-center">
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
            recipient: paymentType === "CREDIT" ? "Card Credit" : merchantId,
            reference: paymentResult?.transaction?.txId || "",
            date: new Date().toLocaleDateString(),
            type: paymentType === "CREDIT" ? "NFC Card Credit" : "NFC Payment",
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
