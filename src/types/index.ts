export type CurrencyCode = 'USD' | 'INR' | 'EUR';

export type TransactionStatus = 'PAID' | 'PENDING' | 'CANCELED' | 'FLAGGED';
export type TransactionType = 'E-commerce' | 'P2P Transfer' | 'Phone credit' | 'Bill Payment' | 'Wallet Top-up';
export type LedgerEntryType = 'DEBIT' | 'CREDIT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatarUrl: string;
  isWalletSuspended: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  recoveryCodes?: string[];
  createdAt: string;
  cards: VirtualCard[];
}

export interface VirtualCard {
  id: string;
  last4: string;
  cardHolder: string;
  expiry: string;
  type: 'CloudWatch' | 'Visa' | 'Mastercard';
  variant: 'gradient-orange' | 'gradient-cyan';
  balancePaise: number; // in cents/paise (integer)
  isFrozen: boolean;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  walletId: string;
  entryType: LedgerEntryType;
  amountMinor: number; // integer minor units (e.g. 14235 = $142.35)
  currency: CurrencyCode;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  idempotencyKey: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientAvatar?: string;
  amountMinor: number; // in minor units
  currency: CurrencyCode;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  category: string;
  createdAt: string;
  feeMinor: number;
  fraudRiskScore: number;
  fraudRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fraudRuleTriggered?: string;
  receiptSignature: string;
}

export interface FraudAlert {
  id: string;
  ruleCode: string;
  ruleName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0 - 100
  transactionId?: string;
  transactionRef?: string;
  userId: string;
  userName: string;
  description: string;
  status: 'PENDING_REVIEW' | 'ESCALATED' | 'DISMISSED';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface AnalyticsSummary {
  walletBalanceMinor: number;
  weeklySpendMinor: number;
  monthlySpendMinor: number;
  annualSpendMinor: number;
  weeklyChangePercent: number;
  monthlyChangePercent: number;
  annualChangePercent: number;
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  successfulTxCount: number;
  pendingTxCount: number;
  canceledTxCount: number;
  dailyTrends: { day: string; thisWeek: number; lastWeek: number }[];
  categoryBreakdown: { name: string; amountMinor: number; percentage: number; color: string }[];
}

export interface TestResult {
  id: string;
  title: string;
  category: string;
  status: 'PASSED' | 'FAILED' | 'RUNNING';
  durationMs: number;
  message: string;
  details?: string;
}
