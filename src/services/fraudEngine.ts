import { Transaction, FraudAlert } from '../types';

export interface FraudEvaluationResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeredRules: {
    code: string;
    name: string;
    description: string;
    points: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  isBlocked: boolean; // if critical risk score >= 80
}

export function evaluateTransactionRisk(params: {
  amountMinor: number;
  senderId: string;
  senderName: string;
  recipientId: string;
  recentTransactions: Transaction[];
  currentBalanceMinor: number;
  isNewRecipient: boolean;
}): FraudEvaluationResult {
  const { amountMinor, senderId, senderName, recipientId, recentTransactions, isNewRecipient } = params;

  let riskScore = 5; // baseline noise
  const triggeredRules: FraudEvaluationResult['triggeredRules'] = [];

  const now = Date.now();
  const lastFiveMinutes = now - 5 * 60 * 1000;
  const lastMinute = now - 60 * 1000;

  // 1. Velocity Burst: multiple transfers by sender in last 60 seconds
  const recentOneMinuteTxs = recentTransactions.filter(
    (t) => t.senderId === senderId && new Date(t.createdAt).getTime() > lastMinute
  );

  if (recentOneMinuteTxs.length >= 2) {
    const points = 35;
    riskScore += points;
    triggeredRules.push({
      code: 'RULE_VELOCITY_BURST',
      name: 'High Frequency Velocity',
      description: `Detected ${recentOneMinuteTxs.length + 1} transfers within 60 seconds from this account`,
      points,
      severity: 'HIGH',
    });
  }

  // 2. Large Amount Threshold (> $2,500 = 250000 minor units)
  if (amountMinor >= 250000) {
    const points = 30;
    riskScore += points;
    triggeredRules.push({
      code: 'RULE_LARGE_AMOUNT_THRESHOLD',
      name: 'High Value Transfer',
      description: `Transfer amount ($${(amountMinor / 100).toFixed(2)}) exceeds standard single transaction limit of $2,500.00`,
      points,
      severity: amountMinor > 500000 ? 'CRITICAL' : 'HIGH',
    });
  }

  // 3. New Recipient Spike
  if (isNewRecipient && amountMinor > 100000) {
    const points = 20;
    riskScore += points;
    triggeredRules.push({
      code: 'RULE_NEW_RECIPIENT_LARGE',
      name: 'First-Time Recipient High Value',
      description: `First ever transfer to recipient with amount exceeding $1,000.00`,
      points,
      severity: 'MEDIUM',
    });
  }

  // 4. Multiple recent canceled or failed attempts in last 5 minutes
  const recentFailedTxs = recentTransactions.filter(
    (t) => t.senderId === senderId && t.status === 'CANCELED' && new Date(t.createdAt).getTime() > lastFiveMinutes
  );

  if (recentFailedTxs.length >= 2) {
    const points = 25;
    riskScore += points;
    triggeredRules.push({
      code: 'RULE_REPEATED_FAILED_ATTEMPTS',
      name: 'Repeated Failed Attempts',
      description: `${recentFailedTxs.length} failed/canceled attempts in the last 5 minutes`,
      points,
      severity: 'MEDIUM',
    });
  }

  // Bound score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 75) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 25) riskLevel = 'MEDIUM';

  const isBlocked = riskScore >= 85;

  return {
    riskScore,
    riskLevel,
    triggeredRules,
    isBlocked,
  };
}

export function createFraudAlertFromEvaluation(
  evaluation: FraudEvaluationResult,
  transactionRef: string,
  userId: string,
  userName: string
): FraudAlert | null {
  if (evaluation.triggeredRules.length === 0 && evaluation.riskScore < 30) {
    return null;
  }

  const primaryRule = evaluation.triggeredRules[0] || {
    code: 'RULE_ANOMALOUS_ACTIVITY',
    name: 'Anomalous Payment Pattern',
    description: `Automated risk score reached ${evaluation.riskScore}/100`,
    severity: evaluation.riskLevel,
  };

  return {
    id: `fa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ruleCode: primaryRule.code,
    ruleName: primaryRule.name,
    severity: primaryRule.severity,
    riskScore: evaluation.riskScore,
    transactionRef,
    userId,
    userName,
    description: primaryRule.description,
    status: 'PENDING_REVIEW',
    createdAt: new Date().toISOString(),
  };
}
