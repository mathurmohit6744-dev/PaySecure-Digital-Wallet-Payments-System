import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { User } from '../types';
import {
  generateBase32Secret,
  generateOtpAuthUrl,
  generateQRCodeSVG,
  calculateTOTP,
  verifyTOTP,
  getTOTPTimeRemaining,
  generateRecoveryCodes,
} from '../services/totpService';
import { ledgerService } from '../services/ledgerService';

interface TwoFactorModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdated: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  currentUser,
  onClose,
  onUpdated,
}) => {
  const [secret, setSecret] = useState(
    currentUser.twoFactorSecret || generateBase32Secret()
  );
  const [inputCode, setInputCode] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(getTOTPTimeRemaining());
  const [liveTOTP, setLiveTOTP] = useState(calculateTOTP(secret));
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>(
    currentUser.recoveryCodes || generateRecoveryCodes()
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // 30-second live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTOTPTimeRemaining();
      setSecondsRemaining(remaining);
      setLiveTOTP(calculateTOTP(secret));
    }, 1000);
    return () => clearInterval(timer);
  }, [secret]);

  const otpAuthUrl = generateOtpAuthUrl(currentUser.email, secret);
  const qrSvgDataUri = generateQRCodeSVG(otpAuthUrl);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleVerifyAndEnable = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const isValid = verifyTOTP(secret, inputCode);
    if (!isValid) {
      setFeedback({
        type: 'error',
        message: 'Invalid 6-digit verification code. Please check your authenticator app time.',
      });
      return;
    }

    ledgerService.updateTwoFactor(currentUser.id, true, secret, recoveryCodes);
    setFeedback({
      type: 'success',
      message: 'Two-factor authentication successfully activated and enrolled!',
    });
    onUpdated();
  };

  const handleDisable2FA = () => {
    ledgerService.updateTwoFactor(currentUser.id, false);
    setFeedback({
      type: 'success',
      message: '2FA has been disabled for this account.',
    });
    onUpdated();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#171f2e] border border-[#222c42] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#222c42] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">2FA Security Center</h2>
              <p className="text-xs text-slate-400">TOTP Authenticator & Backup Recovery Keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#20293d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Indicator */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              currentUser.twoFactorEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {currentUser.twoFactorEnabled ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <p className="text-sm font-bold">
                  Status: {currentUser.twoFactorEnabled ? '2FA Active & Protected' : '2FA Not Enrolled'}
                </p>
                <p className="text-xs opacity-80">
                  {currentUser.twoFactorEnabled
                    ? 'Transfers and logins require 6-digit TOTP confirmation'
                    : 'Enroll Google Authenticator or Microsoft Authenticator now'}
                </p>
              </div>
            </div>

            {currentUser.twoFactorEnabled && (
              <button
                onClick={handleDisable2FA}
                className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold transition"
              >
                Disable
              </button>
            )}
          </div>

          {/* QR Code and Secret */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#121722] p-4 rounded-2xl border border-[#222c42]">
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-md">
              <img
                src={qrSvgDataUri}
                alt="Authenticator QR Code"
                className="w-36 h-36 object-contain"
              />
              <span className="text-[10px] text-slate-700 font-mono mt-1 font-bold">
                Scan with Authenticator
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Manual Entry Secret
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono font-bold text-amber-400 bg-[#171f2e] px-2.5 py-1.5 rounded-lg border border-[#222c42] select-all">
                    {secret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="p-1.5 rounded-lg bg-[#20293d] hover:bg-slate-700 text-slate-300 transition"
                    title="Copy Secret"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Live TOTP simulator display for effortless demo testing */}
              <div className="p-3 rounded-xl bg-[#171f2e] border border-[#222c42] space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current Live Token:</span>
                  <span className="text-amber-400 font-bold">{secondsRemaining}s remaining</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-extrabold text-white tracking-widest">
                    {liveTOTP}
                  </span>
                  <button
                    onClick={() => setInputCode(liveTOTP)}
                    className="text-[10px] text-amber-400 hover:underline font-semibold"
                  >
                    Use in box ↓
                  </button>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Code Form */}
          <form onSubmit={handleVerifyAndEnable} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Verify 6-Digit Authenticator Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="E.g. 123456"
                className="flex-1 bg-[#121722] text-center font-mono text-lg font-bold text-white tracking-widest px-4 py-2.5 rounded-xl border border-[#222c42] focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs transition"
              >
                Verify & Save
              </button>
            </div>
          </form>

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Backup Recovery Codes */}
          <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c42] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Single-Use Emergency Recovery Codes
                </p>
                <p className="text-[11px] text-slate-400">
                  Save these codes safely if you lose access to your phone
                </p>
              </div>
              <button
                onClick={handleCopyRecoveryCodes}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-[#171f2e] px-2.5 py-1 rounded-lg border border-[#222c42] transition"
              >
                {copiedCodes ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="bg-[#171f2e] p-2 rounded-lg border border-[#222c42] text-center font-mono text-[11px] text-slate-300 font-bold"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
