import AmountInput from "@/components/ui/Input/AmountInput";
import OptimizedInput from "@/components/ui/Input/OptimizedInput";
import BanksModal from "@/components/ui/Modals/BanksModal";
import BeneficiaryModal from "@/components/ui/Modals/BeneficiaryModal";
import PaymentMethodModal from "@/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/components/ui/Modals/Transaction/TransactionPinModal";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TransferFormData, transferSchema } from "@/lib/schema/validations";
import AccountService from "@/lib/services/AccountService";
import { LocationService } from "@/lib/services/LocationService";
import PaymentService from "@/lib/services/PaymentService";
import { isAccountNameValid } from "@/lib/utils";
import { formatAmount } from "@/lib/utils/formatAmount";
import { categoryEmojis } from "@/lib/utils/narrationCategories";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper functions

const BankTransfers = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const [transferData, setTransferData] = useState<TransferFormData | null>(
    null,
  );
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState<string>("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);

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
      const account = await AccountService.ResolveAccountName(
        selectedBank.code,
        accountNumber,
      );
      setAccountName(
        account.success
          ? account.details.accountName!
          : account.errorMessage || "Account Not Found",
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
      return false;
    }

    setTransferData(data);
    setShowPaymentMethodModal(true);
  };

  const processTransfer = async (
    TwoFA_VerificationCode: string,
  ): Promise<ReceiptData | void> => {
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
      paymentMode: "BANK_TRANSFER" as PaymentMode,
      beneficiaryAccountNumber: transferData.accountNumber,
      narration: transferData.narration || `Transfer to ${accountName}`,
      beneficiaryBankName: selectedBank?.name || "",
      beneficiaryBankCode: selectedBank?.code || "",
      beneficiaryAccountName: accountName || "",
      saveBeneficiary,
      OneTimeCode: TwoFA_VerificationCode,
      ...(location && { location }),
    };

    const payment = await PaymentService.B2BTransfer(payload);

    // Check if response indicates an error
    if (!payment.success) {
      throw new Error(payment.errorMessage);
    }

    return {
      amount: transferData.amount,
      recipient: `${transferData.accountNumber} (${selectedBank?.name})`,
      reference: payment.details.transactionId,
      date: new Date().toLocaleString(),
      narration: transferData.narration,
      type: "BANK_TRANSFER",
    };
  };

  const handlePinSuccess = async (
    TwoFA_VerificationCode: string,
  ): Promise<boolean> => {
    if (!transferData) return false;

    if (!isAccountNameValid(accountName)) {
      setShowPinModal(false);
      setErrorMessage(
        "Account Verification Failed. Cannot Proceed With Transfer.",
      );

      return false;
    }

    setShowPinModal(false);
    setLoading(true);

    try {
      const result = await processTransfer(TwoFA_VerificationCode);
      setTransactionResult(result);

      setLoading(false);

      if (saveBeneficiary && transferData && accountName) {
        const raw = await SecureStore.getItemAsync("frequent_beneficiaries");
        const list: Beneficiary[] = raw ? JSON.parse(raw) : [];
        const exists = list.some(
          (b) =>
            b.accountNumber === transferData.accountNumber &&
            b.bankCode === transferData.bankCode,
        );
        if (!exists) {
          const bank = banks.find((b) => b.code === transferData.bankCode);
          list.push({
            accountNumber: transferData.accountNumber,
            accountName,
            bankName: bank?.name || selectedBankName,
            bankCode: transferData.bankCode,
            useCount: 1,
            lastUsed: new Date().toISOString(),
          });
          await SecureStore.setItemAsync(
            "frequent_beneficiaries",
            JSON.stringify(list),
          );
        }
      }

      console.log("Testing truthy", !!result, result);
      return !!result;
    } catch (error: any) {
      console.log("Transfer error:", error);
      setErrorMessage(error.message || "Transfer Failed. Please Try Again.");

      setLoading(false);
      return false;
    }
  };

  const handleCloseSuccess = () => {
    setValue("bankCode", "");
    setValue("accountNumber", "");
    setValue("amount", "");
    setValue("narration", "");
    setSelectedBankName("");
    setTransferData(null);
    router.back();
  };

  const handleBeneficiarySelect = (b: Beneficiary) => {
    setValue("bankCode", b.bankCode);
    setValue("accountNumber", b.accountNumber);
    setSelectedBankName(b.bankName);
    setAccountName(b.accountName);
    setShowBeneficiaryModal(false);
  };

  const handleBankSelection = (bank: Bank) => {
    setValue("bankCode", bank.code);
    setSelectedBankName(bank.name);
    setShowBankModal(false);
  };

  const handlePaymentMethodSelected = (data: {
    method: PaymentMethod;
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
      <ScreenHeader
        title="Bank Transfers"
        goBack
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1 mb-8 px-5"
        contentContainerClassName="flex-grow"
      >
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

        <View className="flex-row items-center justify-between mb-1">
          <Text
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Account Number
          </Text>
          <Pressable onPress={() => setShowBeneficiaryModal(true)}>
            <Text
              className={`text-sm font-semibold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
            >
              Beneficiaries
            </Text>
          </Pressable>
        </View>

        <OptimizedInput
          control={control}
          name="accountNumber"
          label=""
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

        <OptimizedInput
          control={control}
          name="narration"
          label="Narration"
          placeholder="Enter Transaction Description"
          maxLength={50}
        />

        <View className="flex-row flex-wrap gap-3 mb-4 items-center">
          {Object.keys(categoryEmojis).map((preset) => (
            <Pressable
              key={preset}
              onPress={() => setValue("narration", preset)}
              className={`px-3 py-2 rounded-full ${
                isDark ? "bg-emerald-500/30" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                {preset} {categoryEmojis[preset]}{" "}
              </Text>
            </Pressable>
          ))}
        </View>

        <View
          className={`flex-row items-center justify-between mb-5 p-4 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-gray-100 border border-gray-200"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-600"}`}
          >
            Save as Beneficiary
          </Text>
          <Switch
            value={saveBeneficiary}
            onValueChange={setSaveBeneficiary}
            trackColor={{
              false: isDark ? "#374151" : "#d1d5db",
              true: "#10b981",
            }}
            thumbColor="#fff"
          />
        </View>

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
            paymentMessage={`Enter PIN to Confirm Transfer of ${formatAmount(
              Number.parseFloat(transferData.amount) || 0,
              "NGN",
            )
              .replace("NGN", "")
              .trim()} to (${accountName}) [${selectedBankName}]`}
            amount={transferData.amount}
            recipient={accountName ?? ""}
            showPinModal={showPinModal}
            error={errorMessage}
            initiateTransaction={handlePinSuccess}
            transactionResult={transactionResult}
            onCancel={handleCloseSuccess}
          />
        )}
        {/* </View> */}

        <BeneficiaryModal
          visible={showBeneficiaryModal}
          onClose={() => setShowBeneficiaryModal(false)}
          onSelect={handleBeneficiarySelect}
        />

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

        {/* <TransactionSuccess
          visible={showSuccessModal}
          data={transactionResult}
          onClose={handleCloseSuccess}
          onDownloadReceipt={handleDownloadReceipt}
        /> */}

        {/* <TransactionFailure
          visible={showFailureModal}
          error={errorMessage}
          onRetry={handleRetry}
          onClose={() => setShowFailureModal(false)}
        /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BankTransfers;
