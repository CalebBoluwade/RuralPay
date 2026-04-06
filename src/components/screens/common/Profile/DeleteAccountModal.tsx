import { Trash2 } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";

interface DeleteAccountModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({
  visible,
  isDark,
  onClose,
  onConfirm,
}: Readonly<DeleteAccountModalProps>) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 justify-center items-center px-5 ${isDark ? "bg-black/80" : "bg-black/40"}`}
      >
        <View
          className={`rounded-2xl p-6 w-full ${
            isDark
              ? "bg-slate-900 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
        >
          <View className="items-center mb-6">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                isDark ? "bg-red-900/30" : "bg-red-100"
              }`}
            >
              <Trash2 size={32} color="#ef4444" />
            </View>
            <Text
              className={`text-2xl font-brand font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Delete Account?
            </Text>
            <Text
              className={`text-center leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              This Will Permanently Delete Your Account. This Action Cannot Be
              Undone.
            </Text>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              className={`flex-1 p-4 rounded-2xl ${
                isDark
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-slate-100 border border-slate-200"
              }`}
              onPress={onClose}
            >
              <Text
                className={`text-center font-bold text-base ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 p-4 rounded-2xl bg-red-500"
              onPress={onConfirm}
            >
              <Text className="text-white text-center font-bold text-base">
                Delete Account
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
