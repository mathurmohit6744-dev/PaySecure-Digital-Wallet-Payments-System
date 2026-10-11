import React from 'react';
import { Search, ChevronDown, LayoutGrid, Bell, Shield, Send } from 'lucide-react';
import { CurrencyCode } from '../types';

interface TopNavProps {
  onSearch: (query: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onOpenSendModal: () => void;
  onOpenSecurity: () => void;
  pendingAlertsCount: number;
  timeRange: string;
  setTimeRange: (range: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSearch,
  currency,
  onCurrencyChange,
  onOpenSendModal,
  onOpenSecurity,
  pendingAlertsCount,
  timeRange,
  setTimeRange,
}) => {
  return (
    <header className="h-18 px-8 border-b border-[#1e2638] bg-[#111622]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Search Input matching screenshot */}
      <div className="relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search for people, document, goods..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full bg-[#182030] text-sm text-slate-200 placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl border border-[#222d42] focus:outline-none focus:border-amber-500/70 transition"
        />
      </div>

      {/* Top right actions matching screenshot */}
      <div className="flex items-center gap-3">
        {/* Currency Switcher (Paise vs Cents) */}
        <div className="flex items-center bg-[#182030] border border-[#222d42] rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => onCurrencyChange('USD')}
            className={`px-2.5 py-1 rounded-lg transition ${
              currency === 'USD' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => onCurrencyChange('INR')}
            className={`px-2.5 py-1 rounded-lg transition ${
              currency === 'INR' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            INR (₹)
          </button>
        </div>

        {/* Time Period Selector matching screenshot */}
        <div className="relative group">
          <button className="flex items-center gap-2 bg-[#182030] text-sm text-slate-300 px-3.5 py-2 rounded-xl border border-[#222d42] hover:border-slate-600 transition">
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-[#182030] border border-[#222d42] rounded-xl shadow-xl py-1 hidden group-hover:block z-30">
            {['This week', 'This month', 'This year'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeRange(period)}
                className={`w-full text-left px-3.5 py-1.5 text-xs transition ${
                  timeRange === period ? 'text-amber-400 font-bold bg-[#202b40]' : 'text-slate-300 hover:bg-[#202b40]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Change view button matching screenshot */}
        <button
          onClick={onOpenSendModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>Send Money</span>
        </button>

        {/* Security / 2FA status button */}
        <button
          onClick={onOpenSecurity}
          className="relative p-2 rounded-xl bg-[#182030] border border-[#222d42] text-slate-300 hover:text-white hover:border-slate-600 transition"
          title="2FA & Security Center"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenSecurity}
          className="relative p-2 rounded-xl bg-[#182030] border border-[#222d42] text-slate-300 hover:text-white hover:border-slate-600 transition"
          title="Fraud Risk Notifications"
        >
          <Bell className="w-4 h-4 text-slate-400" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              {pendingAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
