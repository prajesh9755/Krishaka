import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LANGUAGES, TRANSLATIONS } from '../data/translations';
import { applyGoogleTranslate } from '../utils/googleTranslate';

export function LanguageSelectionScreen({
  currentLanguage,
  onSelectLanguage,
  onContinue,
}) {
  const [selected, setSelected] = useState(currentLanguage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = TRANSLATIONS[selected] || TRANSLATIONS.en;

  const handleContinue = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSelectLanguage(selected);
    applyGoogleTranslate(selected);
    setTimeout(() => {
      setIsSubmitting(false);
      onContinue();
    }, 450);
  };

  return (
    <div id="language-selection-screen" className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F4F1E8] text-[#1A1C18]">
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md mx-auto py-8">
        
        {/* Krishaka Brand Logo */}
        <div className="mb-6 w-full flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#3F6B3A]/10 border border-[#3F6B3A]/20 flex items-center justify-center mb-2 shadow-xs">
              <svg className="w-10 h-10 text-[#3F6B3A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22h20" />
                <path d="M12 2v20" />
                <path d="M12 7c3 0 7-2 7-5-3 0-7 2-7 5z" />
                <path d="M12 12c-3 0-7-2-7-5 3 0 7 2 7 5z" />
                <path d="M12 17c3 0 7-2 7-5-3 0-7 2-7 5z" />
              </svg>
            </div>
            <span className="font-headline text-3xl font-bold text-[#3F6B3A] tracking-tight">Krishaka</span>
          </div>
        </div>

        {/* Heading Section */}
        <div className="text-center w-full mb-6">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-[#3F6B3A] tracking-tight">
            {t.chooseLanguage}
          </h1>
          <p className="font-body text-sm sm:text-base mt-1.5 text-[#1A1C18]/70">
            {t.selectLanguagePrompt}
          </p>
        </div>

        {/* Language Form */}
        <form onSubmit={handleContinue} className="w-full flex flex-col gap-3">
          {LANGUAGES.map((lang) => {
            const isChecked = selected === lang.code;
            return (
              <div key={lang.code} className="w-full">
                <input
                  type="radio"
                  id={`lang-${lang.code}`}
                  name="krishaka-language"
                  value={lang.code}
                  checked={isChecked}
                  onChange={() => {
                    setSelected(lang.code);
                    onSelectLanguage(lang.code);
                  }}
                  className="sr-only"
                />
                <label
                  htmlFor={`lang-${lang.code}`}
                  className="cursor-pointer block w-full select-none"
                >
                  <div
                    className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl transition-all duration-200 ${
                      isChecked
                        ? 'border-2 border-[#3F6B3A] bg-[#3F6B3A]/8 shadow-xs'
                        : 'border border-[#DCD6C8] bg-white hover:border-[#3F6B3A]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Custom Radio Dot */}
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'border-[#3F6B3A] bg-white'
                            : 'border-[#8F9487] bg-transparent'
                        }`}
                      >
                        {isChecked && (
                          <div className="w-3 h-3 rounded-full bg-[#3F6B3A]" />
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-body text-base font-semibold text-[#1A1C18]">
                          {lang.name} {lang.name !== lang.nativeName && `(${lang.nativeName})`}
                        </span>
                        <span className="text-xs text-[#1A1C18]/60 font-body">
                          {lang.region}
                        </span>
                      </div>
                    </div>

                    {isChecked && (
                      <span className="text-[#3F6B3A] font-semibold text-xs px-2 py-0.5 rounded-full bg-[#3F6B3A]/10 border border-[#3F6B3A]/20">
                        Active
                      </span>
                    )}
                  </div>
                </label>
              </div>
            );
          })}

          {/* Continue CTA Button */}
          <div className="mt-4 w-full">
            <button
              id="language-continue-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[#3F6B3A] hover:bg-[#355B31] text-white rounded-xl font-body text-base sm:text-lg font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <span>{t.processing}</span>
              ) : (
                <>
                  <span>{t.continueBtn}</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
