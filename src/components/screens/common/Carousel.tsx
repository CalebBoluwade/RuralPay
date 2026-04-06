import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  useColorScheme,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  accent: string; // Tailwind bg class for icon bubble
  accentText: string; // Tailwind text class for icon
}

interface OnboardingCarouselProps {
  onFinish: () => void; // called when user taps "Get Started" or skips
  appVersion: string; // App version to display
}

function NfcRing({
  size,
  color,
  delay,
}: Readonly<{
  size: number;
  color: string;
  delay: number;
}>) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    const start = () => {
      scale.value = withRepeat(withTiming(1.8, { duration: 1800 }), -1, false);
      opacity.value = withRepeat(withTiming(0, { duration: 1800 }), -1, false);
    };
    const t = setTimeout(start, delay);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
          position: "absolute",
        },
      ]}
    />
  );
}

function NfcWave() {
  return (
    <View
      style={{ width: 160, height: 160 }}
      className="items-center justify-center"
    >
      <NfcRing size={100} color="#93c5fd" delay={0} />
      <NfcRing size={140} color="#bfdbfe" delay={400} />
      <NfcRing size={180} color="#dbeafe" delay={800} />
    </View>
  );
}

// 💳 Floating Card Component
function FloatingCard() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-10, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={style}
      className="w-80 h-48 bg-lime-600 rounded-2xl p-4 justify-between shadow-2xl"
    >
      <Text className="text-white text-lg font-bold">**** **** **** 1234</Text>

      <Text className="text-white font-semibold">Jane Doe</Text>
    </Animated.View>
  );
}

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "💳",
    title: "Instant Card Payments",
    subtitle:
      "Tap your Contactless Card On Any RuralPay terminal and complete a payment in under two seconds — no internet required.",
    accent: "bg-emerald-100",
    accentText: "text-emerald-600",
  },
  {
    id: "2",
    icon: "🏦",
    title: "Send & Receive Money",
    subtitle:
      "Transfer funds to any bank account or wallet in Nigeria instantly. Enter an account number or scan a QR code.",
    accent: "bg-blue-100",
    accentText: "text-blue-600",
  },
  {
    id: "3",
    icon: "🔒",
    title: "Bank-Grade Security",
    subtitle:
      "Every transaction is protected by biometric verification and end-to-end encryption. Your money, always safe.",
    accent: "bg-violet-100",
    accentText: "text-violet-600",
  },
  {
    id: "4",
    icon: "📊",
    title: "Smart Spending Insights",
    subtitle:
      "Understand where your money goes with automatic categorisation, monthly summaries, and savings goals.",
    accent: "bg-amber-100",
    accentText: "text-amber-600",
  },
];

// ─── Dot indicator ────────────────────────────────────────────────────────────

const Dots = ({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}) => (
  <View className="flex-row items-center justify-center gap-x-2">
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        className={[
          "rounded-full transition-all",
          i === activeIndex ? "w-6 h-2 bg-lime-400" : "w-2 h-2 bg-gray-300",
        ].join(" ")}
      />
    ))}
  </View>
);

// ─── Individual slide ─────────────────────────────────────────────────────────

const SlideItem = ({
  isDark,
  item,
  index,
}: {
  isDark: boolean;
  item: Slide;
  index: number;
}) => (
  <View
    style={{ width: SCREEN_WIDTH }}
    className="flex-1 items-center justify-evenly px-8"
  >
    {/* Center Visual */}
    {index === 0 ? (
      <View className="items-center justify-center">
        <View
          className="items-center justify-center"
          style={{ marginBottom: 16 }}
        >
          <NfcWave />
          <View style={{ position: "absolute" }}>
            <FloatingCard />
          </View>
        </View>
      </View>
    ) : (
      <View
        className={`w-40 h-40 rounded-3xl items-center justify-center mb-10 ${item.accent}`}
      >
        {/* Icon bubble */}
        <Text style={{ fontSize: 120 }}>{item.icon}</Text>
      </View>
    )}

    <View>
      <Text
        className={`${isDark ? "text-slate-400" : "text-slate-600"} text-3xl font-bold text-center mb-4 leading-tight`}
      >
        {item.title}
      </Text>
      <Text className="text-gray-500 text-base text-center leading-relaxed max-w-xs">
        {item.subtitle}
      </Text>
    </View>
  </View>
);

export default function OnboardingCarousel({
  onFinish,
  appVersion,
}: Readonly<OnboardingCarouselProps>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isLast = activeIndex === SLIDES.length - 1;

  // Track which slide is visible
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const goNext = useCallback(() => {
    if (isLast) {
      onFinish();
      return;
    }
    flatListRef.current?.scrollToIndex({
      index: activeIndex + 1,
      animated: true,
    });
  }, [isLast, activeIndex, onFinish]);

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Skip button */}
      <View className="flex-row justify-end px-6 pt-2 pb-4">
        {!isLast && (
          <Pressable
            onPress={onFinish}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-lime-500 text-lg font-bold">Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} isDark={isDark} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        // onScroll={Animated.(
        //   [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        //   { useNativeDriver: false }
        // )}
        scrollEventThrottle={16}
        // className="flex-1"
      />

      {/* Bottom controls */}
      <View className="px-6 pt-6 pb-4 gap-y-6">
        <Dots count={SLIDES.length} activeIndex={activeIndex} />

        {isLast ? (
          <Pressable
            onPress={goNext}
            className={`bg-lime-400 rounded-2xl py-4 shadow-lg mb-2 `}
          >
            <Text className="text-black text-lg font-bold text-center tracking-wide">
              Get Started
            </Text>
          </Pressable>
        ) : null}

        <Text className={`text-center text-base ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          v{appVersion}
        </Text>
      </View>
    </SafeAreaView>
  );
}
