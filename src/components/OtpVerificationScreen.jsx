import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export function OtpVerificationScreen({
  language,
  phone,
  demoCode = '1234',
  onBack,
  onVerifyOtp,
  onResendOtp,
  isLoading,
  errorMessage,
}) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Mask phone for privacy (e.g. +91 98XXX XXX00)
  const formatMaskedPhone = (rawPhone) => {
    const clean = (rawPhone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      const p = clean.slice(-10);
      return `+91 ${p.slice(0, 2)}XXX XXX${p.slice(8, 10)}`;
    }
    return rawPhone;
  };

  // 30-second countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Trigger shake on error
  useEffect(() => {
    if (errorMessage) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleInputChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (val.length > 1) {
      // Pasting full 4 digits
      const pasted = val.slice(0, 4).split('');
      for (let i = 0; i < 4; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 3);
      inputRefs[nextIdx].current?.focus();
      return;
    }

    newDigits[index] = val ? val.slice(-1) : '';
    setDigits(newDigits);

    if (val !== '' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const fullOtp = digits.join('');
    if (fullOtp.length === 4) {
      onVerifyOtp(fullOtp);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleResend = () => {
    setIsResending(true);
    setTimeLeft(30);
    setDigits(['', '', '', '']);
    onResendOtp();
    setTimeout(() => {
      setIsResending(false);
      inputRefs[0].current?.focus();
    }, 400);
  };

  const handleFillDemoOtp = () => {
    const code = demoCode || '1234';
    const split = code.split('').slice(0, 4);
    setDigits(split);
    inputRefs[3].current?.focus();
  };

  const isFormComplete = digits.every((d) => d.length === 1);

  return (
    <div id="otp-verification-screen" className="min-h-screen flex flex-col bg-[#F4F1E8] text-[#1A1C18]">
      
      {/* Top Header */}
      <header className="w-full top-0 sticky bg-[#F4F1E8] z-50 border-b border-[#DCD6C8]/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
          <button
            id="otp-back-btn"
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-full hover:bg-[#3F6B3A]/10 transition-colors active:scale-95 text-[#3F6B3A] cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="font-headline text-2xl font-bold text-[#3F6B3A] tracking-tight">
            Krishaka
          </h1>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-[#3F6B3A]/15">
          
          {/* Header Section */}
          <div className="text-center mb-6">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1A1C18] mb-2">
              {t.verifyPhone}
            </h2>
            <p className="font-body text-sm sm:text-base text-[#1A1C18]/70 leading-relaxed">
              {t.enterOtpPrompt} <br />
              <span className="font-bold text-[#1A1C18] tracking-wide">
                {formatMaskedPhone(phone)}
              </span>
            </p>
          </div>

          {/* Teacher Test Mode Hint Card */}
          <div className="mb-6 p-3 rounded-xl bg-[#E2ECD8] border border-[#3F6B3A]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#3F6B3A]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">Test OTP Code: </span>
                <span className="font-mono font-bold text-sm bg-white px-1.5 py-0.5 rounded border border-[#3F6B3A]/20">
                  {demoCode || '1234'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillDemoOtp}
              className="text-[11px] font-bold text-[#3F6B3A] bg-white hover:bg-[#3F6B3A] hover:text-white px-2.5 py-1 rounded-md border border-[#3F6B3A]/30 transition-all cursor-pointer shadow-2xs"
            >
              Auto Fill
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-[#B8562D]/10 border border-[#B8562D]/30 rounded-lg text-[#B8562D] text-xs font-semibold text-center">
              {errorMessage}
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleFormSubmit} className="space-y-6" id="otp-form">
            
            {/* 4 OTP Digit Input Grid */}
            <div
              id="otp-container"
              className={`flex justify-center gap-3 sm:gap-4 ${isShaking ? 'animate-shake' : ''}`}
            >
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  id={`otp-digit-${index + 1}`}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  aria-label={`Digit ${index + 1}`}
                  className="w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-headline font-bold text-[#1A1C18] border-2 border-[#3F6B3A]/30 rounded-xl bg-[#F4F1E8]/30 focus:border-[#3F6B3A] focus:bg-white focus:ring-4 focus:ring-[#3F6B3A]/15 focus:outline-hidden transition-all"
                />
              ))}
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-center space-y-5">
              
              {/* Resend Timer */}
              <div className="text-sm text-[#1A1C18]/70 flex items-center gap-1.5 font-body">
                {timeLeft > 0 ? (
                  <>
                    <span>{t.resendIn}</span>
                    <span className="font-bold tabular-nums text-[#1A1C18]" id="timer">
                      00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </span>
                  </>
                ) : (
                  <button
                    id="resend-btn"
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-[#B8562D] hover:text-[#9E4823] hover:underline font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{t.resendNow}</span>
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="otp-verify-proceed-btn"
                type="submit"
                disabled={isLoading || !isFormComplete}
                className="w-full group flex items-center justify-center gap-2 bg-[#3F6B3A] hover:bg-[#355B31] text-white font-body text-base font-bold py-4 px-6 rounded-xl shadow-xs transition-all active:scale-[0.98] focus:ring-4 focus:ring-[#3F6B3A]/20 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <span>{t.verifying}</span>
                ) : (
                  <>
                    <span>{t.verifyProceed}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
