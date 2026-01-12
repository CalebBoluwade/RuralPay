import ScreenHeader from "@/components/ui/ScreenHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MerchantServices() {
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
      route: "/(transaction)/ProvisionCard",
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
    <SafeAreaView className="flex-1 px-6 pt-4 pb-8">
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
              className="border border-white/20 p-6 rounded-3xl"
              style={{ marginBottom: 16 }}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-16 h-16 rounded-2xl items-center justify-center mr-4 shadow-lg`}
                >
                  <MaterialCommunityIcons
                    size={28}
                    name={service.icon as any}
                    color="#fff"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold  mb-1">
                    {service.title}
                  </Text>
                  <Text className="text-base leading-5">
                    {service.description}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  size={24}
                  name="chevron-right"
                  color="rgba(255,255,255,0.5)"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-8 backdrop-blur border border-white/10 p-6 rounded-3xl">
          <Text className="text-lg font-bold mb-2">📊 Quick Stats</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-400">247</Text>
              <Text className="text-sm">Active Cards</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-400">$12.4K</Text>
              <Text className="text-sm">Today&apos;s Volume</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-400">89</Text>
              <Text className="text-sm">Transactions</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
