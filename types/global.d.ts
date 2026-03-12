global {
  // --- Types ---

  type TransferStatus = "PENDING_RECIPIENT" | "COMPLETED" | "FAILED";
  type TransactionType = "CREDIT" | "DEBIT" | "P2P_DEBIT" | "P2P_CREDIT";

  type PaymentMode =
    | "CARD"
    | "QR"
    | "BANK_TRANSFER"
    | "AIRTIME_DATA"
    | "USSD"
    | "VOICE"
    | "BLE";

  type PaymentMethod = "NFC_CARD" | "BALANCE" | "BLUETOOTH";

  type VASType = "airtime" | "tickets" | "data" | "general";

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

  interface ReceiptData {
    amount: string;
    recipient: string;
    reference: string;
    date: string;
    narration?: string;
    type: PaymentMode;
    senderName?: string;
    senderAccount?: string;
    merchantId?: string;
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
    email: string;
    password: string;
    phoneNumber: string;
    bvn: string;
    pushToken: string;
  }

  type KYCStatus = "VERIFIED" | "PENDING" | "FAILED" | "UNVERIFIED";

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
    code: string;
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

  interface TransactionHistory {
    fee: number;
    transactionDate: string;
    transactionId: string;
    reference: string;
    currency: string;
    amount: number;
    merchantId?: string;
    fromAccount: string;
    narration?: string;
    status: string;
    txType: TransactionType;
    paymentMode: PaymentMode;
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
    location?: LocationData;
    paymentMode: PaymentMode;
    saveBeneficiary: boolean;
    transactionID: string;
  }

  interface AirtimeDataPayload {
    transactionID: string;
    paymentMode: string;
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
    code: string;
  }

  interface Beneficiary {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    useCount: number;
    lastUsed: string;
  }

  interface PaymentCard {
    PAN: string;
    expiryDate: string;
    bin: string;
    last4: string;
  }

  interface CardInfo extends PaymentCard {
    success: boolean;
    PIN: string;
    cryptogram: string;
    issuerAppData: string;
    currencyCode: string;
    ATC: number;
    CVR: string;
    cardNonce: string;

    cardholderName: string;
    applicationLabel: string;
    countryCode: string;
    language: string;
  }

  interface Credentials {
    cardId: string;
    cak: string;
    cek: string;
    accountId: string;
  }

  interface CardDetailsResult {
    success: boolean;
    message: string;
    transaction?: NFCCardTransaction;
  }

  interface MerchantRegistrationData {
    businessName: string;
    businessAddress: string;
    businessType: string;
    userId: string;
  }
}

export { };

