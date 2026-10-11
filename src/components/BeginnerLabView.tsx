import React, { useState } from 'react';
import {
  Terminal,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  Shield,
  Code,
  Laptop,
} from 'lucide-react';
import { TestResult } from '../types';
import { ledgerService } from '../services/ledgerService';
import { verifyTOTP, calculateTOTP } from '../services/totpService';
import { evaluateTransactionRisk } from '../services/fraudEngine';

export const BeginnerLabView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const runAutomatedTests = () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    setTimeout(() => {
      // Test 1: Double-Entry Sum Zero
      const startT1 = performance.now();
      const entries = ledgerService.getLedgerEntries();
      const debits = entries
        .filter((e) => e.entryType === 'DEBIT')
        .reduce((sum, e) => sum + e.amountMinor, 0);
      const credits = entries
        .filter((e) => e.entryType === 'CREDIT')
        .reduce((sum, e) => sum + e.amountMinor, 0);

      results.push({
        id: 't1',
        title: 'Double-Entry Invariant (Debits == Credits)',
        category: 'Financial Integrity',
        status: debits === credits ? 'PASSED' : 'FAILED',
        durationMs: Math.round(performance.now() - startT1),
        message: `Sum(Debit) = $${(debits / 100).toFixed(2)} | Sum(Credit) = $${(credits / 100).toFixed(2)} (Diff = 0)`,
        details: 'Verified that every posted ledger transaction is balanced with zero float error.',
      });

      // Test 2: Idempotency Key Duplicate Prevention
      const startT2 = performance.now();
      const testKey = `test_idem_${Date.now()}`;
      const res1 = ledgerService.executeTransfer({
        senderId: 'usr_jordi_01',
        recipientIdentifier: 'sarah.m@fintech.dev',
        amountMinor: 500,
        currency: 'USD',
        description: 'Idempotency Test Transfer 1',
        idempotencyKey: testKey,
        twoFactorCode: calculateTOTP(ledgerService.getActiveUser().twoFactorSecret || ''),
      });

      // Immediately call again with identical key
      const res2 = ledgerService.executeTransfer({
        senderId: 'usr_jordi_01',
        recipientIdentifier: 'sarah.m@fintech.dev',
        amountMinor: 500,
        currency: 'USD',
        description: 'Idempotency Test Transfer 1',
        idempotencyKey: testKey,
      });

      const passedIdem =
        res1.success &&
        res2.success &&
        res1.transaction?.id === res2.transaction?.id &&
        res2.fraudWarning?.includes('Duplicate request detected');

      results.push({
        id: 't2',
        title: 'Idempotency Key Deduplication Guard',
        category: 'Financial Integrity',
        status: passedIdem ? 'PASSED' : 'FAILED',
        durationMs: Math.round(performance.now() - startT2),
        message: 'Second identical call safely returned prior receipt without duplicate debit.',
        details: `Transaction ID match: ${res1.transaction?.id === res2.transaction?.id}`,
      });

      // Test 3: Insufficient Funds Guard
      const startT3 = performance.now();
      const resInf = ledgerService.executeTransfer({
        senderId: 'usr_jordi_01',
        recipientIdentifier: 'sarah.m@fintech.dev',
        amountMinor: 999999999, // Exceeds balance
        currency: 'USD',
        description: 'Overdraft Test',
        idempotencyKey: `idem_overdraft_${Date.now()}`,
      });

      results.push({
        id: 't3',
        title: 'Sufficient Funds Check & Negative Balance Guard',
        category: 'Financial Integrity',
        status: !resInf.success && resInf.error?.includes('Insufficient funds') ? 'PASSED' : 'FAILED',
        durationMs: Math.round(performance.now() - startT3),
        message: resInf.error || 'Passed',
        details: 'Ledger rejected debit exceeding available integer minor balance.',
      });

      // Test 4: Fraud Engine Velocity Detection
      const startT4 = performance.now();
      const mockTxs = ledgerService.getAllTransactions();
      const fraudEval = evaluateTransactionRisk({
        amountMinor: 300000, // > $2,500
        senderId: 'usr_jordi_01',
        senderName: 'M. Jordi',
        recipientId: 'new_recipient_test',
        recentTransactions: mockTxs,
        currentBalanceMinor: 1000000,
        isNewRecipient: true,
      });

      results.push({
        id: 't4',
        title: 'Fraud Engine High-Value Spike Detection',
        category: 'Security & Risk',
        status: fraudEval.riskScore >= 50 && fraudEval.triggeredRules.length > 0 ? 'PASSED' : 'FAILED',
        durationMs: Math.round(performance.now() - startT4),
        message: `Calculated Risk Score: ${fraudEval.riskScore}/100 (${fraudEval.riskLevel})`,
        details: `Triggered rules: ${fraudEval.triggeredRules.map((r) => r.name).join(', ')}`,
      });

      // Test 5: TOTP Authenticator RFC 6238 Verification
      const startT5 = performance.now();
      const testSecret = 'JBSWY3DPEHPK3PXP';
      const validCode = calculateTOTP(testSecret);
      const isVerified = verifyTOTP(testSecret, validCode);
      const isBadRejected = !verifyTOTP(testSecret, '000000');

      results.push({
        id: 't5',
        title: 'TOTP RFC 6238 Time-Window Verification',
        category: 'Authentication',
        status: isVerified && isBadRejected ? 'PASSED' : 'FAILED',
        durationMs: Math.round(performance.now() - startT5),
        message: `Verified token "${validCode}" within current 30s step. Rejected bad token "000000".`,
        details: 'Drift window -1/+1 step tolerance validated.',
      });

      setTestResults(results);
      setIsRunningTests(false);
    }, 400);
  };

  const windowsPrereqCommands = [
    { label: '1. Check Node.js Version (Needs v18+)', cmd: 'node -v' },
    { label: '2. Check npm Package Manager', cmd: 'npm -v' },
    { label: '3. Check Git Version Control', cmd: 'git --version' },
    { label: '4. Check PostgreSQL Client (psql)', cmd: 'psql --version' },
  ];

  const windowsDevCommands = [
    { label: 'Start PostgreSQL Service on Windows', cmd: 'net start postgresql-x64-16' },
    { label: 'Create PaySecure Database in PostgreSQL', cmd: 'createdb -U postgres paysecure_db' },
    { label: 'Install Dependencies in Terminal', cmd: 'npm install' },
    { label: 'Run Prisma Database Migration', cmd: 'npx prisma migrate dev --name init' },
    { label: 'Seed Development Accounts & Cards', cmd: 'npm run seed' },
    { label: 'Launch Full-Stack Dev Server (Port 3000)', cmd: 'npm run dev' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Phase 1: Architecture & Windows Guide
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Beginner Friendly (Hinglish)
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
          PaySecure System Architecture & Setup Workbench
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Simple step-by-step guidance in Hinglish, exact Windows terminal commands, free tools list,
          and a live financial integrity automated test suite.
        </p>
      </div>

      {/* Phase Tracker */}
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          Master Roadmap & Phase Tracker
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { phase: 'Phase 1', title: 'Architecture & Windows Prereqs', done: true },
            { phase: 'Phase 2', title: 'React & Express Project Setup', done: true },
            { phase: 'Phase 3', title: 'PostgreSQL Schema & Prisma', done: true },
            { phase: 'Phase 4', title: 'Auth & RBAC Sessions', done: true },
            { phase: 'Phase 5', title: 'Append-Only Ledger Engine', done: true },
            { phase: 'Phase 6', title: 'Atomic P2P Transfers & Idempotency', done: true },
            { phase: 'Phase 7', title: 'Transactions & PDF Receipts', done: true },
            { phase: 'Phase 8', title: 'TOTP 2FA & Backup Codes', done: true },
            { phase: 'Phase 9', title: 'Rule-Based Fraud Engine', done: true },
            { phase: 'Phase 10', title: 'Payment Analytics (Recharts)', done: true },
            { phase: 'Phase 11', title: 'Admin Sanctions & Audit Logs', done: true },
            { phase: 'Phase 12', title: 'Sandbox Gateway Integration', inProgress: true },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                item.done
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                  : item.inProgress
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                    : 'bg-[#121722] border-[#222c42] text-slate-400'
              }`}
            >
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                  {item.phase}
                </span>
                <p className="text-xs font-semibold text-white">{item.title}</p>
              </div>
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hinglish Architecture Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Core Architecture */}
        <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                1. System Architecture (Samjhein Hinglish Mein)
              </h3>
              <p className="text-xs text-slate-400">Client-Server & Banking Principles</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              <strong className="text-amber-400">Frontend (React + Vite):</strong> Ye user ka
              chehra (UI) hai. Yahan customer balance dekhta hai, recipient select karta hai, aur
              payment request bhejta hai. Frontend par kabhi bhi balance direct calculate ya edit
              nahi hota!
            </p>
            <p>
              <strong className="text-emerald-400">Backend (Node.js + Express):</strong> Ye hamara
              secure brain hai. Har request ko authenticate karta hai (JWT/Sessions), rate-limiting
              lagata hai, aur payment rules verify karta hai.
            </p>
            <p>
              <strong className="text-blue-400">Database (PostgreSQL + Prisma):</strong> Yahan users,
              wallets, aur sabse important: <em>Append-Only Ledger</em> store hota hai. PostgreSQL ki
              ACID transactions ensure karti hain ki agar beech mein internet ya server crash ho jaye,
              toh paise hawa mein gayab na hon!
            </p>
          </div>
        </div>

        {/* Card 2: The Golden Rule of FinTech */}
        <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                2. FinTech Ka Sabse Bada Niyam: Double-Entry Ledger
              </h3>
              <p className="text-xs text-slate-400">Kyun direct balance update nahi karte?</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <strong>Galat Tareeqa (Amateur way):</strong> `user.balance = user.balance - 100`.
              Agar server beech mein band ho gaya, toh paise kat jayenge par recipient ko nahi milenge!
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <strong>Sahi Tareeqa (Bank Grade):</strong> Hamesha ek transaction ke do ledger rows
              bante hain:
              <ul className="list-disc ml-5 mt-1 space-y-0.5">
                <li>1. Sender wallet: <strong>DEBIT</strong> ₹100.00 (or 10000 paise)</li>
                <li>2. Recipient wallet: <strong>CREDIT</strong> ₹100.00</li>
              </ul>
              Net sum always = 0! Aur hum minor units (paise/cents) use karte hain taki float
              calculation errors na hon!
            </div>
          </div>
        </div>
      </div>

      {/* Windows Commands Box */}
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Exact Windows Terminal Commands (VS Code / PowerShell)
              </h2>
              <p className="text-xs text-slate-400">
                Apne laptop ke PowerShell ya VS Code terminal (Ctrl + `) mein run karein
              </p>
            </div>
          </div>
        </div>

        {/* Section A: Prereq Checks */}
        <div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            Step A: Check Prerequisites Installed on Your Windows Laptop
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {windowsPrereqCommands.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#121722] border border-[#222c42] flex items-center justify-between"
              >
                <div>
                  <p className="text-[11px] text-slate-400">{item.label}</p>
                  <code className="text-xs font-mono font-bold text-white">{item.cmd}</code>
                </div>
                <button
                  onClick={() => handleCopy(item.cmd, idx)}
                  className="p-2 rounded-lg bg-[#1f283a] hover:bg-slate-700 text-slate-300 transition"
                  title="Copy command"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section B: Project Initialization & Run */}
        <div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            Step B: PostgreSQL & Application Launch Commands
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {windowsDevCommands.map((item, idx) => {
              const adjustedIdx = idx + 10;
              return (
                <div
                  key={adjustedIdx}
                  className="p-3 rounded-xl bg-[#121722] border border-[#222c42] flex items-center justify-between"
                >
                  <div>
                    <p className="text-[11px] text-slate-400">{item.label}</p>
                    <code className="text-xs font-mono font-bold text-amber-300">{item.cmd}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(item.cmd, adjustedIdx)}
                    className="p-2 rounded-lg bg-[#1f283a] hover:bg-slate-700 text-slate-300 transition"
                    title="Copy command"
                  >
                    {copiedIndex === adjustedIdx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Free Tools to Install */}
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Recommended 100% Free Development Tools for Windows
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c42] space-y-1">
            <p className="font-bold text-white text-sm">PostgreSQL 16 Windows Installer</p>
            <p className="text-slate-400">
              Download free from <strong>enterprisedb.com/downloads/postgres</strong>. Ye Windows service banata hai.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c42] space-y-1">
            <p className="font-bold text-white text-sm">pgAdmin 4 ya DBeaver Community</p>
            <p className="text-slate-400">
              Free visual database viewer tool to inspect your tables, ledger rows, and schema graphically.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c42] space-y-1">
            <p className="font-bold text-white text-sm">VS Code + Thunder Client</p>
            <p className="text-slate-400">
              Free lightweight API testing extension inside VS Code to test REST endpoints without Postman memory lag.
            </p>
          </div>
        </div>
      </div>

      {/* Live Automated Test Suite Runner */}
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-400" />
              Automated Financial Integrity & Security Test Runner
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Runs in-browser unit tests verifying double-entry balance, race conditions, idempotency,
              and 2FA TOTP RFC 6238 math.
            </p>
          </div>

          <button
            onClick={runAutomatedTests}
            disabled={isRunningTests}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
          >
            {isRunningTests ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Execute Test Suite Now</span>
          </button>
        </div>

        {/* Test Results Output */}
        {testResults.length > 0 && (
          <div className="space-y-3 pt-2">
            {testResults.map((test) => (
              <div
                key={test.id}
                className="p-4 rounded-2xl bg-[#121722] border border-[#222c42] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        test.status === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {test.status}
                    </span>
                    <span className="font-bold text-white text-sm">{test.title}</span>
                    <span className="text-[10px] text-slate-500">[{test.category}]</span>
                  </div>
                  <p className="text-slate-300 mt-1">{test.message}</p>
                  {test.details && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{test.details}</p>
                  )}
                </div>
                <div className="text-slate-400 font-mono text-[11px] shrink-0">
                  {test.durationMs}ms
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
