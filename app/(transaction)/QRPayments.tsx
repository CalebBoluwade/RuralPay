import { BankTransferService } from "@/components/services/BankTransferService";
import QRCodeService from "@/components/services/QRCodeService";
import BalanceCard from "@/components/ui/BalanceCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Transaction/TransactionPin";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import { ToastService } from "@/hooks/use-toast";
import { CameraView } from "expo-camera";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QRPayments = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState<
    "SELECT_MODE" | "GENERATE" | "SCAN" | "SELECT_ACCOUNT" | "ENTER_PIN" | "SUCCESS" | "FAILURE"
  >("SELECT_MODE");
  const [mode, setMode] = useState<"GENERATE" | "SCAN">("GENERATE");
  const [amount, setAmount] = useState("");
  const [qrData, setQRData] = useState<string | null>(null);
  const [qrResult, setQRResult] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [scannedQRData, setScannedQRData] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<BalanceEnquiry | null>(null);

  const handleModeSelect = (selectedMode: "GENERATE" | "SCAN") => {
    setMode(selectedMode);
    setStep(selectedMode === "GENERATE" ? "GENERATE" : "SCAN");
  };

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
      const result = await QRCodeService.GeneratePaymentQR(
        Number.parseFloat(amount),
      );

      console.log(result);
      setQRResult(result);
      setQRData(result);
      ToastService.success("QR code generated successfully");
      setStep("GENERATE");
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
      const result = await QRCodeService.processScannedQR(data, {
        type: "Visa",
        lastFourDigits: "4242",
        cardholderName: "Customer",
      });

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
      const payment = await BankTransferService.B2BTransfer({
        amount: scannedQRData.amount,
        currency: "NGN",
        toBankCode: "000",
        fromAccount: selectedAccount.accountId,
        toAccount: "0000000000",
        reference: `QRPAY-${Date.now()}`,
      });

      if (payment.success) {
        setPaymentResult({
          amount: scannedQRData.amount.toString(),
          recipient: scannedQRData.merchantName,
          reference: payment.transactionId,
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
    setStep(mode === "GENERATE" ? "GENERATE" : "SCAN");
  };

  const handleClose = () => {
    router.back();
  };

  const renderSelectMode = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="QR Payments"
        subtitle="Generate or Scan QR Payments Codes"
        onBack={() => router.back()}
      />
      <View className="px-6 justify-center">
        <TouchableOpacity
          onPress={() => handleModeSelect("GENERATE")}
          className={`p-6 rounded-2xl mb-4 ${isDark ? "bg-indigo-600" : "bg-indigo-700"}`}
        >
          <Text className="text-white font-bold text-xl text-center">
            Generate QR Code
          </Text>
          <Text className="text-blue-100 text-center mt-2">
            Create a QR code to receive payment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleModeSelect("SCAN")}
          className={`p-6 rounded-2xl ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
        >
          <Text className="text-white font-bold text-xl text-center">
            Scan QR Code
          </Text>
          <Text className="text-green-100 text-center mt-2">
            Scan a QR code to make payment
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderGenerate = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Generate QR Code"
        subtitle="Enter Amount to Generate Payment QR"
        onBack={() => setStep("SELECT_MODE")}
      />

      <View className="px-6">
        {qrData ? (
          <View
            className={`rounded-2xl p-6 items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
          >
            <Image
              source={{ uri: `data:image/png;base64,${qrData}` }}
              className="w-64 h-64 rounded-2xl mb-4"
              resizeMode="contain"
            />
            <Text
              className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              ₦{amount}
            </Text>
            <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
              Customer Can Scan to Pay
            </Text>
          </View>
        ) : (
          <View
            className={`rounded-2xl p-6 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
          >
            <Text
              className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Amount (NGN)
            </Text>
            <View
              className={`flex-row items-center rounded-2xl mb-6 backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
              }`}
            >
              <View className="bg-green-600 px-4 py-4 rounded-l-2xl">
                <Text className="text-white font-bold text-xl">₦</Text>
              </View>
              <TextInput
                className={`flex-1 p-4 text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                placeholder="0.00"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity
              className={`p-4 rounded-2xl ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
              onPress={handleGenerateQR}
            >
              <Text className="text-white text-lg font-bold text-center">
                Generate QR Code
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  const renderScan = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Scan QR Code"
        subtitle="Point Camera at QR Code to Pay"
        onBack={() => setStep("SELECT_MODE")}
      />

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
          showNFC={false}
          onAccountChange={(account) => setSelectedAccount(account)}
        />

        {scannedQRData && (
          <View
            className={`rounded-2xl p-4 mb-4 ${isDark ? "bg-white/10 border border-white/20" : "bg-white/60 border border-gray-200/50"}`}
          >
            <Text className={`text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Payment Details
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className={isDark ? "text-white" : "text-gray-900"}>Merchant</Text>
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                {scannedQRData.merchantName}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={isDark ? "text-white" : "text-gray-900"}>Amount</Text>
              <Text className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                ₦{scannedQRData.amount.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
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
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <TransactionPin
      paymentMessage={`Confirm QR Payment of ${amount}`}
      showPinModal={true}
      onSuccess={handlePinSuccess}
      onCancel={() => setStep("GENERATE")}
    />
  );

  return (
    <>
      {step === "SELECT_MODE" && renderSelectMode()}
      {step === "GENERATE" && renderGenerate()}
      {step === "SCAN" && renderScan()}
      {step === "SELECT_ACCOUNT" && renderSelectAccount()}
      {step === "ENTER_PIN" && renderEnterPin()}
      {step === "SUCCESS" && (
        <TransactionSuccess
          data={{
            amount: paymentResult?.amount || amount,
            recipient: paymentResult?.recipient || "QR Payment",
            reference: paymentResult?.reference || "QR" + Date.now(),
            date: new Date().toLocaleDateString(),
            type: "QR Payment",
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

export default QRPayments;
