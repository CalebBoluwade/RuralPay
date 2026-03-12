import { ChevronRight, Search, Users, X } from "lucide-react-native";
import * as Contacts from "expo-contacts";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PaymentMethodModal from "./Transaction/PaymentMethodModal";

interface PhoneNumber {
  label: string;
  number: string;
}

interface DataModalProps {
  visible: boolean;
  onClose: () => void;
}

const DataModal: React.FC<DataModalProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contactNumbers, setContactNumbers] = useState<PhoneNumber[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<PhoneNumber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const networks = [
    { id: "mtn", name: "MTN", color: "#FFCC00" },
    { id: "glo", name: "Glo", color: "#00A859" },
    { id: "airtel", name: "Airtel", color: "#ED1C24" },
    { id: "9mobile", name: "9mobile", color: "#00A65E" },
  ];

  const dataPlans = [
    { id: "1", size: "1GB", validity: "1 Day", price: 300 },
    { id: "2", size: "2GB", validity: "7 Days", price: 500 },
    { id: "3", size: "5GB", validity: "30 Days", price: 1500 },
    { id: "4", size: "10GB", validity: "30 Days", price: 2500 },
    { id: "5", size: "20GB", validity: "30 Days", price: 4500 },
    { id: "6", size: "50GB", validity: "30 Days", price: 10000 },
  ];

  const handlePurchase = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelected = (data: {
    method: string;
    accountNumber?: string;
    accountName?: string;
  }) => {
    onClose();
  };

  const getContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Contact access is needed to select phone numbers.",
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        const numbers: PhoneNumber[] = [];
        data.forEach((contact) => {
          if (contact.phoneNumbers) {
            contact.phoneNumbers.forEach((phone) => {
              numbers.push({
                label: contact.name || phone.label || "Phone",
                number: phone.number || "",
              });
            });
          }
        });
        setContactNumbers(numbers);
        setFilteredContacts(numbers);
        setIsContactModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch contacts. Please try again.");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSelectNumber = (num: string) => {
    const cleanNum = num.replace(/[^0-9+]/g, "");
    setPhoneNumber(cleanNum);
    setIsContactModalVisible(false);
    setSearchQuery("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredContacts(contactNumbers);
      return;
    }
    
    const filtered = contactNumbers.filter(contact => 
      contact.number.toLowerCase().includes(query.toLowerCase()) ||
      contact.label.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
      >
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-2xl font-brand ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Buy Data Bundle
            </Text>
            <Pressable
              onPress={onClose}
              className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            >
              <X size={24} color={isDark ? "#fff" : "#6B7280"} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Select Network
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {networks.map((network) => (
              <Pressable
                key={network.id}
                onPress={() => setSelectedNetwork(network.id)}
                className={`flex-1 min-w-[45%] py-4 rounded-xl items-center ${
                  selectedNetwork === network.id
                    ? "border-2"
                    : isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-50 border border-gray-200"
                }`}
                style={
                  selectedNetwork === network.id
                    ? { borderColor: network.color }
                    : {}
                }
              >
                <Text
                  className={`font-brand ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {network.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Phone Number
          </Text>
          <View className="flex-row gap-3 items-center mb-6">
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="08012345678"
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              keyboardType="phone-pad"
              className={`flex-1 px-4 py-4 rounded-xl ${isDark ? "bg-white/10 text-white border border-white/20" : "bg-gray-50 text-gray-900 border border-gray-200"}`}
            />
            <Pressable
              className={`w-12 h-12 rounded-xl items-center justify-center ${
                isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"
              }`}
              onPress={getContacts}
              disabled={isLoadingContacts}
            >
              {isLoadingContacts ? (
                <ActivityIndicator size="small" color={isDark ? "#00A859" : "#65a30d"} />
              ) : (
                <Users size={20} color={isDark ? "#00A859" : "#65a30d"} />
              )}
            </Pressable>
          </View>

          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Select Data Plan
          </Text>
          <View className="gap-3 mb-8">
            {dataPlans.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                className={`p-4 rounded-xl ${
                  selectedPlan === plan.id
                    ? isDark
                      ? "bg-blue-600/20 border-2 border-blue-500"
                      : "bg-blue-50 border-2 border-blue-500"
                    : isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-50 border border-gray-200"
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text
                      className={`text-lg font-brand ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {plan.size}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Valid for {plan.validity}
                    </Text>
                  </View>
                  <Text
                    className={`text-xl font-brand ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    ₦{plan.price}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handlePurchase}
            disabled={!phoneNumber || !selectedNetwork || !selectedPlan}
            className={`py-4 rounded-xl mb-6 ${
              phoneNumber && selectedNetwork && selectedPlan
                ? "bg-blue-600"
                : isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-brand ${phoneNumber && selectedNetwork && selectedPlan ? "text-white" : isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Purchase Data
            </Text>
          </Pressable>
        </ScrollView>

        <PaymentMethodModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={dataPlans.find((p) => p.id === selectedPlan)?.price || 0}
          onPaymentMethodSelected={handlePaymentMethodSelected}
        />

        {/* Contacts Modal */}
        <Modal visible={isContactModalVisible} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className={`${isDark ? "bg-slate-900" : "bg-white"} rounded-t-3xl pb-8`}>
              <View className="flex-row justify-between items-center p-6 pb-4">
                <Text className={`text-xl font-brand ${isDark ? "text-white" : "text-slate-900"}`}>
                  Select Contact
                </Text>
                <Pressable
                  onPress={() => {
                    setIsContactModalVisible(false);
                    setSearchQuery("");
                  }}
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isDark ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  <X size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                </Pressable>
              </View>

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

              <FlatList
                data={filteredContacts}
                keyExtractor={(item, index) => index.toString()}
                className="max-h-80"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectNumber(item.number)}
                    className={`mx-6 py-4 border-b ${
                      isDark ? "border-slate-800" : "border-slate-100"
                    } flex-row justify-between items-center active:opacity-70`}
                  >
                    <View className="flex-1">
                      <Text className={`text-base font-medium ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}>
                        {item.number}
                      </Text>
                      <Text className={`text-sm mt-1 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}>
                        {item.label}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={isDark ? "#64748b" : "#94a3b8"} />
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View className="items-center py-16">
                    {searchQuery
                      ? <Search size={48} color={isDark ? "#64748b" : "#94a3b8"} />
                      : <Users size={48} color={isDark ? "#64748b" : "#94a3b8"} />}
                    <Text className={`text-base mt-3 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}>
                      {searchQuery ? "No matching contacts" : "No contacts found"}
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

export default DataModal;
