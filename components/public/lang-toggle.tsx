'use client';

import * as React from 'react';
import { Language, dictionary } from '@/lib/dictionary';
import { NeuButton } from '@/components/ui/neu-button';
import { ClayBadge } from '@/components/ui/clay-badge';

interface LangToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LangToggle({ currentLang, onLanguageChange }: LangToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10">
      <button
        onClick={() => onLanguageChange('id')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          currentLang === 'id'
            ? 'bg-[#FF6500] text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        ID
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          currentLang === 'en'
            ? 'bg-[#FF6500] text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
