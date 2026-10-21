import React, { useState } from 'react';
import { 
  ArrowRight, 
  Tractor, 
  Store, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  AlertCircle,
  CheckCircle2,
  Database
} from 'lucide-react';
import { TRANSLATIONS } from '../../data/translations';
import { LanguageSelector } from '../common/LanguageSelector';

export function LoginScreen({
  language,
  selectedRole,
  identifier,
  onRoleChange,
  onIdentifierChange,
  onSubmitLogin,
  onNavigateToSignUp,
  onLanguageChange,
  onOpenLanguageModal,
  isLoading,
  errorMessage,
  successMessage,
}) {
  const [localId, setLocalId] = useState(identifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [localSuccess, setLocalSuccess] = useState(successMessage || '');

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanId = localId.trim();
    if (!cleanId) {
      setFieldError('Please enter your registered Mobile Number or Email ID.');
      return;
    }

    if (!password) {
      setFieldError('Please enter your account password.');
      return;
    }

    setFieldError('');
    setLocalSuccess('');
    onIdentifierChange(cleanId);
    onSubmitLogin(cleanId, password, selectedRole);
  };

  const handleQuickFill = (role, idVal, passVal) => {
    setLocalId(idVal);
    setPassword(passVal);
    onRoleChange(role);
    onIdentifierChange(idVal);
    setFieldError('');
    setLocalSuccess('');
  };

  return (
    <div id="login-screen" className="relative min-h-screen flex flex-col justify-center items-center overflow-x-hidden bg-[#F4F1E8]">
      
      {/* Background Farm Image & Earthy Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80"
          alt="Indian Agriculture Fields"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F1E8]/90 via-[#F4F1E8]/95 to-[#F4F1E8]" />
      </div>

      {/* Top Bar for Language & System info */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-headline font-bold text-xl text-[#3F6B3A]" translate="no">{language === 'en' ? 'Krishaka' : 'कृषका'}</span>
          <span className="text-[11px] font-semibold tracking-wide bg-[#3F6B3A]/10 text-[#3F6B3A] px-2 py-0.5 rounded-full border border-[#3F6B3A]/20 hidden sm:inline-block">
            Agri Marketplace &bull; Login Module
          </span>
        </div>

        <LanguageSelector
          currentLanguage={language}
          onSelectLanguage={(newLang) => {
            if (onLanguageChange) onLanguageChange(newLang);
          }}
          accentColor="#3F6B3A"
          id="login-language-selector"
        />
      </header>

      {/* Main Form Container */}
      <main className="z-20 w-full max-w-md mx-auto px-4 py-16 sm:py-20 flex flex-col items-center">
        
        {/* Krishaka Logo */}
        <div className="mb-5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#3F6B3A]/25 flex items-center justify-center shadow-xs">
            <svg className="w-10 h-10 text-[#3F6B3A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 22h20" />
              <path d="M12 2v20" />
              <path d="M12 7c3 0 7-2 7-5-3 0-7 2-7 5z" />
              <path d="M12 12c-3 0-7-2-7-5 3 0 7 2 7 5z" />
              <path d="M12 17c3 0 7-2 7-5-3 0-7 2-7 5z" />
            </svg>
          </div>
          <span className="font-headline text-2xl font-bold text-[#3F6B3A] mt-1 tracking-tight" translate="no">{language === 'en' ? 'Krishaka' : 'कृषका'}</span>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-[#DCD6C8] flex flex-col gap-4">
          
          <div className="text-center">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#1A1C18] mb-1">
              {t.welcomeBack}
            </h1>
            <p className="text-[#1A1C18]/70 text-xs sm:text-sm font-body">
              {t.signInPrompt}
            </p>
          </div>

          {/* User Type Toggle (Farmer / Buyer) */}
          <div className="flex p-1 bg-[#EBE7DC] rounded-xl w-full">
            <button
              id="type-farmer-btn"
              type="button"
              onClick={() => onRoleChange('farmer')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedRole === 'farmer'
                  ? 'bg-[#3F6B3A] text-white shadow-xs'
                  : 'text-[#1A1C18]/80 hover:text-[#3F6B3A]'
              }`}
            >
              <Tractor className="w-4 h-4 mr-1.5 stroke-[2.2]" />
              <span>{t.farmer}</span>
            </button>

            <button
              id="type-buyer-btn"
              type="button"
              onClick={() => onRoleChange('buyer')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedRole === 'buyer'
                  ? 'bg-[#3F6B3A] text-white shadow-xs'
                  : 'text-[#1A1C18]/80 hover:text-[#3F6B3A]'
              }`}
            >
              <Store className="w-4 h-4 mr-1.5 stroke-[2.2]" />
              <span>{t.buyer}</span>
            </button>
          </div>

          {/* Success Banner */}
          {(successMessage || localSuccess) && (
            <div className="p-3 bg-[#3F6B3A]/10 border border-[#3F6B3A]/30 rounded-xl text-[#3F6B3A] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage || localSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {(errorMessage || fieldError) && (
            <div className="p-3 bg-[#B8562D]/10 border border-[#B8562D]/30 rounded-xl text-[#B8562D] text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage || fieldError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            
            {/* Mobile / Email Identifier */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-identifier" className="text-xs font-semibold text-[#1A1C18] uppercase tracking-wider flex justify-between">
                <span>{t.mobileOrEmail}</span>
              </label>
              <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 overflow-hidden bg-white">
                <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/70">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={localId}
                  onChange={(e) => {
                    setLocalId(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  placeholder={t.mobileOrEmailPlaceholder}
                  className="block w-full py-2.5 px-3 text-[#1A1C18] placeholder:text-[#1A1C18]/40 focus:outline-hidden text-sm font-body"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-[#1A1C18] uppercase tracking-wider">
                  {t.password}
                </label>
              </div>
              <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 overflow-hidden bg-white">
                <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/70">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  placeholder={t.passwordPlaceholder}
                  className="block w-full py-2.5 px-3 text-[#1A1C18] placeholder:text-[#1A1C18]/40 focus:outline-hidden text-sm font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-[#1A1C18]/50 hover:text-[#1A1C18] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Login Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading || !localId.trim() || !password}
              className="w-full bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all active:scale-[0.98] mt-1 flex justify-center items-center gap-2 group cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-sm"
            >
              {isLoading ? (
                <span>{t.processing}</span>
              ) : (
                <>
                  <span>{t.login}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <p className="text-[11px] text-[#1A1C18]/65 text-center">
              {t.otpNote}
            </p>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[#DCD6C8]" />
            <span className="shrink-0 mx-3 text-[#1A1C18]/50 text-[11px] uppercase tracking-wider font-semibold">
              {t.or}
            </span>
            <div className="flex-grow border-t border-[#DCD6C8]" />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-[#1A1C18]/80">
              {t.dontHaveAccount}{' '}
              <button
                id="login-to-signup-link"
                type="button"
                onClick={onNavigateToSignUp}
                className="font-bold text-[#B8562D] hover:text-[#9E4823] transition-colors underline-offset-4 hover:underline cursor-pointer ml-1"
              >
                {t.signUp}
              </button>
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-xs text-[#1A1C18]/60 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#3F6B3A]" />
          <span>Role-Based Authentication &bull; JSON Encrypted Storage</span>
        </div>
      </main>

    </div>
  );
}
