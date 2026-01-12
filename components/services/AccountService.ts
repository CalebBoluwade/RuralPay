import { axiosInstance } from "../../lib/api";

class AccountService {
  async getAccountData(): Promise<AccountData> {
    const response = await axiosInstance.get("/account");
    return response.data;
  }

  async getAccountBalance(accountId: string): Promise<BalanceEnquiry> {
    const response = await axiosInstance.get(`/accounts/balance-enquiry?accountId=${accountId}`);
    return response.data;
  }

  async ResolveAccountName(
    bankCode: string,
    accountNumber: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      const response = await axiosInstance.get(
        `/accounts/name-enquiry?accountId=${accountNumber}&bankCode=${bankCode}`
      );

      return {
        success: true,
        accountName: response.data.accountName,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to resolve account name",
      };
    }
  }
}

export default new AccountService();
