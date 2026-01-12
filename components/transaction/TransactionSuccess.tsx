import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Share, Text, TouchableOpacity, View } from "react-native";

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
    <View className="flex-1 justify-center items-center px-5 bg-black/40">
      <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="checkmark" size={32} color="#22c55e" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Transaction Successful
          </Text>
          <Text className="text-gray-600 text-center">
            Your {data.type} has been completed successfully
          </Text>
        </View>

        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Amount</Text>
            <Text className="font-semibold text-gray-800">₦{data.amount}</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Recipient</Text>
            <Text className="font-semibold text-gray-800 flex-1 text-right">
              {data.recipient}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Reference</Text>
            <Text className="font-mono text-sm text-gray-800">
              {data.reference}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Date</Text>
            <Text className="text-gray-800">{data.date}</Text>
          </View>
          {data.narration && (
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Narration</Text>
              <Text className="text-gray-800 flex-1 text-right">
                {data.narration}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row space-x-2 gap-2 mb-4">
          <TouchableOpacity
            className="flex-1 bg-emerald-700 rounded-lg p-3 items-center"
            onPress={onDownloadReceipt}
          >
            <Text className="text-white font-semibold">Download Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded-lg p-3 items-center"
            onPress={handleShare}
          >
            <Text className="text-gray-800 font-semibold">Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-gray-100 rounded-lg p-3 items-center"
          onPress={onClose}
        >
          <Text className="text-gray-800 font-semibold">Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TransactionSuccess;