import { axiosInstance } from "@/src/lib/api";
import { useStripe } from "@stripe/stripe-react-native";
import { useStripeTerminal } from "@stripe/stripe-terminal-react-native";
import { useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";

export const PaymentScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const { clientSecret } = await axiosInstance.post<{ clientSecret: string }>(
        "/payments/create-intent"
      );

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "RuralPay",
        applePay: { merchantCountryCode: "NG" },
        googlePay: { merchantCountryCode: "NG", testEnv: __DEV__ },
        allowsDelayedPaymentMethods: false,
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw new Error(presentError.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Pay with Apple/Google Pay" onPress={initializePayment} />
      )}
    </View>
  );
};

export const TapToPayScreen = () => {
  const [discoveredReaders, setDiscoveredReaders] = useState<import("@stripe/stripe-terminal-react-native").Reader.Type[]>([]);
  const { discoverReaders, connectReader } = useStripeTerminal({
    onUpdateDiscoveredReaders: (readers) => setDiscoveredReaders(readers),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const startTapToPay = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: discoverError } = await discoverReaders({
        discoveryMethod: "tapToPay",
      });

      if (discoverError) throw new Error(discoverError.message);
      if (!discoveredReaders.length) throw new Error("No Tap to Pay reader found");

      const { error: connectError } = await connectReader({
        discoveryMethod: "tapToPay",
        reader: discoveredReaders[0],
        locationId: process.env.EXPO_PUBLIC_STRIPE_LOCATION_ID!,
      });

      if (connectError) throw new Error(connectError.message);
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {ready && <Text>Ready to accept card taps</Text>}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Start Tap to Pay" onPress={startTapToPay} disabled={ready} />
      )}
    </View>
  );
};
