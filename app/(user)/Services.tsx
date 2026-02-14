import AirtimeModal from "@/components/ui/Modals/AirtimeModal";
import DataModal from "@/components/ui/Modals/DataModal";
import TicketsModal from "@/components/ui/Modals/TicketsModal";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Services = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [airtimeModalVisible, setAirtimeModalVisible] = useState(false);
  const [dataModalVisible, setDataModalVisible] = useState(false);
  const [ticketsModalVisible, setTicketsModalVisible] = useState(false);

  const services = [
    {
      id: "electricity",
      name: "Electricity Bills",
      description: "Pay for prepaid & postpaid",
      icon: "flash",
      color: isDark ? "#fbbf24" : "#f59e0b",
    },
    {
      id: "cable",
      name: "Cable TV",
      description: "DSTV, GOtv, Startimes",
      icon: "tv",
      color: isDark ? "#f472b6" : "#db2777",
    },
    {
      id: "betting",
      name: "Betting & Lottery",
      description: "Fund betting accounts",
      icon: "trophy",
      color: isDark ? "#fb923c" : "#ea580c",
    },
    {
      id: "education",
      name: "Education",
      description: "WAEC, JAMB, NECO pins",
      icon: "school",
      color: isDark ? "#34d399" : "#059669",
    },
    {
      id: "tickets",
      name: "Event Tickets",
      description: "Concerts, shows & events",
      icon: "ticket",
      color: isDark ? "#f472b6" : "#ec4899",
    },
  ];

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
    >
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Value Added Services"
          subtitle="Airtime, Data & more"
          onBack={() => router.back()}
        />

        <View className="">
          <Text
            className={`text-lg font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Popular Services
          </Text>
          <View className="flex-row justify-between gap-2">
            <Pressable
              onPress={() => setAirtimeModalVisible(true)}
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl shadow-lg ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200"
              }`}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <Ionicons
                name="phone-portrait"
                size={28}
                color={isDark ? "#a78bfa" : "#7c3aed"}
              />
              <Text
                className={`text-xs mt-2 font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Airtime
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDataModalVisible(true)}
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl shadow-lg ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200"
              }`}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <Ionicons
                name="wifi"
                size={28}
                color={isDark ? "#60a5fa" : "#2563eb"}
              />
              <Text
                className={`text-xs mt-2 font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Data
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl shadow-lg ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200"
              }`}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <Ionicons
                name="flash"
                size={28}
                color={isDark ? "#fbbf24" : "#f59e0b"}
              />
              <Text
                className={`text-xs mt-2 font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Electricity
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="px-2 py-4">
          <Text
            className={`text-lg font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Other Services
          </Text>

          {services.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => {
                if (service.id === "airtime") setAirtimeModalVisible(true);
                else if (service.id === "data") setDataModalVisible(true);
                else if (service.id === "tickets") setTicketsModalVisible(true);
              }}
              className={`px-6 py-5 rounded-2xl backdrop-blur-xl mb-3 ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
              }`}
              // activeOpacity={0.7}
            >
              <View className="flex-row gap-3 items-center">
                {service.icon === "school" ? (
                  <MaterialCommunityIcons
                    size={36}
                    name={service.icon as any}
                    color={service.color}
                  />
                ) : service.icon === "ticket" ? (
                  <Ionicons
                    size={36}
                    name="ticket-outline"
                    color={service.color}
                  />
                ) : (
                  <Ionicons
                    size={36}
                    name={service.icon as any}
                    color={service.color}
                  />
                )}
                <View className="flex-1">
                  <Text
                    className={`text-xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {service.name}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {service.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <AirtimeModal
        visible={airtimeModalVisible}
        onClose={() => setAirtimeModalVisible(false)}
      />
      <DataModal
        visible={dataModalVisible}
        onClose={() => setDataModalVisible(false)}
      />
      <TicketsModal
        visible={ticketsModalVisible}
        onClose={() => setTicketsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default Services;
