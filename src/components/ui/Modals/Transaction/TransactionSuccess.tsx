import { formatAmount } from "@/src/lib/utils/formatAmount";
import { CheckCircle2 } from "lucide-react-native";
import React from "react";
import { Pressable, Share, Text, View, useColorScheme } from "react-native";

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
          Your transaction of{" "}
          {formatAmount(transactionResult.amount, "NGN", true, false)} was
          completed successfully.
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
            {transactionResult?.reference}
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

      <View className="flex-row space-x-2 gap-2 mb-4">
        <Pressable
          className={`flex-1 rounded-2xl py-5 px-1 items-center ${isDark ? "bg-lime-600" : "bg-lime-500"}`}
          onPress={handleDownloadReceipt}
        >
          <Text className="text-white text-base font-semibold break-words text-wrap">
            Download Receipt
          </Text>
        </Pressable>
        <Pressable
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
        </Pressable>
      </View>

      <Pressable
        onPress={() => onClose()}
        className={`p-5 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-500"}`}
      >
        <Text className="text-white text-center text-xl font-bold">Close</Text>
      </Pressable>
    </View>

    // <Modal
    //   visible={visible}
    //   animationType="slide"
    //   presentationStyle="fullScreen"
    //   onRequestClose={onClose}
    // >
    //   <View
    //     className={`flex-1 justify-center items-center px-5 ${isDark ? "bg-black/80" : "bg-black/40"}`}
    //   >
    //     <View
    //       className={`rounded-2xl p-6 w-full max-w-sm backdrop-blur-xl ${
    //         isDark
    //           ? "bg-white/10 border border-white/20"
    //           : "bg-white/80 border border-gray-200/50"
    //       }`}
    //     >
    //       <View className="items-center mb-6">
    //         <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-4">
    //           <Ionicons name="checkmark" size={32} color="#22c55e" />
    //         </View>
    //         <Text
    //           className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}
    //         >
    //           Transaction Successful
    //         </Text>
    //         <Text
    //           className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
    //         >
    //           Your {data.type} has been completed successfully
    //         </Text>
    //       </View>

    //       <View
    //         className={`rounded-2xl p-4 mb-6 backdrop-blur-xl ${
    //           isDark
    //             ? "bg-white/5 border border-white/10"
    //             : "bg-gray-50/80 border border-gray-200/30"
    //         }`}
    //       >
    //         <View className="flex-row justify-between mb-3">
    //           <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
    //             Amount
    //           </Text>
    //           <Text
    //             className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
    //           >
    //             ₦{data.amount}
    //           </Text>
    //         </View>
    //         <View className="flex-row justify-between mb-3">
    //           <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
    //             Recipient
    //           </Text>
    //           <Text
    //             className={`font-semibold flex-1 text-right ${isDark ? "text-white" : "text-gray-800"}`}
    //           >
    //             {data.recipient}
    //           </Text>
    //         </View>
    //         <View className="flex-row justify-between mb-3">
    //           <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
    //             Reference
    //           </Text>
    //           <Text
    //             className={`font-mono text-sm ${isDark ? "text-white" : "text-gray-800"}`}
    //           >
    //             {data.reference}
    //           </Text>
    //         </View>
    //         <View className="flex-row justify-between mb-3">
    //           <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
    //             Date
    //           </Text>
    //           <Text className={isDark ? "text-white" : "text-gray-800"}>
    //             {data.date}
    //           </Text>
    //         </View>
    //         {data.narration && (
    //           <View className="flex-row justify-between">
    //             <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
    //               Narration
    //             </Text>
    //             <Text
    //               className={`flex-1 text-right ${isDark ? "text-white" : "text-gray-800"}`}
    //             >
    //               {data.narration}
    //             </Text>
    //           </View>
    //         )}
    //       </View>

    //       <View className="flex-row space-x-2 gap-2 mb-4">
    //         <Pressable
    //           className={`flex-1 rounded-2xl py-3 px-1 items-center ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
    //           onPress={onDownloadReceipt}
    //         >
    //           <Text className="text-white text-base font-semibold break-words text-wrap">
    //             Download Receipt
    //           </Text>
    //         </Pressable>
    //         <Pressable
    //           className={`flex-1 rounded-2xl py-3 px-1 items-center backdrop-blur-xl ${
    //             isDark
    //               ? "bg-white/10 border border-white/20"
    //               : "bg-gray-200 border border-gray-300"
    //           }`}
    //           onPress={handleShare}
    //         >
    //           <Text
    //             className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
    //           >
    //             Share
    //           </Text>
    //         </Pressable>
    //       </View>

    //       <Pressable
    //         className={`rounded-2xl p-3 items-center backdrop-blur-xl ${
    //           isDark
    //             ? "bg-white/5 border border-white/10"
    //             : "bg-gray-100 border border-gray-200"
    //         }`}
    //         onPress={onClose}
    //       >
    //         <Text
    //           className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
    //         >
    //           Done
    //         </Text>
    //       </Pressable>
    //     </View>
    //   </View>
    // </Modal>
  );
};

export default TransactionSuccess;
