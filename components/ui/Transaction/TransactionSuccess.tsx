import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Share,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface TransactionData {
  amount: string;
  recipient: string;
  reference: string;
  date: string;
  narration?: string;
  type: string;
}

interface TransactionSuccessProps {
  data: TransactionData;
  onClose: () => void;
  onDownloadReceipt: () => void;
}

const TransactionSuccess: React.FC<TransactionSuccessProps> = ({
  data,
  onClose,
  onDownloadReceipt,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Transaction Successful!\nAmount: ₦${data.amount}\nRecipient: ${data.recipient}\nReference: ${data.reference}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <View
      className={`flex-1 justify-center items-center px-5 ${isDark ? "bg-black/80" : "bg-black/40"}`}
    >
      <View
        className={`rounded-2xl p-6 w-full max-w-sm backdrop-blur-xl ${
          isDark
            ? "bg-white/10 border border-white/20"
            : "bg-white/80 border border-gray-200/50"
        }`}
      >
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-4">
            <Ionicons name="checkmark" size={32} color="#22c55e" />
          </View>
          <Text
            className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}
          >
            Transaction Successful
          </Text>
          <Text
            className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Your {data.type} has been completed successfully
          </Text>
        </View>

        <View
          className={`rounded-2xl p-4 mb-6 backdrop-blur-xl ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-gray-50/80 border border-gray-200/30"
          }`}
        >
          <View className="flex-row justify-between mb-3">
            <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
              Amount
            </Text>
            <Text
              className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
            >
              ₦{data.amount}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
              Recipient
            </Text>
            <Text
              className={`font-semibold flex-1 text-right ${isDark ? "text-white" : "text-gray-800"}`}
            >
              {data.recipient}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
              Reference
            </Text>
            <Text
              className={`font-mono text-sm ${isDark ? "text-white" : "text-gray-800"}`}
            >
              {data.reference}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
              Date
            </Text>
            <Text className={isDark ? "text-white" : "text-gray-800"}>
              {data.date}
            </Text>
          </View>
          {data.narration && (
            <View className="flex-row justify-between">
              <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
                Narration
              </Text>
              <Text
                className={`flex-1 text-right ${isDark ? "text-white" : "text-gray-800"}`}
              >
                {data.narration}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row space-x-2 gap-2 mb-4">
          <TouchableOpacity
            className={`flex-1 rounded-2xl py-3 px-1 items-center ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
            onPress={onDownloadReceipt}
          >
            <Text className="text-white text-base font-semibold break-words text-wrap">
              Download Receipt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 rounded-2xl py-3 px-1 items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-gray-200 border border-gray-300"
            }`}
            onPress={handleShare}
          >
            <Text
              className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`rounded-2xl p-3 items-center backdrop-blur-xl ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-gray-100 border border-gray-200"
          }`}
          onPress={onClose}
        >
          <Text
            className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TransactionSuccess;
