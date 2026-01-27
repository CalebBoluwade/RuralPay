import ScreenHeader from "@/components/ui/ScreenHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MerchantServices() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const services = [
    {
      id: "provision",
      title: "Card Provision",
      description: "Issue new NFC cards to customers",
      icon: "credit-card-plus",
      route: "/(transaction)/ProvisionCard",
    },
    {
      id: "management",
      title: "Card Management",
      description: "Activate, block, or replace existing cards",
      icon: "credit-card-settings",
      route: "/(transaction)/CardManagement",
    },
    {
      id: "analytics",
      title: "Transaction Analytics",
      description: "View detailed merchant transaction reports",
      icon: "chart-line",
      route: "/(transaction)/ProvisionCard",
    },
    {
      id: "customers",
      title: "Customer Management",
      description: "Manage customer accounts and spending limits",
      icon: "account-group",
      route: null,
    },
  ];

  return (
    <SafeAreaView
      className={`flex-1 px-6 --pt-4 pb-8 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Merchant Hub"
          subtitle="Complete business card management suite"
          onBack={() => router.back()}
        />

        <View className="space-y-4">
          {services.map((service, index) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => service.route && router.push(service.route as any)}
              className={`p-6 rounded-2xl backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50 shadow-sm"
              }`}
              style={{ marginBottom: 16 }}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-16 h-16 rounded-2xl items-center justify-center mr-4 ${
                    isDark ? "bg-white/10" : "bg-gray-100"
                  }`}
                >
                  <MaterialCommunityIcons
                    size={28}
                    name={service.icon as any}
                    color={isDark ? "#f472b6" : "#db2777"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {service.title}
                  </Text>
                  <Text
                    className={`text-base leading-5 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {service.description}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  size={24}
                  name="chevron-right"
                  color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View
          className={`mt-8 p-6 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <Text
            className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            📊 Quick Stats
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-400">247</Text>
              <Text
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Active Cards
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-400">$12.4K</Text>
              <Text
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Today&apos;s Volume
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-lime-400">89</Text>
              <Text
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Transactions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
