import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { useIdentityGate } from "@/src/hooks/useIdentityGate";
import AccountService from "@/src/lib/services/AccountService";
import ToastService from "@/src/lib/services/ToastService";
import { CreditCard } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const MIN_LIMIT = process.env.MIN_LIMIT
  ? Number.parseInt(process.env.MIN_LIMIT, 10)
  : 20000;
const MAX_DAILY_LIMIT = process.env.MAX_DAILY_LIMIT
  ? Number.parseInt(process.env.MAX_DAILY_LIMIT, 10)
  : 1000000;
const MAX_SINGLE_TRANSACTION_LIMIT = process.env.MAX_SINGLE_TRANSACTION_LIMIT
  ? Number.parseInt(process.env.MAX_SINGLE_TRANSACTION_LIMIT, 10)
  : 10000000;

function LimitInput({
  isDark,
  label,
  value,
  onChangeText,
  disabled,
}: Readonly<{
  isDark: boolean;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}>) {
  return (
    <View className="mb-4">
      <Text
        className={`text-base font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
      >
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-2xl ${
          isDark
            ? "bg-slate-800 border border-slate-700"
            : "bg-slate-50 border border-slate-200"
        }`}
      >
        <View className="bg-lime-400 px-3 py-4 rounded-l-2xl">
          <Text className="text-black font-bold text-lg">₦</Text>
        </View>
        <TextInput
          className={`flex-1 p-3 text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
          editable={!disabled}
        />
      </View>
    </View>
  );
}

export function LimitSettingsSection({
  isDark,
}: Readonly<{ isDark: boolean }>) {
  const [dailyLimit, setDailyLimit] = useState(0);
  const [tempDailyLimit, setTempDailyLimit] = useState("");
  const [singleTransactionLimit, setSingleTransactionLimit] = useState(0);
  const [tempSingleTransactionLimit, setTempSingleTransactionLimit] =
    useState("");
  const [updating, setUpdating] = useState(false);
  const { requireVerification } = useIdentityGate({ ttl: 3 * 60 * 1000 });
  const { user } = useAuth();

  useEffect(() => {
    // AccountService.getSpendingLimits()
    //   .then(({ dailyLimit: d, monthlyLimit: m }) => {
    setDailyLimit(user?.transactionLimits?.dailyLimit || 0);
    setSingleTransactionLimit(
      user?.transactionLimits?.singleTransactionLimit || 0,
    );
    setTempDailyLimit((user?.transactionLimits?.dailyLimit || 0).toString());
    setTempSingleTransactionLimit(
      (user?.transactionLimits?.singleTransactionLimit || 0).toString(),
    );
    // })
    // .catch(() => ToastService.error("Failed to load spending limits"))
    // .finally(() => setupdating(false));
  }, []);

  const handleReset = useCallback(() => {
    setTempDailyLimit(dailyLimit.toString());
    setTempSingleTransactionLimit(singleTransactionLimit.toString());
  }, [dailyLimit, singleTransactionLimit]);

  const handleConfirm = useCallback(() => {
    const daily = Number.parseInt(tempDailyLimit, 10);
    const singleTransaction = Number.parseInt(tempSingleTransactionLimit, 10);

    if (Number.isNaN(daily) || Number.isNaN(singleTransaction)) {
      ToastService.error("Please enter valid numbers");
      return;
    }
    if (daily < MIN_LIMIT || daily > MAX_DAILY_LIMIT) {
      ToastService.error(
        `Daily limit must be between ₦${MIN_LIMIT.toLocaleString()} and ₦${MAX_DAILY_LIMIT.toLocaleString()}`,
      );
      return;
    }
    if (
      singleTransaction < MIN_LIMIT ||
      singleTransaction > MAX_SINGLE_TRANSACTION_LIMIT
    ) {
      ToastService.error(
        `Single transaction limit must be between ₦${MIN_LIMIT.toLocaleString()} and ₦${MAX_SINGLE_TRANSACTION_LIMIT.toLocaleString()}`,
      );
      return;
    }
    if (daily > singleTransaction) {
      ToastService.error("Daily limit cannot exceed single transaction limit");
      return;
    }

    requireVerification(async () => {
      setUpdating(true);
      const result = await AccountService.updateSpendingLimits({
        dailyLimit: daily,
        singleTransactionLimit: singleTransaction,
      });
      if (result.success) {
        setDailyLimit(daily);
        setSingleTransactionLimit(singleTransaction);
        ToastService.success("Spending limits updated");
      } else {
        ToastService.error(result.message || "Failed to update limits");
        setTempDailyLimit(dailyLimit.toString());
        setTempSingleTransactionLimit(singleTransactionLimit.toString());
      }
      setUpdating(false);
    });
  }, [
    tempDailyLimit,
    tempSingleTransactionLimit,
    dailyLimit,
    singleTransactionLimit,
    requireVerification,
  ]);

  return (
    <View
      className={`rounded-2xl p-6 mb-6 ${
        isDark
          ? "bg-slate-900 border border-slate-700"
          : "bg-white border border-slate-200"
      }`}
    >
      <View className="flex-row items-center mb-6">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
            isDark ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          <CreditCard size={24} color={isDark ? "#a3e635" : "#65a30d"} />
        </View>
        <Text
          className={`text-xl font-brand font-bold flex-1 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Transaction Limits
        </Text>
        {updating && (
          <ActivityIndicator
            size="small"
            color={isDark ? "#a3e635" : "#65a30d"}
          />
        )}
      </View>

      <LimitInput
        isDark={isDark}
        label="Daily Limit"
        value={tempDailyLimit}
        onChangeText={setTempDailyLimit}
        disabled={updating}
      />

      <LimitInput
        isDark={isDark}
        label="Single Transaction Limit"
        value={tempSingleTransactionLimit}
        onChangeText={setTempSingleTransactionLimit}
        disabled={updating}
      />

      <View
        className={`p-3 rounded-xl mb-4 ${
          isDark
            ? "bg-slate-800/50 border border-slate-700/50"
            : "bg-slate-50 border border-slate-200"
        }`}
      >
        <Text
          className={`text-xs leading-5 ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Daily limit must be ≤ monthly limit. Changes require biometric
          verification.
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          className={`flex-1 p-4 rounded-2xl ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-slate-100 border border-slate-200"
          }`}
          onPress={handleReset}
          disabled={updating}
        >
          <Text
            className={`text-center font-bold ${isDark ? "text-white" : "text-slate-800"}`}
          >
            Reset
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 p-4 rounded-2xl bg-lime-400 ${updating ? "opacity-50" : ""}`}
          onPress={handleConfirm}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text className="text-black text-center font-bold">Confirm</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
