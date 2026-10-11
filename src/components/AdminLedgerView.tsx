import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User as UserIcon,
  Search,
  Scale,
} from 'lucide-react';
import { User, LedgerEntry, AuditLog, CurrencyCode } from '../types';
import { ledgerService } from '../services/ledgerService';

interface AdminLedgerViewProps {
  allUsers: User[];
  ledgerEntries: LedgerEntry[];
  auditLogs: AuditLog[];
  currency: CurrencyCode;
  onRefresh: () => void;
}

export const AdminLedgerView: React.FC<AdminLedgerViewProps> = ({
  allUsers,
  ledgerEntries,
  auditLogs,
  currency,
  onRefresh,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const [activeTab, setActiveTab] = useState<'users' | 'ledger' | 'audit'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate total debits and credits across the whole system
  const totalDebits = ledgerEntries
    .filter((e) => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + e.amountMinor, 0);

  const totalCredits = ledgerEntries
    .filter((e) => e.entryType === 'CREDIT')
    .reduce((sum, e) => sum + e.amountMinor, 0);

  const isBalanced = totalDebits === totalCredits;

  const handleToggleFreeze = (userId: string) => {
    ledgerService.toggleWalletSuspension(userId);
    onRefresh();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Admin Compliance & Ledger Inspector
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Restricted Access
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Immutable Double-Entry Ledger verification, user restrictions, and append-only audit trail
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#171f2e] border border-[#222c42] rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'ledger'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Double-Entry Ledger
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Wallet Controls
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* Double-Entry Ledger Mathematical Proof Banner */}
      <div className="p-6 rounded-3xl bg-[#171f2e] border border-[#222c42] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isBalanced
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Double-Entry Mathematical Proof (Debit ≡ Credit)
              {isBalanced ? (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  BALANCED: SUM DIFF = 0
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                  IMBALANCED LEAK DETECTED
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every financial event records matched DEBIT and CREDIT rows in integer minor units.
              Net ledger delta must always equal exactly 0.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#121722] p-4 rounded-2xl border border-[#222c42]">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Debits</p>
            <p className="font-mono text-sm font-bold text-amber-400">
              {currencySymbol}
              {(totalDebits / 100).toFixed(2)}
            </p>
          </div>
          <div className="text-slate-600 font-bold">=</div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Credits</p>
            <p className="font-mono text-sm font-bold text-emerald-400">
              {currencySymbol}
              {(totalCredits / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Tab 1: Ledger Entries */}
      {activeTab === 'ledger' && (
        <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Append-Only Ledger Stream</h2>
            <span className="text-xs text-slate-400">
              Total {ledgerEntries.length} Entries Posted
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#222c42]">
                  <th className="pb-3 px-3">Entry ID</th>
                  <th className="pb-3 px-3">Transaction ID</th>
                  <th className="pb-3 px-3">Wallet / Target</th>
                  <th className="pb-3 px-3">Entry Type</th>
                  <th className="pb-3 px-3">Amount (Minor)</th>
                  <th className="pb-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222c42]/60 font-mono">
                {ledgerEntries.map((entry) => {
                  const isDebit = entry.entryType === 'DEBIT';
                  return (
                    <tr key={entry.id} className="hover:bg-[#1f2a3f]/50 transition">
                      <td className="py-3 px-3 text-slate-300">{entry.id}</td>
                      <td className="py-3 px-3 text-slate-400">{entry.transactionId}</td>
                      <td className="py-3 px-3 text-white font-sans">{entry.walletId}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isDebit
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {entry.entryType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {isDebit ? '-' : '+'}
                        {currencySymbol}
                        {(entry.amountMinor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[10px]">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Users and Wallet Controls */}
      {activeTab === 'users' && (
        <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white">Registered Wallets & Sanction Controls</h2>
          <div className="space-y-3">
            {allUsers.map((user) => {
              const balance = ledgerService.getWalletBalance(user.id);
              return (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl bg-[#121722] border border-[#222c42] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {user.role}
                        </span>
                        {user.twoFactorEnabled && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            2FA ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {user.email} • {user.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        Ledger Balance
                      </p>
                      <p className="font-mono text-sm font-bold text-white">
                        {currencySymbol}
                        {(balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleFreeze(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        user.isWalletSuspended
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-[#1f283a] text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {user.isWalletSuspended ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Suspended (Unlock)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Active (Suspend)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Append-Only Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">System Audit Log Trail</h2>
            <span className="text-xs text-slate-400">Immutable Compliance Journal</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#121722] border border-[#222c42] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.status === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-medium">{log.details}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    User: {log.userEmail} • Resource: {log.resource} • IP: {log.ipAddress}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
