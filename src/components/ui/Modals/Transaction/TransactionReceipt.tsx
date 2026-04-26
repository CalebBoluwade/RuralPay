import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { maskCardNumber } from "@/src/lib/utils";
import { formatAmount } from "@/src/lib/utils/formatAmount";
import React from "react";
import { Text, View, useColorScheme } from "react-native";

interface TransactionReceiptProps {
  transaction: TransactionHistoryItem;
}

const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
  transaction,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const isCredit = (transaction.txType || "").includes("CREDIT");

  return (
    <View
      className={`rounded-2xl p-6 backdrop-blur-xl ${
        isDark
          ? "bg-white/10 border border-white/20"
          : "bg-white/80 border border-gray-200/50 shadow-sm"
      }`}
    >
      <Text
        className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        Transaction Information
      </Text>

      <View className="space-y-4">
        <View
          className={`flex-row justify-between items-center py-3 border-b ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <Text
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Status
          </Text>
          <View
            className={`px-4 py-2 rounded-full ${
              transaction.status === "COMPLETED"
                ? isDark
                  ? "bg-green-500/20 border border-green-500/30"
                  : "bg-green-100 border border-green-200"
                : isDark
                  ? "bg-orange-500/20 border border-orange-500/30"
                  : "bg-orange-100 border border-orange-200"
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                transaction.status === "COMPLETED"
                  ? "text-green-500"
                  : "text-orange-500"
              }`}
            >
              {transaction.status}
            </Text>
          </View>
        </View>

        <View
          className={`flex-row justify-between items-center py-3 border-b ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <Text
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Transaction ID
          </Text>
          <Text
            className={`text-lg font-semibold text-right flex-1 ml-4 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {transaction.transactionId}
          </Text>
        </View>

        <View
          className={`flex-row justify-between items-center py-3 border-b ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <Text
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Narration
          </Text>
          <Text
            className={`text-lg font-semibold text-right flex-1 ml-4 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {transaction.narration || "N/A"}
          </Text>
        </View>

        <View
          className={`flex-row justify-between items-center py-3 border-b ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <Text
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Date & Time
          </Text>
          <Text
            className={`text-lg font-semibold text-right flex-1 ml-4 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {new Date(transaction.transactionDate).toLocaleDateString()}
            {" . "}
            {new Date(transaction.transactionDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {user?.role === "merchant" && (
          <View
            className={`flex-row justify-between items-center py-3 border-b ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Text
              className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Settlement Date
            </Text>

            {transaction.settlementDate ? (
              <Text
                className={`text-lg font-semibold text-right flex-1 ml-4 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {new Date(transaction.settlementDate!).toLocaleDateString()}
              </Text>
            ) : (
              <Text
                className={`text-lg font-semibold text-right flex-1 ml-4 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                N/A
              </Text>
            )}
          </View>
        )}

        <View
          className={`flex-row justify-between items-center py-3 border-b ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <Text
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Currency
          </Text>
          <Text
            className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {transaction.currency}
          </Text>
        </View>

        {user?.role === "merchant" ? (
          <View
            className={`flex-row justify-between items-center py-3 border-b ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Text
              className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Transaction Profit
            </Text>
            <Text className={`text-lg font-semibold text-lime-400`}>
              {formatAmount(
                Number(transaction.profit) || 0,
                transaction.currency,
                true,
                isCredit,
              )}
            </Text>
          </View>
        ) : (
          <View
            className={`flex-row justify-between items-center py-3 border-b ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Text
              className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Fees
            </Text>
            <Text
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {formatAmount(
                Number(transaction.fee) || 0,
                transaction.currency,
                true,
                isCredit,
              )}
            </Text>
          </View>
        )}

        {transaction.toAccount && (
          <View
            className={`flex-row justify-between items-center py-3 border-b ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Text
              className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Recipient
            </Text>
            <Text
              className={`text-lg font-semibold text-right flex-1 ml-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {transaction.toAccount}
            </Text>
          </View>
        )}

        {transaction.fromAccount && (
          <View className="flex-row justify-between items-center py-3">
            <Text
              className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Sender
            </Text>
            <Text
              className={`text-lg font-semibold text-right flex-1 ml-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {transaction.paymentMode === "CARD"
                ? maskCardNumber(transaction.fromAccount)
                : transaction.fromAccount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TransactionReceipt;
