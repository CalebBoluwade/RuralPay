import TicketsModal from "@/src/components/ui/Modals/TicketsModal";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { router } from "expo-router";
import {
  ChevronRight,
  GraduationCap,
  Smartphone,
  Ticket,
  Trophy,
  Tv,
  Wifi,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK_ACTIONS = [
  { id: "airtime", label: "Airtime", icon: Smartphone },
  { id: "data", label: "Data", icon: Wifi },
  { id: "electricity", label: "Electricity", icon: Zap },
  { id: "cable", label: "Cable TV", icon: Tv },
];

const OTHER_SERVICES = [
  {
    id: "betting",
    name: "Betting & Lottery",
    description: "Fund betting accounts",
    icon: Trophy,
  },
  {
    id: "education",
    name: "Education",
    description: "WAEC, JAMB, NECO pins",
    icon: GraduationCap,
  },
  {
    id: "tickets",
    name: "Event Tickets",
    description: "Concerts, shows & events",
    icon: Ticket,
  },
];

const ValueAddedServices = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [ticketsModalVisible, setTicketsModalVisible] = useState(false);

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const accentColor = isDark ? "#a3e635" : "#65a30d";

  const handleQuickAction = (id: string) => {
    if (id === "airtime") router.push("/airtime");
    else if (id === "data") router.push("/dataPurchase");
  };

  const handleServicePress = (id: string) => {
    if (id === "tickets") setTicketsModalVisible(true);
  };

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Value Added Services"
          subtitle="Airtime, Data & more"
          onBack={() => router.back()}
        />

        <View className="px-5 mt-4">
          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-8">
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                className="flex-1 items-center"
                onPress={() => handleQuickAction(action.id)}
              >
                <View
                  className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${cardClass}`}
                >
                  <action.icon
                    size={25}
                    strokeWidth={1.5}
                    color={accentColor}
                  />
                </View>
                <Text
                  className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Other Services */}
          <Text
            className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            More Services
          </Text>
          <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
            {OTHER_SERVICES.map((service, index) => (
              <Pressable
                key={service.id}
                onPress={() => handleServicePress(service.id)}
                className={`flex-row items-center px-4 py-5 gap-4 ${
                  index < OTHER_SERVICES.length - 1
                    ? isDark
                      ? "border-b border-white/10"
                      : "border-b border-slate-100"
                    : ""
                }`}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
                >
                  <service.icon size={26} color={accentColor} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {service.name}
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {service.description}
                  </Text>
                </View>
                <ChevronRight
                  size={18}
                  color={isDark ? "#64748b" : "#94a3b8"}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      <TicketsModal
        visible={ticketsModalVisible}
        onClose={() => setTicketsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ValueAddedServices;
