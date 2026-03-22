import { axiosInstance } from "../../lib/api";

class AccountService {
  async getAccountData(): Promise<AccountData> {
    const response = await axiosInstance.get("/account");
    return response.data;
  }

  async GetVirtualAccount(): Promise<{
    status: boolean;
    expiresAt: string;
    virtualAccount: VirtualAccount;
  }> {
    const response = await axiosInstance.get(`/account/virtual-account`);
    return response.details;
  }

  async AccountBalanceEnquiry(): Promise<{
    accounts: BalanceEnquiry[];
    dailyLimit: number;
    singleTransactionLimit: number;
    dailySpent: number;
  }> {
    const response = await axiosInstance.get<
      APIResponse<{
        dailyLimit: number;
        singleTransactionLimit: number;
        dailySpent: number;
        accounts: BalanceEnquiry[];
      }>
    >(`/account/balance-enquiry`);

    return {
      dailyLimit: response.details.dailyLimit || 0,

      singleTransactionLimit: response.details.singleTransactionLimit || 0,

      dailySpent: response.details.dailySpent || 0,

      accounts: response.details.accounts || [],
    };
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
      const response = await axiosInstance.post("/account/validate-bvn", {
        bvn: bvn,
        phoneNumber,
        email,
      });

      const data = response.details;

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

  async LinkAccount({
    bankCode,
    accountNumber,
    IsPrimary,
  }: {
    bankCode: string;
    accountNumber: string;
    IsPrimary: boolean;
  }): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.post("/account/link", {
        bankCode,
        accountNumber,
        IsPrimary,
      });

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to Validate BVN";
      return { message, success: false, details: {} };
    }
  }

  async UnlinkAccount({
    bankCode,
    accountNumber,
  }: {
    bankCode: string;
    accountNumber: string;
  }): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.post("/account/unlink", {
        bankCode,
        accountNumber,
      });

      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to Unlink Account";
      return { message, success: false, details: {} };
    }
  }

  async SendUserOTP(action: string, channel: string): Promise<APIResponse<{}>> {
    console.log(action, channel);
    try {
      const response = await axiosInstance.post<APIResponse<{}>>(
        "/account/send-otp",
        {
          action,
          channel,
        },
      );

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to Send OTP";
      return { message, success: false, details: {} };
    }
  }

  // async ValidateUserOTP(action: string, otp: string): Promise<APIResponse<{}>> {
  //   try {
  //     const response = await axiosInstance.post<APIResponse<{}>>(
  //       "/account/verify-otp",
  //       {
  //         action,
  //         otp,
  //       },
  //     );

  //     return response;
  //   } catch (error: any) {
  //     const message = error.response?.data?.message || "Failed to validate OTP";
  //     return { success: false, message, details: {} };
  //   }
  // }

  async ValidateIdentity({
    bvn,
    selfieBase64,
  }: {
    bvn: string;
    selfieBase64: string;
  }): Promise<APIResponse<{ verified: boolean; message?: string }>> {
    try {
      const response = await axiosInstance.post("/account/validate-identity", {
        bvn,
        selfie: selfieBase64,
      });
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Identity verification failed";
      return { success: false, message, details: { verified: false } };
    }
  }

  async ResolveAccountName(
    bankCode: string,
    accountNumber: string,
  ): Promise<APIResponse<{ accountName: string; accountId: string }>> {
    try {
      const response = await axiosInstance.get<
        APIResponse<{ accountName: string; accountId: string }>
      >(
        `/account/name-enquiry?accountId=${accountNumber}&bankCode=${bankCode}`,
      );

      return response;
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.response?.data?.message,
        message:
          error.response?.data?.message || "Failed to Resolve Account Name",
        details: { accountName: "", accountId: "" },
      };
    }
  }
}

export default new AccountService();
