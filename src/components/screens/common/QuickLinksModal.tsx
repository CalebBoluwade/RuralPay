import { useAuth as useAuthSession } from "@/src/components/context/AuthSessionProvider";
import { useLanguage } from "@/src/components/context/LanguageContext";
import PaymentMethodModal from "@/src/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
import PaymentService from "@/src/lib/services/PaymentService";
import QRCodeService from "@/src/lib/services/QRCodeService";
import ToastService from "@/src/lib/services/ToastService";
import WidgetStorageService from "@/src/lib/services/WidgetStorageService";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Activity, MessageSquareHeart, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, useColorScheme, View } from "react-native";

// ─── Inline QR Scanner Modal ────────────────────────────────────────────────

function QuickScanModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuthSession();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const processing = useRef(false);
  const paymentDone = useRef(false);

  const [scannedData, setScannedData] = useState<ScannedQRData | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
  } | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Write role to widget shared storage on mount
  useEffect(() => {
    if (!visible) return;
    try {
      WidgetStorageService.set("user_role", user?.role ?? "consumer");
    } catch {}
  }, [visible]);

  const reset = () => {
    setScanned(false);
    processing.current = false;
    paymentDone.current = false;
    setScannedData(null);
    setError("");
    setPaymentResult(null);
    setPendingPayment(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing.current) return;
    processing.current = true;
    setScanned(true);
    setError("");
    try {
      const result = await QRCodeService.processScannedQR(data);
      if (!result?.amount) throw new Error("Invalid QR code");
      setScannedData(result);
      setShowMethodModal(true);
    } catch (e) {
      const msg = (e as Error).message || "Failed to process QR code";
      setError(msg);
      ToastService.error(msg);
      reset();
    }
  };

  const handleMethodSelected = (data: {
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
  }) => {
    setShowMethodModal(false);
    setPendingPayment(data);
    setShowPinModal(true);
  };

  const handlePinSuccess = async (
    selected2FA: TwoFAType,
    twoFACode: string,
  ): Promise<boolean> => {
    if (!pendingPayment?.accountNumber || !scannedData) return false;
    setIsProcessing(true);
    setError("");
    try {
      const payment = await PaymentService.B2BTransfer({
        amount: scannedData.amount,
        currency: "NGN",
        beneficiaryBankCode: scannedData.bankCode,
        beneficiaryBankName: scannedData.bankName ?? scannedData.merchantName,
        beneficiaryAccountNumber: scannedData.accountNumber,
        beneficiaryAccountName: scannedData.merchantName,
        fromAccount: pendingPayment.accountNumber,
        narration: `QR Payment IFO ${scannedData.merchantName}`,
        OneTimeCode: twoFACode,
        saveBeneficiary: false,
        paymentMode: "QR",
        transactionID: PaymentService.generateTransactionId("QR"),
        txType: "DEBIT",
        twoFAType: selected2FA,
      });
      if (payment.success) {
        paymentDone.current = true;
        setPaymentResult({
          amount: scannedData.amount.toString(),
          recipient: scannedData.merchantName,
          reference: payment.details.transactionId,
          date: new Date().toLocaleString(),
          type: "QR Payment",
          narration: `QR Payment to ${scannedData.merchantName}`,
        });
        return true;
      }
      setError(payment.errorMessage || "Payment failed");
      return false;
    } catch (e) {
      setError((e as Error).message || "Payment failed");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
          <Text
            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Scan to Pay
          </Text>
          <Pressable
            onPress={handleClose}
            className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? "bg-white/10" : "bg-gray-100"}`}
          >
            <X size={18} color={isDark ? "#fff" : "#64748b"} />
          </Pressable>
        </View>

        {/* Camera / Permission */}
        <View className="flex-1 px-5 pb-8 justify-center">
          {!permission?.granted ? (
            <View className="items-center gap-4">
              <Text
                className={`text-center mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Camera access is required to scan QR codes.
              </Text>
              <Pressable
                onPress={requestPermission}
                className="bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Grant Permission
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="w-full aspect-square rounded-2xl overflow-hidden">
              <CameraView
                style={{ flex: 1 }}
                onBarcodeScanned={
                  scanned ||
                  showMethodModal ||
                  showPinModal ||
                  paymentDone.current
                    ? undefined
                    : handleBarCodeScanned
                }
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
              {/* Scan frame overlay */}
              <View className="absolute inset-0 items-center justify-center">
                <View className="w-48 h-48 border-2 border-white/60 rounded-2xl" />
              </View>
            </View>
          )}

          {error ? (
            <View className="mt-4 p-3 bg-red-100 rounded-xl">
              <Text className="text-red-600 text-center text-base">
                {error}
              </Text>
            </View>
          ) : (
            <Text
              className={`text-center mt-4 text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Point your camera at a RuralPay QR code
            </Text>
          )}
        </View>
      </View>

      {scannedData && (
        <PaymentMethodModal
          visible={showMethodModal}
          onClose={() => {
            setShowMethodModal(false);
            reset();
          }}
          amount={scannedData.amount}
          onPaymentMethodSelected={handleMethodSelected}
        />
      )}

      {pendingPayment && scannedData && (
        <TransactionPin
          paymentMessage={`Confirm QR Payment of ₦${scannedData.amount?.toLocaleString()} to ${scannedData.merchantName}`}
          showPinModal={showPinModal}
          error={error}
          initiateTransaction={handlePinSuccess}
          transactionResult={paymentResult}
          onCancel={() => {
            setShowPinModal(false);
            setPendingPayment(null);
            reset();
          }}
          isLoading={isProcessing}
          setIsLoading={setIsProcessing}
        />
      )}
    </Modal>
  );
}

// ─── Quick Links Modal ───────────────────────────────────────────────────────

const LINKS: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
  color: { dark: string; light: string };
  route: string;
}[] = [
  {
    icon: "mic-outline",
    labelKey: "payments.voice",
    color: { dark: "#84cc16", light: "#65a30d" },
    route: "/user/tapPayments",
  },
  {
    icon: "phone-portrait-outline",
    labelKey: "payments.ussd",
    color: { dark: "#fb923c", light: "#ea580c" },
    route: "/user/bank-transfers",
  },
  {
    icon: "bluetooth-outline",
    labelKey: "payments.bluetooth",
    color: { dark: "#a78bfa", light: "#7c3aed" },
    route: "/user/tapPayments",
  },
];

export default function QuickLinksModal() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();
  const [showScanner, setShowScanner] = useState(false);

  const tileClass = `py-5 rounded-2xl items-center backdrop-blur-xl ${
    isDark
      ? "bg-white/10 border border-white/20"
      : "bg-gray-50 border border-gray-200 shadow-sm"
  }`;
  const tileStyle = {
    width: "30.5%" as const,
    shadowColor: isDark ? "#fff" : "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  };

  return (
    <View className="flex-1 px-6 py-8">
      <Text
        className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {t("home.quickLinks")}
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {LINKS.map(({ icon, labelKey, color, route }) => (
          <Pressable
            key={labelKey}
            className={tileClass}
            style={tileStyle}
            onPress={() => {
              router.dismiss();
              router.push(route as any);
            }}
          >
            <Ionicons
              name={icon}
              size={32}
              color={isDark ? color.dark : color.light}
            />
            <Text
              className={`text-base mt-3 font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
            >
              {t(labelKey)}
            </Text>
          </Pressable>
        ))}

        {/* QR Scan tile — opens inline scanner */}
        <Pressable
          className={tileClass}
          style={tileStyle}
          onPress={() => setShowScanner(true)}
        >
          <Ionicons
            name="qr-code-outline"
            size={32}
            color={isDark ? "#60a5fa" : "#2563eb"}
          />
          <Text
            className={`text-base mt-3 font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
          >
            {t("payments.qr")}
          </Text>
        </Pressable>

        {/* Bank Uptime tile */}
        <Pressable
          className={tileClass}
          style={tileStyle}
          onPress={() => {
            router.dismiss();
            router.push("/merchant/bank-uptime" as any);
          }}
        >
          <Activity size={32} color={isDark ? "#34d399" : "#059669"} />
          <Text
            className={`text-base mt-3 font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
          >
            Bank Uptime
          </Text>
        </Pressable>

        {/* Feedback tile */}
        <Pressable
          className={tileClass}
          style={tileStyle}
          onPress={() => {
            router.dismiss();
            router.push("/feedback");
          }}
        >
          <MessageSquareHeart
            size={32}
            color={isDark ? "#a3e635" : "#65a30d"}
          />
          <Text
            className={`text-base mt-3 font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
          >
            Feedback
          </Text>
        </Pressable>
      </View>

      <QuickScanModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </View>
  );
}
