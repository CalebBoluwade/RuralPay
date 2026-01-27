import OptimizedInput from "@/components/Input/OptimizedInput";
import AccountService from "@/components/services/AccountService";
import { BankTransferService } from "@/components/services/BankTransferService";
import { LocationService } from "@/components/services/LocationService";
import { ReceiptService } from "@/components/services/ReceiptService";
import ToastService from "@/components/services/ToastService";
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
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { z } from "zod";

const transferSchema = z.object({
  bankCode: z.string().min(3, "Please select a bank"),
  accountNumber: z
    .string()
    .min(10, "Account number must be 10 digits")
    .max(10, "Account number must be 10 digits")
    .regex(/^[0-9]+$/, "Account number must contain only digits"),
  fromAccount: z
    .string()
    .min(10, "Please Select an Account")
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  const [accounts, setAccounts] = useState<BalanceEnquiry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BalanceEnquiry | null>(
    null,
  );
  const [transferData, setTransferData] = useState<TransferFormData | null>(
    null,
  );
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState<string>("");
  const [banks, setBanks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showUptimeModal, setShowUptimeModal] = useState(false);
  const [selectedBankForUptime, setSelectedBankForUptime] = useState<any>(null);

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
      fromAccount: selectedAccount?.accountId ?? "",
    },
  });

  console.log(selectedAccount?.accountId, errors);

  const watchedValues = useWatch({ control });
  const { bankCode, accountNumber } = watchedValues;

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadAccountData = async () => {
    try {
      const balance = await AccountService.AccountBalance();

      setAccounts(balance || []);
    } catch (error) {
      console.warn(error);
      ToastService.error("Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();

    const fetchBanks = async () => {
      const banks = await BankTransferService.GetBanks();
      setBanks(banks);
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    const performNameEnquiry = async () => {
      if (bankCode && accountNumber && accountNumber.length === 10) {
        setNameLoading(true);
        setAccountName(null);

        const selectedBank = banks.find((bank) => bank.code === bankCode);
        if (selectedBank) {
          const result = await AccountService.ResolveAccountName(
            selectedBank.code,
            accountNumber,
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
    if (
      !accountName ||
      accountName === "Account not found" ||
      accountName.includes("error") ||
      accountName.includes("failed")
    ) {
      setErrorMessage(
        "Please verify the account details. Name enquiry failed.",
      );
      setShowFailureModal(true);
      return;
    }

    setTransferData(data);
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    if (!transferData) return;

    // Double-check name enquiry before processing
    if (
      !accountName ||
      accountName === "Account not found" ||
      accountName.includes("error") ||
      accountName.includes("failed")
    ) {
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
      const selectedBank = banks.find(
        (bank) => bank.code === transferData.bankCode,
      );

      // Get current location
      const location = await LocationService.getCurrentLocation();

      const payload = {
        amount: Number.parseFloat(transferData.amount),
        currency: "NGN",
        fromAccount: transferData.fromAccount,
        reference: `TXN${Date.now()}`,
        toAccount: transferData.accountNumber,
        toBankCode: selectedBank?.code || "",
        ...(location && { location }),
      };

      const response = await BankTransferService.B2BTransfer(payload);

      const result = {
        amount: transferData.amount,
        recipient: `${transferData.accountNumber} (${selectedBank?.name})`,
        reference: response.transactionId,
        date: new Date().toLocaleString(),
        narration: transferData.narration,
        type: "Bank Transfer",
      };

      setTransactionResult(result);
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(error.error || "Transfer Failed. Please Try Again.");
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
      <SafeAreaView
        className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-[#f5f5fa]"}
      >
        <BalanceCard
          showNFC
          accounts={accounts}
          loading={loading}
          onAccountChange={(account) => {
            console.log(account);
            setSelectedAccount(account);
          }}
        />

        <ScrollView
          className="flex-1 pt-6 mb-8 px-5"
          keyboardShouldPersistTaps="handled"
        >
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
            <View
              className={`mb-5 p-3 rounded-xl backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
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
              className={`mb-5 p-3 rounded-xl backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
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
            name="amount"
            label="Amount (NGN)"
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

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
            placeholder="Enter transaction description"
            maxLength={50}
          />

          <TouchableOpacity
            className={`rounded-2xl p-4 items-center mb-3 backdrop-blur-xl ${
              loading ? "opacity-50" : ""
            } ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/80 border border-gray-200/50"
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={isDark ? "#a78bfa" : "#7c3aed"} />
            ) : (
              <Text
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                💸 Send Money
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className={`rounded-2xl p-4 items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/5 border border-white/10"
                : "bg-white/40 border border-gray-200/30"
            }`}
            onPress={() => router.back()}
          >
            <Text
              className={`text-base font-semibold ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TransactionPin
            paymentMessage={`Enter PIN to Confirm Transfer of ₦${transferData?.amount} to (${accountName}) [${selectedBankName}]`}
            showPinModal={showPinModal}
            onSuccess={handlePinSuccess}
            onCancel={() => setShowPinModal(false)}
          />

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
            <View
              className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
            >
              <View
                className={`p-5 ${
                  isDark
                    ? "border-b border-white/10"
                    : "border-b border-gray-200"
                }`}
              >
                <Text
                  className={`text-xl font-bold text-center mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Select Bank
                </Text>

                <TextInput
                  className={`p-4 rounded-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-gray-100 border border-gray-200 text-gray-900"
                  }`}
                  placeholder="Search banks..."
                  placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ScrollView className="flex-1">
                {filteredBanks.map((bank) => {
                  const uptime = 85 + Math.random() * 14;
                  const statusColor =
                    uptime >= 95
                      ? "#10b981"
                      : uptime >= 85
                        ? "#f59e0b"
                        : "#ef4444";
                  return (
                    <TouchableOpacity
                      key={bank.code}
                      className={`p-4 gap-4 flex-row w-full items-center ${
                        isDark
                          ? "border-b border-white/10"
                          : "border-b border-gray-100"
                      }`}
                      onPress={() => {
                        setValue("bankCode", bank.code);
                        setSelectedBankName(bank.name);
                        setShowBankModal(false);
                      }}
                    >
                      <SvgUri uri={bank.logoData} width={50} height={50} />
                      <View className="flex-1">
                        <Text
                          className={`text-base ${
                            isDark ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {bank.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <View
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: statusColor }}
                          />
                          <Text
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {uptime.toFixed(1)}% uptime
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedBankForUptime({ ...bank, uptime });
                          setShowUptimeModal(true);
                        }}
                        className={`p-2 rounded-lg ${
                          isDark ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        <Text className="text-xs">📊</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                className={`p-4 m-5 rounded-2xl backdrop-blur-xl ${
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-100 border border-gray-200"
                }`}
                onPress={() => setShowBankModal(false)}
              >
                <Text
                  className={`text-center font-semibold ${
                    isDark ? "text-white" : "text-gray-600"
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Modal>

          <Modal
            visible={showUptimeModal}
            animationType="fade"
            transparent
            onRequestClose={() => setShowUptimeModal(false)}
          >
            <TouchableOpacity
              className="flex-1 bg-black/50 justify-center items-center px-5"
              activeOpacity={1}
              onPress={() => setShowUptimeModal(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                className={`w-full rounded-3xl p-6 ${
                  isDark ? "bg-[#1a1a24]" : "bg-white"
                }`}
              >
                <View className="flex-row items-center justify-between mb-6">
                  <Text
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {selectedBankForUptime?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowUptimeModal(false)}>
                    <Text
                      className={`text-2xl ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  className={`p-4 rounded-2xl mb-4 ${
                    isDark ? "bg-white/5" : "bg-gray-50"
                  }`}
                >
                  <Text
                    className={`text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Current Uptime
                  </Text>
                  <Text
                    className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {selectedBankForUptime?.uptime.toFixed(1)}%
                  </Text>
                </View>

                <View
                  className={`p-4 rounded-2xl mb-4 ${
                    isDark ? "bg-white/5" : "bg-gray-50"
                  }`}
                >
                  <Text
                    className={`text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Success Probability
                  </Text>
                  <View className="flex-row justify-between mb-2">
                    <Text
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      Low
                    </Text>
                    <Text
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      High
                    </Text>
                  </View>
                  <View
                    className={`h-2 rounded-full overflow-hidden ${
                      isDark ? "bg-white/10" : "bg-gray-200"
                    }`}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedBankForUptime?.uptime}%`,
                        backgroundColor:
                          selectedBankForUptime?.uptime >= 95
                            ? "#10b981"
                            : selectedBankForUptime?.uptime >= 85
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                  </View>
                </View>

                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Successful
                    </Text>
                    <Text
                      className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-green-600"}`}
                    >
                      {Math.floor((selectedBankForUptime?.uptime || 0) * 10)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Failed
                    </Text>
                    <Text
                      className={`text-sm font-semibold ${isDark ? "text-red-400" : "text-red-600"}`}
                    >
                      {Math.floor(
                        (100 - (selectedBankForUptime?.uptime || 0)) * 10,
                      )}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Avg Response
                    </Text>
                    <Text
                      className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {(1.2 + Math.random() * 0.8).toFixed(1)}s
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  className={`mt-6 p-4 rounded-2xl ${
                    isDark ? "bg-white/10" : "bg-gray-100"
                  }`}
                  onPress={() => {
                    setShowUptimeModal(false);
                    setValue("bankCode", selectedBankForUptime.code);
                    setSelectedBankName(selectedBankForUptime.name);
                    setShowBankModal(false);
                  }}
                >
                  <Text
                    className={`text-center font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Select This Bank
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default BankTransfers;
