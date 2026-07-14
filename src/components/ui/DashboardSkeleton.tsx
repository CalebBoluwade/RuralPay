import { useEffect, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 50;

function useShimmer() {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return anim;
}

function SkeletonBox({
  opacity,
  className,
  style,
}: {
  opacity: Animated.Value;
  className: string;
  style?: object;
}) {
  return <Animated.View style={[{ opacity }, style]} className={className} />;
}

export function DashboardSkeleton({ isDark }: { isDark: boolean }) {
  const opacity = useShimmer();
  const bg = isDark ? "bg-white/10" : "bg-slate-200";

  return (
    <View className="px-5">
      {/* Balance card skeleton */}
      <View className="mb-4 mt-2">
        <SkeletonBox
          opacity={opacity}
          className={`h-4 w-32 rounded-full mb-3 ${bg}`}
        />
        <SkeletonBox
          opacity={opacity}
          className={`rounded-2xl mb-2 ${bg}`}
          style={{ width: CARD_WIDTH, height: 110 }}
        />
      </View>

      {/* Quick actions skeleton */}
      <View className="flex-row gap-3 mb-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-1 items-center gap-2">
            <SkeletonBox
              opacity={opacity}
              className={`w-16 h-16 rounded-2xl ${bg}`}
            />
            <SkeletonBox
              opacity={opacity}
              className={`h-2.5 w-10 rounded-full ${bg}`}
            />
          </View>
        ))}
      </View>

      {/* Section label skeleton */}
      <SkeletonBox
        opacity={opacity}
        className={`h-4 w-40 rounded-full mb-4 ${bg}`}
      />

      {/* Transaction row skeletons */}
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          className={`flex-row items-center py-4 gap-3 ${
            i < 3
              ? isDark
                ? "border-b border-white/10"
                : "border-b border-slate-100"
              : ""
          }`}
        >
          <SkeletonBox
            opacity={opacity}
            className={`w-12 h-12 rounded-xl ${bg}`}
          />
          <View className="flex-1 gap-2">
            <SkeletonBox
              opacity={opacity}
              className={`h-3.5 w-32 rounded-full ${bg}`}
            />
            <SkeletonBox
              opacity={opacity}
              className={`h-2.5 w-20 rounded-full ${bg}`}
            />
          </View>
          <View className="items-end gap-2">
            <SkeletonBox
              opacity={opacity}
              className={`h-3.5 w-16 rounded-full ${bg}`}
            />
            <SkeletonBox
              opacity={opacity}
              className={`h-5 w-20 rounded-full ${bg}`}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function MerchantDashboardSkeleton({ isDark }: { isDark: boolean }) {
  const opacity = useShimmer();
  const bg = isDark ? "bg-white/10" : "bg-slate-200";

  return (
    <View className="px-5">
      {/* Stats row skeleton */}
      <View className="flex-row gap-3 mt-2 mb-5">
        {[0, 1].map((i) => (
          <View
            key={i}
            className={`flex-1 p-4 rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-white border border-slate-200"}`}
          >
            <SkeletonBox
              opacity={opacity}
              className={`h-2.5 w-24 rounded-full mb-3 ${bg}`}
            />
            <SkeletonBox
              opacity={opacity}
              className={`h-7 w-28 rounded-lg ${bg}`}
            />
          </View>
        ))}
      </View>

      {/* Quick actions skeleton */}
      {/* <View className="flex-row gap-3 mb-6">
        {[0, 1].map((i) => (
          <View key={i} className="flex-1 items-center gap-2">
            <SkeletonBox opacity={opacity} className={`w-16 h-16 rounded-2xl ${bg}`} />
            <SkeletonBox opacity={opacity} className={`h-2.5 w-10 rounded-full ${bg}`} />
          </View>
        ))}
      </View> */}

      {/* Actions section label */}
      <SkeletonBox
        opacity={opacity}
        className={`h-4 w-20 rounded-full mb-3 ${bg}`}
      />

      {/* Menu item skeletons */}
      <View
        className={`rounded-2xl overflow-hidden mb-6 ${isDark ? "bg-white/10 border border-white/20" : "bg-white border border-slate-200"}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={`flex-row items-center px-4 py-4 gap-4 ${
              i < 3
                ? isDark
                  ? "border-b border-white/10"
                  : "border-b border-slate-100"
                : ""
            }`}
          >
            <SkeletonBox
              opacity={opacity}
              className={`w-12 h-12 rounded-xl ${bg}`}
            />
            <View className="flex-1 gap-2">
              <SkeletonBox
                opacity={opacity}
                className={`h-3.5 w-32 rounded-full ${bg}`}
              />
              <SkeletonBox
                opacity={opacity}
                className={`h-2.5 w-44 rounded-full ${bg}`}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Section label */}
      <SkeletonBox
        opacity={opacity}
        className={`h-4 w-40 rounded-full mb-4 ${bg}`}
      />

      {/* Transaction row skeletons */}
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className={`flex-row items-center py-4 gap-3 ${
            i < 2
              ? isDark
                ? "border-b border-white/10"
                : "border-b border-slate-100"
              : ""
          }`}
        >
          <SkeletonBox
            opacity={opacity}
            className={`w-12 h-12 rounded-xl ${bg}`}
          />
          <View className="flex-1 gap-2">
            <SkeletonBox
              opacity={opacity}
              className={`h-3.5 w-32 rounded-full ${bg}`}
            />
            <SkeletonBox
              opacity={opacity}
              className={`h-2.5 w-20 rounded-full ${bg}`}
            />
          </View>
          <View className="items-end gap-2">
            <SkeletonBox
              opacity={opacity}
              className={`h-3.5 w-16 rounded-full ${bg}`}
            />
            <SkeletonBox
              opacity={opacity}
              className={`h-5 w-20 rounded-full ${bg}`}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
