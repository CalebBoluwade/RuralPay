import { useLanguage } from "@/components/context/LanguageContext";
import ScreenHeader from "@/components/ui/ScreenHeader";
import NFCService from "@/lib/services/NFCService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function onSelectMethod(id: string): void {
  switch (id) {
    case "qr":
      router.push("/(transaction)/QRPayments");
      break;
    case "manual":
      router.push("/(transaction)/BankTransfers");
      break;
    case "bluetooth":
      router.push("/(transaction)/BluetoothPayments");
      break;
    default:
      break;
  }
}

export default function Payments() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();
  const [isNFCSupported, setIsNFCSupported] = useState<boolean>(false);

  useEffect(() => {
    const checkNFC = async () => {
      const supported = await NFCService.isSupported();
      // const isBLEupported = await BLEService.();

      setIsNFCSupported(supported);
    };

    checkNFC();
  }, []);

  const methods = [
    {
      id: "NFC",
      name: t("payments.nfc"),
      description: "NFC Contactless",
      icon: "radio",
      available: true,
      // available: isNFCSupported,
    },
    {
      id: "qr",
      name: "QR Code",
      description: "Scan or display",
      icon: "qr-code",
      available: true,
    },
    {
      id: "bluetooth",
      name: "Bluetooth",
      description: "Proximity Payment",
      icon: "bluetooth",
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
        subtitle="Enter payment details to get started"
        onBack={() => router.back()}
      />
      <View className="flex-1 flex gap-3 justify-center px-6">
        <View className="mb-3">
          <Text
            className={`text-lg font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {t("home.quickLinks")}
          </Text>
          <View className="flex-row justify-between gap-2">
            <Pressable
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50 shadow-lg"
              }`}
              onPress={() => router.push("/(transaction)/BankTransfers")}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <Ionicons
                name="card-outline"
                size={28}
                color={isDark ? "#a78bfa" : "#7c3aed"}
              />
              <Text
                className={`text-xs mt-2 font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {t("payments.bankTransfer")}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50 shadow-lg"
              }`}
              onPress={() =>
                router.push("/(common)/Transaction/TransactionHistory")
              }
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <MaterialCommunityIcons
                size={28}
                name="clock"
                color={isDark ? "#60a5fa" : "#2563eb"}
              />
              <Text
                className={`text-xs mt-2 font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {t("payments.history")}
              </Text>
            </Pressable>

            {/* <TouchableOpacity
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50 shadow-lg"
              }`}
              onPress={() => router.push("/(transaction)/MerchantServices")}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <MaterialCommunityIcons
                size={28}
                name="store"
                color={isDark ? "#f472b6" : "#db2777"}
              />
              <Text
                className={`text-xs mt-2 font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {t("payments.merchant")}
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>

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
        {/* 
        <TouchableOpacity
          className={`px-6 py-5 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
          onPress={() => router.push("/(transaction)/BankTransfers")}
        >
          <View className="flex-row gap-3 items-center">
            <MaterialCommunityIcons
              size={36}
              name="bank-circle"
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
            <View className="flex-1">
              <Text
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Bank Transfers
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Transfer Money to Other Accounts
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-6 py-5 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
          onPress={() => router.push("/(transaction)/USSDPay")}
        >
          <View className="flex-row gap-3 items-center">
            <Feather
              size={36}
              name="smartphone"
              color={isDark ? "#fb923c" : "#ea580c"}
            />
            <View className="flex-1">
              <Text
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                USSD Payments
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Dynamic Generated Payment codes
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-6 py-5 rounded-2xl backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
          onPress={() => router.push("/(transaction)/NFCPayments")}
        >
          <View className="flex-row gap-3 items-center">
            <MaterialCommunityIcons
              size={36}
              name="nfc"
              color={isDark ? "#34d399" : "#059669"}
            />
            <View className="flex-1">
              <Text
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                NFC Payments
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Tap to Pay with your card at merchants
              </Text>
            </View>
          </View>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}
