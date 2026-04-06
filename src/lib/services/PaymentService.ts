import { axiosInstance } from "@/src/lib/api";
import * as Crypto from "expo-crypto";
import { integrityService } from "./IntegrityService";

const INTEGRITY_ERROR = "Payment blocked: device security compromised";

class PaymentService {
  generateTransactionId(mode?: PaymentMode): string {
    const timestamp = Date.now();
    const [b0, b1, b2] = Crypto.getRandomBytes(3);
    const random = ((b0 << 16) | (b1 << 8) | b2)
      .toString(16)
      .toUpperCase()
      .padStart(6, "0");
    const prefix = mode ? mode.replace(/_/g, "-") : "TX";
    return `${prefix}-${timestamp}${random}`;
  }

  async MakeAirtimePurchase(
    payload: AirtimeDataPayload,
  ): Promise<APIResponse<TransactionHistoryItem>> {
    const response = await axiosInstance.post<
      APIResponse<TransactionHistoryItem>
    >("/payment", payload);
    if (__DEV__)
      console.log(
        payload,
        "Initiating airtime purchase with payload:",
        response,
      );
    return response;
  }

  async GetBanks(abortSignal?: AbortSignal): Promise<Bank[]> {
    const response = await axiosInstance.get<APIResponse<Bank[]>>("/banks", {
      signal: abortSignal,
    });
    return response.details ?? [];
  }

  async GetCardBIN(bin: string): Promise<BINData> {
    const response = await axiosInstance.get<APIResponse<BINData>>(
      `/card/bin?bin=${bin}`,
    );

    return response.details;
  }

  async B2BTransfer(
    payload: TransferPayload,
    abortSignal?: AbortSignal,
  ): Promise<APIResponse<TransactionHistoryItem>> {
    if (await integrityService.isDeviceCompromised())
      throw new Error(INTEGRITY_ERROR);
    const response = await axiosInstance.post<
      APIResponse<TransactionHistoryItem>
    >("/payment", payload, { signal: abortSignal });

    if (__DEV__) console.log(response);
    return response;
  }

  async MakeNFCCardPayment(
    payload: NFCCardTransaction,
    abortSignal?: AbortSignal,
  ): Promise<APIResponse<TransactionHistoryItem>> {
    if (await integrityService.isDeviceCompromised())
      throw new Error(INTEGRITY_ERROR);

    try {
      const response = await axiosInstance.post<
        APIResponse<TransactionHistoryItem>
      >("/payment", payload, { signal: abortSignal });

      console.log(response);
      return response;
    } catch (error) {
      if (__DEV__) console.error("Payment failed:", error);

      return error as APIResponse<TransactionHistoryItem>;
      // throw error;
    }
  }

  async FetchAllTransactions(
    startDate?: string,
    endDate?: string,
    limit?: number,
    page?: number,
    status?: string,
    abortSignal?: AbortSignal,
  ): Promise<PaginatedTransactions> {
    const urlParams = new URLSearchParams();
    if (page !== undefined) urlParams.append("page", page.toString());
    if (startDate) urlParams.append("startDate", startDate);
    if (endDate) urlParams.append("endDate", endDate);
    if (limit) urlParams.append("limit", limit.toString());
    if (status) urlParams.append("status", status);

    const response = await axiosInstance.get<
      APIResponse<PaginatedTransactions>
    >(`/transaction${urlParams.toString() ? "?" + urlParams.toString() : ""}`, {
      signal: abortSignal,
    });

    return response.details || [];
  }

  async FetchRecentTransactions(
    limit: number = 5,
    abortSignal?: AbortSignal,
  ): Promise<PaginatedTransactions> {
    const response = await axiosInstance.get<
      APIResponse<PaginatedTransactions>
    >(`/transaction?limit=${limit}`, { signal: abortSignal });
    return response.details || [];
  }

  async FetchTransactionById(
    txId: string,
    abortSignal?: AbortSignal,
  ): Promise<TransactionHistoryItem> {
    const response = await axiosInstance.get<
      APIResponse<TransactionHistoryItem>
    >(`/transaction/${txId}`, { signal: abortSignal });
    return response.details;
  }

  async GetUserBeneficiaries(): Promise<Beneficiary[]> {
    const response = await axiosInstance.get<APIResponse<Beneficiary[]>>(
      "/payment/beneficiaries",
    );
    return response.details ?? [];
  }

  async FetchAllUSSDTransactions(): Promise<USSDTransaction[]> {
    const response = await axiosInstance.get("/ussd/codes");
    return response.data;
  }

  async FetchVouchers(vasType: string): Promise<Voucher[]> {
    try {
      const response =
        await axiosInstance.get<APIResponse<Voucher[]>>("/vouchers");

      return response.details.filter((v) =>
        v.voucherAllowedServices.includes(vasType as VASType),
      );
    } catch (error) {
      if (__DEV__) console.error("Error fetching Vouchers:", error);
      return [];
    }
  }

  async FetchDataPlans(network: string): Promise<DataPlan[]> {
    try {
      const response = await axiosInstance.get<APIResponse<DataPlan[]>>(
        `/data-plans?network=${network}`,
      );

      return response.details;
    } catch (error) {
      if (__DEV__) console.error("Error Fetching Data Plans:", error);
      return [];
    }
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
