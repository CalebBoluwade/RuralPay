import { axiosInstance } from "../../lib/api";

class AccountService {
  async getAccountData(): Promise<AccountData> {
    const response = await axiosInstance.get("/account");
    return response.data;
  }

  async AccountBalance(): Promise<BalanceEnquiry[]> {
    const response = await axiosInstance.get(`/accounts/balance-enquiry`);
    return response.data.accounts || [];
  }

  async ValidateBVN({
    bvn,
    phoneNumber,
    email,
  }: {
    bvn: string;
    phoneNumber: string;
    email: string;
  }): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await axiosInstance.post("/accounts/validate-bvn", {
        bvn: bvn,
        phoneNumber,
        email,
      });

      const data = response.data;

      if (data.valid) {
        return { valid: true, message: data.message };
      } else {
        return { valid: false, message: data.message || "Invalid BVN" };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to validate BVN";
      return { valid: false, message };
    }
  }

  async ValidateOTP(
    bvn: string,
    otp: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await axiosInstance.post("/accounts/verify-otp", {
        bvn,
        otp,
      });

      const data = response.data;
      if (data.valid) {
        return { valid: true };
      } else {
        return { valid: false, message: data.message || "Invalid OTP" };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to validate OTP";
      return { valid: false, message };
    }
  }

  async ResolveAccountName(
    bankCode: string,
    accountNumber: string,
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      const response = await axiosInstance.get(
        `/accounts/name-enquiry?accountId=${accountNumber}&bankCode=${bankCode}`,
      );

      return {
        success: true,
        accountName: response.data.accountName,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to Resolve Account Name",
      };
    }
  }
}

export default new AccountService();
