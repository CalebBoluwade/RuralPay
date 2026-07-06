// utils/statusColors.ts
export const statusColorMap: Record<string, string> = {
  COMPLETED: "#16A34A",
  CANCELLED: "#F59E0B",
  FAILED_SETTLEMENT: "#DC2626",
};

export const formatNaira = (amount: number | undefined) => {
  if (!amount) return "₦0.00";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export const isAccountNameValid = (accountName: string | null): boolean => {
  return Boolean(
    accountName &&
    accountName !== "Account Not Found" &&
    !accountName.includes("error") &&
    !accountName.includes("Failed"),
  );
};

export const maskPhone = (phone?: string) => {
  if (!phone) return "+234 ••• ••• 1234";
  const last4 = phone.slice(-4);
  return `+234 ••• ••• ${last4}`;
};

export const maskEmail = (email?: string) => {
  if (!email) return "u••••@example.com";
  const [name, domain] = email.split("@");
  return `${name[0]}••••@${domain}`;
};

export const maskAccountNumber = (accountNumber?: string) => {
  if (!accountNumber) return "••••1234";
  const last4 = accountNumber.slice(-4);
  return `••••${last4}`;
};

export const maskCardNumber = (cardNumber?: string) => {
  if (!cardNumber) return "•••• •••• •••• 1234";
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
};

export const LoginAPIResponseMessage = (responseCode: number) => {
  console.log("Login API Response Code: ", responseCode);

  switch (responseCode) {
    case 401:
      return "Invalid Credentials";
    case 400:
      return "Something Went Wrong";
    case 429:
      return "Too Many Login Attempts. Try Again Later";
    default:
      return (
        "Login Failed. Check Your Connection And Try Again. " +
        (__DEV__ ? process.env.EXPO_PUBLIC_API_URL : "") +
        (__DEV__ ? (responseCode ? ` (Error Code: ${responseCode})` : "") : "")
      );
  }
};
