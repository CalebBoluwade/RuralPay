import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SvgUri } from "react-native-svg";

type TokenStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type CardScheme = "VISA" | "MASTERCARD" | "VERVE";

interface UICardInfo {
  bin: string;
  last4: string;
  holder: string;
  expiryDate: string;
  accent: string;
  tokenStatus: TokenStatus;
  nfcEnabled: boolean;
  scheme: CardScheme;
}

interface PaymentCardProps {
  card: UICardInfo;
  isSelected: boolean;
  onSelect: () => void;
}

const TOKEN_STATUS_COLORS: Record<
  TokenStatus,
  { bg: string; text: string; label: string }
> = {
  ACTIVE: { bg: "#16a34a33", text: "#4ade80", label: "Active" },
  INACTIVE: { bg: "#ffffff1a", text: "#9ca3af", label: "Inactive" },
  PENDING: { bg: "#ca8a0433", text: "#fbbf24", label: "Pending" },
};

const SCHEME_ASSETS: Partial<Record<CardScheme, number>> = {
  VISA: require("@/assets/images/visa.svg"),
  MASTERCARD: require("@/assets/images/mastercard.svg"),
};

function TokenBadge({ status }: { status: TokenStatus }) {
  const { bg, text, label } = TOKEN_STATUS_COLORS[status];
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          color: text,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function NFCIcon({ active, color }: { active: boolean; color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [active]);

  return (
    <View
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active && (
        <Animated.View
          style={{
            position: "absolute",
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: color,
            opacity: 0.3,
            transform: [{ scale: pulse }],
          }}
        />
      )}
      <MaterialCommunityIcons
        name="nfc"
        size={22}
        color={active ? color : "#ffffff40"}
      />
    </View>
  );
}

function SchemeLogo({ scheme }: { scheme: CardScheme }) {
  const assetModule = SCHEME_ASSETS[scheme];
  const uri = assetModule ? Asset.fromModule(assetModule).uri : null;
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      {uri ? (
        <SvgUri uri={uri} width={48} height={28} />
      ) : (
        <>
          <MaterialCommunityIcons
            name="credit-card"
            size={24}
            color="#00425f"
          />
          <Text
            style={{
              color: "#ffffffa0",
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            {scheme}
          </Text>
        </>
      )}
    </View>
  );
}

const PaymentCard = ({ card, isSelected, onSelect }: PaymentCardProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.02 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isSelected]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onSelect}
        className="gap-2"
        style={{
          borderRadius: 16,
          margin: 12,
          padding: 20,
          overflow: "hidden",
          backgroundColor: "#1a1a2e",
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? card.accent : "#ffffff15",
          shadowColor: isSelected ? card.accent : "#000",
          shadowOffset: { width: 0, height: isSelected ? 12 : 4 },
          shadowOpacity: isSelected ? 0.5 : 0.3,
          shadowRadius: isSelected ? 20 : 8,
          elevation: isSelected ? 12 : 4,
        }}
      >
        {/* Accent glow top-right */}
        <View
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: card.accent,
            opacity: 0.12,
          }}
        />

        {/* Top row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <TokenBadge status={card.tokenStatus} />
          <View hitSlop={8}>
            <NFCIcon
              active={card.nfcEnabled && card.tokenStatus === "ACTIVE"}
              color={card.accent}
            />
          </View>
        </View>

        {/* Chip */}
        <View style={{ marginBottom: 16 }}>
          <MaterialCommunityIcons
            name="integrated-circuit-chip"
            size={36}
            color="#d4af37"
          />
        </View>

        {/* Card number */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#ffffff80",
              fontSize: 15,
              fontFamily: "monospace",
              letterSpacing: 3,
            }}
          >
            {card.bin.slice(0, 4)}
          </Text>
          <Text
            style={{
              color: "#ffffff60",
              fontSize: 15,
              fontFamily: "monospace",
              letterSpacing: 3,
            }}
          >
            ••••
          </Text>
          <Text
            style={{
              color: "#ffffff60",
              fontSize: 15,
              fontFamily: "monospace",
              letterSpacing: 3,
            }}
          >
            ••••
          </Text>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 15,
              fontFamily: "monospace",
              letterSpacing: 3,
              fontWeight: "700",
            }}
          >
            {card.last4}
          </Text>
        </View>

        {/* Bottom row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text
              style={{
                color: "#ffffff60",
                fontSize: 9,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              Cardholder
            </Text>
            <Text
              style={{
                color: "#ffffffd9",
                fontSize: 13,
                fontFamily: "monospace",
                letterSpacing: 1,
                fontWeight: "600",
              }}
            >
              {card.holder}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  color: "#ffffff60",
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Exp
              </Text>
              <Text
                style={{
                  color: "#ffffff99",
                  fontSize: 11,
                  fontFamily: "monospace",
                  fontWeight: "600",
                }}
              >
                {card.expiryDate}
              </Text>
            </View>
          </View>
          <SchemeLogo scheme={card.scheme} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default PaymentCard;
