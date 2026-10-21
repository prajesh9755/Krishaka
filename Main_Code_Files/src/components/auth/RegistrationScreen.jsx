import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Tractor, 
  Store, 
  CheckCircle2, 
  MapPin, 
  Building, 
  ShieldCheck, 
  BadgeCheck, 
  Wheat, 
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Mail,
  User,
  AlertCircle
} from 'lucide-react';
import { TRANSLATIONS } from '../../data/translations';
import { getPasswordValidationError } from '../../utils/passwordRules';
import { PasswordRequirements } from './PasswordRequirements';
import { LanguageSelector } from '../common/LanguageSelector';
import { STATE_DISTRICTS } from '../../data/locations';


export function RegistrationScreen({
  language,
  initialPhone = '',
  initialRole = 'farmer',
  initialEmail = '',
  onBackToLogin,
  onSubmitRegistration,
  onLanguageChange,
  isLoading,
  errorMessage,
}) {
  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(initialPhone.replace('+91', '').trim());
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Farmer fields
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [state, setState] = useState('');
  const districtOptions = STATE_DISTRICTS[state] || [];
  const [pincode, setPincode] = useState('');
  const [landArea, setLandArea] = useState(5);
  const [selectedCrops, setSelectedCrops] = useState(['Wheat', 'Onion']);
  const [isOrganic, setIsOrganic] = useState(true);
  const [kisanCardNumber, setKisanCardNumber] = useState('');
  const [bankUpiId, setBankUpiId] = useState('');


  const [formErrors, setFormErrors] = useState({});

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const toggleCrop = (crop) => {
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== crop));
      }
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    const passError = getPasswordValidationError(password);
    if (passError) {
      errors.password = passError;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!village.trim()) errors.village = 'Village name is required.';
    if (!state) errors.state = 'Please select your state.';
    if (!district) errors.district = 'Please select your district.';
    if (!taluka.trim()) errors.taluka = 'Taluka is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    let farmerDetails;
    let buyerDetails;

    if (role === 'farmer') {
      farmerDetails = {
        village: village.trim(),
        taluka: taluka.trim(),
        district,
        state,
        pincode: pincode.trim(),
        landAreaAcres: Number(landArea) || 5,
        primaryCrops: selectedCrops,
        organicCertified: isOrganic,
        kisanCardNumber: kisanCardNumber.trim() || '',
        aadhaarOrKisanIdVerified: true,
        bankUpiId: bankUpiId.trim() || '',
      };
    } else {
      buyerDetails = {
        village: village.trim(),
        taluka: taluka.trim(),
        district,
        state,
        deliveryCity: district,
        deliveryState: state,
      };
    }

    const payload = {
      name: fullName.trim(),
      phone: `+91${cleanPhone}`,
      password: password,
      role,
      language,
      email: email.trim() || '',
      farmerDetails,
      buyerDetails,
    };

    onSubmitRegistration(payload);
  };

  return (
    <div id="registration-screen" className="min-h-screen bg-[#F4F1E8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1 text-sm font-semibold text-[#1A1C18]/80 hover:text-[#3F6B3A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.signIn}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-lg text-[#3F6B3A]" translate="no">{language === 'en' ? 'Krishaka' : 'कृषका'}</span>
              <span className="text-[11px] font-semibold bg-[#3F6B3A]/10 text-[#3F6B3A] px-2 py-0.5 rounded-full border border-[#3F6B3A]/20">
                Registration
              </span>
            </div>

            <LanguageSelector
              currentLanguage={language}
              onSelectLanguage={(newLang) => {
                if (onLanguageChange) onLanguageChange(newLang);
              }}
              accentColor="#3F6B3A"
              id="registration-language-selector"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-[#DCD6C8] overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-[#3F6B3A] text-white p-6">
            <h1 className="font-headline text-2xl font-bold">
              {role === 'farmer' ? t.farmerRegistrationTitle : t.buyerRegistrationTitle}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1">
              Create your verified account on India's trusted agriculture marketplace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-[#B8562D]/10 border border-[#B8562D]/30 rounded-xl text-[#B8562D] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. ROLE SELECTOR */}
            <div>
              <label className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-2">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'farmer'
                      ? 'border-[#3F6B3A] bg-[#E2ECD8]/50 text-[#3F6B3A] shadow-xs'
                      : 'border-[#DCD6C8] bg-white text-[#1A1C18]/80 hover:border-[#3F6B3A]/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'farmer' ? 'bg-[#3F6B3A] text-white' : 'bg-[#F4F1E8] text-[#1A1C18]'}`}>
                    <Tractor className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">{t.farmer}</div>
                    <div className="text-[11px] text-[#1A1C18]/60">Sell farm produce directly</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'buyer'
                      ? 'border-[#B8562D] bg-[#FCEEE7] text-[#B8562D] shadow-xs'
                      : 'border-[#DCD6C8] bg-white text-[#1A1C18]/80 hover:border-[#B8562D]/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'buyer' ? 'bg-[#B8562D] text-white' : 'bg-[#F4F1E8] text-[#1A1C18]'}`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">{t.buyer}</div>
                    <div className="text-[11px] text-[#1A1C18]/60">Procure from verified farmers</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. BASIC PROFILE CREDENTIALS */}
            <div className="space-y-4 pt-2 border-t border-[#DCD6C8]/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3F6B3A]">
                Account & Login Credentials
              </h3>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  {t.fullName} <span className="text-[#B8562D]">*</span>
                </label>
                <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                  <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/60">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="register-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full py-2.5 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-[#B8562D] text-xs mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Mobile Number & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    {t.phoneNumber} <span className="text-[#B8562D]">*</span>
                  </label>
                  <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                    <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18] font-semibold text-xs select-none">
                      +91
                    </div>
                    <input
                      id="register-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile"
                      className="w-full py-2.5 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-[#B8562D] text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    {t.emailOptional}
                  </label>
                  <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                    <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/60">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full py-2.5 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    {t.password} <span className="text-[#B8562D]">*</span>
                  </label>
                  <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                    <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/60">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full py-2.5 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-2.5 text-[#1A1C18]/50 hover:text-[#1A1C18] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-[#B8562D] text-xs mt-1">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    {t.confirmPassword} <span className="text-[#B8562D]">*</span>
                  </label>
                  <div className="flex rounded-lg border border-[#DCD6C8] focus-within:border-[#3F6B3A] focus-within:ring-2 focus-within:ring-[#3F6B3A]/20 bg-white overflow-hidden">
                    <div className="flex items-center px-3 bg-[#F4F1E8] border-r border-[#DCD6C8] text-[#1A1C18]/60">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.confirmPasswordPlaceholder}
                      className="w-full py-2.5 px-3 text-sm text-[#1A1C18] focus:outline-hidden"
                    />
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-[#B8562D] text-xs mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Real-time Password Security Checklist */}
              <PasswordRequirements password={password} className="mt-1" />

            </div>

            {/* 3. LOCATION (both roles); land & crops are farmer-only */}
              <div className="space-y-4 pt-2 border-t border-[#DCD6C8]/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3F6B3A] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {role === 'farmer' ? 'Farm Location & Crop Particulars' : 'Location'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                      {t.state} <span className="text-[#B8562D]">*</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => { setState(e.target.value); setDistrict(''); }}
                      className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm text-[#1A1C18] bg-white focus:border-[#3F6B3A] focus:outline-hidden"
                    >
                      <option value="">Select state</option>
                      {Object.keys(STATE_DISTRICTS).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    {formErrors.state && (
                      <p className="text-[#B8562D] text-xs mt-1">{formErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                      {t.district} <span className="text-[#B8562D]">*</span>
                    </label>
                    <select
                      key={state} // remount per state so Google Translate translates the new options
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      disabled={!state}
                      className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm text-[#1A1C18] bg-white focus:border-[#3F6B3A] focus:outline-hidden disabled:opacity-50"
                    >
                      <option value="">{state ? 'Select district' : 'Select state first'}</option>
                      {districtOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {formErrors.district && (
                      <p className="text-[#B8562D] text-xs mt-1">{formErrors.district}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                      {t.villageName} <span className="text-[#B8562D]">*</span>
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Enter your village"
                      className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm text-[#1A1C18] bg-white focus:border-[#3F6B3A] focus:outline-hidden"
                    />
                    {formErrors.village && (
                      <p className="text-[#B8562D] text-xs mt-1">{formErrors.village}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                      Taluka <span className="text-[#B8562D]">*</span>
                    </label>
                    <input
                      type="text"
                      value={taluka}
                      onChange={(e) => setTaluka(e.target.value)}
                      placeholder="Enter your taluka"
                      className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm text-[#1A1C18] bg-white focus:border-[#3F6B3A] focus:outline-hidden"
                    />
                    {formErrors.taluka && (
                      <p className="text-[#B8562D] text-xs mt-1">{formErrors.taluka}</p>
                    )}
                  </div>
                </div>

                {role === 'farmer' && (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                      {t.landArea}
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={landArea}
                      onChange={(e) => setLandArea(parseFloat(e.target.value) || 1)}
                      className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm text-[#1A1C18] bg-white focus:border-[#3F6B3A] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Primary Crops Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1.5">
                    {t.selectCrops} (Select one or more)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {t.primaryCrops.map((crop) => {
                      const isSelected = selectedCrops.includes(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => toggleCrop(crop)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#3F6B3A] text-white border-[#3F6B3A]'
                              : 'bg-[#F4F1E8] text-[#1A1C18]/80 border-[#DCD6C8] hover:border-[#3F6B3A]'
                          }`}
                        >
                          {crop}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Organic Checkbox */}
                <div className="flex items-center gap-2 p-3 bg-[#E2ECD8]/40 border border-[#3F6B3A]/20 rounded-xl">
                  <input
                    id="is-organic-check"
                    type="checkbox"
                    checked={isOrganic}
                    onChange={(e) => setIsOrganic(e.target.checked)}
                    className="w-4 h-4 accent-[#3F6B3A] cursor-pointer"
                  />
                  <label htmlFor="is-organic-check" className="text-xs font-medium text-[#1A1C18] cursor-pointer">
                    Practices Organic / Zero-chemical farming (Organic badge certified)
                  </label>
                </div>
                </>
                )}
              </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-[#DCD6C8]">
              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold py-3.5 px-6 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Saving profile to database...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t.createAccount}</span>
                  </>
                )}
              </button>

              <div className="text-center mt-3">
                <span className="text-xs text-[#1A1C18]/70">
                  {t.alreadyHaveAccount}{' '}
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="font-bold text-[#3F6B3A] hover:underline cursor-pointer ml-1"
                  >
                    {t.signIn}
                  </button>
                </span>
              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
