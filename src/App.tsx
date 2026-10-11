/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { SendMoneyModal } from './components/SendMoneyModal';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';
import { TwoFactorModal } from './components/TwoFactorModal';
import { FraudAlertsView } from './components/FraudAlertsView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminLedgerView } from './components/AdminLedgerView';
import { BeginnerLabView } from './components/BeginnerLabView';
import { ledgerService } from './services/ledgerService';
import { Transaction, CurrencyCode, User } from './types';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(() => ledgerService.getActiveUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => ledgerService.getAllUsers());
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [timeRange, setTimeRange] = useState<string>('This week');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Refresh data trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshAllData = () => {
    setRefreshKey((k) => k + 1);
    setCurrentUser(ledgerService.getActiveUser());
    setAllUsers(ledgerService.getAllUsers());
  };

  const transactions = ledgerService.getUserTransactions(currentUser.id);
  const allLedgerTransactions = ledgerService.getAllTransactions();
  const ledgerEntries = ledgerService.getLedgerEntries();
  const fraudAlerts = ledgerService.getFraudAlerts();
  const auditLogs = ledgerService.getAuditLogs();
  const analytics = ledgerService.getAnalytics(currentUser.id);

  const pendingAlertsCount = fraudAlerts.filter((a) => a.status === 'PENDING_REVIEW').length;

  // Filter transactions by search
  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSwitchUser = () => {
    const nextUser =
      currentUser.role === 'CUSTOMER'
        ? allUsers.find((u) => u.role === 'ADMIN') || allUsers[1]
        : allUsers.find((u) => u.role === 'CUSTOMER') || allUsers[0];

    ledgerService.setActiveUser(nextUser.id);
    refreshAllData();
    showToast('info', `Switched active role to: ${nextUser.name} (${nextUser.role})`);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all transactions and ledger back to initial seed data?')) {
      ledgerService.resetToSeed();
      refreshAllData();
      showToast('success', 'Database & Ledger reset to initial verified seed state.');
    }
  };

  const handleTransferSuccess = (tx: Transaction) => {
    setIsSendModalOpen(false);
    refreshAllData();
    setSelectedReceipt(tx);
    showToast('success', `Transfer of $${(tx.amountMinor / 100).toFixed(2)} completed successfully!`);
  };

  const handleToggleCardFrozen = (cardId: string) => {
    ledgerService.toggleCardFrozen(cardId);
    refreshAllData();
    showToast('info', 'Virtual card freeze status updated.');
  };

  const handleSimulateFraudScenario = (scenario: 'velocity' | 'large_amount' | 'failed_attempts') => {
    if (scenario === 'large_amount') {
      const res = ledgerService.executeTransfer({
        senderId: currentUser.id,
        recipientIdentifier: 'usr_sarah_02',
        amountMinor: 280000, // $2,800 > threshold
        currency: 'USD',
        description: 'Simulated High Value Spike Transfer',
        idempotencyKey: `sim_spike_${Date.now()}`,
        twoFactorCode: currentUser.twoFactorSecret ? '123456' : undefined,
      });
      refreshAllData();
      showToast('warning', 'Triggered High Value Transfer! Alert created in Fraud console.');
    } else if (scenario === 'velocity') {
      // Execute 3 small transfers rapidly
      for (let i = 0; i < 3; i++) {
        ledgerService.executeTransfer({
          senderId: currentUser.id,
          recipientIdentifier: 'usr_alex_03',
          amountMinor: 1000,
          currency: 'USD',
          description: `Rapid burst transfer #${i + 1}`,
          idempotencyKey: `sim_velo_${Date.now()}_${i}`,
          twoFactorCode: currentUser.twoFactorSecret ? '123456' : undefined,
        });
      }
      refreshAllData();
      showToast('warning', 'Velocity Alert Triggered! 3 transfers executed in rapid succession.');
    } else if (scenario === 'failed_attempts') {
      // Simulate failed 2FA attempts
      for (let i = 0; i < 3; i++) {
        ledgerService.addAuditLog({
          userId: currentUser.id,
          userEmail: currentUser.email,
          action: '2FA_VERIFICATION_FAILED',
          resource: 'P2P_TRANSFER',
          details: 'Simulated invalid one-time password retry',
          ipAddress: '103.111.82.14',
          status: 'WARNING',
        });
      }
      refreshAllData();
      showToast('warning', 'Logged 3 consecutive failed verification attempts in audit trail.');
    }
  };

  return (
    <div className="flex h-screen bg-[#0e131f] text-slate-100 font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#171f2e] border border-slate-700 shadow-2xl text-xs text-white animate-in slide-in-from-top-2">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Left Navigation Sidebar matching screenshot */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onResetData={handleResetData}
        pendingAlertsCount={pendingAlertsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <TopNav
          onSearch={setSearchQuery}
          currency={currency}
          onCurrencyChange={setCurrency}
          onOpenSendModal={() => setIsSendModalOpen(true)}
          onOpenSecurity={() => setIs2FAModalOpen(true)}
          pendingAlertsCount={pendingAlertsCount}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={currentUser}
              analytics={analytics}
              transactions={filteredTransactions}
              currency={currency}
              onOpenSendModal={() => setIsSendModalOpen(true)}
              onSelectTransaction={(tx) => setSelectedReceipt(tx)}
              onToggleCardFrozen={handleToggleCardFrozen}
              onOpenBeginnerLab={() => setActiveTab('beginner-lab')}
            />
          )}

          {activeTab === 'transfer' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Peer-to-Peer Transfer</h1>
                  <p className="text-xs text-slate-400">
                    Send funds directly using immutable double-entry ledger bookkeeping
                  </p>
                </div>
                <button
                  onClick={() => setIsSendModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Open Transfer Modal
                </button>
              </div>

              {/* Direct inline send form preview */}
              <div className="p-6 rounded-3xl bg-[#171f2e] border border-[#222c42] space-y-4">
                <p className="text-sm font-semibold text-white">Quick Contacts on PaySecure</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {allUsers
                    .filter((u) => u.id !== currentUser.id)
                    .map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setIsSendModalOpen(true)}
                        className="p-3.5 rounded-2xl bg-[#121722] border border-[#222c42] hover:border-amber-500/50 cursor-pointer transition flex items-center gap-3"
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{user.name}</p>
                          <p className="text-[10px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">All Transactions</h1>
                  <p className="text-xs text-slate-400">
                    Search and inspect electronic receipts with cryptographic signatures
                  </p>
                </div>
              </div>

              <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#222c42]">
                        <th className="pb-3 px-4">Recipient / Sender</th>
                        <th className="pb-3 px-4">Amount</th>
                        <th className="pb-3 px-4">Reference</th>
                        <th className="pb-3 px-4">Date</th>
                        <th className="pb-3 px-4">Category</th>
                        <th className="pb-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222c42]/60">
                      {filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedReceipt(tx)}
                          className="hover:bg-[#1f2a3f]/70 transition cursor-pointer"
                        >
                          <td className="py-3 px-4 font-medium text-white">{tx.recipientName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {currency === 'INR' ? '₹' : '$'}
                            {(tx.amountMinor / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">{tx.reference}</td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-300">{tx.category}</td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statement' && (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold text-white">Account Statement & Ledger Summary</h1>
              <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
                <p className="text-xs text-slate-300">
                  Detailed ledger credits & debits posted to wallet ID: <code>{currentUser.id}</code>
                </p>
                <div className="space-y-2">
                  {ledgerEntries
                    .filter((e) => e.walletId === currentUser.id)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl bg-[#121722] border border-[#222c42] flex items-center justify-between font-mono text-xs"
                      >
                        <div>
                          <span
                            className={`font-bold mr-2 ${
                              entry.entryType === 'DEBIT' ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            [{entry.entryType}]
                          </span>
                          <span className="text-slate-300">Tx: {entry.transactionId}</span>
                        </div>
                        <div className="font-bold text-white">
                          {entry.entryType === 'DEBIT' ? '-' : '+'}
                          {currency === 'INR' ? '₹' : '$'}
                          {(entry.amountMinor / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsView analytics={analytics} currency={currency} />}

          {activeTab === 'security-2fa' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Two-Factor Authentication (TOTP)</h1>
                  <p className="text-xs text-slate-400">
                    Manage RFC 6238 time-based one-time passwords and recovery codes
                  </p>
                </div>
                <button
                  onClick={() => setIs2FAModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Configure Authenticator App
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-[#171f2e] border border-[#222c42] space-y-3">
                <p className="text-sm font-bold text-white">Why 2FA is Critical for FinTech Wallets</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In PaySecure, every sensitive action (such as high-value P2P transfers or login from
                  unrecognized IP addresses) prompts a 6-digit TOTP challenge. TOTP codes change
                  every 30 seconds and are calculated strictly on your device without transmitting your
                  master secret across the network.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'fraud-alerts' && (
            <FraudAlertsView
              alerts={fraudAlerts}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onSimulateFraud={handleSimulateFraudScenario}
            />
          )}

          {activeTab === 'admin-ledger' && (
            <AdminLedgerView
              allUsers={allUsers}
              ledgerEntries={ledgerEntries}
              auditLogs={auditLogs}
              currency={currency}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'beginner-lab' && <BeginnerLabView />}
        </main>
      </div>

      {/* Send Money Modal */}
      {isSendModalOpen && (
        <SendMoneyModal
          currentUser={currentUser}
          allUsers={allUsers}
          currency={currency}
          onClose={() => setIsSendModalOpen(false)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {/* Transaction Receipt Modal */}
      {selectedReceipt && (
        <TransactionReceiptModal
          transaction={selectedReceipt}
          currency={currency}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* 2FA Security Modal */}
      {is2FAModalOpen && (
        <TwoFactorModal
          currentUser={currentUser}
          onClose={() => setIs2FAModalOpen(false)}
          onUpdated={refreshAllData}
        />
      )}
    </div>
  );
}
