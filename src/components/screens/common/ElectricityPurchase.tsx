import AmountInput from "@/src/components/ui/Input/AmountInput";
import PaymentMethodModal from "@/src/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { useClearLoadingOnLock } from "@/src/hooks/useClearLoadingOnLock";
import { LocationService } from "@/src/lib/services/LocationService";
import PaymentService from "@/src/lib/services/PaymentService";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FALLBACK_PROVIDERS: ElectricityProvider[] = [
  { id: "IKEDC", name: "Ikeja Electric" },
  { id: "EKEDC", name: "Eko Electric" },
  { id: "AEDC", name: "Abuja Electric" },
  { id: "PHEDC", name: "Port Harcourt Electric" },
  { id: "KEDCO", name: "Kano Electric" },
  { id: "IBEDC", name: "Ibadan Electric" },
];

const METER_TYPES = [
  { id: "PREPAID", label: "Prepaid" },
  { id: "POSTPAID", label: "Postpaid" },
];

function useFadeSlide(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity: anim, transform: [{ translateY }] };
}

const ElectricityPurchase = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [isLoading, setIsLoading] = useState(false);
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [providers, setProviders] = useState<ElectricityProvider[]>(FALLBACK_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedMeterType, setSelectedMeterType] = useState("PREPAID");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    method: PaymentMethod;
    accountNumber?: string;
    appliedVoucher?: Voucher;
  } | null>(null);
  const [transactionError, setTransactionError] = useState("");
  useClearLoadingOnLock(setIsLoading);

  useEffect(() => {
    PaymentService.FetchElectricityProviders()
      .then((data) => { if (data.length) setProviders(data); });
  }, []);

  const providerAnim = useFadeSlide(0);
  const meterAnim = useFadeSlide(80);
  const amountAnim = useFadeSlide(160);
  const btnAnim = useFadeSlide(240);

  const canPurchase = !!meterNumber && !!amount && !!selectedProvider;

  const handlePaymentMethodSelected = (data: {
    method: PaymentMethod;
    accountNumber?: string;
    appliedVoucher?: Voucher;
  }) => {
    setShowPaymentModal(false);
    setPendingPaymentData(data);
    setShowPinModal(true);
  };

  const initiateTransaction = async (twoFACode: string): Promise<boolean> => {
    if (!pendingPaymentData) return false;
    try {
      const location = await LocationService.getCurrentLocation();
      const payload: AirtimeDataPayload = {
        transactionID: PaymentService.generateTransactionId("ELECTRICITY"),
        paymentMode: "ELECTRICITY" as PaymentMode,
        service: "ELECTRICITY",
        amount: Number(amount),
        beneficiaryPhoneNumber: meterNumber,
        network: selectedProvider,
        narration: `${selectedMeterType} Electricity for ${meterNumber}`,
        debitAccount: pendingPaymentData.accountNumber!,
        voucher: pendingPaymentData.appliedVoucher,
        OneTimeCode: twoFACode,
        ...(location && { location }),
      };
      const result = await PaymentService.MakeAirtimePurchase(payload);
      if (!result.success) setTransactionError(result.errorMessage ?? "Transaction Failed");
      return result.success;
    } catch (e: any) {
      setTransactionError(e?.message ?? "Transaction Failed");
      return false;
    }
  };

  return (
    <>
      <SafeAreaView className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}>
        <ScreenHeader goBack title="Buy Electricity" />

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Provider */}
          <Animated.View style={providerAnim} className="mb-6">
            <Text className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
              Select Provider
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {providers.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedProvider(p.id)}
                  className={`px-4 py-3 rounded-xl border ${
                    selectedProvider === p.id
                      ? "border-lime-500 bg-lime-500/20"
                      : isDark
                        ? "bg-white/10 border-white/10"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text className={`font-brand font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Meter Type */}
          <Animated.View style={meterAnim} className="mb-6">
            <Text className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
              Meter Type
            </Text>
            <View className="flex-row gap-3">
              {METER_TYPES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedMeterType(t.id)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    selectedMeterType === t.id
                      ? "border-lime-500 bg-lime-500/20"
                      : isDark
                        ? "bg-white/10 border-white/10"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text className={`font-brand font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Meter Number */}
          <Animated.View style={meterAnim} className="mb-6">
            <Text className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
              Meter Number
            </Text>
            <Card className="overflow-hidden">
              <View className="flex-row items-center px-4 py-3 gap-3">
                <TextInput
                  value={meterNumber}
                  onChangeText={setMeterNumber}
                  placeholder="Enter meter number"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  keyboardType="numeric"
                  className={`flex-1 text-sm font-brand py-2 ${isDark ? "text-white" : "text-slate-900"}`}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Amount */}
          <Animated.View style={amountAnim} className="mb-6">
            <Text className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
              Amount
            </Text>
            <AmountInput onAmountChange={(amt) => setAmount(amt.toString())} />
          </Animated.View>

          {/* CTA */}
          <Animated.View style={btnAnim} className="mb-8">
            <Button
              label="Buy Electricity"
              onPress={() => setShowPaymentModal(true)}
              disabled={!canPurchase}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={Number(amount || "0")}
        useValuedAddedServices
        vasType="airtime"
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      <TransactionPin
        showPinModal={showPinModal}
        paymentMessage={`Confirm ₦${amount} Electricity for meter ${meterNumber}`}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        error={transactionError}
        initiateTransaction={initiateTransaction}
        onCancel={() => {
          setShowPinModal(false);
          setPendingPaymentData(null);
          setTransactionError("");
        }}
      />
    </>
  );
};

export default ElectricityPurchase;
