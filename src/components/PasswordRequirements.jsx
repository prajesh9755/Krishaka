import React from 'react';
import { Check, X } from 'lucide-react';
import { checkPasswordRules } from '../utils/passwordRules';

export function PasswordRequirements({ password, className = '' }) {
  const rules = checkPasswordRules(password);

  // Criteria list with clean labels
  const criteria = [
    { label: 'At least 8 characters', met: rules.hasMinLength },
    { label: 'One uppercase letter (A-Z)', met: rules.hasUpperCase },
    { label: 'One lowercase letter (a-z)', met: rules.hasLowerCase },
    { label: 'One number (0-9)', met: rules.hasNumber },
    { label: 'One special symbol (!@#$%^&*)', met: rules.hasSymbol },
  ];

  // Count how many criteria are fulfilled (0 to 5)
  const score = criteria.filter((c) => c.met).length;

  return (
    <div className={`p-3 bg-[#F4F1E8]/70 rounded-lg border border-[#DCD6C8] text-xs space-y-2 ${className}`}>
      {/* Progress / Strength Meter */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-[#1A1C18]/80">Password Requirements:</span>
        <span className={`font-bold ${
          score === 5 ? 'text-[#3F6B3A]' : score >= 3 ? 'text-amber-700' : 'text-[#B8562D]'
        }`}>
          {score === 5 ? 'Strong (All met)' : `${score}/5 criteria met`}
        </span>
      </div>

      {/* Visual meter bar */}
      <div className="w-full h-1.5 bg-[#DCD6C8] rounded-full overflow-hidden flex">
        <div 
          className={`h-full transition-all duration-300 ${
            score === 5 
              ? 'bg-[#3F6B3A] w-full' 
              : score >= 3 
                ? 'bg-amber-600 w-3/5' 
                : score > 0 
                  ? 'bg-[#B8562D] w-1/5' 
                  : 'w-0'
          }`}
        />
      </div>

      {/* Individual checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              item.met ? 'text-[#3F6B3A] font-medium' : 'text-[#1A1C18]/60'
            }`}
          >
            {item.met ? (
              <div className="w-3.5 h-3.5 rounded-full bg-[#3F6B3A] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-[#DCD6C8] text-[#1A1C18]/50 flex items-center justify-center shrink-0">
                <X className="w-2.5 h-2.5" />
              </div>
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
