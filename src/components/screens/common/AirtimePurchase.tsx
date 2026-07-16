import { useAuth } from "@/src/components/context/AuthSessionProvider";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import AmountInput from "@/src/components/ui/Input/AmountInput";
import ContactsModal from "@/src/components/ui/Modals/ContactsModal";
import PaymentMethodModal from "@/src/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
import {
  AirtelLogo,
  GloLogo,
  MTNLogo,
  NineMobileLogo,
} from "@/src/components/ui/NetworkLogos";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { useClearLoadingOnLock } from "@/src/hooks/useClearLoadingOnLock";
import AppLogger, { LogLevel } from "@/src/lib/services/AppLogger";
import { LocationService } from "@/src/lib/services/LocationService";
import PaymentService from "@/src/lib/services/PaymentService";
import ToastService from "@/src/lib/services/ToastService";
import { maskPhone } from "@/src/lib/utils";
import * as Contacts from "expo-contacts";
import { Phone, Users } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const networks = [
  { id: "mtn", name: "MTN", color: "#FFCC00", Logo: MTNLogo },
  { id: "glo", name: "Glo", color: "#00A859", Logo: GloLogo },
  { id: "airtel", name: "Airtel", color: "#ED1C24", Logo: AirtelLogo },
  { id: "9mobile", name: "9mobile", color: "#00A65E", Logo: NineMobileLogo },
];

function useFadeSlide(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return { opacity: anim, transform: [{ translateY }] };
}

const AirtimePurchase = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
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
  useClearLoadingOnLock(setIsLoading, setIsLoadingContacts);

  const networkAnim = useFadeSlide(0);
  const phoneAnim = useFadeSlide(80);
  const amountAnim = useFadeSlide(160);
  const btnAnim = useFadeSlide(240);

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
      const location = await LocationService.getCurrentLocation();

      const payload: AirtimeDataPayload = {
        transactionID: PaymentService.generateTransactionId("AIRTIME"),
        paymentMode: "AIRTIME",
        service: "AIRTIME",
        amount: Number(amount),
        beneficiaryPhoneNumber: phoneNumber,
        network: selectedNetwork.toUpperCase(),
        narration: `Airtime Purchase for ${phoneNumber}`,
        debitAccount: pendingPaymentData.accountNumber!,
        voucher: pendingPaymentData.appliedVoucher,
        OneTimeCode: twoFACode,
        ...(location && { location }),
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
        className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
      >
        <ScreenHeader goBack title="Buy Airtime" />

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Network Selection */}
          <Animated.View style={networkAnim} className="mb-6">
            <Text
              className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Select Network
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {networks.map((network) => (
                <Pressable
                  key={network.id}
                  onPress={() => setSelectedNetwork(network.id)}
                  className={`flex-1 min-w-[45%] py-4 rounded-xl items-center gap-2 ${
                    selectedNetwork === network.id
                      ? "border-2"
                      : isDark
                        ? "bg-white/10 border border-white/10"
                        : "bg-slate-50 border border-slate-100"
                  }`}
                  style={
                    selectedNetwork === network.id
                      ? { borderColor: network.color }
                      : {}
                  }
                >
                  <network.Logo size={36} />
                  <Text
                    className={`font-brand font-semibold text-base ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {network.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Phone Number */}
          <Animated.View style={phoneAnim} className="mb-6">
            <Text
              className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Phone Number
            </Text>
            <Card className="overflow-hidden">
              {/* Use my number */}
              <Pressable
                className={`flex-row items-center px-4 py-4 gap-4 ${isDark ? "border-b border-white/10" : "border-b border-slate-100"}`}
                onPress={() =>
                  user?.phoneNumber
                    ? setPhoneNumber(user.phoneNumber)
                    : ToastService.error("No Phone Number found")
                }
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
                >
                  <Phone size={22} color={isDark ? "#a3e635" : "#65a30d"} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Use My Number
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {maskPhone(user?.phoneNumber)}
                  </Text>
                </View>
              </Pressable>

              {/* Manual input */}
              <View className="flex-row items-center px-4 py-3 gap-3">
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="08012345678"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  keyboardType="phone-pad"
                  className={`flex-1 text-base font-brand py-2 ${isDark ? "text-white" : "text-slate-900"}`}
                />
                <Pressable
                  className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
                  onPress={getContacts}
                  disabled={isLoadingContacts}
                >
                  {isLoadingContacts ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? "#a3e635" : "#65a30d"}
                    />
                  ) : (
                    <Users size={18} color={isDark ? "#a3e635" : "#65a30d"} />
                  )}
                </Pressable>
              </View>
            </Card>
          </Animated.View>

          {/* Amount */}
          <Animated.View style={amountAnim} className="mb-6">
            <Text
              className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Amount
            </Text>
            <AmountInput onAmountChange={(amt) => setAmount(amt.toString())} />
          </Animated.View>

          {/* CTA */}
          <Animated.View style={btnAnim} className="mb-8">
            <Button
              label="Purchase Airtime"
              onPress={() => setShowPaymentModal(true)}
              disabled={!canPurchase}
            />
          </Animated.View>
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
        isLoading={isLoading}
        setIsLoading={setIsLoading}
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
