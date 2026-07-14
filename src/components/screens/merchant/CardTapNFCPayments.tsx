import ScanToPay from "@/assets/images/ScanToPay.svg";
import CardPIN from "@/src/components/ui/Modals/Transaction/CardPin";
import { useClearLoadingOnLock } from "@/src/hooks/useClearLoadingOnLock";
import NFCService from "@/src/lib/services/NFCService";
import PaymentService from "@/src/lib/services/PaymentService";
import ToastService from "@/src/lib/services/ToastService";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/components/context/AuthSessionProvider";
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

  const { width } = useWindowDimensions();

  const [step, setStep] = useState("ENTER_AMOUNT");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [loading, setLoading] = useState(false);
  useClearLoadingOnLock(setLoading);
  const [paymentResult, setPaymentResult] =
    useState<APIResponse<TransactionHistoryItem> | null>(null);
  const [error, setError] = useState<string>("");
  const [cardPin, setCardPin] = useState("");
  const [cardTransaction, setCardTransaction] = useState<CardDetailsResult>();
  const [rawCardInfo, setRawCardInfo] = useState<CardInfo | null>(null);

  const networkInfo = useNetInfo();

  useEffect(() => {
    const initPaymentMethod = async () => {
      try {
        const nfcInit = await NFCService.initialize();
        if (nfcInit) {
          setNFCReady(true);
          if (__DEV__) console.log("NFC initialized successfully");
        } else {
          setNFCReady(false);
          if (__DEV__) console.log("NFC initialization failed");
        }
      } catch (err) {
        if (__DEV__) console.error("NFC init error:", err);
        setNFCReady(false);
      }
    };
    initPaymentMethod();
  }, []);

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
      ToastService.warning("Register As A Merchant To Continue");
      return;
    }

    try {
      setLoading(true);
      // Read card ONCE - no PIN needed yet
      const cardResult = await NFCService.ReadNFCCardOnly();

      if (!cardResult.success || !cardResult.cardInfo) {
        setError(cardResult.message || "Failed to Read Card");
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Store raw card info for later use with PIN
      setRawCardInfo(cardResult.cardInfo);
      setCardTransaction(cardResult);
      setStep("PIN_CONFIRMATION");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unknown Error Occurred While Reading Card",
      );
      if (__DEV__) console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const processPaymentResponse = (
    paymentResponse: APIResponse<TransactionHistoryItem>,
  ) => {
    if (paymentResponse.success) {
      if (__DEV__)
        console.log(
          "[PAYMENT] Payment succeeded! Transaction ID:",
          paymentResponse.details?.transactionId,
        );
      ToastService.success(
        `Payment of ₦${Number(amount).toFixed(2)} Successful!`,
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const errorMsg = paymentResponse.errorMessage?.toLowerCase() || "";
      const isCanceledError =
        errorMsg.includes("canceled") || errorMsg.includes("abort");

      if (__DEV__)
        console.warn("[PAYMENT] Payment failed:", paymentResponse.errorMessage);

      if (!isCanceledError) {
        const displayError = paymentResponse.errorMessage || "Payment Failed";
        setError(displayError);
        ToastService.error(displayError);
      } else if (__DEV__) {
        console.log("[PAYMENT] Canceled error suppressed from UI");
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const validatePaymentInputs = (): {
    valid: boolean;
    merchant?: typeof merchant;
    cardInfo?: CardInfo;
  } => {
    if (!merchant || !cardPin) {
      ToastService.warning("Please Enter PIN to Continue");
      return { valid: false };
    }

    if (!rawCardInfo) {
      ToastService.warning("Card Data Not Available");
      return { valid: false };
    }

    return { valid: true, merchant, cardInfo: rawCardInfo };
  };

  const handleLocationRetrieval = async (
    transaction: NFCCardTransaction,
  ): Promise<void> => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (__DEV__)
        console.log("[PAYMENT] Location retrieved:", location ? "yes" : "no");
      transaction.location = location ?? undefined;
    } catch (locationError) {
      if (__DEV__)
        console.warn(
          "[PAYMENT] Location error (non-fatal):",
          locationError instanceof Error
            ? locationError.message
            : locationError,
        );
    }
  };

  const makePaymentRequest = async (
    transaction: NFCCardTransaction,
  ): Promise<APIResponse<TransactionHistoryItem> | null> => {
    const isConnected = networkInfo.isConnected === true;
    if (__DEV__)
      console.log(
        "[PAYMENT] Network connected:",
        isConnected,
        "networkInfo:",
        networkInfo,
      );

    if (!isConnected) {
      ToastService.warning("No Internet Connection. Saving payment locally.");
      setError("No Internet Connection");
      return null;
    }

    // Create a dedicated abort controller for this payment request
    const paymentAbortController = new AbortController();
    const paymentTimeoutId = setTimeout(() => {
      paymentAbortController.abort();
    }, 30000); // 30 second timeout

    try {
      if (__DEV__) console.log("[PAYMENT] Making API call...");

      const paymentResponse = await PaymentService.MakeNFCCardPayment(
        transaction,
        paymentAbortController.signal,
      );

      if (__DEV__)
        console.log(
          "[PAYMENT] API response received:",
          paymentResponse.success,
        );

      return paymentResponse;
    } finally {
      clearTimeout(paymentTimeoutId);
    }
  };

  const handlePaymentProcessing = async (
    validation: ReturnType<typeof validatePaymentInputs>,
  ): Promise<void> => {
    if (!validation.valid || !validation.merchant || !validation.cardInfo) {
      return;
    }

    if (__DEV__) console.log("[PAYMENT] Starting Payment Processing...");

    const cardResultWithPIN = await NFCService.ProcessCardWithPIN({
      merchantId: validation.merchant.id,
      amount: Number.parseFloat(amount),
      cardPIN: cardPin,
      cardInfo: validation.cardInfo,
    });

    if (__DEV__)
      console.log(
        "[PAYMENT] ProcessCardWithPIN result:",
        cardResultWithPIN.success,
      );

    if (!cardResultWithPIN.success) {
      setError(cardResultWithPIN.message || "PIN Verification Failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (cardResultWithPIN.transaction) {
      await handleLocationRetrieval(cardResultWithPIN.transaction);

      if (cardResultWithPIN?.transaction?.cardInfo) {
        delete cardResultWithPIN.transaction.cardInfo.BIN;
        delete cardResultWithPIN.transaction.cardInfo.last4;
        delete cardResultWithPIN.transaction.cardInfo.errorMessage;
        delete cardResultWithPIN.transaction.cardInfo.schemeLabel;
      }

      const paymentResponse = await makePaymentRequest(
        cardResultWithPIN.transaction,
      );

      if (paymentResponse) {
        setPaymentResult(paymentResponse);
        processPaymentResponse(paymentResponse);
      }
    }
  };

  const HandleCardTapPayment = async () => {
    try {
      setLoading(true);
      const validation = validatePaymentInputs();
      await handlePaymentProcessing(validation);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message?.toLowerCase() : "";

      if (__DEV__)
        console.error(
          "[PAYMENT] Error:",
          error instanceof Error ? error.message : error,
        );

      // Suppress known non-critical errors
      const isCanceledError =
        errorMsg.includes("canceled") ||
        errorMsg.includes("abort") ||
        (error instanceof Error && error.name === "AbortError");

      if (!isCanceledError && error instanceof Error) {
        ToastService.error("Payment Processing Failed");
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinEntered = (pin: string) => {
    setCardPin(pin);
  };

  const resetAllState = () => {
    setStep("ENTER_AMOUNT");
    setAmount("");
    setAmountError("");
    setLoading(false);
    setPaymentResult(null);
    setError("");
    setCardPin("");
    setCardTransaction(undefined);
    setRawCardInfo(null);
  };

  const handlePinCancel = () => {
    resetAllState();
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
          onPress={() => {
            resetAllState();
            setShowMerchantPayModal(false);
          }}
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
        >
          <X size={22} color={isDark ? "#fff" : "#64748b"} />
        </Pressable>
      </View>

      <View className="flex-1 px-5">
        {/* Info card */}
        <View className={`rounded-2xl p-5 mb-6 mt-4 ${cardClass}`}>
          <View className="flex-row items-center gap-3">
            <View
              className={`px-5 py-4 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
            >
              <CreditCard size={22} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
            <View>
              <Text
                className={`text-lg font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Accept Contactless Payments
              </Text>
              <Text
                className={`text-base mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Tap Bank Cards To Make Payments
              </Text>
            </View>
          </View>
        </View>

        {/* Illustration */}
        <View className="items-center mb-6">
          <ScanToPay width={width - 48} height={(width - 48) * 0.8} />
        </View>

        {/* Amount input */}
        <AmountInput
          onAmountChange={(amount) => {
            setAmount(amount);
            setAmountError("");
          }}
          error={amountError}
        />

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
            onPress={() => {
              resetAllState();
              setShowMerchantPayModal(false);
            }}
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

  const RenderEnterPin = () => (
    <CardPIN
      cardTransaction={cardTransaction!}
      error={error}
      paymentMessage="Enter Your 4-Digit Card PIN to Authorize This Transaction"
      showPinModal={true}
      merchantBusinessName={merchant?.businessName || ""}
      merchantCommisionRate={merchant?.commisionRate || 0}
      amount={Number.parseFloat(amount)}
      isLoading={loading}
      setIsLoading={setLoading}
      onPinEntered={handlePinEntered}
      onCancel={handlePinCancel}
      HandleCardTapPayment={HandleCardTapPayment}
      transactionResult={paymentResult?.details}
    />
  );

  const RenderTapUserCard = () => {
    const getButtonColor = () => {
      if (NFCReady) {
        return "bg-lime-400";
      }
      return isDark ? "bg-slate-700" : "bg-slate-300";
    };

    return (
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
            onPress={resetAllState}
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
              className={`text-2xl font-brand font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {NFCReady
                ? "Ready to Scan Payment Card"
                : error === "NFC Not Available"
                  ? "NFC Not Available"
                  : error}
            </Text>
            <Text
              className={`text-base text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Press Continue. Position your NFC Card against the back of the
              Device
            </Text>
          </View>

          {/* NFC Not Ready Warning */}
          {!NFCReady && !loading && (
            <View
              className={`rounded-2xl p-4 mb-6 ${isDark ? "bg-red-500/20 border border-red-500/50" : "bg-red-50 border border-red-200"}`}
            >
              <Text
                className={`text-base font-brand font-bold ${isDark ? "text-red-400" : "text-red-700"}`}
              >
                NFC is not available on this device. Please check if NFC is
                enabled in your phone settings.
              </Text>
            </View>
          )}

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
                className={`text-base mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Please Keep Your Card Close To The Device
              </Text>
            </View>
          )}

          {/* Actions */}
          {!loading && (
            <Pressable
              className={`py-4 rounded-2xl mb-4 items-center ${getButtonColor()}`}
              onPress={CaptureCardDetails}
              disabled={loading || !NFCReady}
            >
              <Text className="text-white font-brand font-bold text-base">
                Continue
              </Text>
            </Pressable>
          )}

          <Pressable
            className={`py-4 rounded-2xl items-center ${isDark ? "bg-white/10" : "bg-slate-100"}`}
            onPress={resetAllState}
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
  };

  return (
    <Modal
      visible={showMerchantPayModal}
      onRequestClose={() => {
        resetAllState();
        setShowMerchantPayModal(false);
      }}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      {step === "ENTER_AMOUNT" && renderEnterDetails()}
      {step === "TAP_CARD" && RenderTapUserCard()}
      {step === "PIN_CONFIRMATION" && RenderEnterPin()}
    </Modal>
  );
};

export default CardTapNFCPayments;
