import PaymentCard from "@/components/PaymentCard";
import AmountInput from "@/components/ui/Input/AmountInput";
import PaymentMethodModal from "@/components/ui/Modals/Transaction/PaymentMethodModal";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { CardPaySchema, cardPaySchema } from "@/lib/schema/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { ScrollView, useColorScheme } from "react-native";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";

const TokenizedCards = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showPaymentMethodModal, setShowPaymentMethodModal] =
    React.useState(false);

  const {
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CardPaySchema>({
    resolver: zodResolver(cardPaySchema),
    defaultValues: {
      cardId: "",
      amount: "",
    },
    reValidateMode: "onChange",
  });

  const cards = [
    {
      id: 1,
      bin: "423456",
      last4: "1234",
      holder: "John Doe",
      expiryDate: "12/25",
      accent: "#6366f1",
      tokenStatus: "ACTIVE" as const,
      nfcEnabled: true,
      scheme: "VISA" as const,
    },
    {
      id: 2,
      bin: "512345",
      last4: "5678",
      holder: "John Doe",
      expiryDate: "08/24",
      accent: "#eb001b",
      tokenStatus: "INACTIVE" as const,
      nfcEnabled: false,
      scheme: "MASTERCARD" as const,
    },
  ];

  function handlePaymentMethodSelected(data: {
    method: PaymentMethod;
    accountNumber?: string;
    accountName?: string;
  }): void {
    if (data.method !== "NFC_CARD") return;
  }

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-slate-50"}
    >
      <ScreenHeader title="Wallet" onBack={() => router.back()} />
      <ScrollView
        className="flex-1 mt-2 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
      >
        <AmountInput
          error={errors.amount?.message}
          onAmountChange={(amt) => setValue("amount", amt)}
        />

        <PagerView style={{ height: 250 }} initialPage={0}>
          {cards.map(({ id, ...card }) => (
            <PaymentCard
              key={id}
              card={card}
              isSelected={getValues("cardId") === id.toString()}
              onSelect={() => setValue("cardId", id.toString())}
            />
          ))}
        </PagerView>
      </ScrollView>

      <PaymentMethodModal
        visible={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        amount={Number.parseFloat(getValues("amount") || "0") || 0}
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />
    </SafeAreaView>
  );
};

export default TokenizedCards;
