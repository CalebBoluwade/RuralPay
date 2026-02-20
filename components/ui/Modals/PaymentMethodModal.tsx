import AccountService from "@/lib/services/AccountService";
import BLEService from "@/lib/services/BLEService";
import NFCService from "@/lib/services/NFCService";
import ToastService from "@/lib/services/ToastService";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import BalanceCard from "../BalanceCard";

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  onPaymentMethodSelected: (data: {
    method: string;
    accountNumber?: string;
    accountName?: string;
  }) => void;
}

const paymentSchema = z.object({
  method: z.enum(["nfc", "bluetooth", "balance"], {
    message: "Please select a payment method",
  }),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  visible,
  onClose,
  amount,
  onPaymentMethodSelected,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [accountEnquiry, setAccountEnquiry] = useState<AccountBalanceEnquiry>();
  const [selectedAccount, setSelectedAccount] = useState<BalanceEnquiry | null>(
    null,
  );

  const [isBluetoothSupported, setIsBluetoothSupported] =
    useState<boolean>(false);
  const [isNFCSupported, setIsNFCSupported] = useState<boolean>(false);

  useEffect(() => {
    const checkNFC_Bluetooth = async () => {
      const supported = await NFCService.isSupported();
      const isBLEupported = await BLEService.initialize();

      setIsNFCSupported(supported);
      setIsBluetoothSupported(isBLEupported.success);
    };

    checkNFC_Bluetooth();
  }, []);

  const { control, watch, setValue } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const selectedMethod = watch("method");

  const paymentMethods = [
    {
      id: "nfc",
      name: "Tap to Pay (NFC)",
      description: "Pay using Contactless NFC",
      icon: "phone-portrait-outline",
      color: isDark ? "#a78bfa" : "#7c3aed",
      isAvailable: isNFCSupported,
    },
    {
      id: "bluetooth",
      name: "Bluetooth Payment",
      description: "Pay via Bluetooth connection",
      icon: "bluetooth",
      color: isDark ? "#60a5fa" : "#2563eb",
      isAvailable: isBluetoothSupported,
    },
    {
      id: "balance",
      name: "Account Balance",
      description: "Pay using your linked bank accounts",
      icon: "card-outline",
      color: isDark ? "#34d399" : "#059669",
      isAvailable: true,
    },
  ];

  const handleContinue = () => {
    if (!selectedMethod) return;

    if (selectedMethod === "balance" && !selectedAccount) return;

    if (
      selectedMethod === "balance" &&
      amount > (selectedAccount?.availableBalance || 0)
    ) {
      Alert.alert(
        "Insufficient Balance",
        "Your Available Balance is Insufficient For This Payment.",
      );
      return;
    } else if (
      selectedMethod === "balance" &&
      amount > (accountEnquiry?.singleTransactionLimit || 0)
    ) {
      Alert.alert(
        "Single Transaction Limit Exceeded",
        "You Have Exceeded Your Single Transaction Limit.",
      );
      return;
    }

    console.log("Payment method selected:", selectedMethod);
    onPaymentMethodSelected({
      method: selectedMethod,
      accountNumber: selectedAccount?.accountId,
      accountName: selectedAccount?.accountName,
    });
    onClose();
  };

  const loadAccountData = async () => {
    try {
      const balance = await AccountService.AccountBalance();
      setAccountEnquiry(balance);
    } catch {
      ToastService.error("Failed to Load Account Data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      setValue("accountId", selectedAccount.accountId);
      setValue("accountName", selectedAccount.accountName);
    }
  }, [selectedAccount]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
      >
        <View className="p-6">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Select Payment Method
            </Text>
            <Pressable
              onPress={onClose}
              className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            >
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#fff" : "#6B7280"}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View
            className={`p-6 rounded-2xl mb-6 border-2 border-dashed border-lime-300 ${isDark ? "bg-white/10" : "bg-gray-50"}`}
          >
            <Text
              className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Amount to Pay
            </Text>
            <Text
              className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              ₦{amount.toLocaleString()}
            </Text>
          </View>

          <Text
            className={`text-sm font-semibold mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Choose Payment Method
          </Text>

          <Controller
            control={control}
            name="method"
            render={({ field: { onChange, value } }) => (
              <View className="gap-3 mb-6">
                {paymentMethods.map((method) => (
                  <Pressable
                    key={method.id}
                    onPress={() => {
                      if (method.isAvailable) {
                        onChange(method.id);
                        if (method.id !== "balance") {
                          setSelectedAccount(null);
                          setValue("accountId", undefined);
                          setValue("accountName", undefined);
                        }
                      }
                    }}
                    disabled={!method.isAvailable}
                    className={`p-5 rounded-2xl ${
                      value === method.id
                        ? isDark
                          ? "bg-white/20 border-2 border-white/40"
                          : "bg-gray-100 border-2 border-gray-400"
                        : isDark
                          ? "bg-white/10 border border-white/20"
                          : "bg-gray-50 border border-gray-200"
                    } ${!method.isAvailable ? "opacity-40" : ""}`}
                  >
                    <View className="flex-row items-center gap-4">
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center border-2 ${
                          value === method.id
                            ? "bg-lime-500 border-lime-500"
                            : "border-lime-500"
                        }`}
                      >
                        {value === method.id && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? "bg-white/10" : "bg-white"}`}
                      >
                        <Ionicons
                          name={method.icon as any}
                          size={24}
                          color={method.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {method.name}
                        </Text>
                        <Text
                          className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {method.description}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}

                {value === "balance" && (
                  <BalanceCard
                    accountEnquiry={accountEnquiry}
                    loading={loading}
                    onAccountChange={(account) => {
                      setSelectedAccount(account);
                    }}
                  />
                )}

                {value === "nfc" && (
                  <View className="mt-2">
                    <Text
                      className={`text-center mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Tap your card to pay
                    </Text>
                    <Pressable
                      onPress={async () => {
                        const cardInfo = await NFCService.readCard();

                        if (cardInfo?.success) {
                          ToastService.success("Payment Successful via NFC!");
                          onPaymentMethodSelected({ method: "nfc" });
                          onClose();
                        } else {
                          ToastService.error("Failed to read card");
                        }
                      }}
                      className={`py-3 rounded-xl ${isDark ? "bg-lime-500" : "bg-green-600"}`}
                    >
                      <Text
                        className={`text-center text-base font-bold ${isDark ? "text-black" : "text-white"}`}
                      >
                        Tap to Pay
                      </Text>
                    </Pressable>
                  </View>
                )}

                {value === "bluetooth" && (
                  <View className="mt-2">
                    <Text
                      className={`text-center mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Waiting for customer payment
                    </Text>
                    <Pressable
                      onPress={async () => {
                        ToastService.info("Starting payment server...");

                        await BLEService.startAdvertising({ amount });

                        const result = await BLEService.startPaymentServer(
                          (payment) => {
                            console.log(payment);

                            ToastService.success(
                              "Payment Successful via Bluetooth!",
                            );
                            onPaymentMethodSelected({ method: "bluetooth" });
                            onClose();
                          },
                        );

                        if (!result.success) {
                          ToastService.error(
                            result.success || "Failed to start server",
                          );
                        }
                      }}
                      className={`py-3 rounded-xl ${isDark ? "bg-lime-500" : "bg-green-600"}`}
                    >
                      <Text
                        className={`text-center text-base font-bold ${isDark ? "text-black" : "text-white"}`}
                      >
                        Start Payment Server
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          />

          <Pressable
            onPress={handleContinue}
            disabled={
              !selectedMethod ||
              (selectedMethod === "balance" && !selectedAccount)
            }
            className={`py-4 rounded-xl mb-6 ${
              selectedMethod &&
              (selectedMethod !== "balance" || selectedAccount)
                ? "bg-lime-500"
                : isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center text-base font-bold ${selectedMethod && (selectedMethod !== "balance" || selectedAccount) ? "text-black" : isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Continue
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default PaymentMethodModal;
