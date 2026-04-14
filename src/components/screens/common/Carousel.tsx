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

interface Slide {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  accent: string;
}

interface OnboardingCarouselProps {
  onFinish: () => void;
  appVersion: string;
}

// ─── Slide 1 animated visuals ─────────────────────────────────────────────────

function NfcRing({
  size,
  color,
  delay,
}: Readonly<{ size: number; color: string; delay: number }>) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    const t = setTimeout(() => {
      scale.value = withRepeat(withTiming(1.8, { duration: 1800 }), -1, false);
      opacity.value = withRepeat(withTiming(0, { duration: 1800 }), -1, false);
    }, delay);
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

function Slide1Visual() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ width: 240, height: 180 }} className="items-center justify-center">
      {/* NFC rings behind the card */}
      <NfcRing size={80} color="#93c5fd" delay={0} />
      <NfcRing size={120} color="#bfdbfe" delay={400} />
      <NfcRing size={160} color="#dbeafe" delay={800} />
      {/* Card on top */}
      <Animated.View
        style={[cardStyle, { width: 220, height: 130 }]}
        className="bg-lime-600 rounded-2xl p-4 justify-between shadow-2xl"
      >
        <Text className="text-white text-base font-bold">**** **** **** 1234</Text>
        <Text className="text-white font-semibold">Jane Doe</Text>
      </Animated.View>
    </View>
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

// ─── Individual slide ─────────────────────────────────────────────────────────

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
  return (
    <View
      style={{ width: SCREEN_WIDTH, height: slideHeight }}
      className="items-center justify-center px-8 gap-y-8"
    >
      {index === 0 ? (
        <Slide1Visual />
      ) : (
        <View
          className={`w-36 h-36 rounded-3xl items-center justify-center ${item.accent}`}
        >
          <Text style={{ fontSize: 72 }}>{item.icon}</Text>
        </View>
      )}

      <View className="items-center gap-y-3">
        <Text
          className={`text-2xl font-bold text-center leading-tight ${isDark ? "text-white" : "text-slate-800"}`}
        >
          {item.title}
        </Text>
        <Text
          className={`text-sm text-center leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}
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

  const isLast = activeIndex === 4 - 1; // SLIDES.length

  const SLIDES: Slide[] = [
    {
      id: "1",
      icon: "💳",
      title: t("onboarding.slide1Title"),
      subtitle: t("onboarding.slide1Subtitle"),
      accent: "bg-emerald-100",
    },
    {
      id: "2",
      icon: "🏦",
      title: t("onboarding.slide2Title"),
      subtitle: t("onboarding.slide2Subtitle"),
      accent: "bg-blue-100",
    },
    {
      id: "3",
      icon: "🔒",
      title: t("onboarding.slide3Title"),
      subtitle: t("onboarding.slide3Subtitle"),
      accent: "bg-violet-100",
    },
    {
      id: "4",
      icon: "📊",
      title: t("onboarding.slide4Title"),
      subtitle: t("onboarding.slide4Subtitle"),
      accent: "bg-amber-100",
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
    flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }, [isLast, activeIndex, onFinish]);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Top row: skip */}
      <View className="flex-row justify-end px-6 pt-2 pb-2" style={{ minHeight: 44 }}>
        {!isLast && (
          <Pressable
            onPress={onFinish}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-lime-500 text-base font-bold">{t("common.skip")}</Text>
          </Pressable>
        )}
      </View>

      {/* Slides — flex-1 so they fill remaining space */}
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

      {/* Bottom controls */}
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
