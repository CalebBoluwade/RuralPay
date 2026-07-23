import PaymentService from "@/src/lib/services/PaymentService";
import { ReceiptService } from "@/src/lib/services/ReceiptService";
import * as Haptics from "expo-haptics";
import { ArrowBigLeftDashIcon, CreditCard, Lock, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScanToPay from "@/assets/images/ScanToPay.svg";
import MasterCard from "@/assets/images/mastercard.svg";
import VisaCard from "@/assets/images/visa.svg";

import CardPaymentSummaryCard from "./CardPaymentSummaryCard";
import TransactionFailure from "./TransactionFailure";
import TransactionSuccess from "./TransactionSuccess";

interface CardPinProps {
  paymentMessage: string;
  showPinModal: boolean;
  isLoading: boolean;
  merchantBusinessName: string;
  merchantCommisionRate: number;
  amount: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onPinEntered: (pin: string) => void;
  error: string;
  cardTransaction: CardDetailsResult;
  transactionResult?: TransactionHistoryItem; // TransactionData
  onCancel?: () => void;
  HandleCardTapPayment: () => Promise<void>;
}

const CardPIN: React.FC<CardPinProps> = ({
  paymentMessage,
  showPinModal,
  onPinEntered,
  onCancel,
  merchantBusinessName,
  merchantCommisionRate,
  amount,
  isLoading,
  setIsLoading,
  error,
  cardTransaction,
  transactionResult,
  HandleCardTapPayment,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [code, setCode] = React.useState<number[]>([]);
  const [BINData, setBINData] = useState<BINData | null>(null);
  const { width } = useWindowDimensions();

  const [currentStep, setCurrentStep] = React.useState<AuthStep>(() =>
    skipPin ? "Confirm" : "PIN"
  );

  // PIN bypass is only permitted in non-production environments.
  // Even if EXPO_PUBLIC_PIN_ENTRY_DISABLED=true is accidentally set in .env.production,
  // this guard ensures it is ignored at runtime.
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === "production";
  const PIN_DISABLED =
    !isProduction && process.env.EXPO_PUBLIC_PIN_ENTRY_DISABLED === "true";
  const PIN_MIN_AMOUNT = process.env.EXPO_PUBLIC_PIN_MIN_AMOUNT
    ? Number.parseInt(process.env.EXPO_PUBLIC_PIN_MIN_AMOUNT, 10)
    : 0;
  const skipPin = PIN_DISABLED || (!isProduction && amount < PIN_MIN_AMOUNT);

  const codeLength = new Array(4).fill(0);



  const fetchBin = async () => {
    const cardBIN = cardTransaction?.BIN || "";
    if (!cardBIN || BINData) return;
    setIsLoading(true);
    try {
      const data = await PaymentService.GetCardBIN(cardBIN.slice(0, 6));
      setBINData(data);
    } catch (error) {
      if (__DEV__) console.log("Failed to Fetch BIN", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCardSchemeLogo = () => {
    if (!BINData?.scheme) {
      return <CreditCard size={24} color={isDark ? "#fff" : "#000"} />;
    }

    const scheme = BINData.scheme.toLowerCase();

    if (scheme.includes("visa")) return <VisaCard width={24} height={24} />;
    else if (scheme.includes("mastercard"))
      return <MasterCard width={24} height={24} />;

    return <CreditCard size={24} color={isDark ? "#fff" : "#000"} />;
  };

  useEffect(() => {
    if (BINData || !cardTransaction?.BIN) return;
    const bin = cardTransaction.BIN.slice(0, 6);
    setIsLoading(true);
    PaymentService.GetCardBIN(bin)
      .then(setBINData)
      .catch((err) => { if (__DEV__) console.log("Failed to Fetch BIN", err); })
      .finally(() => setIsLoading(false));
  }, [cardTransaction?.BIN]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedStep = useMemo<AuthStep>(() => {
    if (currentStep === "Confirm") {
      if (transactionResult?.transactionId) return "Success";
      if (error) return "Failure";
    }
    return currentStep;
  }, [currentStep, transactionResult, error]);

  const handleDownloadReceipt = async () => {
    if (transactionResult) {
      await ReceiptService.DownloadTransactionReceipt({
        ...transactionResult,
        reference: transactionResult.reference,
        amount: (transactionResult.amount || amount).toString(),
        toAccount: transactionResult.toAccount,
        merchantName: merchantBusinessName,
        cardLast4: cardTransaction?.cardInfo?.last4,
      });
    }
  };

  const RenderButton = (num: number) => (
    <Pressable
      key={num}
      onPress={() => OnNumberPressDown(num)}
      className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
        isDark
          ? "bg-white/10 border border-white/20"
          : "bg-white/30 border border-gray-200/50"
      }`}
    >
      <Text
        className={`text-2xl font-light ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {num}
      </Text>
    </Pressable>
  );

  const onBackspacePress = () => {
    if (code.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode((prev) => prev.slice(0, -1));
  };

  const RenderPinView = () => (
    <View>
      <View className="items-center pt-10 pb-4">
        <View
          className={`flex-row items-center px-4 py-2 rounded-full ${
            isDark ? "bg-white/10" : "bg-gray-100"
          }`}
        >
          <Lock size={14} color={isDark ? "#a78bfa" : "#7c3aed"} />
          <Text
            className={`ml-2 text-xs font-medium ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            End-to-End Encrypted
          </Text>
        </View>
      </View>

      <View
        className={`flex-1 justify-center ${
          isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"
        }`}
      >
        <View className="px-5 items-center">
          <Text
            className={`text-2xl font-bold mb-4 text-center ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Enter PIN
          </Text>
          <Text
            className={`text-base font-semibold text-center mb-12 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {paymentMessage}
          </Text>
        </View>

        <View className="flex-row justify-center mb-12">
          {codeLength.map((_, index) => (
            <View
              key={index + 1}
              className={`w-4 h-4 mx-2 justify-center items-center rounded-lg backdrop-blur-xl ${
                code.length > index
                  ? isDark
                    ? "bg-lime-500 border-2 border-lime-400"
                    : "bg-lime-600 border-2 border-lime-500"
                  : isDark
                    ? "border-2 border-white/30 bg-transparent"
                    : "border-2 border-gray-400 bg-transparent"
              }`}
            >
              <Text
                className={`text-2xl ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {code.length > index ? "•" : ""}
              </Text>
            </View>
          ))}
        </View>

        <View className="items-center">
          <View className="flex-row justify-between w-80 mb-6">
            {[1, 2, 3].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-80 mb-6">
            {[4, 5, 6].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-80 mb-6">
            {[7, 8, 9].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-64 mb-4">
            <View className="w-20 h-20" />

            <Pressable
              onPress={() => OnNumberPressDown(0)}
              className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/30 border border-gray-200/50"
              }`}
            >
              <Text
                className={`text-2xl font-light ${isDark ? "text-white" : "text-gray-900"}`}
              >
                0
              </Text>
            </Pressable>

            <View className="w-20 h-20 justify-center items-center">
              {code.length > 0 ? (
                <Pressable onPress={() => onBackspacePress()}>
                  <ArrowBigLeftDashIcon
                    size={28}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Pressable>
              ) : onCancel ? (
                <Pressable onPress={onCancel}>
                  <X size={28} color={isDark ? "#9ca3af" : "#6b7280"} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const RenderConfirmPaymentDetails = () => {
    // Check if data is available
    if (!cardTransaction?.success || (!BINData && isLoading)) {
      return (
        <View
          className={`flex-1 px-3 justify-center items-center ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
        >
          <ActivityIndicator
            size="large"
            color={isDark ? "#a78bfa" : "#7c3aed"}
          />
          <Text className={`mt-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Loading Payment Details...
          </Text>
        </View>
      );
    }

    return (
      <View
        className={`justify-center items-center --${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        <View className="items-center mb-6">
          <ScanToPay width={width - 120} height={(width - 120) * 0.8} />
        </View>

        <CardPaymentSummaryCard
          isDark={isDark}
          isLoading={isLoading}
          BINData={BINData}
          cardTransaction={cardTransaction}
          merchantBusinessName={merchantBusinessName}
          merchantCommisionRate={merchantCommisionRate}
          amount={amount}
          onCancel={onCancel!}
          HandleCardTapPayment={HandleCardTapPayment}
          renderCardSchemeLogo={renderCardSchemeLogo}
        />

        {/* <View
          className={`flex-1 p-4 rounded-2xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white border border-gray-200"
          }`}
        >
          <Text
            className={`text-2xl font-bold mb-6 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Confirm Payment
          </Text>

          <Text
            className={`text-lg mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Card PAN
          </Text>
          <Text
            className={`text-xl font-bold leading-relaxed ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {cardTransaction?.success
              ? cardTransaction?.BIN + "****" + cardTransaction?.cardInfo?.last4
              : ""}
          </Text>

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <Text
            className={`text-base mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Card Issuing Bank
          </Text>
          {isLoading ? (
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
                {BINData?.issuerBank || "Unknown Bank"}
              </Text>
            </View>
          )}

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <Text
            className={`text-base mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Card Issuing Network
          </Text>
          {isLoading ? (
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
                {BINData?.scheme
                  ? BINData.scheme.toUpperCase()
                  : "Unknown Scheme"}
              </Text>
            </View>
          )}

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <Text
            className={`text-base mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Merchant
          </Text>
          <Text
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {merchantBusinessName}
          </Text>

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <Text
            className={`text-base mb-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Amount
          </Text>
          <Text className="text-3xl font-bold text-emerald-500">
            ₦{amount ? amount.toFixed(2) : "0.00"}
          </Text>

          <View className="h-[1px] bg-gray-200/20 my-4" />

          <View className="flex-row items-center justify-between">
            <Pressable
              disabled={isLoading || !BINData}
              className={`bg-lime-400 rounded-2xl px-3 py-4 shadow-lg mb-2 ${isLoading || !BINData ? "opacity-50" : ""}`}
              onPress={HandleCardTapPayment}
            >
              <Text className="text-white text-lg font-bold text-center">
                {isLoading ? "Verifying Card..." : "Confirm & Pay"}
              </Text>
            </Pressable>

            <Pressable
              className={`p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-gray-100"}`}
              onPress={onCancel}
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
        </View> */}
      </View>
    );
  };

  const RenderSuccess = () => (
    <TransactionSuccess
      transactionResult={{
        ...transactionResult!,
        amount: transactionResult?.amount || amount,
      }}
      handleDownloadReceipt={handleDownloadReceipt}
      onClose={() => {
        onCancel?.();
        setCurrentStep("PIN");
      }}
    />
  );

  const RenderFailure = () => (
    <TransactionFailure
      error={error}
      onClose={() => {
        onCancel?.();
        setCurrentStep("PIN");
      }}
    />
  );

  const OnNumberPressDown = (num: number) => {
    if (code.length < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCode((prev) => [...prev, num]);
    } else if (code.length === 3) {
      const pin = [...code, num].join("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPinEntered(pin);
      setCode([]);
      setCurrentStep("Confirm");
    }
  };

  const getCurrentStepContent = () => {
    switch (resolvedStep) {
      case "PIN":
        return RenderPinView();
      case "Confirm":
        return RenderConfirmPaymentDetails();
      case "Success":
        return RenderSuccess();
      case "Failure":
        return RenderFailure();
      default:
        return skipPin ? RenderConfirmPaymentDetails() : RenderPinView();
    }
  };

  return (
    // <Modal
    //   visible={showPinModal}
    //   animationType="slide"
    //   presentationStyle={Platform.OS === "ios" ? "pageSheet" : "formSheet"}
    //   onRequestClose={onCancel}
    // >
    <SafeAreaView
      className={`flex-1 justify-center items-center ${isDark ? "bg-[#0a0a0f]" : "bg-[#e7efe7]"}`}
    >
      {getCurrentStepContent()}
    </SafeAreaView>
  );
};

export default CardPIN;
