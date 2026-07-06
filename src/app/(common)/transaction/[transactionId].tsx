import { useAuth } from "@/src/components/context/AuthSessionProvider";
import TransactionReceipt from "@/src/components/ui/Modals/Transaction/TransactionReceipt";
import { AppColor } from "@/src/constants/theme";
import PaymentService from "@/src/lib/services/PaymentService";
import { ReceiptService } from "@/src/lib/services/ReceiptService";
import ToastService from "@/src/lib/services/ToastService";
import { formatAmount } from "@/src/lib/utils/formatAmount";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThumbsDown, ThumbsUp } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TRANSACTION_TYPE_MAP: Record<string, { emoji: string; label: string }> = {
  DEBIT: { emoji: "💳", label: "Payment Made" },
  CREDIT: { emoji: "💰", label: "Payment Received" },
};

const getTransactionTypeLabel = (type: string) =>
  TRANSACTION_TYPE_MAP[type] ?? { emoji: "📝", label: "Transaction" };

function LoadingView({ isDark }: Readonly<{ isDark: boolean }>) {
  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View className="flex-1 justify-center items-center gap-3">
        <Text
          className={`text-base font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Loading Transaction...
        </Text>
      </View>
    </SafeAreaView>
  );
}

function NotFoundView({
  isDark,
  onBack,
}: Readonly<{
  isDark: boolean;
  onBack: () => void;
}>) {
  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View className="flex-1 justify-center items-center px-6 gap-3">
        <Text
          className={`text-2xl font-bold text-center ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Transaction Not Found
        </Text>
        <Text
          className={`text-base text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          The Transaction You&apos;re Looking For Doesn&apos;t Exist
        </Text>
        <Pressable
          className={`${AppColor(isDark).buttonBackground} rounded-2xl px-8 py-4 mt-4`}
          onPress={onBack}
        >
          <Text className="text-black text-base font-bold">← Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function TransactionDetail() {
  const { transactionId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [transaction, setTransaction] = useState<TransactionHistoryItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    try {
      PaymentService.FetchTransactionById(transactionId as string).then(
        (transaction) => {
          setTransaction(transaction);
          setLoading(false);
        },
      );
    } catch {
      ToastService.error("Error Fetching Transaction");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  if (loading) return <LoadingView isDark={isDark} />;
  if (!transaction)
    return <NotFoundView isDark={isDark} onBack={() => router.back()} />;

  const typeInfo = getTransactionTypeLabel(transaction.txType);
  const isCredit = (transaction.txType || "").includes("CREDIT");

  const handleDownloadReceipt = async () => {
    await ReceiptService.DownloadTransactionReceipt({
      ...transaction,
      amount: transaction.amount.toString(),
      toAccount: transaction.toAccount ?? "N/A",
      reference: transaction.transactionId,
      narration: transaction.narration || "N/A",
    });
  };
  console.log(transaction);

  return (
    <SafeAreaView className={`flex-1 ${AppColor(isDark).screenBackground}`}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="pt-2 my-6">
          <Text
            className={`text-xl text-center font-brand font-bold mb-1 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Transaction Details
          </Text>
        </View>

        <View className="px-6 gap-4">
          {/* Hero amount card */}
          <View
            className={`rounded-2xl p-6 mb-3 border-2 border-dashed border-lime-300 ${
              isDark ? "bg-white/10" : "bg-white"
            }`}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-14 h-14 rounded-2xl items-center justify-center ${
                  isDark ? "bg-white/10" : "bg-slate-100"
                }`}
              >
                <Text className="text-2xl">{typeInfo.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text
                  className={`text-md ml-3 mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {typeInfo.label}
                </Text>
                <Text
                  className={`text-2xl font-bold ${
                    isCredit ? "text-lime-400" : "text-red-500"
                  }`}
                >
                  {formatAmount(
                    transaction.amount,
                    transaction.currency,
                    true,
                    isCredit,
                  )}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  isDark ? "bg-white/10" : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-base font-bold ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {transaction.toAccount || transaction.paymentMode}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <TransactionReceipt transaction={transaction} />

          {/* CTA */}
          {transaction.status === "COMPLETED" && (
            <Pressable
              className="bg-lime-400 rounded-2xl py-5 items-center"
              onPress={handleDownloadReceipt}
            >
              <Text className="text-black text-base font-bold">
                Download Transaction Receipt
              </Text>
            </Pressable>
          )}

          <View className="flex-row space-x-2 gap-2 mb-4">
            {user?.role === "consumer" &&
              transaction.status === "COMPLETED" && (
                <Pressable
                  className="flex-1 bg-lime-400 rounded-2xl py-5 items-center"
                  // onPress={handleDownloadReceipt}
                >
                  <View className="flex-row items-center gap-2">
                    <ThumbsUp size={24} />
                    <Text className="text-black text-base font-bold">
                      Give Applause
                    </Text>
                  </View>
                </Pressable>
              )}

            {user?.role === "consumer" &&
              transaction.status === "COMPLETED" && (
                <Pressable
                  className="flex-1 border border-red-400 rounded-2xl py-5 items-center"
                  // onPress={handleDownloadReceipt}
                >
                  <View className="flex-row items-center gap-2">
                    <ThumbsDown size={24} color="red" />
                    <Text className="text-red-500 text-base font-bold">
                      Report As Scam
                    </Text>
                  </View>
                </Pressable>
              )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
