import AppLogger, { LogLevel } from "@/lib/services/AppLogger";
import PaymentService from "@/lib/services/PaymentService";
import * as Contacts from "expo-contacts";
import { router } from "expo-router";
import { ChevronLeft, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AmountInput from "../../../components/ui/Input/AmountInput";
import ContactsModal from "../../../components/ui/Modals/ContactsModal";
import PaymentMethodModal from "../../../components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "../../../components/ui/Modals/Transaction/TransactionPinModal";
import {
  AirtelLogo,
  GloLogo,
  MTNLogo,
  NineMobileLogo,
} from "../../../components/ui/NetworkLogos";

interface PhoneNumber {
  label: string;
  number: string;
  name: string;
  imageUri?: string;
}

const networks = [
  { id: "mtn", name: "MTN", color: "#FFCC00", Logo: MTNLogo },
  { id: "glo", name: "Glo", color: "#00A859", Logo: GloLogo },
  { id: "airtel", name: "Airtel", color: "#ED1C24", Logo: AirtelLogo },
  { id: "9mobile", name: "9mobile", color: "#00A65E", Logo: NineMobileLogo },
];

const AirtimePurchase = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
    appliedVoucher?: Voucher;
    finalAmount?: number;
  } | null>(null);
  const [transactionError, setTransactionError] = useState("");
  const [contactNumbers, setContactNumbers] = useState<PhoneNumber[]>([]);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const handlePurchase = () => setShowPaymentModal(true);

  const handlePaymentMethodSelected = (data: {
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
    appliedVoucher?: Voucher;
    finalAmount?: number;
  }) => {
    setShowPaymentModal(false);
    setPendingPaymentData(data);
    setShowPinModal(true);
  };

  const initiateAirtimeTransaction = async (
    twoFACode: string,
  ): Promise<boolean> => {
    if (!pendingPaymentData) return false;
    try {
      const payload: AirtimeDataPayload = {
        transactionID: PaymentService.generateTransactionId("AIRTIME_DATA"),
        paymentMode: "AIRTIME_DATA",
        service: "AIRTIME",
        amount: Number(amount),
        beneficiaryPhoneNumber: phoneNumber,
        network: selectedNetwork.toUpperCase(),
        narration: `Airtime Purchase for ${phoneNumber}`,
        debitAccount: pendingPaymentData.accountNumber!,
        voucher: pendingPaymentData.appliedVoucher,
        OneTimeCode: twoFACode,
      };
      const result = await PaymentService.MakeAirtimePurchase(payload);
      if (!result.success)
        setTransactionError(result.errorMessage ?? "Transaction Failed");
      return result.success;
    } catch (e: any) {
      setTransactionError(e?.message ?? "Transaction Failed");
      return false;
    }
  };

  const getContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Contact access is needed to select phone numbers.",
        );
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Name,
          Contacts.Fields.Image,
        ],
      });
      if (data.length > 0) {
        const numbers: PhoneNumber[] = [];
        data.forEach((contact) => {
          contact.phoneNumbers?.forEach((phone) => {
            numbers.push({
              name: contact.name || "Unknown",
              label: phone.label || "Phone",
              number: phone.number || "",
              imageUri: contact.imageAvailable ? contact.image?.uri : undefined,
            });
          });
        });
        setContactNumbers(numbers);
        setIsContactModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch contacts. Please try again.");
      AppLogger.logError(
        error as Error,
        { screen: "Airtime", action: "Fetching Contacts" },
        LogLevel.ERROR,
      );
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const canPurchase = !!phoneNumber && !!amount && !!selectedNetwork;

  return (
    <>
      <SafeAreaView
        className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
      >
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            >
              <ChevronLeft size={24} color={isDark ? "#fff" : "#6B7280"} />
            </Pressable>
            <Text
              className={`text-2xl font-brand ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Buy Airtime
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Select Network
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {networks.map((network) => (
              <Pressable
                key={network.id}
                onPress={() => setSelectedNetwork(network.id)}
                className={`flex-1 min-w-[45%] py-4 rounded-xl items-center gap-2 ${
                  selectedNetwork === network.id
                    ? "border-2"
                    : isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-50 border border-gray-200"
                }`}
                style={
                  selectedNetwork === network.id
                    ? { borderColor: network.color }
                    : {}
                }
              >
                <network.Logo size={36} />
                <Text
                  className={`font-brand ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {network.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Phone Number
          </Text>
          <View className="flex-row gap-3 items-center mb-6">
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="08012345678"
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              keyboardType="phone-pad"
              className={`flex-1 px-4 py-4 rounded-xl ${isDark ? "bg-white/10 text-white border border-white/20" : "bg-gray-50 text-gray-900 border border-gray-200"}`}
            />
            <Pressable
              className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
              onPress={getContacts}
              disabled={isLoadingContacts}
            >
              {isLoadingContacts ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#FFCC00" : "#65a30d"}
                />
              ) : (
                <Users size={20} color={isDark ? "#FFCC00" : "#65a30d"} />
              )}
            </Pressable>
          </View>

          <AmountInput onAmountChange={(amt) => setAmount(amt.toString())} />

          <Pressable
            onPress={handlePurchase}
            disabled={!canPurchase}
            className={`rounded-2xl py-4 shadow-lg mb-2 ${canPurchase ? "bg-lime-400" : isDark ? "bg-white/10" : "bg-gray-200"}`}
          >
            <Text
              className={`text-center font-brand ${canPurchase ? "text-white" : isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Purchase Airtime
            </Text>
          </Pressable>
        </ScrollView>

        <ContactsModal
          visible={isContactModalVisible}
          onClose={() => setIsContactModalVisible(false)}
          onSelectNumber={(num) => {
            setPhoneNumber(num);
            setIsContactModalVisible(false);
          }}
          contacts={contactNumbers}
        />
      </SafeAreaView>

      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={Number.parseInt(amount || "0")}
        useValuedAddedServices
        vasType="airtime"
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      <TransactionPin
        showPinModal={showPinModal}
        paymentMessage={`Confirm ₦${amount} Airtime for ${phoneNumber}`}
        amount={amount}
        recipient={phoneNumber}
        error={transactionError}
        initiateTransaction={initiateAirtimeTransaction}
        onCancel={() => {
          setShowPinModal(false);
          setPendingPaymentData(null);
          setTransactionError("");
        }}
      />
    </>
  );
};

export default AirtimePurchase;
