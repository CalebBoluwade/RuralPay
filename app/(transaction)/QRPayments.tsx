import BalanceCard from "@/components/ui/BalanceCard";
import TransactionFailure from "@/components/ui/Modals/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Modals/Transaction/TransactionPinModal";
import TransactionSuccess from "@/components/ui/Modals/Transaction/TransactionSuccess";
import ScreenHeader from "@/components/ui/ScreenHeader";
import PaymentService from "@/lib/services/PaymentService";
import QRCodeService from "@/lib/services/QRCodeService";
import ToastService from "@/lib/services/ToastService";
import { CameraView } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QRPayments = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState<
    "SCAN" | "SELECT_ACCOUNT" | "ENTER_PIN" | "SUCCESS" | "FAILURE"
  >("SCAN");

  const { token } = useLocalSearchParams<{ token?: string }>();

  const [amount, setAmount] = useState("");
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [scannedQRData, setScannedQRData] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<BalanceEnquiry | null>(
    null,
  );

  const handleGenerateQR = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      ToastService.error("Please Enter A Valid Amount");
      return;
    }
    setStep("ENTER_PIN");
  };

  const handlePinSuccess = async () => {
    try {
      setLoading(true);

      ToastService.success("QR code generated successfully");
    } catch (error) {
      console.error(error);
      setError("Failed to Generate QR Code");
      setStep("FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const result = await QRCodeService.processScannedQR(data);

      setScannedQRData(result);
      setStep("SELECT_ACCOUNT");
    } catch (error) {
      setError((error as Error).message || "Failed to process QR payment");
      setStep("FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelected = async () => {
    if (!selectedAccount || !scannedQRData) {
      ToastService.error("Please select an account");
      return;
    }

    setLoading(true);
    try {
      const payment = await PaymentService.B2BTransfer({
        amount: scannedQRData.amount,
        currency: "NGN",
        toBankCode: "000",
        fromAccount: selectedAccount.accountId,
        toAccount: "0000000000",
        paymentMode: "QR",
        transactionID: `QRPAY-${Date.now()}`,
        txType: "DEBIT",
      });

      if (payment.success) {
        setPaymentResult({
          amount: scannedQRData.amount.toString(),
          recipient: scannedQRData.merchantName,
          reference: payment.details.transactionId,
        });
        setStep("SUCCESS");
      } else {
        setError("Payment processing failed");
        setStep("FAILURE");
      }
    } catch (error) {
      setError((error as Error).message || "Failed to process payment");
      setStep("FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setScanned(false);
    setError("");
    setStep("SCAN");
  };

  const handleClose = () => {
    router.back();
  };

  const renderScan = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader title="Scan QR Code" onBack={() => router.back()} />

      <View className="flex-1 justify-center items-center px-6">
        {loading ? (
          <ActivityIndicator
            size="large"
            color={isDark ? "#a78bfa" : "#7c3aed"}
          />
        ) : (
          <View className="w-full h-96 rounded-2xl overflow-hidden">
            <CameraView
              style={{ flex: 1 }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  const renderSelectAccount = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Select Account"
        subtitle={`Choose account to pay ₦${scannedQRData?.amount || 0}`}
        onBack={() => setStep("SCAN")}
      />

      <View className="px-6">
        <BalanceCard
          onAccountChange={(account) => setSelectedAccount(account)}
        />

        {scannedQRData && (
          <View
            className={`rounded-2xl p-4 mb-4 ${isDark ? "bg-white/10 border border-white/20" : "bg-white/60 border border-gray-200/50"}`}
          >
            <Text
              className={`text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Payment Details
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className={isDark ? "text-white" : "text-gray-900"}>
                Merchant
              </Text>
              <Text
                className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {scannedQRData.merchantName}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={isDark ? "text-white" : "text-gray-900"}>
                Amount
              </Text>
              <Text
                className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}
              >
                ₦{scannedQRData.amount.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          className={`p-4 rounded-2xl ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
          onPress={handleAccountSelected}
          disabled={!selectedAccount || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-bold text-center">
              Confirm Payment
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <TransactionPin
      amount={scannedQRData?.amount.toString() || amount}
      recipient="QR Payment"
      paymentMessage={`Confirm QR Payment of ${amount}`}
      showPinModal={true}
      onSuccess={handlePinSuccess}
      onCancel={() => setStep("SELECT_ACCOUNT")}
    />
  );

  return (
    <>
      {step === "SCAN" && renderScan()}
      {step === "SELECT_ACCOUNT" && renderSelectAccount()}
      {step === "ENTER_PIN" && renderEnterPin()}
      {step === "SUCCESS" && (
        <TransactionSuccess
          visible={true}
          data={{
            amount: paymentResult?.amount || amount,
            recipient: paymentResult?.recipient || "QR Payment",
            reference: paymentResult?.reference || "QR" + Date.now(),
            // transactionID: paymentResult?.transactionID || "QR" + Date.now(),
            date: new Date().toLocaleDateString(),
            type: "QR Payment",
          }}
          onClose={handleClose}
          onDownloadReceipt={() => {}}
        />
      )}
      {step === "FAILURE" && (
        <TransactionFailure
          visible={true}
          error={error}
          onRetry={handleRetry}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default QRPayments;
