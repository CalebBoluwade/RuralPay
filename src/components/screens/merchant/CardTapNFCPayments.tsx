import CardPIN from "@/src/components/ui/Modals/Transaction/CardPin";
import NFCService from "@/src/lib/services/NFCService";
import PaymentService from "@/src/lib/services/PaymentService";
import ToastService from "@/src/lib/services/ToastService";
import * as Haptics from "expo-haptics";
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

import { useAuth } from "@/src/components/context/AuthProvider";
import AmountInput from "@/src/components/ui/Input/AmountInput";
import { LocationService } from "@/src/lib/services/LocationService";
import { useNetInfo } from "@react-native-community/netinfo";
import { Check, CreditCard, Smartphone, X } from "lucide-react-native";

interface CardTapNFCPaymentsProps {
  showMerchantPayModal: boolean;
  setShowMerchantPayModal: (value: boolean) => void;
}

const CardTapNFCPayments: React.FC<CardTapNFCPaymentsProps> = ({
  showMerchantPayModal,
  setShowMerchantPayModal,
}) => {
  const [NFCReady, setNFCReady] = useState(false);
  const { user } = useAuth();
  const merchant = user?.merchant;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [step, setStep] = useState("ENTER_AMOUNT");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] =
    useState<APIResponse<TransactionHistory>>();
  const [error, setError] = useState<string>("");
  const [cardPin, setCardPin] = useState("");
  const [cardTransaction, setCardTransaction] = useState<CardDetailsResult>();
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
          const cardBIN = cardTransaction?.success
            ? cardTransaction?.transaction?.cardInfo.BIN!
            : "";
          const data = await PaymentService.GetCardBIN(cardBIN.slice(0, 6));
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

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const handleStartPayment = async () => {
    const numericAmount = Number.parseFloat(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setAmountError("Please Enter A Valid Amount");
      return;
    }
    setAmountError("");

    try {
      setLoading(true);
      if (!merchant) {
        Alert.alert("Merchant Status", "Register As A Merchant To Progress");
        setAmountError("Register As A Merchant To Progress");
        return;
      }
      if (!merchant || !amount || Number.parseFloat(amount) <= 0) {
        ToastService.warning("Please Enter Valid Amount");
        return;
      }
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
      const cardResult = await NFCService.RetrieveNFCCardDetails({
        merchantId: merchant.id,
        amount: Number.parseFloat(amount),
        cardPIN: cardPin,
      });

      if (!cardResult.success) {
        setError(cardResult.message || "Card Payment Failed");
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const location = await LocationService.getCurrentLocation();
      cardResult.transaction!.location = location ?? undefined;
      setCardTransaction(cardResult);
      setStep("ENTER_PIN");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      console.log(error);
    } finally {
      setLoading(false);
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
          "Card Validation Failed: Unable to verify Card issuer",
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
          setError(paymentResponse.errorMessage || "Payment Failed");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        ToastService.warning("Offline Mode: Payment saved locally");
      }
    } catch (error) {
      ToastService.error("Payment Processing Failed");
      setError((error as Error).message);
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

  const renderEnterDetails = () => (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <Text
          className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Card Payment
        </Text>
        <Pressable
          onPress={() => setShowMerchantPayModal(false)}
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
        >
          <X size={22} color={isDark ? "#fff" : "#64748b"} />
        </Pressable>
      </View>

      <View className="flex-1 px-5">
        {/* Info card */}
        <View className={`rounded-2xl p-5 mb-6 mt-4 ${cardClass}`}>
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
            >
              <CreditCard size={22} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
            <View>
              <Text
                className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Accept Contactless Payments
              </Text>
              <Text
                className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Tap cards or mobile wallets to pay
              </Text>
            </View>
          </View>
        </View>

        {/* Illustration */}
        <View className="items-center mb-6">
          <SvgUri
            uri={
              Image.resolveAssetSource(require("@/assets/images/ScanToPay.svg"))
                .uri
            }
            width={240}
            height={240}
          />
        </View>

        {/* Amount input */}
        <View className={`rounded-2xl p-4 mb-6 ${cardClass}`}>
          <AmountInput
            onAmountChange={(amount) => {
              setAmount(amount);
              setAmountError("");
            }}
            error={amountError}
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mb-8">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-lime-400"
            onPress={handleStartPayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Check size={20} color="white" />
            )}
            <Text className="text-white font-brand font-bold text-base">
              Start Payment
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl ${isDark ? "bg-white/10" : "bg-slate-100"}`}
            onPress={() => setShowMerchantPayModal(false)}
          >
            <X size={20} color={isDark ? "#fff" : "#64748b"} />
            <Text
              className={`font-brand font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <CardPIN
      error={error}
      paymentMessage="Enter Your 4-Digit Card PIN to Authorize This Transaction"
      showPinModal={true}
      merchantBusinessName={merchant?.businessName || ""}
      isLoading={loading}
      setIsLoading={setLoading}
      onPinEntered={handlePinEntered}
      onCancel={handlePinCancel}
      HandleCardTapPayment={HandleCardTapPayment}
    />
  );

  const renderTapUserCard = () => (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <Text
          className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Tap Card
        </Text>
        <Pressable
          onPress={() => setStep("ENTER_AMOUNT")}
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
        >
          <X size={22} color={isDark ? "#fff" : "#64748b"} />
        </Pressable>
      </View>

      <View className="flex-1 justify-center px-5">
        {/* Status card */}
        <View className={`rounded-2xl p-8 items-center mb-6 ${cardClass}`}>
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
          >
            <Smartphone size={32} color={isDark ? "#a3e635" : "#65a30d"} />
          </View>
          <Text
            className={`text-xl font-brand font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Ready to Scan
          </Text>
          <Text
            className={`text-sm text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Position your NFC Card against the back of the device
          </Text>
        </View>

        {/* Loading state */}
        {loading && (
          <View className={`rounded-2xl p-6 items-center mb-6 ${cardClass}`}>
            <ActivityIndicator
              size="large"
              color={isDark ? "#a3e635" : "#65a30d"}
            />
            <Text
              className={`text-base font-brand font-bold mt-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Processing payment...
            </Text>
            <Text
              className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Please keep your card close
            </Text>
          </View>
        )}

        {/* Actions */}
        {!loading && (
          <Pressable
            className="py-4 rounded-2xl mb-4 bg-lime-400 items-center"
            onPress={CaptureCardDetails}
          >
            <Text className="text-white font-brand font-bold text-base">
              I&apos;ve Placed The Card
            </Text>
          </Pressable>
        )}

        <Pressable
          className={`py-4 rounded-2xl items-center ${isDark ? "bg-white/10" : "bg-slate-100"}`}
          onPress={() => setStep("ENTER_AMOUNT")}
        >
          <Text
            className={`font-brand font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}
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
      presentationStyle="pageSheet"
    >
      {step === "ENTER_AMOUNT" && renderEnterDetails()}
      {step === "TAP_CARD" && renderTapUserCard()}
      {step === "ENTER_PIN" && renderEnterPin()}
    </Modal>
  );
};

export default CardTapNFCPayments;
