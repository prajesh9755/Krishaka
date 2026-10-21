import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Sparkles } from 'lucide-react';
import { LANGUAGES } from '../../data/translations';
import { applyGoogleTranslate } from '../../utils/googleTranslate';

/**
 * Reusable Language Selector Component
 * Provides an inline interactive dropdown and triggers Google Translate for 100% full-DOM translation.
 */
export function LanguageSelector({
  currentLanguage = 'en',
  onSelectLanguage,
  className = '',
  accentColor = '#3F6B3A',
  showLabel = true,
  id = 'language-selector',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  // Close dropdown on click outside or Esc key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code) => {
    if (onSelectLanguage) {
      onSelectLanguage(code);
    }
    // Trigger Google Translate engine to translate every word and option on the page
    applyGoogleTranslate(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-[#DCD6C8] hover:border-[#3F6B3A]/40 text-xs font-semibold text-[#1A1C18] shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3F6B3A]/30"
        title="Change Language / भाषा बदलें"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
        <span className="font-medium">{activeLang.nativeName}</span>
        {showLabel && (
          <span className="text-[10px] text-[#1A1C18]/60 uppercase tracking-wider hidden xs:inline">
            ({activeLang.code})
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#1A1C18]/50 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-[#DCD6C8] shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 border-b border-[#DCD6C8]/60 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1C18]/60">
              Select Language
            </span>
            <span className="text-[10px] text-[#3F6B3A] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#3F6B3A]" />
              <span>Google Translate</span>
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-[#DCD6C8]/30">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#E2ECD8] text-[#3F6B3A] font-bold'
                      : 'text-[#1A1C18] hover:bg-[#F4F1E8]'
                  }`}
                  role="menuitem"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[13px]">{lang.nativeName}</span>
                    <span className="text-[10px] text-[#1A1C18]/60 font-normal">
                      {lang.name} &bull; {lang.region}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#3F6B3A] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-[#DCD6C8]/60 bg-[#F4F1E8]/60 rounded-b-xl text-[10px] text-[#1A1C18]/70 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-[#3F6B3A] shrink-0" />
            <span>Available across 10+ regional Indian languages</span>
          </div>
        </div>
      )}
    </div>
  );
}

