import { Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface DeleteAccountSectionProps {
  isDark: boolean;
  onDelete: () => void;
}

export function DeleteAccountSection({
  isDark,
  onDelete,
}: Readonly<DeleteAccountSectionProps>) {
  return (
    <View
      className={`rounded-2xl p-6 mb-6 ${
        isDark
          ? "bg-red-950/30 border border-red-900/50"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <View className="flex-row items-center mb-4">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
            isDark ? "bg-red-900/30" : "bg-red-100"
          }`}
        >
          <Trash2 size={24} color="#ef4444" />
        </View>
        <Text
          className={`text-xl font-brand font-bold ${isDark ? "text-red-400" : "text-red-900"}`}
        >
          Delete Account
        </Text>
      </View>
      <Text
        className={`text-base mb-4 leading-6 ${
          isDark ? "text-red-300/80" : "text-red-700"
        }`}
      >
        Permanently delete your account and all associated data. This action
        cannot be undone.
      </Text>
      <Pressable className="bg-red-500 rounded-2xl py-3" onPress={onDelete}>
        <Text className="text-white text-center font-bold">
          Delete My Account
        </Text>
      </Pressable>
    </View>
  );
}
