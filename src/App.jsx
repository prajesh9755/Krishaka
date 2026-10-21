import React, { useState, useEffect } from 'react';
import { ApiService } from './services/api';
import { LanguageSelectionScreen } from './components/common/LanguageSelectionScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegistrationScreen } from './components/auth/RegistrationScreen';
import { FarmerDashboard } from './components/dashboard/FarmerDashboard';
import { BuyerDashboard } from './components/dashboard/BuyerDashboard';
import { Globe, X, Check, Sparkles } from 'lucide-react';
import { LANGUAGES } from './data/translations';
import { applyGoogleTranslate } from './utils/googleTranslate';
import { subscribeToUsers } from './services/firebase';

export default function App() {
  const [screen, setScreen] = useState('language');
  const [language, setLanguage] = useState('en');
  const [role, setRole] = useState('farmer');
  
  // Auth State
  const [identifier, setIdentifier] = useState('');
  
  // Current Authenticated User Profile
  const [currentUser, setCurrentUser] = useState(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Initialize stored language and session
  useEffect(() => {
    const savedLang = ApiService.getStoredLanguage();
    if (savedLang) {
      setLanguage(savedLang);
      applyGoogleTranslate(savedLang);
    }

    const savedUser = ApiService.getStoredUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      setRole(savedUser.role);
      const userLang = savedUser.language || savedLang || 'en';
      setLanguage(userLang);
      applyGoogleTranslate(userLang);
    }
  }, []);

  // Listen to Firestore User updates in real-time
  // If an Admin edits or deletes a user doc in the Firebase Console, this reflects live!
  useEffect(() => {
    const unsub = subscribeToUsers((usersList) => {
      if (currentUser) {
        const found = usersList.find((u) => u.id === currentUser.id);
        if (!found) {
          // User document was deleted in Firebase Console by Admin
          ApiService.setStoredUser(null);
          setCurrentUser(null);
          setErrorMessage('Your account was removed from the database by an administrator.');
          setScreen('login');
        } else if (JSON.stringify(found) !== JSON.stringify(currentUser)) {
          // User document was edited in Firebase Console (e.g. password, name, phone)
          setCurrentUser(found);
          ApiService.setStoredUser(found);
        }
      }
    });

    return () => unsub();
  }, [currentUser]);

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    ApiService.setStoredLanguage(lang);
    applyGoogleTranslate(lang);
    if (currentUser) {
      const updatedUser = { ...currentUser, language: lang };
      setCurrentUser(updatedUser);
      ApiService.setStoredUser(updatedUser);
    }
  };

  const handleLanguageContinue = () => {
    setScreen('login');
  };

  // Password-Based Login
  const handleLoginSubmit = async (loginId, loginPass, loginRole) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await ApiService.login({
        identifier: loginId,
        password: loginPass,
        role: loginRole,
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setRole(res.user.role);
        setLanguage(res.user.language || language);
        setScreen('dashboard');
      } else {
        setErrorMessage(res.error || 'Invalid credentials or account not registered in database.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up / Registration
  const handleRegisterSubmit = async (payload) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await ApiService.register(payload);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setRole(res.user.role);
        setScreen('dashboard');
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    ApiService.setStoredUser(null);
    setCurrentUser(null);
    setErrorMessage('');
    setSuccessMessage('Logged out successfully.');
    setScreen('login');
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8] font-body text-[#1A1C18]">
      
      {/* Dynamic Screen Rendering */}
      {screen === 'language' && (
        <LanguageSelectionScreen
          currentLanguage={language}
          onSelectLanguage={handleLanguageSelect}
          onContinue={handleLanguageContinue}
        />
      )}

      {screen === 'login' && (
        <LoginScreen
          language={language}
          selectedRole={role}
          identifier={identifier}
          onRoleChange={setRole}
          onIdentifierChange={setIdentifier}
          onSubmitLogin={handleLoginSubmit}
          onNavigateToSignUp={() => {
            setErrorMessage('');
            setSuccessMessage('');
            setScreen('register');
          }}
          onLanguageChange={handleLanguageSelect}
          onOpenLanguageModal={() => setIsLangModalOpen(true)}
          isLoading={isLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
        />
      )}

      {screen === 'register' && (
        <RegistrationScreen
          language={language}
          initialPhone={identifier}
          initialRole={role}
          onBackToLogin={() => {
            setErrorMessage('');
            setSuccessMessage('');
            setScreen('login');
          }}
          onSubmitRegistration={handleRegisterSubmit}
          onLanguageChange={handleLanguageSelect}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {screen === 'dashboard' && currentUser && currentUser.role === 'farmer' && (
        <FarmerDashboard
          user={currentUser}
          language={language}
          onLanguageChange={handleLanguageSelect}
          onLogout={handleLogout}
          onOpenLanguageModal={() => setIsLangModalOpen(true)}
        />
      )}

      {screen === 'dashboard' && currentUser && currentUser.role === 'buyer' && (
        <BuyerDashboard
          user={currentUser}
          language={language}
          onLanguageChange={handleLanguageSelect}
          onLogout={handleLogout}
          onOpenLanguageModal={() => setIsLangModalOpen(true)}
        />
      )}

      {/* Global Language Modal */}
      {isLangModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLangModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-[#DCD6C8] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCD6C8]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#3F6B3A]" />
                <h3 className="font-headline font-bold text-base text-[#1A1C18]">Select Language / भाषा चुनें</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F4F1E8] text-[#1A1C18]/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      handleLanguageSelect(lang.code);
                      setIsLangModalOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#3F6B3A] bg-[#E2ECD8] text-[#3F6B3A]'
                        : 'border-[#DCD6C8] bg-white hover:bg-[#F4F1E8] text-[#1A1C18]'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold">{lang.nativeName}</span>
                      <span className="text-[10px] text-[#1A1C18]/60 font-normal">
                        {lang.name} &bull; {lang.region}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#3F6B3A] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#DCD6C8] flex items-center justify-center gap-1.5 text-[11px] text-[#1A1C18]/60">
              <Sparkles className="w-3.5 h-3.5 text-[#3F6B3A]" />
              <span>Full DOM & Sub-Module translation powered by Google</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
