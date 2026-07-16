import AppLogger, { LogLevel } from "@/src/lib/services/AppLogger";
import { LocationService } from "@/src/lib/services/LocationService";
import PaymentService from "@/src/lib/services/PaymentService";
import * as Contacts from "expo-contacts";
import { Users, X } from "lucide-react-native";
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
import ContactsModal from "../../ui/Modals/ContactsModal";
import PaymentMethodModal from "../../ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "../../ui/Modals/Transaction/TransactionPinModal";

interface DataModalProps {
  visible: boolean;
  onClose: () => void;
}

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

const DataModal: React.FC<DataModalProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [contactNumbers, setContactNumbers] = useState<PhoneNumber[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<PhoneNumber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const [pendingPaymentData, setPendingPaymentData] = useState<{
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
    appliedVoucher?: Voucher;
    finalAmount?: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);

  const networkAnim = useFadeSlide(0);
  const phoneAnim = useFadeSlide(80);
  const btnAnim = useFadeSlide(240);

  const networks = [
    { id: "mtn", name: "MTN", color: "#FFCC00" },
    { id: "glo", name: "Glo", color: "#00A859" },
    { id: "airtel", name: "Airtel", color: "#ED1C24" },
    { id: "9mobile", name: "9mobile", color: "#00A65E" },
  ];

  useEffect(() => {
    const GetDataPlans = async () => {
      try {
        const data = await PaymentService.FetchDataPlans(selectedNetwork);
        setDataPlans(data);
        if (__DEV__) console.log("Fetched Data Plans:", data);
      } catch (error) {
        if (__DEV__) console.error("Error fetching data plans:", error);
      }
    };
    GetDataPlans();
  }, [contactNumbers]);

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

  const canPurchase = !!phoneNumber && !!selectedPlan && !!selectedNetwork;

  const handleSelectNumber = (num: string) => {
    const cleanNum = num.replace(/[^0-9+]/g, "");
    setPhoneNumber(cleanNum);
    setIsContactModalVisible(false);
    setSearchQuery("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredContacts(contactNumbers);
      return;
    }

    const filtered = contactNumbers.filter(
      (contact) =>
        contact.number.toLowerCase().includes(query.toLowerCase()) ||
        contact.label.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredContacts(filtered);
  };

  const initiateDataTransaction = async (
    twoFACode: string,
  ): Promise<boolean> => {
    if (!pendingPaymentData) return false;
    try {
      const location = await LocationService.getCurrentLocation();

      const payload: AirtimeDataPayload = {
        transactionID: PaymentService.generateTransactionId("DATA"),
        paymentMode: "DATA",
        service: "DATA_PURCHASE",
        amount: dataPlans.find((p) => p.id === selectedPlan)?.price || 0,
        beneficiaryPhoneNumber: phoneNumber,
        network: selectedNetwork.toUpperCase(),
        narration: `Data Purchase for ${phoneNumber}`,
        debitAccount: pendingPaymentData.accountNumber || "",
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

  return (
    <>
      <SafeAreaView
        className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
      >
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-2xl font-brand ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Buy Data Bundle
            </Text>
            <Pressable
              onPress={onClose}
              className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            >
              <X size={24} color={isDark ? "#fff" : "#6B7280"} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <Text
            className={`text-base font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Select Network
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {networks.map((network) => (
              <Pressable
                key={network.id}
                onPress={() => setSelectedNetwork(network.id)}
                className={`flex-1 min-w-[45%] py-4 rounded-xl items-center ${
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
                <Text
                  className={`font-brand ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {network.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text
            className={`text-base font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
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
              className={`w-12 h-12 rounded-xl items-center justify-center ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200"
              }`}
              onPress={getContacts}
              disabled={isLoadingContacts}
            >
              {isLoadingContacts ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#00A859" : "#65a30d"}
                />
              ) : (
                <Users size={20} color={isDark ? "#00A859" : "#65a30d"} />
              )}
            </Pressable>
          </View>

          <Text
            className={`text-base font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Select Data Plan
          </Text>
          <View className="gap-3 mb-8">
            {dataPlans.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                className={`p-4 rounded-xl ${
                  selectedPlan === plan.id
                    ? isDark
                      ? "bg-blue-600/20 border-2 border-blue-500"
                      : "bg-blue-50 border-2 border-blue-500"
                    : isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-50 border border-gray-200"
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text
                      className={`text-lg font-brand ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {plan.size}
                    </Text>
                    <Text
                      className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Valid for {plan.validity}
                    </Text>
                  </View>
                  <Text
                    className={`text-xl font-brand ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    ₦{plan.price}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* CTA */}
          <Animated.View style={btnAnim} className="mb-8">
            <Pressable
              onPress={() => setShowPaymentModal(true)}
              disabled={!canPurchase}
              className={`rounded-2xl py-4 items-center ${canPurchase ? "bg-lime-400" : isDark ? "bg-white/10" : "bg-slate-200"}`}
            >
              <Text
                className={`font-brand font-bold text-base ${canPurchase ? "text-black" : isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Purchase Data
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Contacts Modal */}
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
        amount={dataPlans.find((p) => p.id === selectedPlan)?.price || 0}
        useValuedAddedServices
        vasType="airtime"
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      <TransactionPin
        showPinModal={showPinModal}
        paymentMessage={`Confirm ${selectedPlan} ${dataPlans.find((p) => p.id === selectedPlan)?.price} for ${phoneNumber}`}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        error={transactionError}
        initiateTransaction={initiateDataTransaction}
        onCancel={() => {
          setShowPinModal(false);
          setPendingPaymentData(null);
          setTransactionError("");
        }}
      />
    </>
  );
};

export default DataModal;
