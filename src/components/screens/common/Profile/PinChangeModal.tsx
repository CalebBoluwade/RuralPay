import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { Key } from "lucide-react-native";

interface PinChangeModalProps {
  visible: boolean;
  isDark: boolean;
  pinStep: "old" | "new";
  oldPin: string;
  setOldPin: (text: string) => void;
  newPin: string;
  setNewPin: (text: string) => void;
  confirmPin: string;
  setConfirmPin: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function PinChangeModal({
  visible,
  isDark,
  pinStep,
  oldPin,
  setOldPin,
  newPin,
  setNewPin,
  confirmPin,
  setConfirmPin,
  onClose,
  onSubmit,
}: PinChangeModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
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
                isDark ? "bg-lime-400/20" : "bg-lime-100"
              }`}
            >
              <Key size={32} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
            <Text
              className={`text-2xl font-brand font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {pinStep === "old" ? "Verify Current PIN" : "Set New PIN"}
            </Text>
            <Text
              className={`text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {pinStep === "old"
                ? "Enter your current 6-digit PIN"
                : "Enter and Confirm your New 6-digit PIN"}
            </Text>
          </View>

          {pinStep === "old" ? (
            <TextInput
              className={`p-4 rounded-2xl mb-4 text-lg ${
                isDark
                  ? "bg-slate-800 border border-slate-700 text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-900"
              }`}
              placeholder="Current PIN"
              placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
              value={oldPin}
              onChangeText={setOldPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              autoFocus
            />
          ) : (
            <>
              <TextInput
                className={`p-4 rounded-2xl mb-4 text-lg ${
                  isDark
                    ? "bg-slate-800 border border-slate-700 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-900"
                }`}
                placeholder="New PIN"
                placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                autoFocus
              />
              <TextInput
                className={`p-4 rounded-2xl mb-4 text-lg ${
                  isDark
                    ? "bg-slate-800 border border-slate-700 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-900"
                }`}
                placeholder="Confirm New PIN"
                placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
              />
            </>
          )}

          <View className="flex-row gap-2">
            <Pressable
              className={`flex-1 p-4 rounded-2xl ${
                isDark
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-slate-100 border border-slate-200"
              }`}
              onPress={onClose}
            >
              <Text
                className={`text-center font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 p-4 rounded-2xl bg-lime-400"
              onPress={onSubmit}
            >
              <Text className="text-black text-center font-bold">
                {pinStep === "old" ? "Continue" : "Update PIN"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
