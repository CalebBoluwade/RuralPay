import { axiosInstance } from "@/src/lib/api";

export interface CheckoutSession {
  token: string;
  merchantId: number;
  merchantName: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  amount: number;
  narration: string;
  status: string;
  callbackUrl?: string;
  expiresAt: string;
  createdAt: string;
}

class CheckoutService {
  async resolveSession(token: string): Promise<CheckoutSession> {
    const response = await axiosInstance.get<APIResponse<CheckoutSession>>(
      `/checkout/session?token=${token}`,
    );
    return response.details;
  }

  async confirmPayment(sessionId: string, transactionId: string): Promise<void> {
    await axiosInstance.post(`/checkout/confirm`, { sessionId, transactionId });
  }
}

export default new CheckoutService();
