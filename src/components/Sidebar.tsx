import React from 'react';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Receipt,
  FileSpreadsheet,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Lock,
  BookOpen,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onSwitchUser: () => void;
  onResetData: () => void;
  pendingAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUser,
  onResetData,
  pendingAlertsCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transfer', label: 'Send Money', icon: ArrowRightLeft, badge: 'P2P' },
    { id: 'transactions', label: 'Transaction', icon: Receipt, badgeCount: 12 },
    { id: 'statement', label: 'Statement', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'security-2fa', label: '2FA Security', icon: ShieldCheck },
    {
      id: 'fraud-alerts',
      label: 'Fraud Alerts',
      icon: AlertTriangle,
      alertCount: pendingAlertsCount,
    },
    { id: 'admin-ledger', label: 'Admin Console', icon: Lock, adminOnly: true },
    {
      id: 'beginner-lab',
      label: 'Phase 1 Guide',
      icon: BookOpen,
      highlight: true,
    },
  ];

  return (
    <aside className="w-64 bg-[#111622] border-r border-[#1e2638] flex flex-col justify-between shrink-0 h-screen select-none overflow-y-auto">
      <div>
        {/* Brand Logo matching screenshot */}
        <div className="p-6 pb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <div className="w-4 h-4 rounded-full bg-[#111622] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              W-pay
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Secure
              </span>
            </span>
          </div>
        </div>

        {/* Profile Card matching screenshot */}
        <div className="px-5 mb-5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Profile
          </p>
          <div
            onClick={onSwitchUser}
            className="p-2.5 rounded-xl bg-[#171e2e] border border-[#222c42] flex items-center justify-between cursor-pointer hover:border-slate-600 transition group"
            title="Click to switch between Customer and Admin profiles"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-amber-400 transition"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#171e2e]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-400">{currentUser.phone}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
          </div>

          <button
            onClick={onSwitchUser}
            className="w-full mt-2 flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400 px-2 py-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Switch account / role</span>
          </button>
        </div>

        {/* Main Menu */}
        <div className="px-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#1e273a] text-white shadow-inner border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c2a]'
                  } ${item.highlight ? 'ring-1 ring-amber-500/30 text-amber-200 bg-amber-500/10' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-amber-400'
                          : item.highlight
                            ? 'text-amber-400'
                            : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badgeCount && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500/90 text-white shadow-sm">
                        {item.badgeCount}
                      </span>
                    )}
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                    {item.alertCount && item.alertCount > 0 ? (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 animate-pulse">
                        {item.alertCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Support / Footer Menu */}
      <div className="p-4 border-t border-[#1e2638] space-y-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          Environment & Support
        </p>

        <button
          onClick={onResetData}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#161c2a] rounded-lg transition"
          title="Reset simulated ledger transactions and database to initial seed"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>Reset Ledger Seed</span>
        </button>

        <button
          onClick={onSwitchUser}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-[#161c2a] rounded-lg transition"
        >
          <UserCheck className="w-4 h-4" />
          <span>Role: {currentUser.role}</span>
        </button>
      </div>
    </aside>
  );
};
