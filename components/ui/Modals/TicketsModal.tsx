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

interface TicketsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TicketsModal: React.FC<TicketsModalProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedEvent, setSelectedEvent] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [email, setEmail] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const events = [
    {
      id: "1",
      name: "Afrobeat Festival 2024",
      date: "Dec 25, 2024",
      venue: "Eko Hotel",
      price: 15000,
      category: "Music",
    },
    {
      id: "2",
      name: "Tech Conference Lagos",
      date: "Jan 15, 2025",
      venue: "Landmark Centre",
      price: 25000,
      category: "Tech",
    },
    {
      id: "3",
      name: "Comedy Night Live",
      date: "Dec 31, 2024",
      venue: "Terra Kulture",
      price: 8000,
      category: "Comedy",
    },
    {
      id: "4",
      name: "Food & Wine Expo",
      date: "Jan 20, 2025",
      venue: "Muson Centre",
      price: 5000,
      category: "Food",
    },
    {
      id: "5",
      name: "Fashion Week Nigeria",
      date: "Feb 10, 2025",
      venue: "Federal Palace Hotel",
      price: 20000,
      category: "Fashion",
    },
  ];

  const selectedEventData = events.find((e) => e.id === selectedEvent);
  const totalPrice = selectedEventData
    ? selectedEventData.price * parseInt(quantity || "1")
    : 0;

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
              Event Tickets
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
            Select Event
          </Text>
          <View className="gap-3 mb-6">
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => setSelectedEvent(event.id)}
                className={`p-4 rounded-xl ${
                  selectedEvent === event.id
                    ? isDark
                      ? "bg-pink-600/20 border-2 border-pink-500"
                      : "bg-pink-50 border-2 border-pink-500"
                    : isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-50 border border-gray-200"
                }`}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {event.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                      <Text
                        className={`text-sm ml-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {event.date}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                      <Text
                        className={`text-sm ml-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {event.venue}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      ₦{event.price.toLocaleString()}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-full mt-1 ${isDark ? "bg-white/20" : "bg-gray-200"}`}
                    >
                      <Text
                        className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {event.category}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedEvent && (
            <>
              <Text
                className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Number of Tickets
              </Text>
              <View className="flex-row items-center gap-3 mb-6">
                <TouchableOpacity
                  onPress={() =>
                    setQuantity(
                      Math.max(1, parseInt(quantity || "1") - 1).toString(),
                    )
                  }
                  className={`w-12 h-12 items-center justify-center rounded-xl ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-100"}`}
                >
                  <Ionicons
                    name="remove"
                    size={24}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  className={`flex-1 px-4 py-3 rounded-xl text-center text-lg font-bold ${isDark ? "bg-white/10 text-white border border-white/20" : "bg-gray-50 text-gray-900 border border-gray-200"}`}
                />
                <TouchableOpacity
                  onPress={() =>
                    setQuantity((parseInt(quantity || "1") + 1).toString())
                  }
                  className={`w-12 h-12 items-center justify-center rounded-xl ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-100"}`}
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              <Text
                className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                keyboardType="email-address"
                autoCapitalize="none"
                className={`px-4 py-4 rounded-xl mb-6 ${isDark ? "bg-white/10 text-white border border-white/20" : "bg-gray-50 text-gray-900 border border-gray-200"}`}
              />

              <View
                className={`p-4 rounded-xl mb-6 ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-100 border border-gray-200"}`}
              >
                <View className="flex-row justify-between mb-2">
                  <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
                    Ticket Price
                  </Text>
                  <Text className={isDark ? "text-white" : "text-gray-900"}>
                    ₦{selectedEventData?.price.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
                    Quantity
                  </Text>
                  <Text className={isDark ? "text-white" : "text-gray-900"}>
                    {quantity}
                  </Text>
                </View>
                <View
                  className={`border-t pt-2 mt-2 ${isDark ? "border-white/20" : "border-gray-300"}`}
                >
                  <View className="flex-row justify-between">
                    <Text
                      className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Total
                    </Text>
                    <Text
                      className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      ₦{totalPrice.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={handlePurchase}
            disabled={!selectedEvent || !email}
            className={`py-4 rounded-xl mb-6 ${
              selectedEvent && email
                ? "bg-pink-600"
                : isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-bold ${selectedEvent && email ? "text-white" : isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Purchase Tickets
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <PaymentMethodModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={totalPrice}
          onPaymentMethodSelected={handlePaymentMethodSelected}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default TicketsModal;
