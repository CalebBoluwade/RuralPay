import { useLanguage } from "@/src/components/context/LanguageContext";
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

const SLIDE_COUNT = 4;

interface Slide {
  id: string;
  title: string;
  subtitle: string;
}

interface OnboardingCarouselProps {
  onFinish: () => void;
  appVersion: string;
}

// ─── Phone frame wrapper ──────────────────────────────────────────────────────

function PhoneFrame({
  isDark,
  children,
}: {
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{ width: SCREEN_WIDTH * 0.62, height: SCREEN_WIDTH * 0.62 * 1.78 }}
      className={`rounded-[32px] overflow-hidden border-2 ${
        isDark ? "border-white/20 bg-slate-900" : "border-slate-300 bg-white"
      }`}
    >
      <View
        className={`flex-row justify-between px-4 pt-2 pb-1 ${isDark ? "bg-slate-900" : "bg-white"}`}
      >
        <Text
          style={{ fontSize: 9 }}
          className={isDark ? "text-slate-400" : "text-slate-500"}
        >
          9:41
        </Text>
        <Text
          style={{ fontSize: 9 }}
          className={isDark ? "text-slate-400" : "text-slate-500"}
        >
          ●●●
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Slide 1: Dashboard mockup ────────────────────────────────────────────────

function Slide1Visual({ isDark }: { isDark: boolean }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.04, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <PhoneFrame isDark={isDark}>
      <View
        className={`flex-1 px-3 pt-1 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
      >
        <Text
          style={{ fontSize: 8 }}
          className={isDark ? "text-slate-400" : "text-slate-500"}
        >
          Good Morning
        </Text>
        <Text
          style={{ fontSize: 11 }}
          className={`font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Ada 👋
        </Text>
        <Animated.View
          style={pulseStyle}
          className="bg-lime-500 rounded-2xl p-3 mb-3"
        >
          <Text style={{ fontSize: 7 }} className="text-lime-900">
            Total Balance
          </Text>
          <Text style={{ fontSize: 14 }} className="text-white font-bold">
            ₦24,500.00
          </Text>
          <Text style={{ fontSize: 7 }} className="text-lime-100 mt-1">
            **** **** 4821
          </Text>
        </Animated.View>
        <View className="flex-row justify-between mb-3">
          {["Send", "Scan", "History", "Cards"].map((label) => (
            <View key={label} className="items-center gap-1">
              <View
                className={`w-8 h-8 rounded-xl items-center justify-center ${isDark ? "bg-white/10" : "bg-white border border-slate-200"}`}
              />
              <Text
                style={{ fontSize: 6 }}
                className={isDark ? "text-slate-400" : "text-slate-500"}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
        {[
          ["Bank Transfer", "-₦5,000"],
          ["QR Payment", "-₦1,200"],
        ].map(([label, amt]) => (
          <View
            key={label}
            className={`flex-row items-center justify-between py-1.5 ${isDark ? "border-b border-white/10" : "border-b border-slate-100"}`}
          >
            <View
              className={`w-5 h-5 rounded-lg mr-2 ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
            />
            <Text
              style={{ fontSize: 7 }}
              className={`flex-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {label}
            </Text>
            <Text style={{ fontSize: 7 }} className="text-red-400 font-bold">
              {amt}
            </Text>
          </View>
        ))}
      </View>
    </PhoneFrame>
  );
}

// ─── Slide 2: Transfer form mockup ───────────────────────────────────────────

function Slide2Visual({ isDark }: { isDark: boolean }) {
  const arrowX = useSharedValue(0);
  useEffect(() => {
    arrowX.value = withRepeat(
      withTiming(6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <PhoneFrame isDark={isDark}>
      <View
        className={`flex-1 px-3 pt-1 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
      >
        <Text
          style={{ fontSize: 11 }}
          className={`font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Send Money
        </Text>
        <View
          className={`rounded-xl p-2 mb-2 ${isDark ? "bg-white/10" : "bg-white border border-slate-200"}`}
        >
          <Text
            style={{ fontSize: 6 }}
            className={isDark ? "text-slate-400" : "text-slate-500"}
          >
            Amount
          </Text>
          <Text
            style={{ fontSize: 13 }}
            className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            ₦10,000
          </Text>
        </View>
        <View
          className={`rounded-xl p-2 mb-2 ${isDark ? "bg-white/10" : "bg-white border border-slate-200"}`}
        >
          <Text
            style={{ fontSize: 6 }}
            className={isDark ? "text-slate-400" : "text-slate-500"}
          >
            Bank
          </Text>
          <Text
            style={{ fontSize: 8 }}
            className={isDark ? "text-white" : "text-slate-900"}
          >
            Access Bank
          </Text>
        </View>
        <View className="rounded-xl p-2 mb-3 bg-emerald-500/20 border border-emerald-500/30">
          <Text style={{ fontSize: 6 }} className="text-emerald-500">
            Account Name
          </Text>
          <Text style={{ fontSize: 8 }} className="text-emerald-400 font-bold">
            CHUKWU EMEKA
          </Text>
        </View>
        <Animated.View
          style={arrowStyle}
          className="bg-lime-400 rounded-xl py-2 items-center"
        >
          <Text style={{ fontSize: 8 }} className="text-black font-bold">
            💸 Send Money →
          </Text>
        </Animated.View>
      </View>
    </PhoneFrame>
  );
}

// ─── Slide 3: QR scanner mockup ──────────────────────────────────────────────

function Slide3Visual({ isDark }: { isDark: boolean }) {
  const scanLine = useSharedValue(0);
  useEffect(() => {
    scanLine.value = withRepeat(
      withTiming(80, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value }],
  }));

  return (
    <PhoneFrame isDark={isDark}>
      <View
        className={`flex-1 px-3 pt-1 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
      >
        <Text
          style={{ fontSize: 11 }}
          className={`font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Scan to Pay
        </Text>
        <Text
          style={{ fontSize: 7 }}
          className={`mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Point camera at merchant QR code
        </Text>
        <View
          className={`rounded-2xl overflow-hidden items-center justify-center ${isDark ? "bg-black" : "bg-slate-800"}`}
          style={{ height: 110 }}
        >
          {(
            [
              [0, 0],
              [0, 1],
              [1, 0],
              [1, 1],
            ] as [number, number][]
          ).map(([r, c], i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                top: r ? undefined : 8,
                bottom: r ? 8 : undefined,
                left: c ? undefined : 8,
                right: c ? 8 : undefined,
                width: 16,
                height: 16,
                borderTopWidth: r ? 0 : 2,
                borderBottomWidth: r ? 2 : 0,
                borderLeftWidth: c ? 0 : 2,
                borderRightWidth: c ? 2 : 0,
                borderColor: "#a3e635",
              }}
            />
          ))}
          <View className="w-14 h-14 bg-white rounded-lg items-center justify-center">
            <View
              className="w-10 h-10"
              style={{ flexDirection: "row", flexWrap: "wrap", gap: 1 }}
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: "22%",
                    aspectRatio: 1,
                    backgroundColor: i % 3 === 0 ? "#000" : "#fff",
                  }}
                />
              ))}
            </View>
          </View>
          <Animated.View
            style={[
              scanStyle,
              {
                position: "absolute",
                left: 8,
                right: 8,
                height: 1.5,
                backgroundColor: "#a3e635",
                opacity: 0.8,
              },
            ]}
          />
        </View>
        <Text
          style={{ fontSize: 7 }}
          className="text-center mt-2 text-lime-500 font-bold"
        >
          Scanning...
        </Text>
      </View>
    </PhoneFrame>
  );
}

// ─── Slide 4: PIN lock screen mockup ─────────────────────────────────────────

function Slide4Visual({ isDark }: { isDark: boolean }) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFilled((f) => (f >= 6 ? 0 : f + 1)), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneFrame isDark={isDark}>
      <View
        className={`flex-1 items-center px-3 pt-4 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
      >
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${isDark ? "bg-violet-500/20" : "bg-violet-100"}`}
        >
          <Text style={{ fontSize: 22 }}>🔒</Text>
        </View>
        <Text
          style={{ fontSize: 10 }}
          className={`font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Enter PIN
        </Text>
        <Text
          style={{ fontSize: 7 }}
          className={`mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Your money is protected
        </Text>
        <View className="flex-row gap-3 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${i < filled ? "bg-lime-400 border-lime-400" : isDark ? "border-white/30" : "border-slate-300"}`}
            />
          ))}
        </View>
        {[
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ].map((row) => (
          <View key={row[0]} className="flex-row gap-4 mb-2">
            {row.map((n) => (
              <View
                key={n}
                className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? "bg-white/10" : "bg-white border border-slate-200"}`}
              >
                <Text
                  style={{ fontSize: 11 }}
                  className={isDark ? "text-white" : "text-slate-900"}
                >
                  {n}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </PhoneFrame>
  );
}

// ─── Dots ─────────────────────────────────────────────────────────────────────

function Dots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View className="flex-row items-center justify-center gap-x-2">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`rounded-full ${i === activeIndex ? "w-6 h-2 bg-lime-400" : "w-2 h-2 bg-gray-300"}`}
        />
      ))}
    </View>
  );
}

// ─── Slide item ───────────────────────────────────────────────────────────────

function SlideItem({
  isDark,
  item,
  index,
  slideHeight,
}: {
  isDark: boolean;
  item: Slide;
  index: number;
  slideHeight: number;
}) {
  const renderVisual = () => {
    if (index === 0) return <Slide1Visual isDark={isDark} />;
    if (index === 1) return <Slide2Visual isDark={isDark} />;
    if (index === 2) return <Slide3Visual isDark={isDark} />;
    return <Slide4Visual isDark={isDark} />;
  };

  return (
    <View
      style={{ width: SCREEN_WIDTH, height: slideHeight }}
      className="items-center justify-center px-8 gap-y-6"
    >
      {renderVisual()}
      <View className="items-center gap-y-2">
        <Text
          className={`text-2xl font-bold text-center leading-tight ${isDark ? "text-white" : "text-slate-800"}`}
        >
          {item.title}
        </Text>
        <Text
          className={`text-base text-center leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}
          style={{ maxWidth: SCREEN_WIDTH - 64 }}
        >
          {item.subtitle}
        </Text>
      </View>
    </View>
  );
}

// ─── Main carousel ────────────────────────────────────────────────────────────

export default function OnboardingCarousel({
  onFinish,
  appVersion,
}: Readonly<OnboardingCarouselProps>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideHeight, setSlideHeight] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  const isLast = activeIndex === SLIDE_COUNT - 1;

  const SLIDES: Slide[] = [
    {
      id: "1",
      title: t("onboarding.slide1Title"),
      subtitle: t("onboarding.slide1Subtitle"),
    },
    {
      id: "2",
      title: t("onboarding.slide2Title"),
      subtitle: t("onboarding.slide2Subtitle"),
    },
    {
      id: "3",
      title: t("onboarding.slide3Title"),
      subtitle: t("onboarding.slide3Subtitle"),
    },
    {
      id: "4",
      title: t("onboarding.slide4Title"),
      subtitle: t("onboarding.slide4Subtitle"),
    },
  ];

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
      <View
        className="flex-row justify-end px-6 pt-2 pb-2"
        style={{ minHeight: 44 }}
      >
        {!isLast && (
          <Pressable
            onPress={onFinish}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-lime-500 text-base font-bold">
              {t("common.skip")}
            </Text>
          </Pressable>
        )}
      </View>

      <View
        className="flex-1"
        onLayout={(e) => setSlideHeight(e.nativeEvent.layout.height)}
      >
        {slideHeight > 0 && (
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <SlideItem
                item={item}
                index={index}
                isDark={isDark}
                slideHeight={slideHeight}
              />
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig.current}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
        )}
      </View>

      <View className="px-6 pb-4 pt-4 gap-y-4">
        <Dots count={SLIDES.length} activeIndex={activeIndex} />
        <Pressable
          onPress={goNext}
          className={`rounded-2xl py-4 ${
            isLast
              ? "bg-lime-400"
              : isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white border border-gray-200"
          }`}
        >
          <Text
            className={`text-lg font-bold text-center ${
              isLast ? "text-black" : isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {isLast ? t("common.getStarted") : t("common.next")}
          </Text>
        </Pressable>
        <Text
          className={`text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          v{appVersion}
        </Text>
      </View>
    </SafeAreaView>
  );
}
