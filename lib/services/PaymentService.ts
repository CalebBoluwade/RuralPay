import { axiosInstance } from "@/lib/api";

class PaymentService {
  async GetBanks(): Promise<Bank[]> {
    const response = await axiosInstance.get("/banks");
    return response.data;
  }

  async GetCardBin(bin: string): Promise<any> {
    const response = await axiosInstance.get(`/cards/bin?bin=${bin}`);
    return response.data;
  }

  async B2BTransfer(payload: TransferPayload): Promise<APIResponse> {
    const response = await axiosInstance.post("/payments", payload);
    return response.data;
  }

  async MakeNFCCardPayment(payload: NFCCardTransaction): Promise<APIResponse> {
    const response = await axiosInstance.post("/payments", payload);
    return response.data;
  }

  generateTransactionId(mode?: PaymentMode): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TX-${timestamp}-${random}`;
  }

  async FetchRecentTransactions(
    limit: number = 5,
  ): Promise<TransactionHistory[]> {
    const response = await axiosInstance.get(
      `/transactions/recent?limit=${limit}`,
    );
    return response.data || [];
  }

  async FetchTransactionById(txId: string): Promise<TransactionHistory> {
    const response = await axiosInstance.get(`/transactions?id=${txId}`);
    return response.data;
  }

  async FetchAllTransactions(): Promise<TransactionHistory[]> {
    const response = await axiosInstance.get("/transactions/recent");
    return response.data || [];
  }

  async FetchAllUSSDTransactions(): Promise<USSDTransaction[]> {
    const response = await axiosInstance.get("/ussd/codes");
    return response.data;
  }

  async FetchUSSDCodeById(ussdCode: string): Promise<any> {
    const response = await axiosInstance.get(`/ussd/codes?code=${ussdCode}`);
    return response.data;
  }

  async generateUSSDCode(payload: USSDCodePayload): Promise<USSDCodeResponse> {
    const response = await axiosInstance.post("/ussd/generate", payload);
    return response.data;
  }

  async TranscribeVoiceCommand(audioBase64: string): Promise<string> {
    try {
      // Call your backend API (which calls speech-to-text service)
      const response = await axiosInstance.post(
        "transactions/voice-transcribe",
        {
          audio: audioBase64,
          encoding: "LINEAR16",
        },
      );

      const { transcript } = await response.data;

      return transcript;
    } catch (error) {
      return "Error transcribing voice command";
    }
  }
}

export default new PaymentService();
