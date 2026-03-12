import AccountService from "@/lib/services/AccountService";
import BLEService from "@/lib/services/BLEService";
import NFCService from "@/lib/services/NFCService";
import PaymentService from "@/lib/services/PaymentService";
import ToastService from "@/lib/services/ToastService";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bluetooth,
  Check,
  Smartphone,
  Tag,
  WalletMinimal,
  X,
} from "lucide-react-native";
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
import BalanceCard from "../../BalanceCard";
import SettingsButton from "../../SettingsButton";

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  useValuedAddedServices?: boolean;
  vasType?: VASType;
  useNFCCards?: boolean;
  useBluetoothPaymentMethod?: boolean;
  onPaymentMethodSelected: (data: {
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
    appliedVoucher?: Voucher;
    finalAmount?: number;
  }) => void;
}

const PaymentMethods = ["BALANCE", "NFC_CARD", "BLUETOOTH"] as PaymentMethod[];

const paymentSchema = z.object({
  method: z.enum(PaymentMethods, {
    message: "Please Select a Payment Method",
  }),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

type PaymentMethodItemProps = {
  method: {
    id: string;
    name: string;
    description: string;
    icon: React.FC<{ size: number; color: string }>;
    color: string;
    isAvailable: boolean;
  };
  selected: boolean;
  isDark: boolean;
  onSelect: (id: string) => void;
};

const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
  method,
  selected,
  isDark,
  onSelect,
}) => (
  <Pressable
    key={method.id}
    onPress={() => onSelect(method.id)}
    disabled={!method.isAvailable}
    className={`p-5 rounded-2xl ${
      selected
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
        className={`w-6 h-6 rounded-full items-center justify-center border-2 ${selected ? "bg-lime-500 border-lime-500" : "border-lime-500"}`}
      >
        {selected && <Check size={16} color="white" />}
      </View>
      <View
        className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? "bg-white/10" : "bg-white"}`}
      >
        <method.icon size={24} color={method.color} />
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
);

type PaymentMethodActionsProps = {
  value: string;
  isDark: boolean;
  isNFCSupported: boolean;
  isBluetoothSupported: boolean;
  amount: number;
  accountEnquiry: AccountBalanceEnquiry | undefined;
  loading: boolean;
  onAccountChange: (account: BalanceEnquiry | null) => void;
  onPaymentMethodSelected: (data: { method: PaymentMethod }) => void;
  onClose: () => void;
};

