import { NativeModules, Platform } from "react-native";

const { PaymentActivity } = NativeModules;

const PaymentActivityService = {
  start(transactionId: string, amount: string, merchant: string) {
    if (Platform.OS === "android") {
      PaymentActivity?.start(transactionId, amount, merchant);
    }
  },

  update(status: "processing" | "success" | "failed", amount: string, merchant: string) {
    if (Platform.OS === "android") {
      PaymentActivity?.update(status, amount, merchant);
    }
  },

  dismiss() {
    if (Platform.OS === "android") {
      PaymentActivity?.dismiss();
    }
  },
};

export default PaymentActivityService;
