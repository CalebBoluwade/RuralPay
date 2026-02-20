import AmountInput from "@/components/ui/Input/AmountInput";
import OptimizedInput from "@/components/ui/Input/OptimizedInput";
import BanksModal from "@/components/ui/Modals/BanksModal";
import PaymentMethodModal from "@/components/ui/Modals/PaymentMethodModal";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Transaction/TransactionPinModal";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import AccountService from "@/lib/services/AccountService";
import { LocationService } from "@/lib/services/LocationService";
import PaymentService from "@/lib/services/PaymentService";
import { ReceiptService } from "@/lib/services/ReceiptService";
import { formatAmount } from "@/lib/utils/formatAmount";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { z } from "zod";

const transferSchema = z.object({
  bankCode: z.string().min(3, "Please select a bank"),
  accountNumber: z
    .string()
    .min(10, "Account number must be 10 digits")
    .max(10, "Account number must be 10 digits")
    .regex(/^[0-9]+$/, "Account number must contain only digits"),
  fromAccount: z.string(),
  amount: z.string().refine((val) => {
    const num = Number.parseFloat(val);
    return !Number.isNaN(num);
  }, "Please Enter A Valid Amount"),
  narration: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

// Helper functions
const isAccountNameValid = (accountName: string | null): boolean => {
  return Boolean(
    accountName &&
    accountName !== "Account Not Found" &&
    !accountName.includes("error") &&
    !accountName.includes("Failed"),
  );
};

const BankTransfers = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  const [transferData, setTransferData] = useState<TransferFormData | null>(
    null,
  );
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState<string>("");
  const [banks, setBanks] = useState<Bank[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      bankCode: "",
      accountNumber: "",
      amount: "",
      narration: "",
      fromAccount: "",
    },
    reValidateMode: "onChange",
  });

  const watchedValues = useWatch({ control });
  const { bankCode, accountNumber } = watchedValues;

  const performNameEnquiry = async () => {
    if (!bankCode || !accountNumber || accountNumber.length !== 10) {
      setAccountName(null);
      return;
    }

    setNameLoading(true);
    setAccountName(null);

    const selectedBank = banks.find((bank) => bank.code === bankCode);
    if (selectedBank) {
      const result = await AccountService.ResolveAccountName(
        selectedBank.code,
        accountNumber,
      );
      setAccountName(
        result.success
          ? result.accountName!
          : result.error || "Account Not Found",
      );
    }
    setNameLoading(false);
  };

  useEffect(() => {
    const fetchBanks = async () => {
      const banks = await PaymentService.GetBanks();
      setBanks(banks);
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    performNameEnquiry();
  }, [bankCode, accountNumber]);

  const onSubmit = async (data: TransferFormData) => {
    if (!isAccountNameValid(accountName)) {
      setErrorMessage(
        "Please Verify the Account Details. Name Enquiry Failed.",
      );
      setShowFailureModal(true);
      return;
    }

    setTransferData(data);
    setShowPaymentMethodModal(true);
  };

  const processTransfer = async (): Promise<ReceiptData | void> => {
    if (!transferData) return;

    const selectedBank = banks.find(
      (bank) => bank.code === transferData.bankCode,
    );

    if (!transferData.fromAccount) {
      throw new Error("No Source Account Selected");
    }

    const location = await LocationService.getCurrentLocation();

    const payload: TransferPayload = {
      transactionID: PaymentService.generateTransactionId("BANK_TRANSFER"),
      amount: Number.parseFloat(transferData.amount),
      currency: "NGN",
      txType: "DEBIT",
      fromAccount: transferData.fromAccount,
      toAccount: transferData.accountNumber,
      toBankCode: selectedBank?.code || "",
      paymentMode: "BANK_TRANSFER" as PaymentMode,
      ...(location && { location }),
    };

    const response = await PaymentService.B2BTransfer(payload);

    // Check if response indicates an error
    if (!response.success) {
      throw new Error(response.errorMessage);
    }

    return {
      amount: transferData.amount,
      recipient: `${transferData.accountNumber} (${selectedBank?.name})`,
      reference: response.transactionId,
      date: new Date().toLocaleString(),
      narration: transferData.narration,
      type: "BANK_TRANSFER",
    };
  };

  const handlePinSuccess = async () => {
    if (!transferData) return;

    if (!isAccountNameValid(accountName)) {
      setShowPinModal(false);
      setErrorMessage(
        "Account Verification Failed. Cannot Proceed With Transfer.",
      );
      setShowFailureModal(true);

      return;
    }

    setShowPinModal(false);
    setLoading(true);

    try {
      const result = await processTransfer();
      setTransactionResult(result);

      setLoading(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.log("Transfer error:", error);
      setErrorMessage(error.message || "Transfer Failed. Please Try Again.");

      setLoading(false);
      setShowFailureModal(true);
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
    setShowPaymentMethodModal(true);
  };

  const handleBankSelection = (bank: Bank) => {
    setValue("bankCode", bank.code);
    setSelectedBankName(bank.name);
    setShowBankModal(false);
  };

  const handlePaymentMethodSelected = (data: {
    method: string;
    accountNumber?: string;
    accountName?: string;
  }) => {
    console.log("Payment Method Data", data);
    if (data.accountNumber) {
      setValue("fromAccount", data.accountNumber);
      setTransferData((prev) =>
        prev ? { ...prev, fromAccount: data.accountNumber! } : null,
      );
    }
    setShowPaymentMethodModal(false);
    setShowPinModal(true);
  };

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-[#f5f5fa]"}
    >
      <ScrollView className="flex-1">
        <ScreenHeader
          title="Bank Transfers"
          goBack
          onBack={() => router.back()}
        />

        <View className="flex-1 mb-8 px-5">
          <AmountInput
            error={errors.amount?.message}
            onAmountChange={(amt) => setValue("amount", amt)}
          />

          <OptimizedInput
            control={control}
            name="bankCode"
            label="Select Bank"
            placeholder="Choose A Bank"
            onPress={() => setShowBankModal(true)}
            editable={false}
            displayValue={selectedBankName}
          />

          <OptimizedInput
            control={control}
            name="accountNumber"
            label="Account Number"
            placeholder="Enter 10-Digit Account Number"
            keyboardType="numeric"
            maxLength={10}
          />

          {nameLoading && (
            <View
              className={`mb-5 p-3 rounded-xl backdrop-blur-xl ${
                isDark
                  ? "border-2 border-emerald-500/40"
                  : "border-2 border-emerald-400"
              }`}
            >
              <View className="flex-row items-center">
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#a78bfa" : "#7c3aed"}
                />
                <Text
                  className={`ml-2 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Resolving Account Name...
                </Text>
              </View>
            </View>
          )}

          {accountName && !nameLoading && (
            <View
              aria-disabled
              className={`mb-5 p-4 rounded-xl backdrop-blur-xl ${
                isDark
                  ? "border-2 border-emerald-500/40"
                  : "border-2 border-emerald-400"
              }`}
            >
              <Text
                className={`text-sm ${isDark ? "text-gray-400" : "text-black"}`}
              >
                Account Name:
              </Text>
              <Text
                className={`font-semibold ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                {accountName}
              </Text>
            </View>
          )}

          <Text
            className={`text-sm mb-5 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Limit: ₦100 - ₦1,000,000
          </Text>

          <OptimizedInput
            control={control}
            name="narration"
            label="Narration (Optional)"
            placeholder="Enter Transaction Description"
            maxLength={50}
          />

          <Pressable
            className={`p-6 rounded-2xl mb-4 ${
              isDark ? "bg-emerald-600" : "bg-emerald-700"
            } ${loading ? "opacity-50" : ""}`}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            style={{ pointerEvents: loading ? "none" : "auto" }}
          >
            {loading ? (
              <ActivityIndicator color={isDark ? "#a78bfa" : "#7c3aed"} />
            ) : (
              <Text className={`text-xl font-bold text-center text-white`}>
                💸 Send Money
              </Text>
            )}
          </Pressable>

          {transferData && (
            <TransactionPin
              paymentMessage={`Enter PIN to Confirm Transfer of ₦${formatAmount(
                Number.parseFloat(transferData.amount) || 0,
                "NGN",
              )
                .replace("NGN", "")
                .trim()} to (${accountName}) [${selectedBankName}]`}
              amount={transferData.amount}
              recipient={accountName!}
              showPinModal={showPinModal}
              onSuccess={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          )}
        </View>

        <BanksModal
          banks={banks}
          visible={showBankModal}
          onClose={() => setShowBankModal(false)}
          onBankSelected={handleBankSelection}
        />

        <PaymentMethodModal
          visible={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          amount={Number.parseFloat(transferData?.amount || "0") || 0}
          onPaymentMethodSelected={handlePaymentMethodSelected}
        />

        <TransactionSuccess
          visible={showSuccessModal}
          data={transactionResult}
          onClose={handleCloseSuccess}
          onDownloadReceipt={handleDownloadReceipt}
        />

        <TransactionFailure
          visible={showFailureModal}
          error={errorMessage}
          onRetry={handleRetry}
          onClose={() => setShowFailureModal(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BankTransfers;
