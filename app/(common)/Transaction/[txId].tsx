import ScreenHeader from "@/components/ui/ScreenHeader";
import TransactionReceipt from "@/components/ui/Transaction/TransactionReceipt";
import PaymentService from "@/lib/services/PaymentService";
import { ReceiptService } from "@/lib/services/ReceiptService";
import ToastService from "@/lib/services/ToastService";
import { formatAmount } from "@/lib/utils/formatAmount";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionDetail() {
  const { txId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [transaction, setTransaction] = useState<TransactionHistory | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      PaymentService.FetchTransactionById(txId as string).then(
        (transaction) => {
          setTransaction(transaction);
          setLoading(false);
        },
      );
    } catch {
      ToastService.error("Error Fetching Transaction");
      setLoading(false);
    }
  }, [txId]);

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        <View className="flex-1 justify-center items-center">
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isDark ? "bg-indigo-600" : "bg-indigo-500"
            }`}
          >
            <Text className="text-2xl text-white">⏳</Text>
          </View>
          <Text
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-700"}`}
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      >
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-red-500 items-center justify-center mb-6">
            <Text className="text-3xl text-white">❌</Text>
          </View>
          <Text
            className={`text-2xl font-bold mb-2 text-center ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Transaction Not Found
          </Text>
          <Text
            className={`text-lg mb-8 text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            The transaction you&apos;re looking for doesn&apos;t exist
          </Text>
          <TouchableOpacity
            className={`px-8 py-4 rounded-2xl ${isDark ? "bg-indigo-600" : "bg-indigo-700"}`}
            onPress={() => router.back()}
          >
            <Text className="text-white text-lg font-bold">← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "P2P_DEBIT":
        return { emoji: "📤", label: "Money Sent" };
      case "P2P_CREDIT":
        return { emoji: "📥", label: "Money Received" };
      case "DEBIT":
        return { emoji: "💳", label: "Card Payment" };
      case "CREDIT":
        return { emoji: "💰", label: "Credit Added" };
      default:
        return { emoji: "📝", label: "Transaction" };
    }
  };

  const typeInfo = getTransactionTypeLabel(transaction.txType);
  const isCredit = (transaction.txType || "").includes("CREDIT");

  const handleDownloadReceipt = async () => {
    await ReceiptService.downloadReceipt({
      amount: transaction.amount.toString(),
      recipient: transaction.merchantId ?? "N/A",
      reference: transaction.transactionID,
      narration: transaction.narration || "N/A",
      date: new Date(transaction.transactionDate).toLocaleString(),
      // type: typeInfo.label,
      type: transaction.paymentMode,
    });
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-1">
          <ScreenHeader
            title="Transaction Details"
            subtitle="Complete transaction information"
            onBack={() => router.back()}
          />
        </View>

        <View className="px-6 pb-8">
          {/* Amount Section */}
          <View
            className={`rounded-2xl p-8 mb-6 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50 shadow-sm"
            }`}
          >
            <View className="items-center">
              <View className="w-28 h-28 rounded-full bg-lime-600 justify-center items-center mb-6">
                <Text className="text-4xl text-white font-bold">
                  {typeInfo.emoji}
                </Text>
              </View>

              <Text
                className={`text-xl font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                {typeInfo.label}
              </Text>

              <Text
                className={`text-3xl font-bold mb-4 ${
                  isCredit ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatAmount(
                  transaction.amount,
                  transaction.currency,
                  true,
                  isCredit,
                )}
              </Text>

              <View
                className={`px-4 py-2 rounded-full mt-2 ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"}`}
              >
                <Text
                  className={`text-sm font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                >
                  {transaction.merchantId}
                </Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <TransactionReceipt transaction={transaction} />

          {/* Download Receipt Button */}
          <Pressable
            className={`rounded-2xl p-4 items-center mt-6 ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
            onPress={() => handleDownloadReceipt()}
          >
            <Text className="text-white text-base font-semibold">
              📄 Download Receipt
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
