global {
  // --- Types ---

  type TransferStatus = "PENDING_RECIPIENT" | "COMPLETED" | "FAILED";
  type TransactionType = "CREDIT" | "DEBIT" | "P2P_DEBIT" | "P2P_CREDIT";

  type PaymentMode = "CARD" | "QR" | "BANK_TRANSFER" | "USSD" | "VOICE" | "BLE";

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

  interface MerchantAnaltyics {
    count: number;
    total: number;
  }

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

  export interface User {
    id: string;
    email: string;
    Username: string;
    phoneNumber: string;
    BVN: string;
    FirstName: string;
    LastName: string;
    AccountId: string;
    role: "consumer" | "merchant";
    merchant?: MerchantProfile;
  }

  export interface AuthResponse {
    token: string;
    user: User;
  }

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
    cardId: string;
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
    transactionID: string;
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
    reference: string;
    toAccount: string;
    toBankCode: string;
    location?: LocationData;
    paymentMode: PaymentMode;
    transactionID: string;
  }

  interface APIResponse {
    success: boolean;
    errorMessage: string;
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

  interface CardInfo {
    success: boolean;
    PAN: string;
    PIN: string;
    expiryDate: string;
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

