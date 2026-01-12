import ScreenHeader from "@/components/ui/ScreenHeader";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

export default function Payments() {
  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
      }}
      className="flex-1"
    >
      <View className="flex-1 flex gap-3 bg-black/40 justify-center px-6 space-y-12">
      <ScreenHeader
        title="Payment Services"
        subtitle="Enter payment details to get started"
        onBack={() => router.back()}
      />
        <TouchableOpacity
          className="bg-white/20 px-6 py-4 rounded-2xl border border-white/30 active:bg-white/30"
          onPress={() => router.push("/(transaction)/BankTransfers")}
        >
          <View className="flex-row gap-2 items-center mb-4">
            <MaterialCommunityIcons size={32} name="bank-circle" color="#fff" />

            <View>
              <Text className="text-2xl font-bold text-white">
                Bank Transfers
              </Text>

              <Text className="text-lg text-white/80 leading-6">
                Transfer Money to Other Accounts
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/20 px-6 py-4 rounded-2xl border border-white/30 active:bg-white/30"
          onPress={() => router.push("/(transaction)/USSDPay")}
        >
          <View className="flex-row gap-2 items-center mb-4">
            <Feather size={32} name="smartphone" color="#fff" />

            <View>
              <Text className="text-2xl font-bold text-white">
                USSD Payments
              </Text>

              <Text className="text-lg text-white/80 leading-6">
                Dynamic Generated Payment codes
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/20 px-6 py-4 rounded-2xl border border-white/30 active:bg-white/30"
          onPress={() => router.push("/(transaction)/NFCPayments")}
        >
          <View className="flex-row gap-2 items-center mb-4">
            <MaterialCommunityIcons size={32} name="nfc" color="#fff" />

            <View>
              <Text className="text-2xl font-bold text-white">
                NFC Payments
              </Text>

              <Text className="text-lg text-white/80 leading-6">
                Tap to Pay with your card at merchants
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/20 px-6 py-4 rounded-2xl border border-white/30 active:bg-white/30"
          onPress={() => router.push("/(transaction)/TransactionHistory")}
        >
          <View className="flex-row gap-2 items-center mb-4">
            <MaterialCommunityIcons size={32} name="clock" color="#fff" />

            <View>
              <Text className="text-2xl font-bold text-white">
                Transaction History
              </Text>

              <Text className="text-lg text-white/80 leading-6">
                Recent History
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/20 px-6 py-4 rounded-2xl border border-white/30 active:bg-white/30"
          onPress={() => router.push("/(transaction)/MerchantServices")}
        >
          <View className="flex-row gap-2 items-center mb-4">
            <MaterialCommunityIcons size={32} name="store" color="#fff" />

            <View>
              <Text className="text-2xl font-bold text-white">
                Merchant Services
              </Text>

              <Text className="text-lg text-white/80 leading-6">
                Card provision and management
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
