global {
  // --- Types ---

  type TransferStatus = "PENDING_RECIPIENT" | "COMPLETED" | "FAILED";
  type TransactionType = "CREDIT" | "DEBIT" | "P2P_DEBIT" | "P2P_CREDIT";

  interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }

  export interface User {
    id: string;
    email: string;
    FirstName: string;
    LastName: string;
    AccountId: string;
  }

  export interface AuthResponse {
    token: string;
    user: User;
  }

  export interface AuthError {
    message: string;
    code?: string;
  }

  interface AccountData {
    accountId: string;
    accountName: string;
    currency: string;
    cardNumber: string;
  }

  interface RecentTransaction {
    txId: string;
    merchantId: string;
    createdAt: string;
    amount: number;
    timestamp: string;
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

  interface Transaction {
    version: number;
    txId: string;
    status: string;
    timestamp: number;
    cardId: string;
    merchantId: string;
    amount: number;
    currency: string;
    counter: number;
    txType: TransactionType;
    signature?: string;
    recipientId?: string;
    senderId?: string;
    fees: number;
    narration?: string;
  }

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
    transferId: string;
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
    cardId: string;
    balance: number;
    counter: number;
    dailyLimit: number;
    singleTxLimit: number;
  }

  interface Credentials {
    cardId: string;
    cak: string;
    cek: string;
    accountId: string;
  }

  interface PaymentResult {
    success: boolean;
    transaction: Transaction;
    newBalance: number;
    offline: boolean;
  }
}

export { };

