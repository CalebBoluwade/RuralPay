import OptimizedInput from "@/components/Input/OptimizedInput";
import AccountService from "@/components/services/AccountService";
import { BankTransferService } from "@/components/services/BankTransferService";
import { LocationService } from "@/components/services/LocationService";
import { ReceiptService } from "@/components/services/ReceiptService";
import BalanceCard from "@/components/ui/BalanceCard";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Transaction/TransactionPin";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { z } from "zod";

const nigerianBanks = [
  { code: "044", name: "Access Bank" },
  { code: "011", name: "First Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "033", name: "United Bank for Africa" },
  { code: "032", name: "Union Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "232", name: "Sterling Bank" },
];

const transferSchema = z.object({
  bankCode: z.string().min(3, "Please select a bank"),
  accountNumber: z
    .string()
    .min(10, "Account number must be 10 digits")
    .max(10, "Account number must be 10 digits")
    .regex(/^[0-9]+$/, "Account number must contain only digits"),
  amount: z.string().refine((val) => {
    const num = Number.parseFloat(val);
    return !Number.isNaN(num) && num >= 100 && num <= 1000000;
  }, "Amount must be between ₦100 and ₦1,000,000"),
  narration: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

const BankTransfers = () => {
  const [loading, setLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [transferData, setTransferData] = useState<TransferFormData | null>(
    null
  );
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState<string>("");

  const { control, handleSubmit, setValue } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      bankCode: "",
      accountNumber: "",
      amount: "",
      narration: "",
    },
  });

  const watchedValues = useWatch({ control });
  const { bankCode, accountNumber } = watchedValues;

  useEffect(() => {
    const performNameEnquiry = async () => {
      if (bankCode && accountNumber && accountNumber.length === 10) {
        setNameLoading(true);
        setAccountName(null);

        const selectedBank = nigerianBanks.find(
          (bank) => bank.code === bankCode
        );
        if (selectedBank) {
          const result = await AccountService.ResolveAccountName(
            selectedBank.code,
            accountNumber
          );

          if (result.success) {
            setAccountName(result.accountName!);
          } else {
            setAccountName(result.error || "Account not found");
          }
        }
        setNameLoading(false);
      } else {
        setAccountName(null);
      }
    };

    performNameEnquiry();
  }, [bankCode, accountNumber]);

  const onSubmit = async (data: TransferFormData) => {
    // Check if name enquiry was successful
    if (!accountName || accountName === "Account not found" || accountName.includes("error") || accountName.includes("failed")) {
      setErrorMessage("Please verify the account details. Name enquiry failed.");
      setShowFailureModal(true);
      return;
    }
    
    setTransferData(data);
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    if (!transferData) return;

    // Double-check name enquiry before processing
    if (!accountName || accountName === "Account not found" || accountName.includes("error") || accountName.includes("failed")) {
      setShowPinModal(false);
      setErrorMessage("Account verification failed. Cannot proceed with transfer.");
      setShowFailureModal(true);
      return;
    }

    setShowPinModal(false);
    setLoading(true);

    try {
      const selectedBank = nigerianBanks.find(
        (bank) => bank.code === transferData.bankCode
      );

      // Get current location
      const location = await LocationService.getCurrentLocation();

      const payload = {
        amount: Number.parseFloat(transferData.amount),
        currency: "NGN",
        fromAccount: "1234567890", // Replace with actual sender account
        reference: `TXN${Date.now()}`,
        toAccount: transferData.accountNumber,
        toBankCode: selectedBank?.code || "",
        ...(location && { location }),
      };

      console.log(payload)
      const response = await BankTransferService.B2BTransfer(payload);

      const result = {
        amount: transferData.amount,
        recipient: `${transferData.accountNumber} (${transferData.bankCode})`,
        reference: response.transactionId,
        date: new Date().toLocaleString(),
        narration: transferData.narration,
        type: "Bank Transfer",
      };

      setTransactionResult(result);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error(error);

      setErrorMessage("Transfer failed. Please try again.");
      setShowFailureModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (transactionResult) {
      await ReceiptService.downloadReceipt(transactionResult);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setValue("bankCode", "");
    setValue("accountNumber", "");
    setValue("amount", "");
    setValue("narration", "");
    setSelectedBankName("");
    setTransferData(null);
  };

  const handleRetry = () => {
    setShowFailureModal(false);
    setShowPinModal(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        }}
        className="flex-1"
      >
        <View className="flex-1 bg-black/40">
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            <View className="flex-1 pt-16 mb-8 px-5">
              <Text className="text-3xl font-bold mb-8 text-center text-white">
                Bank Transfer
              </Text>

              <BalanceCard showNFC={false} />

              <OptimizedInput
                control={control}
                name="bankCode"
                label="Select Bank"
                placeholder="Choose a bank"
                onPress={() => setShowBankModal(true)}
                editable={false}
                displayValue={selectedBankName}
              />

              <OptimizedInput
                control={control}
                name="accountNumber"
                label="Account Number"
                placeholder="Enter 10-digit account number"
                keyboardType="numeric"
                maxLength={10}
              />

              {nameLoading && (
                <View className="mb-5 p-3 bg-white/10 rounded-lg">
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white ml-2">
                      Resolving account name...
                    </Text>
                  </View>
                </View>
              )}

              {accountName && !nameLoading && (
                <View className="mb-5 p-3 bg-white/10 rounded-lg">
                  <Text className="text-white/70 text-sm">Account Name:</Text>
                  <Text className="text-white font-semibold">
                    {accountName}
                  </Text>
                </View>
              )}

              <OptimizedInput
                control={control}
                name="amount"
                label="Amount (NGN)"
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text className="text-xs text-white/70 mb-5">
                Limit: ₦100 - ₦1,000,000
              </Text>

              <OptimizedInput
                control={control}
                name="narration"
                label="Narration (Optional)"
                placeholder="Enter transaction description"
                maxLength={50}
              />

              <TouchableOpacity
                className={`bg-white/90 rounded-lg p-4 items-center mb-3 ${
                  loading ? "opacity-50" : ""
                }`}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#333" />
                ) : (
                  <Text className="text-gray-800 text-lg font-semibold">
                    Send Money
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white/20 rounded-lg p-4 items-center border border-white/30"
                onPress={() => router.back()}
              >
                <Text className="text-white text-base font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <Modal
                visible={showPinModal}
                animationType="slide"
                presentationStyle="fullScreen"
              >
                <ImageBackground
                  source={{
                    uri: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
                  }}
                  className="flex-1"
                >
                  <View className="flex-1 bg-black/40 justify-center">
                    <View className="px-5">
                      <Text className="text-2xl font-bold mb-4 text-center text-white">
                        Enter PIN
                      </Text>
                      <Text className="text-base text-center text-white/80 mb-8">
                        Confirm Transfer of ₦{transferData?.amount}
                        {/* to{" "}{transferData?.bankName} */}
                      </Text>

                      <View className="items-center">
                        <TransactionPin
                          onSuccess={handlePinSuccess}
                          onCancel={() => setShowPinModal(false)}
                        />
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </Modal>

              <Modal
                visible={showSuccessModal}
                animationType="slide"
                presentationStyle="fullScreen"
              >
                <TransactionSuccess
                  data={transactionResult}
                  onClose={handleCloseSuccess}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              </Modal>

              <Modal
                visible={showFailureModal}
                animationType="slide"
                presentationStyle="fullScreen"
              >
                <TransactionFailure
                  error={errorMessage}
                  onRetry={handleRetry}
                  onClose={() => setShowFailureModal(false)}
                />
              </Modal>

              <Modal
                visible={showBankModal}
                animationType="slide"
                presentationStyle="pageSheet"
              >
                <View className="flex-1 bg-white">
                  <View className="p-5 border-b border-gray-200">
                    <Text className="text-xl font-bold text-center">
                      Select Bank
                    </Text>
                  </View>
                  <ScrollView className="flex-1">
                    {nigerianBanks.map((bank) => (
                      <TouchableOpacity
                        key={bank.code}
                        className="p-4 border-b border-gray-100"
                        onPress={() => {
                          setValue("bankCode", bank.code);
                          setSelectedBankName(bank.name);
                          setShowBankModal(false);
                        }}
                      >
                        <Text className="text-base text-gray-800">
                          {bank.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    className="p-4 bg-gray-100 m-5 rounded-lg"
                    onPress={() => setShowBankModal(false)}
                  >
                    <Text className="text-center text-gray-600 font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

export default BankTransfers;