const PaymentMethodActions: React.FC<PaymentMethodActionsProps> = ({
  value,
  isDark,
  isNFCSupported,
  isBluetoothSupported,
  amount,
  accountEnquiry,
  loading,
  onAccountChange,
  onPaymentMethodSelected,
  onClose,
}) => (
  <>
    {value === "BALANCE" && (
      <BalanceCard
        accountEnquiry={accountEnquiry}
        loading={loading}
        onAccountChange={onAccountChange}
      />
    )}
    {!isNFCSupported && value === "NFC_CARD" && <SettingsButton type="nfc" />}
    {!isBluetoothSupported && value === "BLUETOOTH" && (
      <SettingsButton type="bluetooth" />
    )}
    {value === "NFC_CARD" && (
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
              onPaymentMethodSelected({ method: "NFC_CARD" });
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
    {value === "BLUETOOTH" && (
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
            const result = await BLEService.startPaymentServer((payment) => {
              console.log(payment);
              ToastService.success("Payment Successful via Bluetooth!");
              onPaymentMethodSelected({ method: "BLUETOOTH" });
              onClose();
            });
            if (!result.success) {
              ToastService.error(result.success || "Failed to start server");
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
  </>
);

type VoucherSectionProps = {
  vasType: VASType;
  amount: number;
  isDark: boolean;
  onVoucherApplied: (voucher: Voucher | null, finalAmount: number) => void;
};

const VoucherSection: React.FC<VoucherSectionProps> = ({
  vasType,
  amount,
  isDark,
  onVoucherApplied,
}) => {
  const [selected, setSelected] = useState<Voucher | null>(null);
  const [available, setAvailable] = useState<Voucher[]>([]);

  useEffect(() => {
    PaymentService.FetchVouchers(vasType).then(setAvailable);
  }, [vasType]);

  const calcDiscount = (v: Voucher) =>
    v.voucherType === "FIXED"
      ? Math.min(v.voucherDiscountAmount, amount)
      : Math.round((v.voucherDiscountAmount / 100) * amount);

  const handleSelect = (v: Voucher) => {
    const next = selected?.id === v.id ? null : v;
    setSelected(next);
    const discount = next ? calcDiscount(next) : 0;
    onVoucherApplied(next, amount - discount);
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center gap-2 mb-3">
        <Tag size={16} color={isDark ? "#a3e635" : "#65a30d"} />
        <Text
          className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
        >
          Available Vouchers
        </Text>
      </View>
      <View className="gap-2">
        {available.length === 0 ? (
          <View
            className={`p-4 rounded-xl border border-dashed items-center gap-1 ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Tag size={20} color={isDark ? "#4b5563" : "#d1d5db"} />
            <Text
              className={`text-xs text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              No vouchers available for this purchase
            </Text>
          </View>
        ) : (
          available.map((v) => {
            const isSelected = selected?.id === v.id;
            const saving = calcDiscount(v);
            return (
              <Pressable
                key={v.id}
                onPress={() => handleSelect(v)}
                className={`flex-row items-center justify-between p-4 rounded-xl border ${
                  isSelected
                    ? isDark
                      ? "bg-lime-500/20 border-lime-400"
                      : "bg-lime-50 border-lime-500"
                    : isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-5 h-5 rounded-full items-center justify-center border-2 ${
                      isSelected
                        ? "bg-lime-500 border-lime-500"
                        : "border-lime-500"
                    }`}
                  >
                    {isSelected && <Check size={12} color="white" />}
                  </View>
                  <View>
                    <Text
                      className={`text-xs font-bold tracking-widest ${
                        isDark ? "text-lime-400" : "text-lime-700"
                      }`}
                    >
                      {v.voucherCode}
                    </Text>
                    <Text
                      className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {v.voucherDescription}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-sm font-bold ${isDark ? "text-lime-400" : "text-lime-700"}`}
                >
                  -₦{saving.toLocaleString()}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
};

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  visible,
  onClose,
  amount,
  useValuedAddedServices = false,
  vasType = "general",
  useNFCCards = false,
  useBluetoothPaymentMethod = false,
  onPaymentMethodSelected,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [accountEnquiry, setAccountEnquiry] = useState<AccountBalanceEnquiry>();
  const [selectedAccount, setSelectedAccount] = useState<BalanceEnquiry | null>(
    null,
  );
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [finalAmount, setFinalAmount] = useState(amount);

  useEffect(() => {
    setFinalAmount(amount);
  }, [amount]);

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
      id: "BALANCE",
      name: "Account Balance",
      description: "Pay using your linked bank accounts",
      icon: WalletMinimal,
      color: isDark ? "#34d399" : "#059669",
      isAvailable: true,
    },
    ...(useBluetoothPaymentMethod
      ? [
          {
            id: "BLUETOOTH",
            name: "Bluetooth Payment",
            description: "Pay via Bluetooth connection",
            icon: Bluetooth,
            color: isDark ? "#60a5fa" : "#2563eb",
            isAvailable: isBluetoothSupported,
          },
        ]
      : []),
    ...(useNFCCards
      ? [
          {
            id: "NFC_CARD",
            name: "Wallet Cards",
            description: "Pay using Contactless Cards",
            icon: Smartphone,
            color: isDark ? "#a78bfa" : "#7c3aed",
            isAvailable: isNFCSupported,
          },
        ]
      : []),
  ];

  const validateBalance = () => {
    if (finalAmount > (selectedAccount?.availableBalance || 0)) {
      Alert.alert(
        "Insufficient Balance",
        "Your Available Balance is Insufficient For This Payment.",
      );
      return false;
    }
    if (finalAmount > (accountEnquiry?.singleTransactionLimit || 0)) {
      Alert.alert(
        "Single Transaction Limit Exceeded",
        "You Have Exceeded Your Single Transaction Limit.",
      );
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!selectedMethod) return;
    if (selectedMethod === "BALANCE" && !selectedAccount) return;
    if (selectedMethod === "BALANCE" && !validateBalance()) return;

    console.log("Payment method selected:", selectedMethod);
    const paymentResult = await onPaymentMethodSelected({
      method: selectedMethod,
      accountNumber: selectedAccount?.accountId,
      accountName: selectedAccount?.accountName,
      appliedVoucher: appliedVoucher ?? undefined,
      finalAmount,
    });

    console.log(paymentResult);
    onClose();
  };

  const loadAccountData = async () => {
    try {
      const balance = await AccountService.AccountBalanceEnquiry();
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
              className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Select Payment Method
            </Text>
            <Pressable
              onPress={onClose}
              className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            >
              <X size={24} color={isDark ? "#fff" : "#6B7280"} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
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
            {appliedVoucher ? (
              <View className="flex-row items-baseline gap-2">
                <Text
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  ₦{finalAmount.toLocaleString()}
                </Text>
                <Text
                  className={`text-base line-through ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  ₦{amount.toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                ₦{amount.toLocaleString()}
              </Text>
            )}
            {appliedVoucher && (
              <Text
                className={`text-xs mt-1 ${isDark ? "text-lime-400" : "text-lime-600"}`}
              >
                {appliedVoucher.voucherCode} applied · saving ₦
                {(amount - finalAmount).toLocaleString()}
              </Text>
            )}
          </View>

          {useValuedAddedServices && (
            <VoucherSection
              vasType={vasType}
              amount={amount}
              isDark={isDark}
              onVoucherApplied={(v, fa) => {
                setAppliedVoucher(v);
                setFinalAmount(fa);
              }}
            />
          )}

          <Text
            className={`text-sm font-semibold mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Choose Payment Method
          </Text>

          <Controller
            control={control}
            name="method"
            render={({ field: { onChange, value } }) => {
              const handleSelect = (id: string) => {
                onChange(id);
                if (id !== "BALANCE") {
                  setSelectedAccount(null);
                  setValue("accountId", undefined);
                  setValue("accountName", undefined);
                }
              };
              return (
                <View className="gap-3 mb-6">
                  {paymentMethods.map((method) => (
                    <PaymentMethodItem
                      key={method.id}
                      method={method}
                      selected={value === method.id}
                      isDark={isDark}
                      onSelect={handleSelect}
                    />
                  ))}
                  <PaymentMethodActions
                    value={value}
                    isDark={isDark}
                    isNFCSupported={isNFCSupported}
                    isBluetoothSupported={isBluetoothSupported}
                    amount={amount}
                    accountEnquiry={accountEnquiry}
                    loading={loading}
                    onAccountChange={setSelectedAccount}
                    onPaymentMethodSelected={onPaymentMethodSelected}
                    onClose={onClose}
                  />
                </View>
              );
            }}
          />

          <Pressable
            onPress={handleContinue}
            disabled={
              !selectedMethod ||
              (selectedMethod === "BALANCE" && !selectedAccount)
            }
            className={`py-4 rounded-xl mb-6 ${
              selectedMethod &&
              (selectedMethod !== "BALANCE" || selectedAccount)
                ? "bg-lime-500"
                : isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center text-base font-bold ${selectedMethod && (selectedMethod !== "BALANCE" || selectedAccount) ? "text-black" : isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Pay ₦{finalAmount.toLocaleString()}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default PaymentMethodModal;
