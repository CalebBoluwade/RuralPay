import { XCircle } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";

interface TransactionFailureProps {
  error: string;
  onClose: () => void;
}

const TransactionFailure: React.FC<TransactionFailureProps> = ({
  error,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-1 w-full justify-center px-6">
      <View className="items-center mb-12">
        <View
          className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
        >
          <XCircle size={56} color={isDark ? "#ef4444" : "#dc2626"} />
        </View>
        <Text
          className={`text-center text-2xl font-brand font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Transaction Failed. We Couldn&apos;t Complete Your Transaction
        </Text>
        <Text
          className={`text-xl text-center px-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {error}
        </Text>
      </View>

      <Pressable
        onPress={() => onClose()}
        className={`p-5 rounded-2xl ${isDark ? "bg-red-600" : "bg-red-500"}`}
      >
        <Text className="text-white text-center text-xl font-bold">Close</Text>
      </Pressable>
    </View>
  );
};

export default TransactionFailure;
