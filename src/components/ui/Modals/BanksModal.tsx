import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import Button from "../Button";

interface BankModalProps {
  banks: Bank[];
  visible: boolean;
  onClose: () => void;
  onBankSelected: (bank: Bank) => void;
  loading?: boolean;
  fetchError?: boolean;
  onRetry?: () => void;
}

const getUptimeColor = (uptime: number): string => {
  if (uptime >= 95) return "#10b981";
  if (uptime >= 85) return "#f59e0b";
  return "#ef4444";
};

// Render bank list item
const renderBankItem = (
  bank: Bank,
  isDark: boolean,
  onSelect: (bank: Bank) => void,
) => {
  const statusColor = getUptimeColor(bank.uptimePrediction);

  return (
    <Pressable
      key={bank.bankCode}
      className={`p-4 gap-4 flex-row w-full items-center ${
        isDark ? "border-b border-white/10" : "border-b border-gray-100"
      }`}
      onPress={() => onSelect(bank)}
    >
      <SvgUri uri={bank.logoData} width={50} height={50} />
      <View className="flex-1">
        <Text
          className={`text-base ${isDark ? "text-white" : "text-gray-800"}`}
        >
          {bank.name}
        </Text>
        <View className="flex-row items-center mt-1">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: statusColor }}
          />
          <Text
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {bank.uptimePrediction.toFixed(1)}% uptime
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const BanksModal: React.FC<BankModalProps> = ({
  banks,
  visible,
  onClose,
  onBankSelected,
  loading = false,
  fetchError = false,
  onRetry,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const filteredBanks = (banks || []).filter((bank) =>
    bank.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        style={{ flex: 1 }}
        className={isDark ? "bg-[#0a0a0f]" : "bg-white"}
      >
        <View className="flex-1">
          <View
            className={`p-5 ${
              isDark ? "border-b border-white/10" : "border-b border-gray-200"
            }`}
          >
            <Text
              className={`text-xl font-bold text-center mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Select Bank
            </Text>

            <TextInput
              className={`p-4 rounded-xl ${
                isDark
                  ? "bg-white/10 border border-white/20 text-white"
                  : "bg-gray-100 border border-gray-200 text-gray-900"
              }`}
              placeholder="Search Banks..."
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator
                size="large"
                color={isDark ? "#10b981" : "#059669"}
              />
            </View>
          ) : fetchError ? (
            <View className="flex-1 items-center justify-center py-16 px-6 gap-3">
              <Text
                className={`text-lg ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Failed To Load Banks
              </Text>
              <Button label="Retry" onPress={onRetry} />
            </View>
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.bankCode}
              renderItem={({ item }) =>
                renderBankItem(item, isDark, onBankSelected)
              }
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-16 px-6">
                  <Text
                    className={`text-lg ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No Banks Found
                  </Text>
                </View>
              }
            />
          )}

          <Pressable
            className={`p-4 m-5 rounded-2xl backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-gray-100 border border-gray-200"
            }`}
            onPress={onClose}
          >
            <Text
              className={`text-center font-semibold ${
                isDark ? "text-white" : "text-gray-600"
              }`}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default BanksModal;
