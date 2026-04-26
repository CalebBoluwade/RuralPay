import Button from "@/src/components/ui/Button";
import PaymentMethodModal from "@/src/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { useClearLoadingOnLock } from "@/src/hooks/useClearLoadingOnLock";
import PaymentService from "@/src/lib/services/PaymentService";
import QRCodeService from "@/src/lib/services/QRCodeService";
import ToastService from "@/src/lib/services/ToastService";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QRPayments = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { token } = useLocalSearchParams<{ token?: string }>();

  if (__DEV__) console.log(token);

  const [scanned, setScanned] = useState(false);
  const processingScan = useRef(false);
  const paymentComplete = useRef(false);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [scannedQRData, setScannedQRData] = useState<ScannedQRData | null>(
    null,
  );
  const [permission, requestPermission] = useCameraPermissions();

  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  useClearLoadingOnLock(setLoading, setIsProcessingPayment);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
  } | null>(null);

  const ProcessPayment = async (
    selected2FA: TwoFAType,
    twoFACode: string,
  ): Promise<boolean> => {
    if (!pendingPaymentData?.accountNumber || !scannedQRData) {
      setError("Missing payment information");
      return false;
    }

    if (!scannedQRData.accountNumber || !scannedQRData.bankCode) {
      setError("Invalid QR Code: missing merchant account details");
      return false;
    }

    setIsProcessingPayment(true);
    setError("");

    try {
      const payment = await PaymentService.B2BTransfer({
        amount: scannedQRData.amount,
        currency: "NGN",
        beneficiaryBankCode: scannedQRData.bankCode,
        beneficiaryBankName:
          scannedQRData.bankName ?? scannedQRData.merchantName,
        beneficiaryAccountNumber: scannedQRData.accountNumber,
        beneficiaryAccountName: scannedQRData.merchantName,
        fromAccount: pendingPaymentData.accountNumber,
        narration: `QR Payment IFO ${scannedQRData.merchantName}`,
        OneTimeCode: twoFACode,
        saveBeneficiary: false,
        paymentMode: "QR",
        transactionID: PaymentService.generateTransactionId("QR"),
        txType: "DEBIT",
        twoFAType: selected2FA,
      });

      if (payment.success) {
        paymentComplete.current = true;
        setPaymentResult({
          amount: scannedQRData.amount.toString(),
          recipient: scannedQRData.merchantName,
          reference: payment.details.transactionId,
          date: new Date().toLocaleString(),
          type: "QR Payment",
          narration: `QR Payment to ${scannedQRData.merchantName}`,
        });
        return true;
      }

      setError(payment.errorMessage || "Payment processing failed");
      return false;
    } catch (error) {
      if (__DEV__) console.error(error);
      setError((error as Error).message || "Failed to process payment");
      return false;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePinSuccess = async (
    selected2FA: TwoFAType,
    twoFACode: string,
  ): Promise<boolean> => {
    return await ProcessPayment(selected2FA, twoFACode);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processingScan.current) return;
    processingScan.current = true;
    setScanned(true);
    setLoading(true);
    setError("");

    try {
      const result = await QRCodeService.processScannedQR(data);

      if (!result || !result.amount) {
        throw new Error("Invalid QR code data");
      }

      setScannedQRData(result);
      setShowPaymentMethodModal(true);
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Failed to process QR code";
      if (__DEV__) console.error("QR Scan Error:", errorMessage);
      setError(errorMessage);
      ToastService.error(errorMessage);

      // Reset scanning state for retry
      resetScanState();
    } finally {
      setLoading(false);
    }
  };

  const resetScanState = () => {
    setScanned(false);
    processingScan.current = false;
    setScannedQRData(null);
    setError("");
    setPaymentResult(null);
    setPendingPaymentData(null);
  };

  const handlePaymentMethodSelected = (data: {
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
  }) => {
    setShowPaymentMethodModal(false);
    setPendingPaymentData(data);
    setShowPinModal(true);
  };

  const handlePaymentMethodModalClose = () => {
    setShowPaymentMethodModal(false);
    resetScanState();
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPendingPaymentData(null);
    resetScanState();
  };

  const handlePaymentComplete = () => {
    setShowPinModal(false);
    setPendingPaymentData(null);
    ToastService.success("Payment completed successfully");
    router.back();
  };

  const handleCancel = () => {
    setShowPinModal(false);
    setPendingPaymentData(null);
    resetScanState();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <>
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        <ScreenHeader title="Scan QR Code" onBack={() => router.back()} />

        <View className="flex-1 justify-center items-center px-6">
          {loading && !scannedQRData ? (
            <ActivityIndicator
              size="large"
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
          ) : !permission?.granted ? (
            <View className="items-center gap-4">
              <Text
                className={`text-center mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Camera Access Is Required To Scan QR Codes.
              </Text>
              <Button label="Grant Permission" onPress={requestPermission} />
            </View>
          ) : (
            <View className="w-full h-[70%] rounded-2xl overflow-hidden">
              <CameraView
                style={{ flex: 1 }}
                onBarcodeScanned={
                  scanned || showPaymentMethodModal || showPinModal || paymentComplete.current
                    ? undefined
                    : handleBarCodeScanned
                }
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
            </View>
          )}

          {error && (
            <View className="mt-4 p-4 bg-red-100 rounded-lg">
              <Text className="text-red-600 text-center">{error}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Payment Method Selection Modal */}
      {scannedQRData && (
        <PaymentMethodModal
          visible={showPaymentMethodModal}
          onClose={handlePaymentMethodModalClose}
          amount={scannedQRData?.amount || 0}
          onPaymentMethodSelected={handlePaymentMethodSelected}
        />
      )}

      {/* PIN Verification Modal */}
      {pendingPaymentData && scannedQRData && (
        <TransactionPin
          // amount={scannedQRData?.amount.toString()}
          // recipient={scannedQRData?.merchantName || "QR Payment"}
          paymentMessage={`Confirm QR Payment of ₦${scannedQRData?.amount?.toLocaleString()} to ${scannedQRData?.merchantName}`}
          showPinModal={showPinModal}
          error={error}
          initiateTransaction={handlePinSuccess}
          transactionResult={paymentResult}
          onCancel={handleCancel}
          isLoading={isProcessingPayment}
          setIsLoading={setIsProcessingPayment}
          // onSuccess={handlePaymentComplete}
        />
      )}
    </>
  );
};

export default QRPayments;
