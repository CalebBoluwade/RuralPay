import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
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
  size = 200,
  showLabels = true,
  showTooltip = true,
  enableHaptics = true,
}: Readonly<PieChartProps>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const mountProgress = useSharedValue(0);

  useEffect(() => {
    mountProgress.value = withSpring(1, { damping: 15 });
  }, []);

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
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  let currentAngle = -90;

  return (
    <View style={styles.container}>
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
          <View style={[styles.tooltip, { top: center - 30 }]}>
            <Text style={styles.tooltipLabel}>
              {data[selectedIndex].label || `Item ${selectedIndex + 1}`}
            </Text>
            <Text style={styles.tooltipValue}>
              N{data[selectedIndex].value.toFixed(2)}
            </Text>
            <Text style={styles.tooltipPercent}>
              {((data[selectedIndex].value / total) * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      {showLabels && (
        <View style={styles.legendContainer}>
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const isSelected = selectedIndex === index;

            return (
              <Pressable
                key={index}
                style={[
                  styles.legendItem,
                  isSelected && styles.legendItemSelected,
                ]}
                onPress={() => handlePress(index)}
              >
                <View
                  style={[styles.legendColor, { backgroundColor: item.color }]}
                />
                <View style={styles.legendText}>
                  <Text style={styles.legendLabel}>
                    {item.label || `Item ${index + 1}`}
                  </Text>
                  <Text style={styles.legendValue}>
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

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 20,
    width: "100%",
  },
  tooltip: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 120,
  },
  tooltipLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  tooltipValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tooltipPercent: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  legendContainer: {
    width: "100%",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    gap: 12,
  },
  legendItemSelected: {
    backgroundColor: "#e0e0e0",
    transform: [{ scale: 1.02 }],
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
    color: "#666",
  },
});
