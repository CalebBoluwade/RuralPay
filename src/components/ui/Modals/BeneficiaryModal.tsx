import PaymentService from "@/src/lib/services/PaymentService";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    Switch,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../Button";
import Loading from "./Loading";

const FREQ_KEY = "frequent_beneficiaries";
const FREQ_LIMIT = 5;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (beneficiary: Beneficiary) => void;
}

const BeneficiaryModal: React.FC<Props> = ({ visible, onClose, onSelect }) => {
  const isDark = useColorScheme() === "dark";
  const [showFrequent, setShowFrequent] = useState(true);
  const [frequent, setFrequent] = useState<Beneficiary[]>([]);
  const [all, setAll] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [allFetched, setAllFetched] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    loadFrequent();
    if (!showFrequent) fetchAll();
  }, [visible]);

  useEffect(() => {
    if (!showFrequent && !allFetched) fetchAll();
  }, [showFrequent]);

  const loadFrequent = async () => {
    try {
      const raw = await SecureStore.getItemAsync(FREQ_KEY);
      setFrequent(raw ? JSON.parse(raw) : []);
    } catch {
      setFrequent([]);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await PaymentService.GetUserBeneficiaries();
      setAll(data);
      setAllFetched(true);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: Beneficiary) => {
    try {
      const raw = await SecureStore.getItemAsync(FREQ_KEY);
      const list: Beneficiary[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(
        (b) =>
          b.accountNumber === item.accountNumber &&
          b.bankCode === item.bankCode,
      );
      if (idx >= 0) {
        list[idx].useCount += 1;
        list[idx].lastUsed = new Date().toISOString();
      } else {
        list.push({ ...item, useCount: 1, lastUsed: new Date().toISOString() });
      }
      const sorted = list
        .sort((a, b) => b.useCount - a.useCount)
        .slice(0, FREQ_LIMIT);
      await SecureStore.setItemAsync(FREQ_KEY, JSON.stringify(sorted));
    } catch {
      // Don't block selection if frequency tracking fails
    }
    onSelect(item);
  };

  const data = showFrequent ? frequent : all;
  const filtered = data.filter(
    (b) =>
      b.accountName.toLowerCase().includes(search.toLowerCase()) ||
      b.accountNumber.includes(search) ||
      b.bankName.toLowerCase().includes(search.toLowerCase()),
  );

  const bg = isDark ? "bg-[#0a0a0f]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const borderColor = isDark ? "border-white/10" : "border-gray-100";
  const inputBg = isDark
    ? "bg-white/10 border-white/20 text-white"
    : "bg-gray-100 border-gray-200 text-gray-900";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1 }} className={bg}>
        <View className="flex-1">
          {/* Header */}
          <View className={`p-5 border-b ${borderColor}`}>
            <Text
              className={`text-xl font-bold text-center mb-4 ${textPrimary}`}
            >
              Select Beneficiary
            </Text>

            <TextInput
              className={`p-4 rounded-xl border ${inputBg} mb-4`}
              placeholder="Search name, account or bank..."
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={search}
              onChangeText={setSearch}
            />

            <View className="flex-row items-center justify-between">
              <Text className={`text-base font-medium ${textSecondary}`}>
                {showFrequent ? "Frequent Beneficiaries" : "All Beneficiaries"}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className={`text-xs ${textSecondary}`}>Frequent</Text>
                <Switch
                  value={showFrequent}
                  onValueChange={setShowFrequent}
                  trackColor={{
                    false: isDark ? "#374151" : "#d1d5db",
                    true: "#10b981",
                  }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          {/* List */}
          {loading ? (
            <Loading
              accentColor=""
              loading={loading}
              isInitialLoad={false}
              isDark={isDark}
              screenName="Beneficiaries"
            />
          ) : fetchError ? (
            <View className="flex-1 items-center justify-center py-16 px-6 gap-3">
              <Text className={`text-lg ${textSecondary}`}>
                Failed To Load Beneficiaries
              </Text>
              <Button label="Retry" onPress={fetchAll} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => `${item.bankCode}-${item.accountNumber}`}
              renderItem={({ item }) => (
                <Pressable
                  className={`p-4 flex-row items-center border-b ${borderColor}`}
                  onPress={() => handleSelect(item)}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      isDark ? "bg-emerald-500/20" : "bg-emerald-100"
                    }`}
                  >
                    <Text
                      className={`font-bold text-base ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                    >
                      {item.accountName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${textPrimary}`}>
                      {item.accountName}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${textSecondary}`}>
                      {item.accountNumber} · {item.bankName}
                    </Text>
                  </View>
                  {showFrequent && item.useCount > 0 && (
                    <Text className={`text-xs ${textSecondary}`}>
                      {item.useCount}×
                    </Text>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-16 px-6">
                  <Text className={`text-lg ${textSecondary}`}>
                    {showFrequent
                      ? "No Frequent Beneficiaries Yet"
                      : "No Beneficiaries Found"}
                  </Text>
                </View>
              }
            />
          )}

          <Pressable
            className={`p-4 m-5 rounded-2xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-gray-100 border border-gray-200"
            }`}
            onPress={onClose}
          >
            <Text
              className={`text-center font-semibold ${isDark ? "text-white" : "text-gray-600"}`}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default BeneficiaryModal;
