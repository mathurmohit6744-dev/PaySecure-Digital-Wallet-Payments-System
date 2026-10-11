import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  CreditCard,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { User, Transaction, AnalyticsSummary, CurrencyCode } from '../types';

interface DashboardViewProps {
  user: User;
  analytics: AnalyticsSummary;
  transactions: Transaction[];
  currency: CurrencyCode;
  onOpenSendModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onToggleCardFrozen: (cardId: string) => void;
  onOpenBeginnerLab: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  analytics,
  transactions,
  currency,
  onOpenSendModal,
  onSelectTransaction,
  onToggleCardFrozen,
  onOpenBeginnerLab,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Format minor units into clean display (e.g., 1412456 cents -> $14,124.56 or formatted string)
  const formatAmount = (minor: number) => {
    return (minor / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-7">
      {/* Top Header Section matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Dashboard
            {user.isWalletSuspended && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                Wallet Suspended
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Whole data about your business here</p>
        </div>

        {/* 3 Metric Pills matching screenshot */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Weekly totals */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#171f2e] border border-[#222c42]">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
              {currencySymbol}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {currencySymbol}
                {formatAmount(analytics.weeklySpendMinor)}
              </p>
              <p className="text-[11px] text-slate-400">Weekly totals</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              +{analytics.weeklyChangePercent}%
            </span>
          </div>

          {/* Monthly totals */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#171f2e] border border-[#222c42]">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
              {currencySymbol}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {currencySymbol}
                {formatAmount(analytics.monthlySpendMinor)}
              </p>
              <p className="text-[11px] text-slate-400">Monthly totals</p>
            </div>
            <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              {analytics.monthlyChangePercent}%
            </span>
          </div>

          {/* Annual totals */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#171f2e] border border-[#222c42]">
            <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
              {currencySymbol}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {currencySymbol}
                {formatAmount(analytics.annualSpendMinor)}
              </p>
              <p className="text-[11px] text-slate-400">Annual totals</p>
            </div>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {analytics.annualChangePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Hero Grid: Chart Card + Virtual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Spent Chart Card (8 cols) matching screenshot */}
        <div className="lg:col-span-8 bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Total spent</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {currencySymbol}
                    {formatAmount(analytics.walletBalanceMinor)}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3" />
                    +12%
                  </span>
                </div>
              </div>

              {/* Chart dropdown & legend */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    This week
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Last week
                  </span>
                </div>

                <button className="flex items-center gap-1.5 bg-[#1f293d] text-slate-300 text-xs px-3 py-1.5 rounded-xl border border-slate-700/60 hover:text-white transition">
                  <span>This week</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Analytics Curve Chart */}
          <div className="h-64 mt-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222d42" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#222d42' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#222d42' }}
                  tickFormatter={(val) => `${currencySymbol}${val}`}
                  domain={[0, 1600]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#111622] border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-semibold text-slate-200">{payload[0]?.payload?.day}</p>
                          <p className="text-amber-400 font-bold">
                            This week: {currencySymbol}
                            {payload[0]?.value}
                          </p>
                          <p className="text-emerald-400">
                            Last week: {currencySymbol}
                            {payload[1]?.value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="thisWeek"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#171f2e', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="lastWeek"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-[#222d42]/60 flex items-center justify-between text-xs text-slate-400">
            <span>Ledger Consistency: Double-Entry Immutable Verified</span>
            <button
              onClick={onOpenBeginnerLab}
              className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              Understand ledger math & Phase 1 setup →
            </button>
          </div>
        </div>

        {/* My Cards Column (4 cols) matching screenshot */}
        <div className="lg:col-span-4 bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white tracking-wide">My Card</h2>
              <button
                onClick={onOpenSendModal}
                className="w-6 h-6 rounded-full bg-[#202a3d] border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-amber-400 transition"
                title="Add Card / Top up funds"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards List */}
            <div className="space-y-4">
              {user.cards.map((card) => {
                const isOrange = card.variant === 'gradient-orange';
                return (
                  <div
                    key={card.id}
                    className={`relative rounded-2xl p-5 shadow-lg overflow-hidden transition transform hover:-translate-y-1 ${
                      isOrange
                        ? 'bg-gradient-to-br from-[#ff5743] via-[#ff6b55] to-[#f59e0b] text-white'
                        : 'bg-gradient-to-br from-[#1db2c9] via-[#108ea4] to-[#0d6475] text-white'
                    } ${card.isFrozen ? 'grayscale opacity-75 ring-2 ring-rose-500' : ''}`}
                  >
                    {/* Background glow watermark */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <span className="text-base font-mono tracking-widest font-bold">
                          **** {card.last4}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{card.type}</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-end justify-between relative z-10">
                      <div>
                        <p className="text-xs font-semibold tracking-wide uppercase">
                          {card.cardHolder}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] opacity-75 uppercase">EXP</p>
                        <p className="text-xs font-mono font-bold">{card.expiry}</p>
                      </div>
                    </div>

                    {/* Freeze / unfreeze toggle */}
                    <button
                      onClick={() => onToggleCardFrozen(card.id)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-black/20 text-white/80 hover:text-white transition"
                      title={card.isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
                    >
                      {card.isFrozen ? (
                        <Lock className="w-3 h-3 text-rose-300" />
                      ) : (
                        <Unlock className="w-3 h-3 text-white/60" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onOpenSendModal}
            className="w-full mt-4 py-2.5 rounded-xl bg-[#202a3d] hover:bg-[#28354c] border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant P2P Transfer</span>
          </button>
        </div>
      </div>

      {/* Transaction History Section matching screenshot */}
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white tracking-tight">Transaction History</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-[#1f293d] text-slate-300 text-xs px-3 py-1.5 rounded-xl border border-slate-700/60 hover:text-white transition">
              <span>This week</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Table matching screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#222c42]">
                <th className="pb-3 px-4">Name</th>
                <th className="pb-3 px-4">Price</th>
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222c42]/60">
              {transactions.slice(0, 6).map((tx) => {
                // Determine Avatar initial & background color
                let initial = tx.recipientAvatar || tx.recipientName.charAt(0);
                let avatarBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

                if (initial === 'G' || initial === 'L') {
                  avatarBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                } else if (initial === 'A') {
                  avatarBg = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                } else if (initial === 'T') {
                  avatarBg = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                }

                // Date formatting matching screenshot: 11/09/24
                const txDate = new Date(tx.createdAt);
                const day = String(txDate.getDate()).padStart(2, '0');
                const month = String(txDate.getMonth() + 1).padStart(2, '0');
                const year = String(txDate.getFullYear()).slice(-2);
                const formattedDate = `${day}/${month}/${year}`;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-[#1f2a3f]/70 transition cursor-pointer group"
                  >
                    {/* Name column with round colored badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border ${avatarBg}`}
                        >
                          {initial}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-amber-400 transition">
                            {tx.recipientName}
                          </p>
                          <p className="text-[11px] text-slate-400">{tx.reference}</p>
                        </div>
                      </div>
                    </td>

                    {/* Price column */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {currencySymbol}
                      {formatAmount(tx.amountMinor)}
                    </td>

                    {/* Date column */}
                    <td className="py-3.5 px-4 text-xs text-slate-400">{formattedDate}</td>

                    {/* Type pill */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-[#1f283a] text-slate-300 border border-slate-700/50">
                        {tx.type}
                      </span>
                    </td>

                    {/* Status badge matching screenshot */}
                    <td className="py-3.5 px-4">
                      {tx.status === 'PAID' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      )}
                      {tx.status === 'PENDING' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {tx.status === 'CANCELED' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5">
                          <XCircle className="w-3 h-3" />
                          Canceled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
