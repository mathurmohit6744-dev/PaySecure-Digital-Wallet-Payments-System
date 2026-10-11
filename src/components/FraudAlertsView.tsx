import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Zap,
  Info,
  Clock,
  User,
} from 'lucide-react';
import { FraudAlert, User as UserType } from '../types';
import { ledgerService } from '../services/ledgerService';

interface FraudAlertsViewProps {
  alerts: FraudAlert[];
  currentUser: UserType;
  onRefresh: () => void;
  onSimulateFraud: (scenario: 'velocity' | 'large_amount' | 'failed_attempts') => void;
}

export const FraudAlertsView: React.FC<FraudAlertsViewProps> = ({
  alerts,
  currentUser,
  onRefresh,
  onSimulateFraud,
}) => {
  const pendingCount = alerts.filter((a) => a.status === 'PENDING_REVIEW').length;
  const escalatedCount = alerts.filter((a) => a.status === 'ESCALATED').length;
  const dismissedCount = alerts.filter((a) => a.status === 'DISMISSED').length;

  const handleAction = (alertId: string, action: 'DISMISSED' | 'ESCALATED') => {
    ledgerService.updateFraudAlertStatus(alertId, action, currentUser.name);
    onRefresh();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Fraud Detection & Risk Alerts
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Rule-Based Engine Active
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time scoring, velocity limits, anomaly alerts, and administrative resolution
          </p>
        </div>

        {/* Quick status pill counters */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
            Pending: <span className="font-bold text-white ml-1">{pendingCount}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
            Escalated: <span className="font-bold text-white ml-1">{escalatedCount}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400">
            Dismissed: <span className="font-bold text-white ml-1">{dismissedCount}</span>
          </div>
        </div>
      </div>

      {/* Fraud Simulation Sandbox Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#171f2e] via-[#1a2336] to-[#171f2e] border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              Interactive Fraud Engine Trigger Testing
            </h2>
          </div>
          <span className="text-[11px] text-amber-400 font-mono font-semibold">
            Educational Sandbox
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Click any scenario below to trigger real-time rule violations and see how PaySecure's
          scoring model assigns severity points and creates audit logs:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => onSimulateFraud('velocity')}
            className="p-3 rounded-xl bg-[#1f2a3f] hover:bg-[#25324b] border border-slate-700 text-xs font-semibold text-white flex items-center justify-between transition group"
          >
            <div className="text-left">
              <p className="font-bold text-amber-300 group-hover:text-amber-400">
                Velocity Burst Test
              </p>
              <p className="text-[10px] text-slate-400">3 transfers within 60s</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>

          <button
            onClick={() => onSimulateFraud('large_amount')}
            className="p-3 rounded-xl bg-[#1f2a3f] hover:bg-[#25324b] border border-slate-700 text-xs font-semibold text-white flex items-center justify-between transition group"
          >
            <div className="text-left">
              <p className="font-bold text-rose-300 group-hover:text-rose-400">
                High Value Spike Test
              </p>
              <p className="text-[10px] text-slate-400">Transfer &gt; $2,500 limit</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>

          <button
            onClick={() => onSimulateFraud('failed_attempts')}
            className="p-3 rounded-xl bg-[#1f2a3f] hover:bg-[#25324b] border border-slate-700 text-xs font-semibold text-white flex items-center justify-between transition group"
          >
            <div className="text-left">
              <p className="font-bold text-blue-300 group-hover:text-blue-400">
                Failed Attempts Test
              </p>
              <p className="text-[10px] text-slate-400">Multiple canceled retries</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Rules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: 'Velocity Rule',
            desc: '> 2 transfers in 60s',
            pts: '+35 pts',
            sev: 'HIGH',
            color: 'text-amber-400',
          },
          {
            title: 'High Amount Rule',
            desc: 'Amount >= $2,500.00',
            pts: '+30 pts',
            sev: 'HIGH',
            color: 'text-rose-400',
          },
          {
            title: 'New Recipient Spike',
            desc: 'First transfer > $1,000',
            pts: '+20 pts',
            sev: 'MEDIUM',
            color: 'text-blue-400',
          },
          {
            title: 'Critical Block Threshold',
            desc: 'Score >= 85 automatically blocked',
            pts: 'AUTO BLOCK',
            sev: 'CRITICAL',
            color: 'text-rose-500 font-bold',
          },
        ].map((rule, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-[#171f2e] border border-[#222c42]">
            <p className="text-xs font-bold text-white">{rule.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{rule.desc}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={`font-mono text-xs ${rule.color}`}>{rule.pts}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {rule.sev}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Security Incident & Alert Log</h2>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
              No active fraud alerts detected. System is running smoothly.
            </div>
          ) : (
            alerts.map((alert) => {
              const isPending = alert.status === 'PENDING_REVIEW';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : alert.severity === 'HIGH'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#121722] border-[#222c42]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-500 text-white'
                              : alert.severity === 'HIGH'
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {alert.severity} ({alert.riskScore}/100)
                        </span>

                        <span className="text-xs font-bold text-white">{alert.ruleName}</span>

                        {alert.transactionRef && (
                          <span className="text-[11px] font-mono text-slate-400">
                            [{alert.transactionRef}]
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300">{alert.description}</p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          Account: {alert.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        {alert.reviewedBy && (
                          <span className="text-emerald-400">
                            Reviewed by {alert.reviewedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleAction(alert.id, 'DISMISSED')}
                            className="px-3 py-1.5 rounded-xl bg-[#1e273a] hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleAction(alert.id, 'ESCALATED')}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
                          >
                            Escalate & Lock
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            alert.status === 'ESCALATED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Status: {alert.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
