import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PaymentMethodModal from "./PaymentMethodModal";

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

  const handlePaymentMethodSelected = (method: string) => {
    // Handle payment with selected method
    onClose();
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
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Buy Data Bundle
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            >
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#fff" : "#6B7280"}
              />
            </TouchableOpacity>
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
              <TouchableOpacity
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
                  className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {network.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Phone Number
          </Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="08012345678"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            keyboardType="phone-pad"
            className={`px-4 py-4 rounded-xl mb-6 ${isDark ? "bg-white/10 text-white border border-white/20" : "bg-gray-50 text-gray-900 border border-gray-200"}`}
          />

          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Select Data Plan
          </Text>
          <View className="gap-3 mb-8">
            {dataPlans.map((plan) => (
              <TouchableOpacity
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
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
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
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    ₦{plan.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
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
              className={`text-center font-bold ${phoneNumber && selectedNetwork && selectedPlan ? "text-white" : isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Purchase Data
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <PaymentMethodModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={dataPlans.find(p => p.id === selectedPlan)?.price || 0}
          onPaymentMethodSelected={handlePaymentMethodSelected}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default DataModal;
