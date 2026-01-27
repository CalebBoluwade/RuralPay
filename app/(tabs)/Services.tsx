import ScreenHeader from "@/components/ui/ScreenHeader";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View, useColorScheme } from "react-native";

const Services = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const services = [
    {
      id: "airtime",
      name: "Airtime Recharge",
      description: "Buy airtime for all networks",
      icon: "phone-portrait",
      color: isDark ? "#a78bfa" : "#7c3aed",
    },
    {
      id: "data",
      name: "Data Bundles",
      description: "Purchase data plans",
      icon: "wifi",
      color: isDark ? "#60a5fa" : "#2563eb",
    },
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
  ];

  return (
    <View className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}>
      <ScrollView className="flex-1 px-6 pt-24" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Value Added Services"
          subtitle="Airtime, data, bills & more"
          onBack={() => router.back()}
        />

        <View className="mb-6">
          <Text
            className={`text-lg font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Popular Services
          </Text>
          <View className="flex-row justify-between gap-2">
            <TouchableOpacity
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
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
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
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
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
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
            </TouchableOpacity>
          </View>
        </View>

        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            className={`px-6 py-5 rounded-2xl backdrop-blur-xl mb-3 ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-gray-50 border border-gray-200 shadow-sm"
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row gap-3 items-center">
              {service.icon === "school" ? (
                <MaterialCommunityIcons
                  size={36}
                  name={service.icon as any}
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
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Services;
