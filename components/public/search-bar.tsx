'use client';

import * as React from 'react';
import { PpaIcon } from '@/components/ui/ppa-icon';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="w-full max-w-xl mx-auto px-4 mb-6 relative">
      <div className="relative flex items-center">
        <div className="absolute left-7 text-[var(--text-muted)] pointer-events-none">
          <PpaIcon name="search" size={18} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="neu-input w-full pl-12 pr-10 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-md"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-7 text-xs bg-[var(--bg-secondary)] hover:bg-[#FF6500]/20 text-[var(--text-muted)] hover:text-[#FF6500] w-6 h-6 rounded-full flex items-center justify-center transition-colors border border-[var(--border-color)] font-bold"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
