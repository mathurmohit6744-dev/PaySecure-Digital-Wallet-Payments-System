import {
  User,
  Transaction,
  LedgerEntry,
  FraudAlert,
  AuditLog,
  AnalyticsSummary,
  CurrencyCode,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_TRANSACTIONS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_FRAUD_ALERTS,
  INITIAL_AUDIT_LOGS,
} from './seedData';
import { evaluateTransactionRisk, createFraudAlertFromEvaluation } from './fraudEngine';
import { verifyTOTP } from './totpService';

const STORAGE_KEY = 'paysecure_ledger_state_v1';

interface LedgerState {
  users: User[];
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  fraudAlerts: FraudAlert[];
  auditLogs: AuditLog[];
  activeUserId: string;
}

class LedgerService {
  private state: LedgerState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LedgerState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return {
      users: INITIAL_USERS,
      transactions: INITIAL_TRANSACTIONS,
      ledgerEntries: INITIAL_LEDGER_ENTRIES,
      fraudAlerts: INITIAL_FRAUD_ALERTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      activeUserId: 'usr_jordi_01',
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      users: INITIAL_USERS,
      transactions: INITIAL_TRANSACTIONS,
      ledgerEntries: INITIAL_LEDGER_ENTRIES,
      fraudAlerts: INITIAL_FRAUD_ALERTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      activeUserId: 'usr_jordi_01',
    };
    this.saveState();
  }

  // Active user management
  public getActiveUser(): User {
    const user = this.state.users.find((u) => u.id === this.state.activeUserId);
    return user || this.state.users[0];
  }

  public setActiveUser(userId: string): void {
    const user = this.state.users.find((u) => u.id === userId);
    if (user) {
      this.state.activeUserId = userId;
      this.saveState();
    }
  }

  public getAllUsers(): User[] {
    return [...this.state.users];
  }

  // Balance calculation from append-only ledger entries
  // Baseline initial balance for Jordi is $14,124.56 = 1412456 cents
  public getWalletBalance(userId: string): number {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return 0;

    let base = 1412456; // Default seed balance for main demo account
    if (userId === 'usr_sarah_02') base = 500000;
    if (userId === 'usr_alex_03') base = 320000;
    if (userId === 'usr_priya_04') base = 480000;
    if (userId === 'usr_admin_01') base = 10000000;

    const userEntries = this.state.ledgerEntries.filter((e) => e.walletId === userId);
    const credits = userEntries
      .filter((e) => e.entryType === 'CREDIT')
      .reduce((sum, e) => sum + e.amountMinor, 0);
    const debits = userEntries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((sum, e) => sum + e.amountMinor, 0);

    return Math.max(0, base + credits - debits);
  }

  public getAllTransactions(): Transaction[] {
    return [...this.state.transactions];
  }

  public getUserTransactions(userId: string): Transaction[] {
    return this.state.transactions.filter(
      (t) => t.senderId === userId || t.recipientId === userId
    );
  }

  public getTransactionById(id: string): Transaction | undefined {
    return this.state.transactions.find((t) => t.id === id);
  }

  public getLedgerEntries(): LedgerEntry[] {
    return [...this.state.ledgerEntries];
  }

  public getFraudAlerts(): FraudAlert[] {
    return [...this.state.fraudAlerts];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs];
  }

  // Double-Entry P2P Transfer with Idempotency & Concurrency Safety
  public executeTransfer(params: {
    senderId: string;
    recipientIdentifier: string; // email, phone, or id
    amountMinor: number;
    currency: CurrencyCode;
    description: string;
    category?: string;
    idempotencyKey: string;
    twoFactorCode?: string;
  }): {
    success: boolean;
    transaction?: Transaction;
    error?: string;
    fraudWarning?: string;
    isBlockedByFraud?: boolean;
  } {
    const {
      senderId,
      recipientIdentifier,
      amountMinor,
      currency,
      description,
      category = 'P2P Transfer',
      idempotencyKey,
      twoFactorCode,
    } = params;

    // 1. Idempotency Check
    const existing = this.state.transactions.find((t) => t.idempotencyKey === idempotencyKey);
    if (existing) {
      return {
        success: true,
        transaction: existing,
        fraudWarning: 'Duplicate request detected. Returned existing idempotent transaction receipt.',
      };
    }

    // 2. Validate Sender
    const sender = this.state.users.find((u) => u.id === senderId);
    if (!sender) {
      return { success: false, error: 'Sender wallet not found.' };
    }

    if (sender.isWalletSuspended) {
      return {
        success: false,
        error: 'Wallet is suspended. Transfers are locked by compliance administration.',
      };
    }

    // 3. Validate Recipient
    const recipient = this.state.users.find(
      (u) =>
        u.id === recipientIdentifier ||
        u.email.toLowerCase() === recipientIdentifier.toLowerCase() ||
        u.phone === recipientIdentifier
    );

    if (!recipient) {
      return {
        success: false,
        error: `Recipient "${recipientIdentifier}" not found on PaySecure network.`,
      };
    }

    if (recipient.id === sender.id) {
      return { success: false, error: 'Self-transfers are not permitted. Please use wallet top-up.' };
    }

    if (recipient.isWalletSuspended) {
      return { success: false, error: 'Recipient account has been temporarily restricted.' };
    }

    // 4. Validate Amount
    if (amountMinor <= 0 || !Number.isInteger(amountMinor)) {
      return { success: false, error: 'Transfer amount must be a positive integer in minor units.' };
    }

    // 5. Balance Validation
    const currentBalance = this.getWalletBalance(sender.id);
    if (currentBalance < amountMinor) {
      const needed = (amountMinor / 100).toFixed(2);
      const available = (currentBalance / 100).toFixed(2);
      return {
        success: false,
        error: `Insufficient funds. Needed: $${needed}, Available: $${available}.`,
      };
    }

    // 6. Two-Factor Authentication Check
    if (sender.twoFactorEnabled) {
      if (!twoFactorCode) {
        return {
          success: false,
          error: 'Two-factor authentication code (TOTP) is required for this transfer.',
        };
      }
      const is2FAValid = verifyTOTP(sender.twoFactorSecret || '', twoFactorCode);
      const isRecoveryCode = sender.recoveryCodes?.includes(twoFactorCode.trim().toUpperCase());

      if (!is2FAValid && !isRecoveryCode) {
        // Record failed audit attempt
        this.addAuditLog({
          userId: sender.id,
          userEmail: sender.email,
          action: '2FA_VERIFICATION_FAILED',
          resource: 'P2P_TRANSFER',
          details: 'Invalid 6-digit TOTP challenge during transfer confirmation',
          ipAddress: '103.111.82.14',
          status: 'WARNING',
        });
        return { success: false, error: 'Invalid 2FA code or expired one-time token.' };
      }

      // If recovery code used, burn it (single-use)
      if (isRecoveryCode && sender.recoveryCodes) {
        sender.recoveryCodes = sender.recoveryCodes.filter(
          (c) => c !== twoFactorCode.trim().toUpperCase()
        );
      }
    }

    // 7. Fraud Engine Pre-Screen
    const isNewRecipient = !this.state.transactions.some(
      (t) => t.senderId === sender.id && t.recipientId === recipient.id
    );

    const fraudEval = evaluateTransactionRisk({
      amountMinor,
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recentTransactions: this.state.transactions,
      currentBalanceMinor: currentBalance,
      isNewRecipient,
    });

    if (fraudEval.isBlocked) {
      const alert = createFraudAlertFromEvaluation(
        fraudEval,
        `BLOCKED-${Date.now()}`,
        sender.id,
        sender.name
      );
      if (alert) this.state.fraudAlerts.unshift(alert);

      this.addAuditLog({
        userId: sender.id,
        userEmail: sender.email,
        action: 'TRANSFER_BLOCKED_BY_FRAUD_ENGINE',
        resource: 'RISK_SCORE_THRESHOLD',
        details: `Transaction blocked. Risk Score: ${fraudEval.riskScore}/100. Rules: ${fraudEval.triggeredRules.map((r) => r.code).join(', ')}`,
        ipAddress: '103.111.82.14',
        status: 'FAILED',
      });

      this.saveState();
      return {
        success: false,
        error: `Transaction declined by Risk Protection Engine (Risk Score: ${fraudEval.riskScore}/100).`,
        isBlockedByFraud: true,
      };
    }

    // 8. ATOMIC DOUBLE-ENTRY TRANSACTION CREATION
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txRef = `TXN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = new Date().toISOString();

    const newTransaction: Transaction = {
      id: txId,
      reference: txRef,
      idempotencyKey,
      senderId: sender.id,
      senderName: sender.name,
      senderEmail: sender.email,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      recipientAvatar: recipient.avatarUrl,
      amountMinor,
      currency,
      type: 'P2P Transfer',
      status: 'PAID',
      description: description || 'Instant P2P Transfer',
      category,
      createdAt: nowIso,
      feeMinor: 0,
      fraudRiskScore: fraudEval.riskScore,
      fraudRiskLevel: fraudEval.riskLevel,
      fraudRuleTriggered: fraudEval.triggeredRules[0]?.code,
      receiptSignature: `sha256_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`,
    };

    // Double entry: DEBIT sender, CREDIT recipient
    const debitEntry: LedgerEntry = {
      id: `ledg_${Date.now()}_deb`,
      transactionId: txId,
      walletId: sender.id,
      entryType: 'DEBIT',
      amountMinor,
      currency,
      createdAt: nowIso,
    };

    const creditEntry: LedgerEntry = {
      id: `ledg_${Date.now()}_crd`,
      transactionId: txId,
      walletId: recipient.id,
      entryType: 'CREDIT',
      amountMinor,
      currency,
      createdAt: nowIso,
    };

    // Commit to state atomically
    this.state.transactions.unshift(newTransaction);
    this.state.ledgerEntries.push(debitEntry, creditEntry);

    // If fraud warning triggered, create alert
    if (fraudEval.triggeredRules.length > 0) {
      const alert = createFraudAlertFromEvaluation(fraudEval, txRef, sender.id, sender.name);
      if (alert) this.state.fraudAlerts.unshift(alert);
    }

    // Add Audit Log
    this.addAuditLog({
      userId: sender.id,
      userEmail: sender.email,
      action: 'P2P_TRANSFER_COMPLETED',
      resource: `TXN_${txRef}`,
      details: `Debited ${amountMinor} to ${recipient.email}. Ledger entries ${debitEntry.id} and ${creditEntry.id} balanced.`,
      ipAddress: '103.111.82.14',
      status: 'SUCCESS',
    });

    this.saveState();

    return {
      success: true,
      transaction: newTransaction,
      fraudWarning:
        fraudEval.riskScore >= 40
          ? `Security Notice: Transaction assigned risk rating of ${fraudEval.riskLevel} (${fraudEval.riskScore}/100) due to ${fraudEval.triggeredRules.map((r) => r.name).join(', ')}.`
          : undefined,
    };
  }

  // Fraud Alert Actions (Admin)
  public updateFraudAlertStatus(
    alertId: string,
    status: 'DISMISSED' | 'ESCALATED',
    adminName = 'Security Admin'
  ): void {
    const alert = this.state.fraudAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = status;
      alert.reviewedBy = adminName;
      alert.reviewedAt = new Date().toISOString();

      this.addAuditLog({
        userId: 'usr_admin_01',
        userEmail: 'admin@paysecure.io',
        action: `FRAUD_ALERT_${status}`,
        resource: `ALERT_${alertId}`,
        details: `Alert ${alert.ruleName} for user ${alert.userName} marked as ${status}`,
        ipAddress: '192.168.1.1',
        status: 'SUCCESS',
      });

      this.saveState();
    }
  }

  // Wallet freeze/unfreeze (Admin)
  public toggleWalletSuspension(userId: string): boolean {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return false;
    user.isWalletSuspended = !user.isWalletSuspended;

    this.addAuditLog({
      userId: 'usr_admin_01',
      userEmail: 'admin@paysecure.io',
      action: user.isWalletSuspended ? 'WALLET_SUSPENDED' : 'WALLET_REACTIVATED',
      resource: `USER_${userId}`,
      details: `Administrative status change for ${user.email}`,
      ipAddress: '192.168.1.1',
      status: user.isWalletSuspended ? 'WARNING' : 'SUCCESS',
    });

    this.saveState();
    return user.isWalletSuspended;
  }

  // Card Freeze/Unfreeze
  public toggleCardFrozen(cardId: string): void {
    const user = this.getActiveUser();
    const card = user.cards.find((c) => c.id === cardId);
    if (card) {
      card.isFrozen = !card.isFrozen;
      this.saveState();
    }
  }

  // 2FA Management
  public updateTwoFactor(userId: string, enabled: boolean, secret?: string, codes?: string[]): void {
    const user = this.state.users.find((u) => u.id === userId);
    if (user) {
      user.twoFactorEnabled = enabled;
      if (secret) user.twoFactorSecret = secret;
      if (codes) user.recoveryCodes = codes;

      this.addAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: enabled ? '2FA_ENABLED' : '2FA_DISABLED',
        resource: 'SECURITY_SETTINGS',
        details: enabled ? 'TOTP enrollment verified with backup codes generated' : '2FA disabled by user',
        ipAddress: '103.111.82.14',
        status: 'SUCCESS',
      });

      this.saveState();
    }
  }

  // Audit Logger
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.state.auditLogs.unshift(log);
  }

  // Analytics Computation
  public getAnalytics(userId: string): AnalyticsSummary {
    const currentBalance = this.getWalletBalance(userId);
    const txs = this.getUserTransactions(userId);

    const paidTxs = txs.filter((t) => t.status === 'PAID');
    const pendingTxs = txs.filter((t) => t.status === 'PENDING');
    const canceledTxs = txs.filter((t) => t.status === 'CANCELED');

    const totalIncomeMinor = paidTxs
      .filter((t) => t.recipientId === userId)
      .reduce((sum, t) => sum + t.amountMinor, 0);

    const totalExpenseMinor = paidTxs
      .filter((t) => t.senderId === userId)
      .reduce((sum, t) => sum + t.amountMinor, 0);

    // Categories
    const categoryMap: { [cat: string]: number } = {};
    paidTxs
      .filter((t) => t.senderId === userId)
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amountMinor;
      });

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
    const totalCategories = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;
    const categoryBreakdown = Object.entries(categoryMap).map(([name, amountMinor], idx) => ({
      name,
      amountMinor,
      percentage: Math.round((amountMinor / totalCategories) * 100),
      color: colors[idx % colors.length],
    }));

    // Daily trends for screenshot chart (matching SUN to SAT data points)
    const dailyTrends = [
      { day: 'SUN', thisWeek: 850, lastWeek: 600 },
      { day: 'MON', thisWeek: 720, lastWeek: 680 },
      { day: 'TUE', thisWeek: 680, lastWeek: 550 },
      { day: 'WED', thisWeek: 1340, lastWeek: 420 },
      { day: 'THU', thisWeek: 640, lastWeek: 480 },
      { day: 'FRI', thisWeek: 520, lastWeek: 510 },
      { day: 'SAT', thisWeek: 680, lastWeek: 690 },
    ];

    return {
      walletBalanceMinor: currentBalance,
      weeklySpendMinor: 65390, // $653.90 from screenshot
      monthlySpendMinor: 321923, // $3,219.23 from screenshot
      annualSpendMinor: 1508603, // $15,086.03 from screenshot
      weeklyChangePercent: 12,
      monthlyChangePercent: -2,
      annualChangePercent: 12,
      totalIncomeMinor,
      totalExpenseMinor,
      successfulTxCount: paidTxs.length,
      pendingTxCount: pendingTxs.length,
      canceledTxCount: canceledTxs.length,
      dailyTrends,
      categoryBreakdown:
        categoryBreakdown.length > 0
          ? categoryBreakdown
          : [
              { name: 'Food & Dining', amountMinor: 59581, percentage: 35, color: '#f59e0b' },
              { name: 'Telecom & Utilities', amountMinor: 135346, percentage: 45, color: '#3b82f6' },
              { name: 'Automotive & Transport', amountMinor: 35346, percentage: 20, color: '#10b981' },
            ],
    };
  }
}

export const ledgerService = new LedgerService();
