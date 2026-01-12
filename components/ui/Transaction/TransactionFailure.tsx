import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TransactionFailureProps {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

const TransactionFailure: React.FC<TransactionFailureProps> = ({
  error,
  onRetry,
  onClose,
}) => {
  return (
    <View className="flex-1 justify-center items-center px-5 bg-black/40">
      <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="close" size={32} color="#ef4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Transaction Failed
          </Text>
          <Text className="text-gray-600 text-center">
            We Couldn&apos;t Complete Your Transaction
          </Text>
        </View>

        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <Text className="text-red-800 text-center">{error}</Text>
        </View>

        <View className="space-y-3">
          <TouchableOpacity
            className="bg-red-500 rounded-lg p-3 items-center mb-3"
            onPress={onRetry}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-gray-100 rounded-lg p-3 items-center"
            onPress={onClose}
          >
            <Text className="text-gray-800 font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TransactionFailure;