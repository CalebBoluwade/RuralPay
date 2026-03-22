import { ChevronRight, Search, Users, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

interface PhoneNumber {
  label: string;
  number: string;
  name: string;
  imageUri?: string;
}

interface ContactsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectNumber: (number: string) => void;
  contacts: PhoneNumber[];
}

const ContactsModal = ({
  visible,
  onClose,
  onSelectNumber,
  contacts,
}: ContactsModalProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [filteredContacts, setFilteredContacts] =
    useState<PhoneNumber[]>(contacts);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    setFilteredContacts(contacts);
  }, [contacts]);

  const handleSelectNumber = (num: string) => {
    const cleanNum = num.replace(/[^0-9+]/g, "");
    onSelectNumber(cleanNum);
    setSearchQuery("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    const filtered = contacts.filter(
      (contact) =>
        contact.number.toLowerCase().includes(query.toLowerCase()) ||
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.label.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredContacts(filtered);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <View className="flex-1 justify-end bg-black/50">
        <View
          className={`${isDark ? "bg-slate-900" : "bg-white"} rounded-t-3xl pb-8`}
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center p-6 pb-4">
            <Text
              className={`text-xl font-brand ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Select Contact
            </Text>
            <Pressable
              onPress={() => {
                onClose();
                setSearchQuery("");
              }}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <X size={18} color={isDark ? "#94a3b8" : "#64748b"} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View className="px-6 mb-4">
            <View className="relative">
              <Search
                size={18}
                color={isDark ? "#64748b" : "#94a3b8"}
                style={{ position: "absolute", left: 16, top: 18, zIndex: 1 }}
              />
              <TextInput
                className={`h-14 pl-12 pr-4 rounded-xl border-2 text-base ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
                placeholder="Search contacts..."
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Contacts List */}
          <FlatList
            data={filteredContacts}
            keyExtractor={(item, index) => index.toString()}
            className="max-h-96"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelectNumber(item.number)}
                className={`mx-6 py-4 border-b ${
                  isDark ? "border-slate-800" : "border-slate-100"
                } flex-row items-center active:opacity-70`}
              >
                {/* Contact Avatar */}
                <View className="mr-3">
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        isDark ? "bg-lime-600" : "bg-lime-500"
                      }`}
                    >
                      <Text className="text-white font-semibold text-base">
                        {getInitials(item.name)}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-base font-medium ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {item.name}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {item.number}
                  </Text>
                </View>

                <ChevronRight
                  size={16}
                  color={isDark ? "#64748b" : "#94a3b8"}
                />
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center py-16">
                {searchQuery ? (
                  <Search size={48} color={isDark ? "#64748b" : "#94a3b8"} />
                ) : (
                  <Users size={48} color={isDark ? "#64748b" : "#94a3b8"} />
                )}
                <Text
                  className={`text-base mt-3 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {searchQuery ? "No matching contacts" : "No contacts found"}
                </Text>
              </View>
            }
          />
        </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ContactsModal;
