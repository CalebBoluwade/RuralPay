import { axiosInstance } from "@/lib/api";

interface TransferPayload {
  amount: number;
  currency: string;
  fromAccount: string;
  reference: string;
  toAccount: string;
  toBankCode: string;
  location?: LocationData;
}

interface TransferResponse {
  success: boolean;
  status: string;
  transactionId: string;
}

interface USSDCodePayload {
  type: "Send" | "Receive";
  amount?: number;
  currency?: string;
}

interface USSDCodeResponse {
  success: boolean;
  ussdCode: string;
  expiresIn: number;
}

export class BankTransferService {
  static async B2BTransfer(
    payload: TransferPayload
  ): Promise<TransferResponse> {
    const response = await axiosInstance.post(
      "/transactions/external",
      payload
    );
    return response.data;
  }

  static async MakeNFCPayment(payload: Transaction): Promise<TransferResponse> {
    const response = await axiosInstance.post("/transactions", payload);
    return response.data;
  }

  static async FetchRecentTransactions(
    limit: number = 5
  ): Promise<RecentTransaction[]> {
    const response = await axiosInstance.get(
      `/transactions/recent?limit=${limit}`
    );

    console.log(response.data);
    return response.data;
  }

  static async FetchTransactionById(txId: string): Promise<Transaction> {
    const response = await axiosInstance.get(`/transactions?id=${txId}`);

    console.log(response.data);
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
    payload: USSDCodePayload
  ): Promise<USSDCodeResponse> {
    const response = await axiosInstance.post("/ussd/generate", payload);
    return response.data;
  }
}
