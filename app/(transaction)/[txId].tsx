import { BankTransferService } from "@/components/services/BankTransferService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { formatAmount } from "@/lib/formatAmount";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionDetail() {
  const { txId } = useLocalSearchParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      BankTransferService.FetchTransactionById(txId as string).then(
        (transaction) => {
          setTransaction(transaction);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error fetching transaction:", error);
      setLoading(false);
    }
  }, [txId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-50">
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 rounded-full bg-indigo-500 items-center justify-center mb-4">
            <Text className="text-2xl text-white">⏳</Text>
          </View>
          <Text className="text-xl font-semibold text-gray-700">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-50">
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-pink-500 items-center justify-center mb-6">
            <Text className="text-3xl text-white">❌</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Transaction Not Found
          </Text>
          <Text className="text-lg text-gray-600 mb-8 text-center">
            The transaction you&apos;re looking for doesn&apos;t exist
          </Text>
          <TouchableOpacity
            className="bg-indigo-700 px-8 py-4 rounded-2xl shadow-lg"
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
  const isCredit = transaction.txType.includes("CREDIT");

  return (
    <SafeAreaView className="flex-1">
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
          <View className="bg-white/80 backdrop-blur rounded-3xl p-8 shadow-lg border border-white/50 mb-6">
            <View className="items-center">
              <View className="w-28 h-28 rounded-full bg-purple-600 justify-center items-center mb-6 shadow-xl">
                <Text className="text-4xl text-white font-bold drop-shadow-lg">
                  {typeInfo.emoji}
                </Text>
              </View>

              <Text className="text-xl font-semibold text-gray-700 mb-2">
                {typeInfo.label}
              </Text>

              <Text
                className={`text-3xl font-bold mb-4 ${
                  isCredit ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatAmount(
                  transaction.amount,
                  transaction.currency,
                  true,
                  isCredit
                )}
              </Text>

              <View className="bg-indigo-100 px-4 py-2 rounded-full mt-2">
                <Text className="text-sm font-semibold text-indigo-700">
                  {transaction.merchantId}
                </Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50">
            <Text className="text-2xl font-bold text-gray-900 mb-6">
              Transaction Information
            </Text>

            <View className="space-y-4">
              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">
                  Status
                </Text>
                <View
                  className={`px-4 py-2 rounded-full ${
                    transaction.status === "COMPLETED"
                      ? "bg-green-100 border border-green-200"
                      : "bg-orange-100 border border-orange-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      transaction.status === "COMPLETED"
                        ? "text-green-700"
                        : "text-orange-700"
                    }`}
                  >
                    {transaction.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">
                  Transaction ID
                </Text>
                <Text className="text-lg font-semibold text-gray-900 text-right flex-1 ml-4">
                  {transaction.txId}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">
                  Date & Time
                </Text>
                <Text className="text-lg font-semibold text-gray-900 text-right flex-1 ml-4">
                  {new Date(transaction.timestamp * 1000).toLocaleDateString()}
                  {"\n"}
                  {new Date(transaction.timestamp * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">
                  Sender ID
                </Text>
                <Text className="text-lg font-semibold text-gray-900 text-right flex-1 ml-4">
                  {transaction.cardId}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">
                  Currency
                </Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {transaction.currency}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">Fees</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {transaction.fees || 0}
                </Text>
              </View>

              {transaction.recipientId && (
                <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                  <Text className="text-lg font-medium text-gray-600">
                    Recipient
                  </Text>
                  <Text className="text-lg font-semibold text-gray-900 text-right flex-1 ml-4">
                    {transaction.recipientId}
                  </Text>
                </View>
              )}

              {transaction.senderId && (
                <View className="flex-row justify-between items-center py-3">
                  <Text className="text-lg font-medium text-gray-600">
                    Sender
                  </Text>
                  <Text className="text-lg font-semibold text-gray-900 text-right flex-1 ml-4">
                    {transaction.senderId}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
