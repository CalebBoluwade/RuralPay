import { axiosInstance } from "../../lib/api";

class AccountService {
  async GetNotifications(): Promise<APIResponse<UserNotification[]>> {
    const response = await axiosInstance.get<APIResponse<UserNotification[]>>(
      "/account/notifications",
    );

    return response;
  }

  async getAccountData(): Promise<AccountData> {
    const response = await axiosInstance.get("/account");
    return response.de;
  }

  async GetVirtualAccount(): Promise<{
    status: boolean;
    expiresAt: string;
    virtualAccount: VirtualAccount;
  }> {
    const response = await axiosInstance.get(`/account/virtual-account`);
    return response.details;
  }

  async AccountBalanceEnquiry(abortSignal?: AbortSignal): Promise<{
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
    >(`/account/balance-enquiry`, { signal: abortSignal });

    return {
      dailyLimit: response.details.dailyLimit || 0,

      singleTransactionLimit: response.details.singleTransactionLimit || 0,

      dailySpent: response.details.dailySpent || 0,

      accounts: response.details.accounts || [],
    };
  }

  async LinkAccount(
    {
      bankCode,
      accountNumber,
      IsPrimary,
    }: {
      bankCode: string;
      accountNumber: string;
      IsPrimary: boolean;
    },
    abortSignal?: AbortSignal,
  ): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.post(
        "/account/link",
        {
          bankCode,
          accountNumber,
          IsPrimary,
        },
        { signal: abortSignal },
      );

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

  async SendUserOTP(action: string): Promise<APIResponse<{}>> {
    if (__DEV__) console.log(action);
    try {
      const response = await axiosInstance.post<APIResponse<{}>>(
        "/account/send-otp",
        {
          action,
        },
      );

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to Send OTP";
      return { message, success: false, details: {} };
    }
  }

  async ValidateUserPhoneNumberOTP(
    action: string,
    otp: string,
  ): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.post<APIResponse<{}>>(
        "/account/verify-otp",
        {
          action,
          otp,
        },
      );

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to validate OTP";
      return { success: false, message, details: {} };
    }
  }

  async ValidateIdentity({
    bvn,
    selfieBase64,
  }: {
    bvn: string;
    selfieBase64: string;
  }): Promise<APIResponse<{ identityToken: string }>> {
    try {
      const response = await axiosInstance.post("/account/validate-identity", {
        bvn,
        userSelfie: selfieBase64,
      });
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Identity verification failed";
      return { success: false, message, details: { identityToken: "" } };
    }
  }

  async updateSpendingLimits(limits: {
    dailyLimit: number;
    singleTransactionLimit: number;
  }): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.patch<APIResponse<{}>>(
        "/account/spending-limits",
        limits,
      );
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update spending limits";
      return { success: false, message, details: {} };
    }
  }

  async updateNotificationSettings(settings: {
    pushNotifications: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  }): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.patch<APIResponse<{}>>(
        "/account/notification-settings",
        settings,
      );
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to update notification settings";
      return { success: false, message, details: {} };
    }
  }

  async ResolveAccountName(
    bankCode: string,
    accountNumber: string,
    abortSignal?: AbortSignal,
  ): Promise<APIResponse<{ accountName: string; accountId: string }>> {
    try {
      const response = await axiosInstance.get<
        APIResponse<{ accountName: string; accountId: string }>
      >(
        `/account/name-enquiry?accountId=${accountNumber}&bankCode=${bankCode}`,
        { signal: abortSignal },
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
