import React, { useState } from 'react';
import {
  X,
  Send,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Info,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { User, CurrencyCode, Transaction } from '../types';
import { ledgerService } from '../services/ledgerService';
import { calculateTOTP } from '../services/totpService';

interface SendMoneyModalProps {
  currentUser: User;
  allUsers: User[];
  currency: CurrencyCode;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
}

export const SendMoneyModal: React.FC<SendMoneyModalProps> = ({
  currentUser,
  allUsers,
  currency,
  onClose,
  onSuccess,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const availableBalance = ledgerService.getWalletBalance(currentUser.id);

  // Filter out self
  const potentialRecipients = allUsers.filter((u) => u.id !== currentUser.id);

  const [recipient, setRecipient] = useState(potentialRecipients[0]?.email || '');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('Dinner split & coffee');
  const [category, setCategory] = useState('Food & Dining');
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper: auto-generate current valid TOTP for rapid testing
  const currentDemoTOTP = currentUser.twoFactorSecret
    ? calculateTOTP(currentUser.twoFactorSecret)
    : '';

  const handleQuickAmount = (val: number) => {
    setAmountInput(val.toString());
  };

  const regenerateIdempotency = () => {
    setIdempotencyKey(`idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid transfer amount.');
      return;
    }

    // Convert to integer minor units (cents / paise)
    const amountMinor = Math.round(numAmount * 100);

    if (amountMinor > availableBalance) {
      setErrorMessage(
        `Insufficient funds. Available: ${currencySymbol}${(availableBalance / 100).toFixed(2)}, Requested: ${currencySymbol}${numAmount.toFixed(2)}.`
      );
      return;
    }

    if (currentUser.twoFactorEnabled && !twoFactorCode.trim()) {
      setErrorMessage('Please enter your 6-digit Authenticator code (or click Use Demo Code).');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = ledgerService.executeTransfer({
        senderId: currentUser.id,
        recipientIdentifier: recipient,
        amountMinor,
        currency,
        description,
        category,
        idempotencyKey,
        twoFactorCode: twoFactorCode.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Transfer failed.');
        setIsSubmitting(false);
        return;
      }

      if (result.transaction) {
        onSuccess(result.transaction);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during ledger commit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#222c42] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Send Money (P2P)</h2>
              <p className="text-xs text-slate-400">
                Atomic Double-Entry Ledger Transfer with Idempotency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#20293d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Sender Balance Alert */}
          <div className="p-3.5 rounded-2xl bg-[#121722] border border-[#222c42] flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Available Wallet Balance:
              <span className="ml-1.5 font-bold text-white font-mono text-sm">
                {currencySymbol}
                {(availableBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Verified Ledger
            </span>
          </div>

          {/* Recipient Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Recipient
            </label>
            <div className="grid grid-cols-1 gap-2 mb-2">
              {potentialRecipients.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setRecipient(user.email)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    recipient === user.email
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-[#121722] border-[#222c42] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  {recipient === user.email && (
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              ))}
            </div>

            <input
              type="text"
              placeholder="Or enter recipient email or phone"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-[#121722] text-sm text-white px-4 py-2.5 rounded-xl border border-[#222c42] focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Amount ({currency})
              </label>
              <div className="flex gap-1.5">
                {[15, 50, 100, 500, 2600].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => handleQuickAmount(quick)}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#1e273a] hover:bg-slate-700 text-slate-300 transition"
                  >
                    +{quick}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-[#121722] text-2xl font-bold font-mono text-white pl-10 pr-4 py-3 rounded-2xl border border-[#222c42] focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            {parseFloat(amountInput) >= 2500 && (
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Amounts &gt; $2,500 trigger automated high-risk fraud review rules.
              </p>
            )}
          </div>

          {/* Description & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121722] text-xs text-white px-3 py-2.5 rounded-xl border border-[#222c42] focus:outline-none focus:border-amber-500"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="P2P Transfer">P2P Transfer</option>
                <option value="Telecom & Utilities">Telecom & Utilities</option>
                <option value="Automotive & Transport">Automotive & Transport</option>
                <option value="Shopping & Retail">Shopping & Retail</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Note / Memo
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g. Dinner split"
                className="w-full bg-[#121722] text-xs text-white px-3 py-2.5 rounded-xl border border-[#222c42] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Idempotency Key Section (Financial Integrity) */}
          <div className="p-3 rounded-xl bg-[#121722] border border-[#222c42]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Info className="w-3 h-3 text-amber-400" />
                Idempotency Protection Key
              </span>
              <button
                type="button"
                onClick={regenerateIdempotency}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                title="Regenerate key"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
            <p className="font-mono text-[10px] text-slate-500 break-all">{idempotencyKey}</p>
          </div>

          {/* Two-Factor Authentication Prompt if enabled */}
          {currentUser.twoFactorEnabled && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  2FA Authenticator Challenge Required
                </label>
                {currentDemoTOTP && (
                  <button
                    type="button"
                    onClick={() => setTwoFactorCode(currentDemoTOTP)}
                    className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-Fill Demo TOTP ({currentDemoTOTP})
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={9}
                  placeholder="Enter 6-digit TOTP (e.g. 491028) or Backup Code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full bg-[#121722] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-amber-500/40 focus:outline-none focus:border-amber-400 font-mono tracking-wider"
                  required
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Confirm & Commit Atomic Ledger Transfer</span>
          </button>
        </form>
      </div>
    </div>
  );
};
