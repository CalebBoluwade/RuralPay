import CheckoutModal from "@/src/components/ui/Modals/CheckoutModal";
import CheckoutService, {
  CheckoutSession,
} from "@/src/lib/services/CheckoutService";
import ToastService from "@/src/lib/services/ToastService";
import { router, useLocalSearchParams } from "expo-router";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function useFadeSlide(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

const SkeletonBox = ({ className }: { className: string }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ opacity: pulse }}
      className={`rounded-xl bg-slate-200 dark:bg-white/10 ${className}`}
    />
  );
};

const CheckoutScreen = () => {
  const { token } = useLocalSearchParams<{ token: string }>();
  const isDark = useColorScheme() === "dark";
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const heroAnim = useFadeSlide(0);
  const cardAnim = useFadeSlide(100);
  const ctaAnim = useFadeSlide(200);

  const load = () => {
    if (!token) {
      setError("Invalid checkout link");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    CheckoutService.resolveSession(token)
      .then(setSession)
      .catch((e) => setError((e as Error).message || "Failed to load checkout"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleSuccess = (txId: string) => {
    ToastService.success("Payment successful!");
    router.replace({
      pathname: "/(common)/transaction/[transactionId]",
      params: { transactionId: txId },
    } as any);
  };

return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
        {loading ? (
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
          >
            {/* Skeleton hero */}
            <View className="items-center pt-6 pb-8 gap-3">
              <SkeletonBox className="w-16 h-16 rounded-2xl" />
              <SkeletonBox className="w-32 h-4" />
              <SkeletonBox className="w-48 h-10" />
              <SkeletonBox className="w-40 h-3" />
            </View>
            {/* Skeleton card */}
            <SkeletonBox className="w-32 h-3 mb-3" />
            <View
              className={`rounded-2xl overflow-hidden mb-4 ${isDark ? "bg-white/10 border border-white/20" : "bg-white border border-slate-200"}`}
            >
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  className={`flex-row justify-between items-center px-4 py-4 ${i < 3 ? (isDark ? "border-b border-white/10" : "border-b border-slate-100") : ""}`}
                >
                  <SkeletonBox className="w-20 h-3" />
                  <SkeletonBox className="w-28 h-3" />
                </View>
              ))}
            </View>
            {/* Skeleton CTA */}
            <SkeletonBox className="w-full h-14 rounded-2xl mt-2" />
          </ScrollView>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8 gap-5">
            <View
              className={`w-20 h-20 rounded-full items-center justify-center ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
            >
              <AlertCircle size={40} color="#ef4444" />
            </View>
            <View className="items-center gap-2">
              <Text
                className={`text-xl font-brand font-bold text-center ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Couldn&apos;t Load Checkout
              </Text>
              <Text
                className={`text-sm text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {error}
              </Text>
            </View>
            <Pressable
              onPress={load}
              className={`flex-row items-center gap-2 px-6 py-3.5 rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-white border border-slate-200"}`}
            >
              <RefreshCw size={16} color={isDark ? "#a3e635" : "#65a30d"} />
              <Text
                className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : session ? (
          <CheckoutModal
            visible
            session={session}
            onClose={() => router.back()}
            onSuccess={handleSuccess}
          />
        ) : null}
    </SafeAreaView>
  );
};

const DetailRow = ({
  label,
  value,
  isDark,
  bold,
  mono,
  icon,
  last,
  customRight,
}: {
  label: string;
  value?: string;
  isDark: boolean;
  bold?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
  last?: boolean;
  customRight?: React.ReactNode;
}) => (
  <View
    className={`flex-row items-center justify-between px-4 py-3.5 ${!last ? (isDark ? "border-b border-white/10" : "border-b border-slate-100") : ""}`}
  >
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text
        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        {label}
      </Text>
    </View>
    {customRight ?? (
      <Text
        className={`text-sm ${bold ? "font-semibold" : ""} ${mono ? "font-mono" : ""} ${isDark ? "text-white" : "text-slate-900"}`}
        numberOfLines={1}
      >
        {value}
      </Text>
    )}
  </View>
);

export default CheckoutScreen;
