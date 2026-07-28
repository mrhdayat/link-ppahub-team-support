'use client';

import * as React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { NeuButton } from '@/components/ui/neu-button';
import { ClayBadge } from '@/components/ui/clay-badge';
import { ThemeSwitcher } from '@/components/public/theme-switcher';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col antialiased bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300">
      {/* Top Admin Navigation Bar */}
      <header className="w-full navbar-solid sticky top-0 z-40 px-6 py-3 border-b border-[var(--border-color)] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="clay-badge-navy-3d w-9 h-9 rounded-xl flex items-center justify-center border border-[#FF6500]/40">
            <span className="font-black text-xs text-[#FF6500]">PPA</span>
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-[var(--text-main)] flex items-center gap-2">
              ADMIN PANEL LINK HUB
              <ClayBadge variant="safety" className="text-[9px] py-0 px-1.5">LIVE</ClayBadge>
            </h1>
            <p className="text-[11px] font-semibold text-[var(--text-muted)]">Support Berjaya — Internal Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Link href="/" target="_blank">
            <NeuButton variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <PpaIcon name="external-link" size={13} />
              <span className="hidden sm:inline">Lihat Halaman Publik</span>
            </NeuButton>
          </Link>
          <NeuButton
            variant="secondary"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="text-xs text-red-500 hover:text-red-600 font-bold"
          >
            <PpaIcon name="logout" size={13} />
            <span className="hidden sm:inline">Keluar</span>
          </NeuButton>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
