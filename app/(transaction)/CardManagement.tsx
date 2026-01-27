import NFCService from "@/components/services/NFCService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CardManagement() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const cards = [
    {
      id: "1",
      cardNumber: "**** 4532",
      holder: "John Doe",
      status: "active",
      balance: "$2,450.00",
    },
    {
      id: "2",
      cardNumber: "**** 8821",
      holder: "Jane Smith",
      status: "active",
      balance: "$1,820.50",
    },
    {
      id: "3",
      cardNumber: "**** 3341",
      holder: "Mike Johnson",
      status: "blocked",
      balance: "$0.00",
    },
    {
      id: "4",
      cardNumber: "**** 7654",
      holder: "Sarah Williams",
      status: "active",
      balance: "$3,200.75",
    },
  ];

  const handleRegisterCard = async () => {
    setIsRegistering(true);
    try {
      // const nfcService = new NFCService();

      // Check NFC availability
      const isSupported = await NFCService.isSupported();
      if (!isSupported) {
        Alert.alert("Error", "NFC is not supported on this device");
        return;
      }

      const isEnabled = await NFCService.isEnabled();
      if (!isEnabled) {
        Alert.alert("Error", "Please enable NFC in device settings");
        return;
      }

      Alert.alert(
        "Register Card",
        "Hold your NFC card near the device to register it",
      );

      // Read card info
      const cardInfo = await NFCService.readCard();
      // const cardInfo = await NFCService.readCardInfo(true);

      // Prompt for credentials
      Alert.prompt(
        "Card Authentication Key",
        "Enter the Card Authentication Key (CAK) in hex format:",
        async (cak) => {
          if (!cak || cak.length !== 64) {
            Alert.alert("Error", "CAK must be 64 hex characters");
            return;
          }

          Alert.prompt(
            "Card Encryption Key",
            "Enter the Card Encryption Key (CEK) in hex format:",
            async (cek) => {
              if (!cek || cek.length !== 64) {
                Alert.alert("Error", "CEK must be 64 hex characters");
                return;
              }

              Alert.prompt(
                "Account ID",
                "Enter the account ID for this card:",
                async (accountId) => {
                  if (!accountId) {
                    Alert.alert("Error", "Account ID is required");
                    return;
                  }

                  try {
                    // Store credentials
                    // await Keychain.setGenericPassword(
                    //   cardInfo.cardId,
                    //   JSON.stringify({ cak, cek, accountId }),
                    //   { service: `nfc-card-${cardInfo.cardId}` },
                    // );
                    // Alert.alert(
                    //   "Success",
                    //   `Card registered successfully!\nCard ID: ${cardInfo.cardId}\nBalance: ₦${(cardInfo.balance / 100).toFixed(2)}`,
                    // );
                  } catch (error) {
                    Alert.alert(
                      "Error",
                      "Failed to register card: " +
                        (error instanceof Error
                          ? error.message
                          : "Unknown error"),
                    );
                  }
                },
                "plain-text",
              );
            },
            "plain-text",
          );
        },
        "plain-text",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to read card: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAction = (action: string, cardNumber: string) => {
    Alert.alert(
      `${action} Card`,
      `Are you sure you want to ${action.toLowerCase()} card ${cardNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            Alert.alert(
              "Success",
              `Card ${cardNumber} ${action.toLowerCase()}ed`,
            ),
        },
      ],
    );
  };

  const filteredCards = cards.filter(
    (card) =>
      card.holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.cardNumber.includes(searchQuery),
  );

  return (
    <SafeAreaView
      className={`flex-1 px-6 pb-8 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Card Management"
          subtitle="Activate, block, or replace cards"
          onBack={() => router.back()}
        />

        <TouchableOpacity
          onPress={handleRegisterCard}
          disabled={isRegistering}
          className={`mb-6 p-4 rounded-2xl flex-row items-center justify-center ${
            isDark
              ? "bg-blue-500/20 border border-blue-500/30"
              : "bg-blue-500 shadow-sm"
          }`}
        >
          {isRegistering ? (
            <ActivityIndicator color={isDark ? "#60a5fa" : "#ffffff"} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="nfc"
                size={24}
                color={isDark ? "#60a5fa" : "#ffffff"}
              />
              <Text
                className={`ml-2 text-base font-semibold ${isDark ? "text-blue-400" : "text-white"}`}
              >
                Register New Card
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View
          className={`mb-6 p-4 rounded-2xl ${isDark ? "bg-white/10" : "bg-white"}`}
        >
          <TextInput
            placeholder="Search by card number or holder name"
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`text-base ${isDark ? "text-white" : "text-gray-900"}`}
          />
        </View>

        <View className="space-y-4">
          {filteredCards.map((card) => (
            <View
              key={card.id}
              className={`p-5 rounded-2xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white border border-gray-200/50 shadow-sm"
              }`}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                  <Text
                    className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {card.holder}
                  </Text>
                  <Text
                    className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {card.cardNumber}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    card.status === "active"
                      ? "bg-green-500/20"
                      : "bg-red-500/20"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      card.status === "active"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {card.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text
                className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {card.balance}
              </Text>

              <View className="flex-row justify-between gap-2">
                {card.status === "active" ? (
                  <>
                    <TouchableOpacity
                      onPress={() => handleAction("Block", card.cardNumber)}
                      className="flex-1 py-3 rounded-xl bg-red-500/20 items-center"
                    >
                      <Text className="text-red-400 font-semibold">Block</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAction("Replace", card.cardNumber)}
                      className="flex-1 py-3 rounded-xl bg-blue-500/20 items-center"
                    >
                      <Text className="text-blue-400 font-semibold">
                        Replace
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleAction("Activate", card.cardNumber)}
                    className="flex-1 py-3 rounded-xl bg-green-500/20 items-center"
                  >
                    <Text className="text-green-400 font-semibold">
                      Activate
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
