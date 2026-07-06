import { Pencil } from "lucide-react-native";
import {
    Modal,
    Pressable,
    Text,
    TextInput,
    View
} from "react-native";

interface EditProfileModalProps {
  visible: boolean;
  isDark: boolean;
  editedFirstName: string;
  setEditedFirstName: (text: string) => void;
  editedLastName: string;
  setEditedLastName: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function EditProfileModal({
  visible,
  isDark,
  editedFirstName,
  setEditedFirstName,
  editedLastName,
  setEditedLastName,
  onClose,
  onSave,
}: EditProfileModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
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
                isDark ? "bg-lime-500/20" : "bg-lime-100"
              }`}
            >
              <Pencil size={28} color={isDark ? "#84cc16" : "#65a30d"} />
            </View>
            <Text
              className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Edit Profile
            </Text>
            <Text
              className={`text-center mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Update your personal information
            </Text>
          </View>

          <View className="mb-4">
            <Text
              className={`text-base font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              First Name
            </Text>
            <TextInput
              className={`p-4 rounded-2xl text-lg ${
                isDark
                  ? "bg-slate-800 border border-slate-700 text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-900"
              }`}
              placeholder="Enter first name"
              placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
              value={editedFirstName}
              onChangeText={setEditedFirstName}
              autoCapitalize="words"
            />
          </View>

          <View className="mb-6">
            <Text
              className={`text-base font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Last Name
            </Text>
            <TextInput
              className={`p-4 rounded-2xl text-lg ${
                isDark
                  ? "bg-slate-800 border border-slate-700 text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-900"
              }`}
              placeholder="Enter last name"
              placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
              value={editedLastName}
              onChangeText={setEditedLastName}
              autoCapitalize="words"
            />
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
              className="flex-1 p-4 rounded-2xl bg-lime-400"
              onPress={onSave}
            >
              <Text className="text-black text-center font-bold text-base">
                Save Changes
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
