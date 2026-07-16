import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface Props {
  isDark: boolean;
  isLoading: boolean;
  BINData: any;
  cardTransaction: any;
  merchantBusinessName: string;
  merchantCommisionRate: number;
  amount: number;
  onCancel: () => void;
  HandleCardTapPayment: () => void;
  renderCardSchemeLogo: () => React.ReactNode;
}

const CardPaymentSummaryCard: React.FC<Props> = ({
  isDark,
  isLoading,
  BINData,
  cardTransaction,
  merchantBusinessName,
  merchantCommisionRate,
  amount,
  onCancel,
  HandleCardTapPayment,
  renderCardSchemeLogo,
}) => {
  console.log(BINData);
  return (
    <View
      className={`flex-1 w-full p-5 rounded-2xl ${
        isDark
          ? "bg-white/10 border border-white/20"
          : "bg-white border border-gray-200"
      }`}
    >
      {/* Title */}
      <Text
        className={`text-2xl font-bold mb-6 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Confirm Payment
      </Text>

      {/* PAN */}
      <Text
        className={`text-lg mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        Card PAN
      </Text>
      <Text
        numberOfLines={1}
        className={`text-xl font-bold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {cardTransaction?.success
          ? cardTransaction?.BIN + "****" + cardTransaction?.cardInfo?.last4
          : ""}
      </Text>

      <View className="h-[1px] bg-gray-200/20 my-2" />

      {/* Bank */}
      <Text
        className={`text-base mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        Card Issuing Bank
      </Text>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isDark ? "#a78bfa" : "#7c3aed"}
        />
      ) : (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className={`text-xl font-bold flex-shrink ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {BINData?.issuerBank ?? "Bank Not Confirmed"}
        </Text>
      )}

      <View className="h-[1px] bg-gray-200/20 my-2" />

      {/* Scheme */}
      <Text
        className={`text-base mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        Card Issuing Network
      </Text>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isDark ? "#a78bfa" : "#7c3aed"}
        />
      ) : (
        <View className="flex-row items-center gap-3 w-full">
          {renderCardSchemeLogo()}
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={`text-xl font-bold flex-shrink ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {BINData?.scheme ? BINData.scheme.toUpperCase() : "Unknown Scheme"}
          </Text>
        </View>
      )}

      <View className="h-[1px] bg-gray-200/20 my-2" />

      {/* Merchant */}
      <Text
        className={`text-base mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        Merchant
      </Text>
      <Text
        numberOfLines={2}
        className={`text-xl font-bold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {merchantBusinessName}
      </Text>

      <View className="h-[1px] bg-gray-200/20 my-2" />

      <Text
        className={`text-base mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        Merchant Commission
      </Text>
      <Text
        numberOfLines={1}
        className={`text-xl font-bold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {merchantCommisionRate}%
      </Text>

      <View className="h-[1px] bg-gray-200/20 my-2" />

      {/* Amount */}
      <Text
        className={`text-base mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        Amount
      </Text>
      <Text className="text-3xl font-bold text-emerald-500">
        ₦{amount ? amount.toFixed(2) : "0.00"}
      </Text>

      <View className="h-[1px] bg-gray-200/20 my-2" />

      {/* Actions */}
      <View className="flex-row items-center gap-3">
        <Pressable
          disabled={isLoading || !BINData}
          className={`w-40 bg-lime-400 rounded-2xl px-3 py-4 ${
            isLoading || !BINData ? "opacity-50" : ""
          }`}
          onPress={HandleCardTapPayment}
        >
          <Text className="text-white text-lg font-bold text-center">
            {isLoading ? "Verifying Card..." : "Confirm & Pay"}
          </Text>
        </Pressable>

        <Pressable
          className={`w-32 p-4 rounded-2xl ${
            isDark ? "bg-white/5" : "bg-gray-100"
          }`}
          onPress={onCancel}
        >
          <Text
            numberOfLines={1}
            className={`text-lg font-bold text-center text-red-700`}
          >
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CardPaymentSummaryCard;
