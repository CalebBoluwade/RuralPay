import { useLanguage } from "@/src/components/context/LanguageContext";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import AmountInput from "@/src/components/ui/Input/AmountInput";
import OptimizedInput from "@/src/components/ui/Input/OptimizedInput";
import BanksModal from "@/src/components/ui/Modals/BanksModal";
import BeneficiaryModal from "@/src/components/ui/Modals/BeneficiaryModal";
import PaymentMethodModal from "@/src/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { useAbortable } from "@/src/hooks/useAbortable";
import { useClearLoadingOnLock } from "@/src/hooks/useClearLoadingOnLock";
import { TransferFormData, transferSchema } from "@/src/lib/schema/validations";
import AccountService from "@/src/lib/services/AccountService";
import { LocationService } from "@/src/lib/services/LocationService";
import PaymentService from "@/src/lib/services/PaymentService";
import { isAccountNameValid } from "@/src/lib/utils";
import { formatAmount } from "@/src/lib/utils/formatAmount";
import { categoryEmojis } from "@/src/lib/utils/narrationCategories";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
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
  const { t } = useLanguage();
  const { abortController } = useAbortable("bank-transfers");
  const [loading, setLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const [transferData, setTransferData] = useState<TransferFormData | null>(
    null,
  );
  const [transactionResult, setTransactionResult] =
    useState<TransactionHistoryItem | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState<string>("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState(false);
  useClearLoadingOnLock(setLoading, setNameLoading, setBanksLoading);
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

    try {
      const selectedBank = banks.find((bank) => bank.bankCode === bankCode);
      if (selectedBank) {
        const account = await AccountService.ResolveAccountName(
          selectedBank.bankCode,
          accountNumber,
          abortController.signal,
        );
        setAccountName(
          account.success
            ? account.details.accountName!
            : account.errorMessage || "Account Not Found",
        );
      }
    } catch (error) {
      // AbortError is expected when user navigates away
      if (error instanceof Error && error.name !== "AbortError") {
        if (__DEV__) console.error("Name Enquiry Failed:", error);
      }
    } finally {
      setNameLoading(false);
    }
  };

  const fetchBanks = async () => {
    setBanksError(false);
    setBanksLoading(true);
    try {
      const result = await PaymentService.GetBanks(abortController.signal);
      if (Array.isArray(result) && result.length > 0) {
        setBanks(result);
      } else {
        if (__DEV__)
          console.warn("GetBanks returned empty or invalid:", result);
        setBanksError(true);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== "AbortError" &&
        error.name !== "CanceledError"
      ) {
        if (__DEV__) console.error("Failed to fetch banks:", error);
        setBanksError(true);
      }
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const nameEnquiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (nameEnquiryTimer.current) clearTimeout(nameEnquiryTimer.current);
    nameEnquiryTimer.current = setTimeout(performNameEnquiry, 500);
    return () => {
      if (nameEnquiryTimer.current) clearTimeout(nameEnquiryTimer.current);
    };
  }, [bankCode, accountNumber]);

  const onSubmit = async (data: TransferFormData) => {
    if (!isAccountNameValid(accountName)) {
      setErrorMessage(t("bankTransfer.accountVerifyFailed"));
      return false;
    }

    setTransferData(data);
    setShowPaymentMethodModal(true);
  };

  const processTransfer = async (
    selected2FA: TwoFAType,
    TwoFA_VerificationCode: string,
  ): Promise<TransactionHistoryItem> => {
    if (!transferData) throw new Error("No Transfer Data Found");

    const selectedBank = banks.find(
      (bank) => bank.bankCode === transferData.bankCode,
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
      beneficiaryBankCode: selectedBank?.bankCode || "",
      beneficiaryAccountName: accountName || "",
      saveBeneficiary,
      OneTimeCode: TwoFA_VerificationCode,
      twoFAType: selected2FA,
      ...(location && { location }),
    };

    const payment = await PaymentService.B2BTransfer(payload);

    console.log(payment);

    // Check if response indicates an error
    if (!payment.success) {
      setErrorMessage(payment.errorMessage!);
      throw new Error(payment.errorMessage);
    }

    return payment.details;
  };

  const handlePinSuccess = async (
    selected2FA: TwoFAType,
    TwoFA_VerificationCode: string,
  ): Promise<boolean> => {
    if (!transferData) return false;

    if (!isAccountNameValid(accountName)) {
      setShowPinModal(false);
      setErrorMessage(t("bankTransfer.accountVerifyFailedTransfer"));
      return false;
    }

    setShowPinModal(false);
    setLoading(true);

    try {
      const result = await processTransfer(selected2FA, TwoFA_VerificationCode);

      result.amount = Number(transferData.amount);
      result.narration = transferData.narration;

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
          const bank = banks.find((b) => b.bankCode === transferData.bankCode);
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

      return !!result;
    } catch (error: any) {
      const APIErr = error as APIResponse<{}>;
      if (__DEV__) console.log("Transfer error:", APIErr);

      setErrorMessage(
        APIErr.errorMessage || "Transaction Failed. Please Try Again.",
      );

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
    setValue("bankCode", bank.bankCode);
    setSelectedBankName(bank.name);
    setShowBankModal(false);
  };

  const handlePaymentMethodSelected = (data: {
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
  }) => {
    if (__DEV__) console.log("Payment Method Data", data);
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
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <ScreenHeader
        title={t("bankTransfer.title")}
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
          label={t("bankTransfer.selectBank")}
          placeholder={t("bankTransfer.chooseBank")}
          onPress={() => setShowBankModal(true)}
          editable={false}
          displayValue={selectedBankName}
        />

        <View className="flex-row items-center justify-between mb-1">
          <Text
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {t("bankTransfer.accountNumber")}
          </Text>
          <Pressable onPress={() => setShowBeneficiaryModal(true)}>
            <Text
              className={`text-base font-semibold ${isDark ? "text-lime-400" : "text-lime-700"}`}
            >
              {t("bankTransfer.beneficiaries")}
            </Text>
          </Pressable>
        </View>

        <OptimizedInput
          control={control}
          name="accountNumber"
          label=""
          placeholder={t("bankTransfer.enterAccountNumber")}
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
                color={isDark ? "#a3e635" : "#7c3aed"}
              />
              <Text
                className={`ml-2 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {t("bankTransfer.resolvingName")}
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
              className={`text-base ${isDark ? "text-gray-400" : "text-black"}`}
            >
              {t("bankTransfer.accountNameLabel")}
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
          label={t("bankTransfer.narration")}
          placeholder={t("bankTransfer.narrationPlaceholder")}
          maxLength={50}
        />

        <View className="flex-row flex-wrap gap-3 mb-4 items-center">
          {Object.keys(categoryEmojis).map((preset) => (
            <Pressable
              key={preset}
              onPress={() => setValue("narration", preset)}
              className={`px-3 py-2 rounded-full ${
                isDark ? "bg-lime-500/30" : "bg-lime-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-lime-300" : "text-lime-700"
                }`}
              >
                {preset} {categoryEmojis[preset]}{" "}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card
          className="flex-row items-center justify-between mb-5 p-4 backdrop-blur-xl"
          lightClass="bg-gray-100 border border-gray-200"
        >
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-600"}`}
          >
            {t("bankTransfer.saveAsBeneficiary")}
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
        </Card>

        <Button
          label={t("common.sendMoney")}
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          className="mb-4"
        />

        {transferData && (
          <TransactionPin
            paymentMessage={`Enter PIN to Confirm Transfer of ${formatAmount(
              Number.parseFloat(transferData.amount) || 0,
              "NGN",
            )
              .replace("NGN", "")
              .trim()} to (${accountName}) [${selectedBankName}]`}
            // amount={transferData.amount}
            // recipient={accountName ?? ""}
            isLoading={false}
            setIsLoading={() => {}}
            showPinModal={showPinModal}
            error={errorMessage}
            initiateTransaction={handlePinSuccess}
            transactionResult={transactionResult!}
            onCancel={handleCloseSuccess}
          />
        )}

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
          loading={banksLoading}
          fetchError={banksError}
          onRetry={fetchBanks}
        />

        <PaymentMethodModal
          visible={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          amount={Number.parseFloat(transferData?.amount || "0") || 0}
          onPaymentMethodSelected={handlePaymentMethodSelected}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BankTransfers;
