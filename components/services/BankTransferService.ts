import { axiosInstance } from "@/lib/api";

export class BankTransferService {
  static async GetBanks(): Promise<
    { name: string; code: string; logoData: string }[]
  > {
    const response = await axiosInstance.get("/banks");
    return response.data;
  }

  static async B2BTransfer(
    payload: TransferPayload,
  ): Promise<TransferResponse> {
    const response = await axiosInstance.post(
      "/transactions/external",
      payload,
    );
    return response.data;
  }

  static async MakeNFCPayment(payload: Transaction): Promise<TransferResponse> {
    const response = await axiosInstance.post("/transactions", payload);
    return response.data;
  }

  static generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TX-${timestamp}-${random}`;
  }

  static async FetchRecentTransactions(
    limit: number = 5,
  ): Promise<RecentTransaction[]> {
    const response = await axiosInstance.get(
      `/transactions/recent?limit=${limit}`,
    );
    return response.data;
  }

  static async FetchTransactionById(txId: string): Promise<Transaction> {
    const response = await axiosInstance.get(`/transactions?id=${txId}`);
    return response.data;
  }

  static async FetchAllTransactions(): Promise<Transaction[]> {
    const response = await axiosInstance.get("/transactions/recent");
    return response.data;
  }

  static async FetchAllUSSDTransactions(): Promise<USSDTransaction[]> {
    const response = await axiosInstance.get("/ussd/codes");
    return response.data;
  }

  static async FetchUSSDCodeById(ussdCode: string): Promise<any> {
    const response = await axiosInstance.get(`/ussd/codes?code=${ussdCode}`);
    return response.data;
  }

  static async generateUSSDCode(
    payload: USSDCodePayload,
  ): Promise<USSDCodeResponse> {
    const response = await axiosInstance.post("/ussd/generate", payload);
    return response.data;
  }

  static async TranscribeVoiceCommand(audioBase64: string): Promise<string> {
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
