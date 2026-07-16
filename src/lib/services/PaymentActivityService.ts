import { NativeModules, Platform } from "react-native";

const { PaymentActivity, LiveActivity } = NativeModules;

let _elapsed = 0;
let _elapsedTimer: ReturnType<typeof setInterval> | null = null;

const PaymentActivityService = {
  start(transactionId: string, paymentType: string, amount: string, merchant: string) {
    _elapsed = 0;
    _elapsedTimer = setInterval(() => { _elapsed += 1; }, 1000);

    if (Platform.OS === "ios") {
      LiveActivity?.start(transactionId, paymentType, amount, merchant);
    } else {
      PaymentActivity?.start(transactionId, amount, merchant);
    }
  },

  update(status: "processing" | "success" | "failed", amount: string, merchant: string) {
    if (Platform.OS === "ios") {
      LiveActivity?.update(status, amount, merchant, _elapsed);
    } else {
      PaymentActivity?.update(status, amount, merchant);
    }
  },

  dismiss() {
    if (_elapsedTimer) {
      clearInterval(_elapsedTimer);
      _elapsedTimer = null;
    }
    if (Platform.OS === "ios") {
      LiveActivity?.dismiss();
    } else {
      PaymentActivity?.dismiss();
    }
  },
};

export default PaymentActivityService;
