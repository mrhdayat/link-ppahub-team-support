'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { PpaIcon } from '@/components/ui/ppa-icon';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-24 h-8 bg-white/5 animate-pulse rounded-xl" />;
  }

  const themes = [
    { id: 'glass', label: 'Glass', icon: 'sparkles' },
    { id: 'dark', label: 'Dark', icon: 'moon' },
    { id: 'light', label: 'Light', icon: 'sun' },
  ];

  return (
    <div className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={`Switch to ${t.label} Theme`}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            theme === t.id
              ? 'bg-[#1E3E62] text-white shadow-md border border-white/15'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PpaIcon name={t.icon} size={13} />
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
