import { useLanguage } from "@/components/context/LanguageContext";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function onSelectMethod(id: string): void {
  switch (id) {
    case "qr":
      router.push("/(transaction)/QRPayments");
      break;
    case "manual":
      router.push("/(common)/Transaction/BankTransfers");
      break;
    default:
      break;
  }
}

export default function Payments() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  const methods = [
    {
      id: "qr",
      name: "QR Code",
      description: "Scan or display",
      icon: "qr-code",
      available: true,
    },
    {
      id: "manual",
      name: t("payments.bankTransfer"),
      description: t("transactions.transferMoneyDescription"),
      icon: "keypad",
      available: true,
    },
  ];

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-[#f5f5fa]"}
    >
      <ScreenHeader
        title={t("payments.title")}
        subtitle="Get Started"
        goBack={false}
      />
      <View className="flex-1 flex gap-3 px-6">
        {methods.map((method) => (
          <Pressable
            key={method.id}
            className={`px-6 py-5 rounded-2xl backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-gray-50 border border-gray-200 shadow-sm"
            } ${method.available ? "" : "opacity-40"}`}
            onPress={() => method.available && onSelectMethod(method.id)}
            disabled={!method.available}
          >
            <View className="flex-row gap-4 items-center">
              <Ionicons
                size={32}
                name={method.icon as any}
                color={isDark ? "#84cc16" : "#65a30d"}
              />
              <View className="flex-1">
                <Text
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  } ${method.available ? "" : "opacity-50"}`}
                >
                  {method.name}
                </Text>
                <Text
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } ${method.available ? "" : "opacity-50"}`}
                >
                  {method.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
