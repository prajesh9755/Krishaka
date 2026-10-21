import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  RotateCw, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { TRANSLATIONS } from '../../data/translations';
import { ApiService } from '../../services/api';
import { getPasswordValidationError } from '../../utils/passwordRules';
import { PasswordRequirements } from './PasswordRequirements';


export function ForgotPasswordModal({
  isOpen,
  onClose,
  language,
  initialIdentifier = '',
  onSuccessReset,
}) {
  const [step, setStep] = useState('request');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  
  // Timers & Feedback
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setIdentifier(initialIdentifier);
      setOtpDigits(['', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setTimer(30);
      setCanResend(false);
    }
  }, [isOpen, initialIdentifier]);

  // Resend Countdown
  useEffect(() => {
    let interval;
    if (step === 'verify_and_new_password' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered mobile number or email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiService.forgotPasswordRequestOtp(identifier.trim());
      if (res.success && res.phone) {
        setTargetPhone(res.phone);
        setStep('verify_and_new_password');
        setTimer(30);
        setCanResend(false);
      } else {
        setErrorMessage(res.error || 'No registered account found with these details.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, val) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const copy = [...otpDigits];
      copy[index] = '';
      setOtpDigits(copy);
      return;
    }

    const copy = [...otpDigits];
    copy[index] = clean.slice(-1);
    setOtpDigits(copy);

    if (index < 3 && clean) {
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiService.forgotPasswordRequestOtp(identifier.trim());
      if (res.success) {
        setTimer(30);
        setCanResend(false);
      } else {
        setErrorMessage(res.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error resending code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');

    if (enteredOtp.length !== 4) {
      setErrorMessage('Please enter the complete 4-digit verification code.');
      return;
    }

    const passError = getPasswordValidationError(newPassword);
    if (passError) {
      setErrorMessage(passError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiService.forgotPasswordReset(targetPhone, enteredOtp, newPassword);
      if (res.success) {
        setStep('success');
      } else {
        setErrorMessage(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Reset request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="forgot-password-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#F4F1E8] px-6 py-4 border-b border-[#DCD6C8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3F6B3A]/15 text-[#3F6B3A] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="font-headline font-bold text-lg text-[#1A1C18]">
              {step === 'request' ? 'Password Recovery' : step === 'verify_and_new_password' ? 'Verify OTP & Set Password' : 'Password Reset Done'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#DCD6C8] text-[#1A1C18]/70 hover:text-[#1A1C18] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-[#B8562D]/10 border border-[#B8562D]/30 rounded-xl text-[#B8562D] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Identifier */}
          {step === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-[#1A1C18]/70 font-body">
                Enter your registered mobile number or email address. We will verify your identity via a 4-digit OTP code to safely reset your password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] uppercase tracking-wider mb-1">
                  Registered Mobile Number or Email
                </label>
                <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                  <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/60">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Registered mobile number or email"
                    className="w-full py-3 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                    autoFocus
                  />
                </div>
              </div>

              <button
                id="forgot-send-otp-btn"
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="w-full py-3 px-4 bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Checking database...</span>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP + Enter New Password */}
          {step === 'verify_and_new_password' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="p-3 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8] text-xs">
                <span className="text-[#1A1C18]/60 block font-semibold">Verification Code Sent To:</span>
                <span className="font-bold text-[#3F6B3A] text-sm">{targetPhone}</span>
              </div>

              {/* 4 Digit OTP Inputs */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] uppercase tracking-wider mb-2 text-center">
                  Enter 4-Digit OTP
                </label>
                <div className="flex justify-center gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`forgot-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-12 text-center text-xl font-bold font-mono rounded-xl border border-[#DCD6C8] bg-white focus:border-[#3F6B3A] focus:ring-2 focus:ring-[#3F6B3A]/20 focus:outline-hidden shadow-2xs"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Timer */}
              <div className="text-center text-xs text-[#1A1C18]/70">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold text-[#3F6B3A] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Resend OTP Code</span>
                  </button>
                ) : (
                  <span>Resend code in <strong className="text-[#3F6B3A]">{timer}s</strong></span>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                  <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/60">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-new-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full py-2.5 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-[#1A1C18]/50 hover:text-[#1A1C18] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                  <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/60">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-confirm-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full py-2.5 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Real-time Password Security Checklist */}
              <PasswordRequirements password={newPassword} className="mt-1" />

              <button
                id="forgot-reset-submit-btn"
                type="submit"
                disabled={isLoading || otpDigits.join('').length < 4 || newPassword.length < 6}
                className="w-full py-3.5 px-4 bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Updating password in database...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update & Save Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-[#E2ECD8] rounded-full flex items-center justify-center mx-auto text-[#3F6B3A]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-headline font-bold text-xl text-[#1A1C18]">Password Updated!</h4>
                <p className="text-xs text-[#1A1C18]/70 mt-1">
                  Your new password has been securely saved in the Krishaka database. You can now sign in with your updated credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccessReset('Password reset successfully! Please sign in with your new password.');
                }}
                className="w-full py-3 px-4 bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
