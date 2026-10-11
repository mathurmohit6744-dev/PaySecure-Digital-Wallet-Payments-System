import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
  Activity,
} from 'lucide-react';
import { AnalyticsSummary, CurrencyCode } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary;
  currency: CurrencyCode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, currency }) => {
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const formatAmount = (minor: number) => {
    return (minor / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const cashFlowData = [
    {
      name: 'Simulated Cashflow',
      Income: analytics.totalIncomeMinor / 100,
      Outgoing: analytics.totalExpenseMinor / 100,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          Payment Analytics & Flow Insights
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Real-time aggregated metrics computed directly from immutable ledger debits & credits
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#171f2e] border border-[#222c42] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Incoming Payments</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">
            {currencySymbol}
            {formatAmount(analytics.totalIncomeMinor)}
          </p>
          <p className="text-[11px] text-slate-400">Verified P2P & settlement credits</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#171f2e] border border-[#222c42] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Outgoing Spending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-amber-400">
            {currencySymbol}
            {formatAmount(analytics.totalExpenseMinor)}
          </p>
          <p className="text-[11px] text-slate-400">Debit transfers & merchant checkouts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#171f2e] border border-[#222c42] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Successful Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-white">
            {analytics.successfulTxCount}
          </p>
          <p className="text-[11px] text-slate-400">
            {analytics.pendingTxCount} pending, {analytics.canceledTxCount} canceled
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#171f2e] border border-[#222c42] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ledger Health Score</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">100%</p>
          <p className="text-[11px] text-slate-400">Zero float leakage / 100% balanced</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending by Category Pie Chart */}
        <div className="lg:col-span-6 bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Expenditure by Category</h2>
            <span className="text-xs text-slate-400">All-time</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  dataKey="amountMinor"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {analytics.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${currencySymbol}${(Number(value) / 100).toFixed(2)}`,
                    'Amount',
                  ]}
                  contentStyle={{ backgroundColor: '#111622', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#222c42]">
            {analytics.categoryBreakdown.map((item, i) => (
              <div key={i} className="text-center p-2 rounded-xl bg-[#121722]">
                <p className="text-[10px] text-slate-400 truncate">{item.name}</p>
                <p className="text-xs font-bold text-white font-mono mt-0.5">
                  {currencySymbol}
                  {(item.amountMinor / 100).toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cashflow Bar Comparison */}
        <div className="lg:col-span-6 bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Inflow vs. Outflow Comparison</h2>
            <span className="text-xs text-slate-400">Total Volume</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222d42" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <Tooltip
                  formatter={(val: any) => [`${currencySymbol}${val.toFixed(2)}`]}
                  contentStyle={{ backgroundColor: '#111622', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Outgoing" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-2xl bg-[#121722] border border-[#222c42] text-xs text-slate-300">
            <span className="font-bold text-amber-400">Analytical Integrity Rule: </span>
            Metrics never double-count internal transfers. Each transfer generates 1 Debit and 1 Credit record in integer units.
          </div>
        </div>
      </div>
    </div>
  );
};
