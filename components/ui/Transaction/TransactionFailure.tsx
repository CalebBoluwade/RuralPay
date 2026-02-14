import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface TransactionFailureProps {
  visible: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

const TransactionFailure: React.FC<TransactionFailureProps> = ({
  visible,
  error,
  onRetry,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
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
            <View className="w-16 h-16 bg-red-500/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="close" size={32} color="#ef4444" />
            </View>
            <Text
              className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}
            >
              Transaction Failed
            </Text>
            <Text
              className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              We Couldn&apos;t Complete Your Transaction
            </Text>
          </View>

          <View
            className={`rounded-2xl p-4 mb-6 backdrop-blur-xl ${
              isDark
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <Text
              className={`text-center ${isDark ? "text-red-400" : "text-red-800"}`}
            >
              {error}
            </Text>
          </View>

          <View className="space-y-3">
            <TouchableOpacity
              className={`rounded-2xl p-3 items-center mb-3 ${isDark ? "bg-red-600" : "bg-red-500"}`}
              onPress={onRetry}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>

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
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TransactionFailure;
