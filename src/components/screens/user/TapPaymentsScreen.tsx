import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import InfoChip from "@/src/components/ui/InfoChip";
// import { useStripe } from "@stripe/stripe-react-native";
// import { Reader, useStripeTerminal } from "@stripe/stripe-terminal-react-native";
import { router } from "expo-router";
import { CreditCard, Smartphone } from "lucide-react-native";
import { useState } from "react";
import {
    ScrollView,
    Text,
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "../../ui/ScreenHeader";

// ─── Wallet / Apple Pay / Google Pay ────────────────────────────────────────

const WalletPaySection = () => {
  // const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // const { clientSecret } = await axiosInstance.post<{
      //   clientSecret: string;
      // }>("/payment/create-intent");

      // const { error: initError } = await initPaymentSheet({
      //   paymentIntentClientSecret: clientSecret,
      //   merchantDisplayName: "RuralPay",
      //   applePay: { merchantCountryCode: "NG" },
      //   googlePay: { merchantCountryCode: "NG", testEnv: __DEV__ },
      //   allowsDelayedPaymentMethods: false,
      // });

      // if (initError) throw new Error(initError.message);

      // const { error: presentError } = await presentPaymentSheet();
      // if (presentError) throw new Error(presentError.message);

      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl p-5 mb-4">
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className={`w-11 h-11 rounded-2xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
        >
          <CreditCard size={22} color={isDark ? "#a3e635" : "#65a30d"} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-bold font-brand ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Apple / Google Pay
          </Text>
          <Text
            className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Pay instantly with your digital wallet
          </Text>
        </View>
      </View>

      {error && (
        <View className="mb-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
          <Text className="text-red-500 text-base">{error}</Text>
        </View>
      )}

      {success && (
        <View className="mb-3 px-4 py-3 rounded-2xl bg-lime-500/10 border border-lime-500/20">
          <Text
            className={`text-base font-semibold ${isDark ? "text-lime-400" : "text-lime-700"}`}
          >
            ✓ Payment confirmed
          </Text>
        </View>
      )}

      <Button label="Pay Now" loading={loading} onPress={handlePay} />
    </Card>
  );
};

// ─── Tap to Pay (Stripe Terminal) ───────────────────────────────────────────

const TapToPaySection = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // const [discoveredReaders, setDiscoveredReaders] = useState<Reader.Type[]>([]);
  // const { discoverReaders, connectReader } = useStripeTerminal({
  //   onUpdateDiscoveredReaders: (readers) => setDiscoveredReaders(readers),
  // });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      // const { error: discoverError } = await discoverReaders({
      //   discoveryMethod: "tapToPay",
      // });

      // if (discoverError) throw new Error(discoverError.message);
      // if (!discoveredReaders.length)
      //   throw new Error("No Tap to Pay reader found on this device");

      // const { error: connectError } = await connectReader({
      //   discoveryMethod: "tapToPay",
      //   reader: discoveredReaders[0],
      //   locationId: process.env.EXPO_PUBLIC_STRIPE_LOCATION_ID!,
      // });

      // if (connectError) throw new Error(connectError.message);
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl p-5 mb-4">
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className={`w-11 h-11 rounded-2xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
        >
          <Smartphone size={22} color={isDark ? "#a3e635" : "#65a30d"} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-bold font-brand ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Tap to Pay
          </Text>
          <Text
            className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Accept physical card taps via NFC
          </Text>
        </View>

        {ready && (
          <View className="px-3 py-1 rounded-full bg-lime-500/20 border border-lime-500/30">
            <Text
              className={`text-xs font-bold ${isDark ? "text-lime-400" : "text-lime-700"}`}
            >
              Ready
            </Text>
          </View>
        )}
      </View>

      {error && (
        <View className="mb-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
          <Text className="text-red-500 text-base">{error}</Text>
        </View>
      )}

      <Button
        label={ready ? "Reader Connected" : "Start Tap to Pay"}
        loading={loading}
        disabled={ready}
        onPress={handleStart}
      />
    </Card>
  );
};

// ─── Screen ─────────────────────────────────────────────────────────────────

const TapPaymentsScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <ScreenHeader title="Tap to Pay" goBack onBack={() => router.back()} />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="mb-4">
          <InfoChip
            label="What is Tap to Pay?"
            explanation="Hold the back of your phone against a payment terminal or another phone. Your phone uses NFC (a short-range radio signal) to send the payment — no internet needed, no QR code to scan."
          />
        </View>

        <WalletPaySection />
        <TapToPaySection />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TapPaymentsScreen;
