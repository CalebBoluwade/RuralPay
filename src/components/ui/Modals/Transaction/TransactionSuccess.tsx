import { formatAmount } from "@/src/lib/utils/formatAmount";
import { CheckCircle2 } from "lucide-react-native";
import React from "react";
import { Share, Text, View, useColorScheme } from "react-native";
import Button from "../../Button";

interface TransactionSuccessProps {
  transactionResult: TransactionHistoryItem;
  onClose: () => void;
  handleDownloadReceipt: () => void;
}

const TransactionSuccess: React.FC<TransactionSuccessProps> = ({
  transactionResult,
  onClose,
  handleDownloadReceipt,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!transactionResult) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Transaction Successful!\nAmount: ₦${transactionResult.amount}\nRecipient: ${transactionResult.toAccount}\nReference: ${transactionResult.reference}`,
      });
    } catch (error) {
      if (__DEV__) console.error("Error sharing:", error);
    }
  };

  return (
    <View className="flex-1 w-full justify-center px-6">
      <View className="items-center mb-12">
        <View
          className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
        >
          <CheckCircle2 size={56} color={isDark ? "#84cc16" : "#65a30d"} />
        </View>
        <Text
          className={`text-3xl font-brand font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Payment Successful!
        </Text>
        <Text
          className={`text-base text-center px-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {transactionResult?.responseMessage ||
            (transactionResult as any)?.message ||
            `Your Transaction Of ${formatAmount(transactionResult.amount, "NGN", true, false)} Was Completed Successfully.`}
        </Text>
      </View>

      <View
        className={`p-6 rounded-2xl mb-8 border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Reference
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {transactionResult?.reference || transactionResult?.transactionId}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-4">
          <Text
            // Keep this as is, or add a small right margin
            className={`text-base font-medium mr-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Transaction ID
          </Text>
          <Text
            numberOfLines={1} // CRITICAL: Ellipses won't show without this
            ellipsizeMode="head"
            className={`flex-1 text-right text-base font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {transactionResult?.transactionId}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Narration
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {transactionResult?.narration}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Date
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="flex-col gap-3">
        <Button
          label="Download Receipt"
          // variant="primary"
          onPress={handleDownloadReceipt}
        />
        {/* <Pressable
          className={`flex-1 rounded-2xl py-5 px-1 items-center backdrop-blur-xl ${
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
        </Pressable> */}

        <Button label="Close" variant="danger" onPress={onClose} />

        {/* <Pressable
          onPress={() => onClose()}
          className={`flex-1 p-5 rounded-2xl border border-red-400`}
        >
          <Text className="text-center text-xl text-red-500 font-bold">
            Close
          </Text>
        </Pressable> */}
      </View>
    </View>
  );
};

export default TransactionSuccess;
