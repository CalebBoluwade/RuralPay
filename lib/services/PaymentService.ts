import { axiosInstance } from "@/lib/api";

class PaymentService {
  async MakeAirtimePurchase(payload: AirtimeDataPayload): Promise<APIResponse<TransactionHistory>> {
    return axiosInstance.post<APIResponse<TransactionHistory>>("/payments", payload);
  }

  async GetBanks(): Promise<Bank[]> {
    const response = await axiosInstance.get<APIResponse<Bank[]>>("/banks");
    return response.details;
  }

  async GetCardBin(bin: string): Promise<any> {
    const response = await axiosInstance.get<APIResponse<Bank[]>>(
      `/cards/bin?bin=${bin}`,
    );
    return response.details;
  }

  async B2BTransfer(
    payload: TransferPayload,
  ): Promise<APIResponse<TransactionHistory>> {
    const response = await axiosInstance.post<APIResponse<TransactionHistory>>(
      "/payments",
      payload,
    );
    return response;
  }

  async MakeNFCCardPayment(
    payload: NFCCardTransaction,
  ): Promise<APIResponse<TransactionHistory>> {
    const response = await axiosInstance.post<APIResponse<TransactionHistory>>(
      "/payments",
      payload,
    );
    return response;
  }

  generateTransactionId(mode?: PaymentMode): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TX-${timestamp}-${random}`;
  }

  async FetchRecentTransactions(
    limit: number = 5,
  ): Promise<TransactionHistory[]> {
    const response = await axiosInstance.get<APIResponse<TransactionHistory[]>>(
      `/transaction/recent?limit=${limit}`,
    );
    return response.details || [];
  }

  async FetchTransactionById(txId: string): Promise<TransactionHistory> {
    const response = await axiosInstance.get<APIResponse<TransactionHistory>>(
      `/transaction?id=${txId}`,
    );
    return response.details;
  }

  async FetchAllTransactions(): Promise<TransactionHistory[]> {
    const response = await axiosInstance.get<APIResponse<TransactionHistory[]>>(
      "/transaction/recent",
    );
    return response.details || [];
  }

  async GetUserBeneficiaries(): Promise<Beneficiary[]> {
    const response =
      await axiosInstance.get<APIResponse<Beneficiary[]>>("/beneficiaries");
    return response.details || [];
  }

  async FetchAllUSSDTransactions(): Promise<USSDTransaction[]> {
    const response = await axiosInstance.get("/ussd/codes");
    return response.data;
  }

  async FetchVouchers(vasType: string): Promise<Voucher[]> {
    // Simulated API — replace with axiosInstance call when endpoint is ready
    const mock: Voucher[] = [
      {
        id: "v1",
        voucherCode: "AIRTIME10",
        voucherDescription: "₦10 off Airtime",
        voucherDiscountAmount: 10,
        voucherType: "FIXED",
        voucherAllowedServices: ["airtime"],
      },
      {
        id: "v2",
        voucherCode: "AIR20PCT",
        voucherDescription: "20% off Airtime",
        voucherDiscountAmount: 20,
        voucherType: "PERCENT",
        voucherAllowedServices: ["airtime"],
      },
      {
        id: "v3",
        voucherCode: "TIX500",
        voucherDescription: "₦500 off tickets",
        voucherDiscountAmount: 500,
        voucherType: "FIXED",
        voucherAllowedServices: ["tickets"],
      },
      {
        id: "v4",
        voucherCode: "SAVE15",
        voucherDescription: "15% off any VAS",
        voucherDiscountAmount: 15,
        voucherType: "PERCENT",
        voucherAllowedServices: ["airtime", "tickets", "data", "general"],
      },
      {
        id: "v5",
        voucherCode: "DATA200",
        voucherDescription: "₦200 off data",
        voucherDiscountAmount: 200,
        voucherType: "FIXED",
        voucherAllowedServices: ["data"],
      },
    ];
    return mock.filter((v) =>
      v.voucherAllowedServices.includes(vasType as VASType),
    );
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
    } catch {
      return "Error transcribing voice command";
    }
  }
}

export default new PaymentService();
