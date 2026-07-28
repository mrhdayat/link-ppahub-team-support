'use client';

import * as React from 'react';
import { Language, dictionary } from '@/lib/dictionary';
import { PpaIcon } from '@/components/ui/ppa-icon';

interface FooterProps {
  lang: Language;
  copyrightText?: string;
}

export function Footer({ lang, copyrightText }: FooterProps) {
  const dict = dictionary[lang];

  return (
    <footer className="w-full max-w-xl mx-auto mt-12 mb-8 px-4 text-center border-t border-[var(--border-color)] pt-6">
      <div className="flex items-center justify-center gap-2 mb-2 text-xs font-bold text-[#FF6500]">
        <PpaIcon name="shield-alert" size={14} />
        <span>{dict.safetySlogan}</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] font-medium">
        {copyrightText || dict.copyright}
      </p>
    </footer>
  );
}
