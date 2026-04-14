import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import PaymentMethodModal from "@/src/components/ui/Modals/Transaction/PaymentMethodModal";
import TransactionPin from "@/src/components/ui/Modals/Transaction/TransactionPinModal";
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

const FALLBACK_PROVIDERS: CableProvider[] = [
  {
    id: "DSTV",
    name: "DStv",
    plans: [
      { id: "DSTV_PADI", label: "Padi", price: 2500 },
      { id: "DSTV_YANGA", label: "Yanga", price: 3500 },
      { id: "DSTV_CONFAM", label: "Confam", price: 6200 },
      { id: "DSTV_COMPACT", label: "Compact", price: 15700 },
      { id: "DSTV_PREMIUM", label: "Premium", price: 29500 },
    ],
  },
  {
    id: "GOTV",
    name: "GOtv",
    plans: [
      { id: "GOTV_SMALLIE", label: "Smallie", price: 1575 },
      { id: "GOTV_JINJA", label: "Jinja", price: 2715 },
      { id: "GOTV_JOLLI", label: "Jolli", price: 4115 },
      { id: "GOTV_MAX", label: "Max", price: 6000 },
    ],
  },
  {
    id: "STARTIMES",
    name: "StarTimes",
    plans: [
      { id: "ST_NOVA", label: "Nova", price: 900 },
      { id: "ST_BASIC", label: "Basic", price: 1850 },
      { id: "ST_SMART", label: "Smart", price: 2600 },
      { id: "ST_CLASSIC", label: "Classic", price: 3300 },
    ],
  },
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

const CableTVPurchase = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [isLoading, setIsLoading] = useState(false);
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [providers, setProviders] =
    useState<CableProvider[]>(FALLBACK_PROVIDERS);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
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
    PaymentService.FetchCableProviders().then((data) => {
      if (data.length) setProviders(data);
    });
  }, []);

  const providerAnim = useFadeSlide(0);
  const planAnim = useFadeSlide(80);
  const cardAnim = useFadeSlide(160);
  const btnAnim = useFadeSlide(240);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const selectedPlan = selectedProvider?.plans.find(
    (p) => p.id === selectedPlanId,
  );
  const canPurchase =
    !!smartCardNumber && !!selectedProviderId && !!selectedPlanId;

  const handleProviderSelect = (id: string) => {
    setSelectedProviderId(id);
    setSelectedPlanId("");
  };

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
    if (!pendingPaymentData || !selectedPlan) return false;
    try {
      const location = await LocationService.getCurrentLocation();
      const payload: AirtimeDataPayload = {
        transactionID: PaymentService.generateTransactionId("CABLE_TV"),
        paymentMode: "CABLE_TV" as PaymentMode,
        service: "CABLE_TV",
        amount: selectedPlan.price,
        beneficiaryPhoneNumber: smartCardNumber,
        network: selectedProviderId,
        dataPlanId: selectedPlanId,
        narration: `${selectedProvider?.name} ${selectedPlan.label} for ${smartCardNumber}`,
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

  return (
    <>
      <SafeAreaView
        className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
      >
        <ScreenHeader goBack title="Pay Cable TV" />

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Provider */}
          <Animated.View style={providerAnim} className="mb-6">
            <Text
              className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Select Provider
            </Text>
            <View className="flex-row gap-3">
              {providers.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => handleProviderSelect(p.id)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    selectedProviderId === p.id
                      ? "border-lime-500 bg-lime-500/20"
                      : isDark
                        ? "bg-white/10 border-white/10"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text
                    className={`font-brand font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Plans */}
          {selectedProvider && (
            <Animated.View style={planAnim} className="mb-6">
              <Text
                className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Select Bouquet
              </Text>
              <Card className="overflow-hidden">
                {selectedProvider.plans.map((plan, index) => (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlanId(plan.id)}
                    className={`flex-row items-center px-4 py-4 gap-4 ${
                      index < selectedProvider.plans.length - 1
                        ? isDark
                          ? "border-b border-white/10"
                          : "border-b border-slate-100"
                        : ""
                    } ${selectedPlanId === plan.id ? (isDark ? "bg-lime-500/10" : "bg-lime-50") : ""}`}
                  >
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {plan.label}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text
                        className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        ₦{plan.price.toLocaleString()}
                      </Text>
                      {selectedPlanId === plan.id && (
                        <View className="w-2 h-2 rounded-full bg-lime-500" />
                      )}
                    </View>
                  </Pressable>
                ))}
              </Card>
            </Animated.View>
          )}

          {/* Smart Card Number */}
          <Animated.View style={cardAnim} className="mb-6">
            <Text
              className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Smart Card / IUC Number
            </Text>
            <Card className="overflow-hidden">
              <View className="flex-row items-center px-4 py-3 gap-3">
                <TextInput
                  value={smartCardNumber}
                  onChangeText={setSmartCardNumber}
                  placeholder="Enter smart card number"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  keyboardType="numeric"
                  className={`flex-1 text-sm font-brand py-2 ${isDark ? "text-white" : "text-slate-900"}`}
                />
              </View>
            </Card>
          </Animated.View>

          {/* CTA */}
          <Animated.View style={btnAnim} className="mb-8">
            <Button
              label={
                selectedPlan
                  ? `Pay ${selectedProvider?.name} ${selectedPlan.label} — ₦${selectedPlan.price.toLocaleString()}`
                  : "Pay Cable TV"
              }
              onPress={() => setShowPaymentModal(true)}
              disabled={!canPurchase}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={selectedPlan?.price ?? 0}
        useValuedAddedServices
        vasType="data"
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      <TransactionPin
        showPinModal={showPinModal}
        paymentMessage={`Confirm ${selectedProvider?.name} ${selectedPlan?.label} for ${smartCardNumber}`}
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

export default CableTVPurchase;
