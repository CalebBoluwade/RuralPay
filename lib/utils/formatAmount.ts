export const formatAmount = (
  amount: number,
  currency: string = "NGN",
  showSign: boolean = false,
  isCredit: boolean = false,
): string => {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

  return showSign ? (isCredit ? "+" : "-") + formatted : formatted;
};
