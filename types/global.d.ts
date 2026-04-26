global {
  type CardScheme = "VISA" | "MASTERCARD" | "VERVE";
  // --- Types ---
  type AuthStep =
    | "PIN"
    | "Select-2FA"
    | "Verify-2FA"
    | "Confirm"
    | "Success"
    | "Failure";

  type TransferStatus = "PENDING_RECIPIENT" | "COMPLETED" | "FAILED";
  type TransactionType = "CREDIT" | "DEBIT" | "P2P_DEBIT" | "P2P_CREDIT";

  type UserRegistrationStep =
    | "personal"
    | "merchant"
    // | "bvn"
    | "phone-verify"
    | "liveness"
    | "pin"
    | "success";

  type KYCStatus = "VERIFIED" | "PENDING" | "FAILED" | "UNVERIFIED";

  type TwoFAType = "OTP" | "BYPASS" | "FACIAL_RECOGNITION";

  type PaymentMode =
    | "CARD"
    | "QR"
    | "BANK_TRANSFER"
    | "AIRTIME"
    | "DATA"
    | "ELECTRICITY"
    | "CABLE_TV"
    | "USSD"
    | "VOICE"
    | "BLE";

  type PaymentMethod = "NFC_CARD" | "BALANCE" | "BLUETOOTH";

  type UserNotification = {
    id: string;
    title: string;
    type: string;
    message: string;
    time: string;
    read: boolean;
  };

  type VASType = "airtime" | "tickets" | "data" | "general";

  interface DataPlan {
    id: string;
    size: string;
    validity: string;
    price: number;
  }

  interface ElectricityProvider {
    id: string;
    name: string;
  }

  interface CablePlan {
    id: string;
    label: string;
    price: number;
  }

  interface CableProvider {
    id: string;
    name: string;
    plans: CablePlan[];
  }

  interface Voucher {
    id: string;
    voucherCode: string;
    voucherDescription: string;
    voucherDiscountAmount: number;
    voucherType: "FIXED" | "PERCENT";
    voucherAllowedServices: VASType[];
  }

  interface APIResponse<T> {
    success: boolean;
    errorMessage?: string;
    message: string;
    details: T;
  }

  interface ReceiptData extends TransactionHistoryItem {
    amount: string;
    // recipient: string;
    // reference: string;
    // date: string;
    // narration?: string;
    // type: PaymentMode;
    senderName?: string;
    senderAccount?: string;
    merchantName?: string;
    terminalId?: string;
    cardLast4?: string;
  }

  interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }

  interface StatusStat {
    status: string;
    transactionCount: number;
    totalAmount: number;
  }

  interface MerchantDetails {
    todayCompletedCount: number;
    todayCompletedVolume: number;
    todayProfit: number;
    totalCompletedVolume: number;
    totalProfit: number;
    totalCompletedCount: number;
    byStatus: StatusStat[];
  }

  type MerchantAnaltics = APIResponse<MerchantDetails>;

  interface MerchantProfile {
    id: string;
    businessName: string;
    businessAddress: string;
    businessType: string;
    commisionRate: number;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
  }

  interface RegisterData {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    password: string;
    phoneNumber: string;
    bvn: string;
    identityToken: string;
  }

  export interface User {
    id: string;
    email: string;
    userName: string;
    phoneNumber: string;
    BVN: string;
    firstName: string;
    lastName: string;
    accountId: string;
    role: "consumer" | "merchant";
    merchant?: MerchantProfile;
    transactionLimits: {
      dailyLimit: number;
      singleTransactionLimit: number;
    };
    notifications?: {
      devicePush: boolean;
      sms: boolean;
      email: boolean;
    };
    kycStatus?: KYCStatus;
    kycLevel?: number;
  }

  export type AuthResponse = APIResponse<{
    token: string;
    refreshToken: string;
    user: User;
  }>;

  export interface AuthError {
    message: string;
    code?: string;
  }

  interface Bank {
    name: string;
    bankCode: string;
    cbnCode: string;
    logoData: string;
    uptimePrediction: number;
  }

  interface AccountData {
    accountId: string;
    accountName: string;
    currency: string;
    cardNumber: string;
  }

  interface VirtualAccount {
    merchantId: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    accountName: string;
  }

  interface BalanceEnquiry {
    id: string;
    isPrimary: boolean;
    availableBalance: number;
    bankName: string;
    bankCode: string;
    bankLogo: string;
    currency: string;
    status: string;
    accountName: string;
    accountId: string;
  }

  interface AccountBalanceEnquiry {
    accounts: BalanceEnquiry[];
    dailyLimit: number;
    singleTransactionLimit: number;
    dailySpent: number;
  }

  interface EmvTransactionResult {
    cryptogram: string; // Tag 9F26 (The signature)
    issuerAppData: string; // Tag 9F10 (Required by bank)
    atc: string; // Tag 9F36 (Anti-replay counter)
    unpredictableNumber: string; // The random nonce used
    transactionDate: string;
    transactionAmount: string;
  }

  interface NFCCardTransaction {
    transactionID: string;
    location?: LocationData;
    paymentMode: PaymentMode;
    transactionDate: number;
    cardInfo: CardInfo;
    merchantId: string;
    amount: number;
    txType: TransactionType;
    signature?: string;
    narration?: string;
  }

  interface TransactionHistoryItem {
    fee: number;
    transactionDate: string;
    transactionId: string;
    reference: string;
    currency: string;
    amount: number;
    toAccount: string;
    profit?: string;
    settlementDate?: string;
    fromAccount: string;
    narration?: string;
    status: string;
    txType: TransactionType;
    paymentMode: PaymentMode;
  }

  interface PaginatedTransactions {
    transactions: TransactionHistory[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }

  interface Transaction {
    version: number;
    transactionID: string;
    transactionDate: number;

    amount: number;
    currency: string;
    txType: TransactionType;
    signature?: string;
    recipientAccount?: string;
    senderAccount?: string;
    narration?: string;
  }

  interface TransferPayload {
    amount: number;
    txType: TransactionType;
    currency: string;
    fromAccount: string;
    beneficiaryAccountNumber: string;
    beneficiaryAccountName: string;
    beneficiaryBankName: string;
    beneficiaryBankCode: string;
    narration: string;
    OneTimeCode: string;
    twoFAType: TwoFAType;
    location?: LocationData;
    paymentMode: PaymentMode;
    saveBeneficiary: boolean;
    transactionID: string;
  }

  interface PhoneNumber {
    label: string;
    number: string;
    name: string;
    imageUri?: string;
  }

  interface AirtimeDataPayload {
    transactionID: string;
    paymentMode: PaymentMode;
    service: string;
    amount: number;
    beneficiaryPhoneNumber: string;
    network: string;
    dataPlanId?: string;
    narration: string;
    debitAccount: string;
    voucher: Voucher | undefined;
    OneTimeCode?: string;
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

  interface USSDTransaction {
    code: string;
    createdAt: string;
    expired: boolean;
    txType: string;
    amount: number;
    currency: string;
    transactionId: string;
    userId: string;
    expiresAt: string;
    createdAt: string;

    used: boolean;
  }

  interface P2PTransfer {
    transactionID: string;
    senderTx: Transaction;
    recipientId: string;
    status: TransferStatus;
    amount: number;
    currency: string;
    sender_tx_id?: string;
    sender_card_id?: string;
    created_at?: number;
    completed_at?: number;
  }

  interface InitiateResponse {
    success: boolean;
    transferId: string;
    senderTx: Transaction;
    status: TransferStatus;
    message: string;
  }

  interface CompleteResponse {
    success: boolean;
    transferId: string;
    senderTx: Transaction;
    recipientTx: Transaction;
    status: TransferStatus;
  }

  interface Banks {
    name: string;
    bankCode: string;
    cbnCode: string;
  }

  interface Beneficiary {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    useCount: number;
    lastUsed: string;
  }

  interface BINData {
    scheme: string;
    issuerBank: string;
    issuerBankLogo: string;
    currency: string;
  }

  interface PaymentCard {
    PAN: string;
    expiryDate: string;
    BIN?: string;
    last4?: string;
  }

  interface CardInfo extends PaymentCard {
    success?: boolean;
    errorMessage?: string;
    PIN: string;
    cryptogram: string;
    issuerAppData: string;
    currencyCode: string;
    ATC: number;
    CVR: string;
    cryptogram: string;
    schemeLabel?: string;
    countryCode: string;
  }

  interface Credentials {
    cardId: string;
    cak: string;
    cek: string;
    accountId: string;
  }

  interface CardDetailsResult {
    BIN: string;
    success: boolean;
    message: string;
    transaction?: NFCCardTransaction;
    cardInfo?: CardInfo;
  }

  interface MerchantRegistrationData {
    businessName: string;
    businessAddress: string;
    businessType: string;
    userId: string;
  }

  interface ScannedQRData {
    amount: number;
    merchantName: string;
    accountNumber: string;
    bankCode: string;
    bankName?: string;
    merchantId?: string;
  }
}

export { };

