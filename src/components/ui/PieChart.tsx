import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface PieChartData {
  value: number;
  color: string;
  label?: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLabels?: boolean;
  showTooltip?: boolean;
  enableHaptics?: boolean;
}

export default function PieChart({
  data,
  size = 250,
  showLabels = true,
  showTooltip = true,
  enableHaptics = true,
}: Readonly<PieChartProps>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) return null;

  const radius = size / 2;
  const center = size / 2;
  const innerRadius = radius * 0.5;

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angle: number,
  ) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const createPath = (
    startAngle: number,
    endAngle: number,
    isSelected: boolean,
  ) => {
    const r = isSelected ? radius * 1.05 : radius;
    const start = polarToCartesian(center, center, r, endAngle);
    const end = polarToCartesian(center, center, r, startAngle);
    const innerStart = polarToCartesian(center, center, innerRadius, endAngle);
    const innerEnd = polarToCartesian(center, center, innerRadius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y} Z`;
  };

  const handlePress = (index: number) => {
    if (enableHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  let currentAngle = -90;

  return (
    <View className="items-center gap-5 w-full">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G>
            {data.map((item, index) => {
              const angle = (item.value / total) * 360;
              const isSelected = selectedIndex === index;
              const path = createPath(
                currentAngle,
                currentAngle + angle,
                isSelected,
              );
              currentAngle += angle;
              return (
                <G key={index + 1}>
                  <AnimatedPath
                    d={path}
                    fill={item.color}
                    opacity={selectedIndex === null || isSelected ? 1 : 0.5}
                    onPress={() => handlePress(index)}
                  />
                </G>
              );
            })}
          </G>
        </Svg>

        {showTooltip && selectedIndex !== null && (
          <View
            className="absolute self-center bg-black/80 px-3 py-2 rounded-lg items-center min-w-[120px]"
            style={{ top: center - 30 }}
          >
            <Text className="text-white text-xs font-semibold mb-1">
              {data[selectedIndex].label || `Item ${selectedIndex + 1}`}
            </Text>
            <Text className="text-white text-lg font-bold">
              N{data[selectedIndex].value.toFixed(2)}
            </Text>
            <Text className="text-[#aaa] text-xs mt-0.5">
              {((data[selectedIndex].value / total) * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      {showLabels && (
        <View className="w-full gap-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const isSelected = selectedIndex === index;
            return (
              <Pressable
                key={index + 1}
                className={`flex-row items-center p-3 rounded-lg gap-3 ${
                  isSelected ? "bg-neutral-200 scale-[1.02]" : "bg-neutral-100"
                }`}
                onPress={() => handlePress(index)}
              >
                <View
                  className="w-4 h-4 rounded-[4px]"
                  style={{ backgroundColor: item.color }}
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-[#333] mb-0.5">
                    {item.label || `Item ${index + 1}`}
                  </Text>
                  <Text className="text-xs text-[#666]">
                    ${item.value.toFixed(2)} ({percentage}%)
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
