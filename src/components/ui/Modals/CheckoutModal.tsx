import PaymentMethodModal from "@/src/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
import type { CheckoutSession } from "@/src/lib/services/CheckoutService";
import CheckoutService from "@/src/lib/services/CheckoutService";
import PaymentActivityService from "@/src/lib/services/PaymentActivityService";
import PaymentService from "@/src/lib/services/PaymentService";
import { formatAmount } from "@/src/lib/utils/formatAmount";
import {
  Building2,
  ChevronRight,
  Clock,
  ShoppingBag,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CheckoutModalProps {
  visible: boolean;
  session: CheckoutSession;
  onClose: () => void;
  onSuccess: (txId: string) => void;
}

type CheckoutStep = "summary" | "payment" | "pin";

function useExpiryCountdown(expiresAt: string) {
  const getRemaining = () => {
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return {
      expired: diff === 0,
      label: `${m}:${s.toString().padStart(2, "0")}`,
    };
  };
  const [state, setState] = useState(getRemaining);
  useEffect(() => {
    const id = setInterval(() => setState(getRemaining()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return state;
}

function useFadeSlide(trigger: boolean, delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    if (!trigger) {
      opacity.setValue(0);
      translateY.setValue(16);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger]);
  return { opacity, transform: [{ translateY }] };
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  session,
  onClose,
  onSuccess,
}) => {
  const isDark = useColorScheme() === "dark";
  const [step, setStep] = useState<CheckoutStep>("summary");
  const [pendingAccount, setPendingAccount] = useState<{
    method: PaymentMethod;
    accountNumber?: string;
  } | null>(null);
  const [txResult, setTxResult] = useState<TransactionHistoryItem | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { expired, label: expiryLabel } = useExpiryCountdown(session.expiresAt);
  const isOpen = visible && step !== "pin";
  const heroAnim = useFadeSlide(isOpen, 0);
  const cardAnim = useFadeSlide(isOpen, 100);
  const ctaAnim = useFadeSlide(isOpen, 180);

  const card = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200";

  const handlePaymentMethodSelected = (data: {
    method: PaymentMethod;
    accountNumber?: string;
  }) => {
    setPendingAccount(data);
    setStep("pin");
  };

  const initiateTransaction = async (
    twoFAType: TwoFAType,
    twoFACode: string,
  ): Promise<boolean> => {
    if (!pendingAccount?.accountNumber) return false;

    setIsProcessing(true);
    setError("");

    const txId = PaymentService.generateTransactionId("BANK_TRANSFER");
    PaymentActivityService.start(
      txId,
      "CHECKOUT",
      `₦${session.amount.toLocaleString()}`,
      session.merchantName,
    );

    try {
      const payment = await PaymentService.B2BTransfer({
        transactionID: txId,
        amount: session.amount,
        currency: session.currency,
        txType: "DEBIT",
        fromAccount: pendingAccount.accountNumber,
        paymentMode: "BANK_TRANSFER",
        beneficiaryAccountNumber: session.accountNumber,
        beneficiaryBankCode: "",
        beneficiaryBankName: session.bankName,
        beneficiaryAccountName: session.merchantName,
        narration: session.narration,
        OneTimeCode: twoFACode,
        twoFAType,
        saveBeneficiary: false,
      });

      if (payment.success) {
        PaymentActivityService.update(
          "success",
          `₦${session.amount.toLocaleString()}`,
          session.merchantName,
        );
        await CheckoutService.confirmPayment(session.token, txId);
        setTxResult(payment.details);
        onSuccess(txId);
        return true;
      }

      PaymentActivityService.update(
        "failed",
        `₦${session.amount.toLocaleString()}`,
        session.merchantName,
      );
      setError(payment.errorMessage || "Payment failed");
      return false;
    } catch (e) {
      PaymentActivityService.update(
        "failed",
        `₦${session.amount.toLocaleString()}`,
        session.merchantName,
      );
      setError((e as Error).message || "Payment failed");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("summary");
    setPendingAccount(null);
    setTxResult(null);
    setError("");
    onClose();
  };

  const initials = session.merchantName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!visible) return null;

  return (
    <>
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
            <View className="flex-row items-center gap-3">
              <View
                className={`w-9 h-9 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
              >
                <ShoppingBag size={18} color={isDark ? "#a3e635" : "#65a30d"} />
              </View>
              <View>
                <Text
                  className={`text-lg font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Checkout
                </Text>
                <Text
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Secure Payment
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Expiry pill */}
              <View
                className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${
                  expired
                    ? isDark
                      ? "bg-red-500/20"
                      : "bg-red-100"
                    : isDark
                      ? "bg-white/10"
                      : "bg-slate-100"
                }`}
              >
                <Clock
                  size={11}
                  color={expired ? "#ef4444" : isDark ? "#94a3b8" : "#64748b"}
                />
                <Text
                  className={`text-xs font-semibold ${
                    expired
                      ? "text-red-500"
                      : isDark
                        ? "text-slate-400"
                        : "text-slate-500"
                  }`}
                >
                  {expired ? "Expired" : expiryLabel}
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? "bg-white/10" : "bg-slate-100"}`}
              >
                <X size={18} color={isDark ? "#fff" : "#64748b"} />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Amount Hero */}
            <Animated.View
              style={heroAnim}
              className="items-center px-5 pt-10 pb-10"
            >
              <View
                className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
              >
                <Text
                  className={`text-xl font-bold ${isDark ? "text-lime-400" : "text-lime-700"}`}
                >
                  {initials}
                </Text>
              </View>

              <Text
                className={`text-sm mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {session.merchantName}
              </Text>

              <Text
                className={`text-4xl font-brand font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {formatAmount(session.amount, session.currency)}
              </Text>

              <Text
                className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                {session.narration}
              </Text>
            </Animated.View>

            {/* Payment Details Card */}
            <Animated.View style={cardAnim} className="px-5 mb-6">
              <Text
                className={`text-xs font-semibold mb-3 tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                PAYMENT DETAILS
              </Text>

              <View className={`rounded-2xl overflow-hidden ${card}`}>
                <DetailRow
                  label="Recipient"
                  value={session.merchantName}
                  isDark={isDark}
                  bold
                />
                <DetailRow
                  label="Account"
                  value={session.accountNumber}
                  isDark={isDark}
                  mono
                />
                <DetailRow
                  label="Bank"
                  value={session.bankName}
                  isDark={isDark}
                  icon={
                    <Building2
                      size={13}
                      color={isDark ? "#94a3b8" : "#64748b"}
                    />
                  }
                />
                <DetailRow
                  label="Status"
                  value={session.status}
                  isDark={isDark}
                  isStatus
                  last
                />
              </View>
            </Animated.View>

            {/* Pay CTA */}
            <Animated.View style={ctaAnim} className="px-5 pb-10">
              <Pressable
                onPress={() => !expired && setStep("payment")}
                className={`flex-row items-center justify-between rounded-2xl px-5 py-4 ${
                  expired
                    ? isDark
                      ? "bg-white/10"
                      : "bg-slate-200"
                    : "bg-lime-400"
                }`}
              >
                <Text
                  className={`font-brand font-bold text-base ${expired ? (isDark ? "text-slate-500" : "text-slate-400") : "text-black"}`}
                >
                  {expired
                    ? "Session Expired"
                    : `Pay ${formatAmount(session.amount, session.currency)}`}
                </Text>
                {!expired && <ChevronRight size={20} color="#000" />}
              </Pressable>
            </Animated.View>
          </ScrollView>
      </SafeAreaView>

      <PaymentMethodModal
        visible={visible && step === "payment"}
        onClose={() => setStep("summary")}
        amount={session.amount}
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      {pendingAccount && (
        <TransactionPin
          paymentMessage={`Confirm payment of ${formatAmount(session.amount, session.currency)} to ${session.merchantName}`}
          showPinModal={step === "pin"}
          error={error}
          initiateTransaction={initiateTransaction}
          transactionResult={txResult ?? undefined}
          onCancel={handleClose}
          isLoading={isProcessing}
          setIsLoading={setIsProcessing}
        />
      )}
    </>
  );
};

const DetailRow = ({
  label,
  value,
  isDark,
  bold,
  mono,
  icon,
  isStatus,
  last,
}: {
  label: string;
  value: string;
  isDark: boolean;
  bold?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
  isStatus?: boolean;
  last?: boolean;
}) => {
  const statusColor =
    value === "PENDING"
      ? {
          bg: isDark ? "bg-amber-500/20" : "bg-amber-100",
          text: isDark ? "text-amber-400" : "text-amber-600",
        }
      : value === "COMPLETED"
        ? {
            bg: isDark ? "bg-green-500/20" : "bg-green-100",
            text: isDark ? "text-green-400" : "text-green-600",
          }
        : {
            bg: isDark ? "bg-slate-500/20" : "bg-slate-100",
            text: isDark ? "text-slate-400" : "text-slate-600",
          };

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-5 ${
        !last
          ? isDark
            ? "border-b border-white/10"
            : "border-b border-slate-100"
          : ""
      }`}
    >
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text
          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {label}
        </Text>
      </View>

      {isStatus ? (
        <View className={`px-2.5 py-1 rounded-full ${statusColor.bg}`}>
          <Text className={`text-xs font-semibold ${statusColor.text}`}>
            {value}
          </Text>
        </View>
      ) : (
        <Text
          className={`text-sm ${bold ? "font-semibold" : ""} ${mono ? "font-mono" : ""} ${isDark ? "text-white" : "text-slate-900"}`}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </View>
  );
};

export default CheckoutModal;
