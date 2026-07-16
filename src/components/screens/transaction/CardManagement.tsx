import Card from "@/src/components/ui/Card";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import NFCService from "@/src/lib/services/NFCService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
    useColorScheme,
} from "react-native";

export default function CardManagement() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isRegistering, setIsRegistering] = useState(false);
  const [cards, setCards] = useState([
    {
      id: "1",
      cardNumber: "**** 4532",
      holder: "John Doe",
      status: "active",
      balance: "N2,500,450.00",
    },
    {
      id: "2",
      cardNumber: "**** 8821",
      holder: "Jane Smith",
      status: "active",
      balance: "N1,820.50",
    },
    {
      id: "3",
      cardNumber: "**** 3341",
      holder: "Mike Johnson",
      status: "blocked",
      balance: "N0.00",
    },
  ]);

  const handleRegisterCard = async () => {
    setIsRegistering(true);
    try {
      // Check NFC availability
      const isSupported = await NFCService.isSupported();
      if (!isSupported) {
        Alert.alert("Error", "NFC is not Supported on this Device");
        return;
      }

      const isEnabled = await NFCService.isEnabled();
      if (!isEnabled) {
        Alert.alert("Error", "Please Enable NFC in Device Settings");
        return;
      }

      Alert.alert(
        "Register Card",
        "Hold your NFC card near the device to register it",
      );

      // Read card info
      const cardInfo = await NFCService.readCard();

      if (__DEV__) console.log(cardInfo);

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

  const handleBlockCard = (id: string) => {
    Alert.alert("Block Card", "Are you sure you want to block this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () =>
          setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "blocked" } : c)),
          ),
      },
    ]);
  };

  const handleActivateCard = (id: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "active" } : c)),
    );
  };

  return (
    <View className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}>
      <ScrollView
        className="flex-1 px-6 pt-24"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Card Management"
          subtitle={`${cards.length} Card${cards.length > 1 ? "s" : ""} Registered`}
          onBack={() => router.back()}
        />

        <Pressable
          className={`px-6 py-5 rounded-2xl backdrop-blur-xl mb-6 ${
            isDark
              ? "bg-lime-500/20 border-2 border-lime-500"
              : "bg-lime-50 border-2 border-lime-500"
          }`}
          onPress={handleRegisterCard}
          disabled={isRegistering}
        >
          <View className="flex-row items-center justify-center gap-3">
            {isRegistering ? (
              <ActivityIndicator color="#84cc16" />
            ) : (
              <>
                <MaterialCommunityIcons name="nfc" size={28} color="#84cc16" />
                <Text
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Register New Card
                </Text>
              </>
            )}
          </View>
        </Pressable>

        <Text
          className={`text-lg font-bold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Your Cards
        </Text>

        {cards.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons
              name="card-outline"
              size={64}
              color={isDark ? "#84cc16" : "#65a30d"}
            />
            <Text
              className={`text-base mt-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No Cards Registered Yet
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <Card
              key={card.id}
              darkClass={
                card.status === "active"
                  ? "bg-green-500/20 border-2 border-green-500"
                  : "bg-white/10 border border-white/20"
              }
              lightClass={
                card.status === "active"
                  ? "bg-green-50 border-2 border-green-500"
                  : "bg-gray-50 border border-gray-200"
              }
              className="px-6 py-5 backdrop-blur-xl mb-3"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <MaterialCommunityIcons
                      name="credit-card"
                      size={24}
                      color={isDark ? "#ffffff" : "#111827"}
                    />
                    <Text
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {card.cardNumber}
                    </Text>
                    {card.status === "active" && (
                      <View
                        className={`px-2 py-1 rounded-full ${
                          isDark ? "bg-green-500/30" : "bg-green-200"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isDark ? "text-green-300" : "text-green-700"
                          }`}
                        >
                          Active
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className={`text-base font-semibold ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {card.holder}
                  </Text>
                  <Text
                    className={`text-xl font-bold mt-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {card.balance}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                {card.status === "active" ? (
                  <Pressable
                    className={`flex-1 py-3 rounded-xl ${
                      isDark
                        ? "bg-red-500/20 border border-red-500"
                        : "bg-red-50 border border-red-500"
                    }`}
                    onPress={() => handleBlockCard(card.id)}
                  >
                    <Text
                      className={`text-center text-base font-bold ${
                        isDark ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      Block Card
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    className={`flex-1 py-3 rounded-xl ${
                      isDark
                        ? "bg-lime-500/20 border border-lime-500"
                        : "bg-lime-50 border border-lime-500"
                    }`}
                    onPress={() => handleActivateCard(card.id)}
                  >
                    <Text
                      className={`text-center text-base font-bold ${
                        isDark ? "text-lime-300" : "text-lime-700"
                      }`}
                    >
                      Activate Card
                    </Text>
                  </Pressable>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
