import React from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Hash,
  Download,
  Share2,
} from 'lucide-react';
import { Transaction, CurrencyCode } from '../types';

interface TransactionReceiptModalProps {
  transaction: Transaction;
  currency: CurrencyCode;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  currency,
  onClose,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const formatAmount = (minor: number) => {
    return (minor / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#222c42] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Official Electronic Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#20293d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status & Amount */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto">
              {transaction.status === 'PAID' && <CheckCircle2 className="w-8 h-8" />}
              {transaction.status === 'PENDING' && <Clock className="w-8 h-8 text-amber-400" />}
              {transaction.status === 'CANCELED' && <XCircle className="w-8 h-8 text-rose-400" />}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {transaction.status === 'PAID' ? 'Payment Completed' : transaction.status}
              </p>
              <h3 className="text-3xl font-extrabold text-white font-mono mt-1">
                {currencySymbol}
                {formatAmount(transaction.amountMinor)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{transaction.description}</p>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c42] space-y-3 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Transaction Reference</span>
              <span className="font-mono font-bold text-slate-200">{transaction.reference}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Timestamp</span>
              <span className="text-slate-200">
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Sender Account</span>
              <span className="font-medium text-slate-200">{transaction.senderName}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Recipient Account</span>
              <span className="font-medium text-slate-200">{transaction.recipientName}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Category</span>
              <span className="text-slate-200">{transaction.category}</span>
            </div>

            <div className="border-t border-[#222c42] pt-2 flex justify-between text-slate-400">
              <span>Platform Processing Fee</span>
              <span className="text-emerald-400 font-semibold">$0.00 (Zero Fee MVP)</span>
            </div>

            <div className="flex justify-between font-bold text-sm text-white pt-1">
              <span>Total Debited</span>
              <span className="font-mono text-amber-400">
                {currencySymbol}
                {formatAmount(transaction.amountMinor)}
              </span>
            </div>
          </div>

          {/* Ledger & Security Verification details */}
          <div className="p-3.5 rounded-xl bg-[#141b2a] border border-[#20293d] space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Ledger Security Seal
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                APPEND-ONLY COMMITTED
              </span>
            </div>

            <div className="font-mono text-[10px] text-slate-500 break-all">
              Sig: {transaction.receiptSignature}
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1">
              <span>Fraud Risk Assessment:</span>
              <span
                className={`font-semibold ${
                  transaction.fraudRiskScore < 30
                    ? 'text-emerald-400'
                    : transaction.fraudRiskScore < 60
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}
              >
                {transaction.fraudRiskLevel} ({transaction.fraudRiskScore}/100)
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="py-2.5 rounded-xl bg-[#202a3d] hover:bg-[#27344c] border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 flex items-center justify-center gap-2 transition"
            >
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
