import CardPIN from "@/components/ui/Transaction/CardPin";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import NFCService from "@/lib/services/NFCService";
import PaymentService from "@/lib/services/PaymentService";
import ToastService from "@/lib/services/ToastService";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";

import AmountInput from "@/components/ui/Input/AmountInput";
import { LocationService } from "@/lib/services/LocationService";
import { Ionicons } from "@expo/vector-icons";
import { useNetInfo } from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthProvider";

interface NFCPaymentsProps {
  showMerchantPayModal: boolean;
  setShowMerchantPayModal: (value: boolean) => void;
}

const NFCPayments: React.FC<NFCPaymentsProps> = ({
  showMerchantPayModal,
  setShowMerchantPayModal,
}) => {
  // NFCManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
  //   console.log("Discovered tag", tag);
  //   handleCardTap();
  // });
  const [NFCReady, setNFCReady] = useState(false);

  const { user } = useAuth();
  const merchant = user?.merchant;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState("ENTER_AMOUNT");

  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<APIResponse>();
  const [error, setError] = useState<string>("");
  const [cardPin, setCardPin] = useState("");
  const [cardTransaction, setCardTransaction] = useState<PaymentResult>();
  const [binData, setBinData] = useState<any>(null);

  const networkInfo = useNetInfo();

  useEffect(() => {
    const initPaymentMethod = async () => {
      const nfcInit = await NFCService.initialize();
      const nfcEnabled = await NFCService.isEnabled();
      setNFCReady(nfcInit && nfcEnabled);
    };

    initPaymentMethod();
  }, []);

  useEffect(() => {
    if (step === "CONFIRM") {
      const fetchBin = async () => {
        setLoading(true);
        try {
          const cardPAN = cardTransaction?.success
            ? cardTransaction?.transaction?.cardInfo.PAN!
            : "";
          const data = await PaymentService.GetCardBin(cardPAN.slice(0, 6));
          setBinData(data);
        } catch (error) {
          console.log("Failed to fetch BIN", error);
        } finally {
          setLoading(false);
        }
      };
      fetchBin();
    }
  }, [step, cardTransaction]);

  const handleStartPayment = async () => {
    const numericAmount = Number.parseFloat(amount);

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setAmountError("Please enter a valid amount");
      // return;
    }

    if (numericAmount > 1000000) {
      setAmountError("Amount cannot exceed ₦1,000,000");
      // return;
    }

    setAmountError("");

    try {
      setLoading(true);

      if (!merchant) {
        Alert.alert("Merchant Status", "Register As A Merchant To Progress");
        setAmountError("Register As A Merchant To Progress");
        // return;
      }

      if (!merchant || !amount || Number.parseFloat(amount) <= 0) {
        ToastService.warning("Please Enter Valid Amount");
        return;
      }

      // if (!nfcReady) {
      //   ToastService.error(
      //     "NFC Not Available",
      //     // "NFC is not available on this device or is disabled. Please enabl e NFC in settings.",
      //   );
      //   return;
      // }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep("TAP_CARD");
    } finally {
      setLoading(false);
    }
  };

  const CaptureCardDetails = async () => {
    if (!merchant) {
      ToastService.warning("Register As A Merchant To Progress");
      return;
    }

    try {
      setLoading(true);

      const cardResult = await NFCService.MakeNFCCardPayment({
        merchantId: merchant.id,
        amount: Number.parseFloat(amount),
        cardPIN: cardPin,
      });

      if (!cardResult.success) {
        ToastService.error("Card Payment Failed. Please Try Again.");
        setStep("FAILURE");
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const location = await LocationService.getCurrentLocation();
      cardResult.transaction!.location = location ?? undefined;
      setCardTransaction(cardResult);

      setStep("ENTER_PIN");
    } catch (error) {
      console.log(error);
    }
  };

  const HandleCardTapPayment = async () => {
    try {
      if (!merchant) {
        ToastService.warning("Register As A Merchant To Progress");
        return;
      }

      if (!binData) {
        ToastService.error(
          "Card Validation Failed: Unable to verify card issuer",
        );
        return;
      }

      if (networkInfo.isConnected) {
        const paymentResponse = await PaymentService.MakeNFCCardPayment(
          cardTransaction?.transaction!,
        );

        setPaymentResult(paymentResponse);

        if (paymentResponse.success) {
          ToastService.success(
            `Payment of ₦${Number(amount).toFixed(2)} Successful!`,
          );

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStep("SUCCESS");
        } else {
          ToastService.error(
            `Payment of ₦${Number(amount).toFixed(2)} Failed!`,
          );

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setStep("FAILURE");
        }
      } else {
        ToastService.warning("Offline Mode: Payment saved locally");
      }
    } catch (error) {
      ToastService.error("Payment processing failed");
      setError((error as Error).message);
      setStep("FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const handlePinEntered = (pin: string) => {
    setCardPin(pin);
    setStep("CONFIRM");
  };

  const handlePinCancel = () => {
    setStep("ENTER_AMOUNT");
  };

  const handleRetry = () => {
    setStep("TAP_CARD");

    setError("");
  };

  const handleClose = () => {
    router.back();
  };

  const renderCardSchemeLogo = () => {
    if (!binData?.scheme) {
      return (
        <Ionicons name="card" size={24} color={isDark ? "#fff" : "#000"} />
      );
    }

    const scheme = binData.scheme.toLowerCase();
    let source = null;

    if (scheme.includes("visa")) source = require("@/assets/images/visa.svg");
    else if (scheme.includes("mastercard"))
      source = require("@/assets/images/mastercard.svg");

    if (source) {
      return (
        <SvgUri
          uri={source}
          style={{ width: 32, height: 32, borderRadius: 16 }}
        />
      );
    }

    return <Ionicons name="card" size={24} color={isDark ? "#fff" : "#000"} />;
  };

  const renderEnterDetails = () => (
    <SafeAreaView
      className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-[#ffffff]"}
    >
      <View
        className={`flex-1 items-center justify-center p-4 ${isDark ? "bg-[#0a0a0f]" : "bg-[#ffffff]"}`}
      >
        <View className="my-3 p-1 justify-center items-center">
          <Text
            className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "--text-black text-gray-900"}`}
          >
            Accept Contactless Card Payments Here
          </Text>

          <SvgUri
            uri={
              Image.resolveAssetSource(require("@/assets/images/ScanToPay.svg"))
                .uri
            }
            className="justify-center items-center"
            width={285}
            height={285}
          />
        </View>

        <AmountInput
          onAmountChange={(amount) => {
            setAmount(amount);
            setAmountError("");
          }}
          error={amountError}
        />

        <View className="flex-row gap-3 mb-8">
          <Pressable
            className={`p-4 flex-row items-center gap-3 rounded-2xl backdrop-blur-xl ${
              isDark ? "bg-emerald-600" : "bg-emerald-700"
            }`}
            onPress={handleStartPayment}
          >
            <Ionicons name="checkmark" size={28} color={"white"} />

            <Text className="text-white text-lg font-bold text-center">
              Make Payment
            </Text>
          </Pressable>

          <Pressable
            className={`p-4 flex-row items-center gap-3 rounded-2xl backdrop-blur-xl ${
              isDark
                ? "bg-white/5 border border-white/10"
                : "bg-gray-200/40 border border-gray-200/30"
            }`}
            onPress={() => setShowMerchantPayModal(false)}
          >
            <Ionicons name="close" size={28} color={"red"} />
            <Text
              className={`text-lg font-semibold text-center ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Cancel Payment
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <View className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-white"}`}>
      <View className="items-center pt-10 pb-4">
        <View
          className={`flex-row items-center px-4 py-2 rounded-full ${
            isDark ? "bg-white/10" : "bg-gray-100"
          }`}
        >
          <Ionicons
            name="lock-closed"
            size={14}
            color={isDark ? "#a78bfa" : "#7c3aed"}
          />
          <Text
            className={`ml-2 text-xs font-medium ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            End-to-End Encrypted
          </Text>
        </View>
      </View>
      <CardPIN
        paymentMessage={"Enter 4-Digit Card PIN to Authorize This Transaction"}
        showPinModal={true}
        onPinEntered={handlePinEntered}
        onCancel={handlePinCancel}
      />
    </View>
  );

  const renderConfirm = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <View className="flex-1 px-6 pt-6">
        <Text
          className={`text-2xl font-bold mb-6 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Confirm Payment
        </Text>

        <View
          className={`p-6 rounded-2xl mb-6 ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white border border-gray-200"
          }`}
        >
          <Text
            className={`text-sm mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Card PAN
          </Text>
          <Text
            className={`text-xl font-bold ml-3 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {cardTransaction?.success
              ? cardTransaction?.transaction?.cardInfo.PAN!
              : ""}
          </Text>

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <Text
            className={`text-sm mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Card Issuer
          </Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
          ) : (
            <View className="flex-row items-center">
              {renderCardSchemeLogo()}
              <Text
                className={`text-xl font-bold ml-3 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {binData?.bank_name || "Unknown Bank"}
              </Text>
            </View>
          )}

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <Text
            className={`text-sm mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Merchant
          </Text>
          <Text
            className={`text-xl font-bold ml-3 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {merchant?.businessName ?? "N/A"}
          </Text>

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <Text
            className={`text-sm mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Amount
          </Text>
          <Text className="text-3xl font-bold text-emerald-500">₦{amount}</Text>
        </View>

        <View className="flex-1" />

        <Pressable
          disabled={loading || !binData}
          className={`p-6 rounded-2xl mb-4 ${
            isDark ? "bg-emerald-600" : "bg-emerald-700"
          } ${loading || !binData ? "opacity-50" : ""}`}
          onPress={HandleCardTapPayment}
        >
          <Text className="text-white text-lg font-bold text-center">
            {loading ? "Verifying Card..." : "Confirm & Pay"}
          </Text>
        </Pressable>

        <Pressable
          className={`p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-gray-100"}`}
          onPress={() => setStep("ENTER_AMOUNT")}
        >
          <Text
            className={`text-lg font-semibold text-center ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Cancel
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const renderTapUserCard = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <View className="flex-1 justify-center px-8">
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
            Position your NFC Card Against the Back of The Device
          </Text>
        </View>

        {!loading && (
          <Pressable
            className={`p-6 rounded-2xl mb-4 ${
              isDark ? "bg-emerald-600" : "bg-emerald-700"
            }`}
            onPress={CaptureCardDetails}
          >
            <Text className="text-white text-lg font-bold text-center">
              I&apos;ve Placed The Card Against the Back of The Device
            </Text>
          </Pressable>
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
              Please Keep Your Card close
            </Text>
          </View>
        )}

        <Pressable
          className={`p-4 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/40 border border-gray-200/30"
          }`}
          onPress={() => setStep("ENTER_AMOUNT")}
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
    <Modal
      visible={showMerchantPayModal}
      onRequestClose={() => setShowMerchantPayModal(false)}
      animationType="slide"
      presentationStyle="formSheet"
    >
      {step === "ENTER_AMOUNT" && renderEnterDetails()}
      {step === "TAP_CARD" && renderTapUserCard()}
      {step === "ENTER_PIN" && renderEnterPin()}
      {step === "CONFIRM" && renderConfirm()}
      {step === "SUCCESS" && (
        <TransactionSuccess
          visible
          data={{
            amount: amount,
            recipient: merchant?.id!,
            reference: paymentResult?.transactionId || "",
            date: new Date().toLocaleDateString(),
            type: "NFC Merchant Payment",
          }}
          onClose={handleClose}
          onDownloadReceipt={() => {}}
        />
      )}
      {step === "FAILURE" && (
        <TransactionFailure
          visible
          error={error}
          onRetry={handleRetry}
          onClose={handleClose}
        />
      )}
    </Modal>
  );
};

export default NFCPayments;
