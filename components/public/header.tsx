'use client';

import * as React from 'react';
import Image from 'next/image';
import { Language, dictionary } from '@/lib/dictionary';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { ClayBadge } from '@/components/ui/clay-badge';

interface HeaderProps {
  lang: Language;
  tagline?: string;
  companyName?: string;
  officialSlogan?: string;
  logoUrl?: string;
  logoSupportTruck?: string;
  logoDewatering?: string;
  logoHighVoltage?: string;
}

export function Header({
  lang,
  tagline,
  companyName = 'Support Berjaya',
  officialSlogan = 'Support Berjaya, Berjaya di darat, laut dan udara',
  logoUrl = '/brand/logo-ppa.png',
  logoSupportTruck = '/brand/logo-support-truck.svg',
  logoDewatering = '/brand/logo-dewatering.svg',
  logoHighVoltage = '/brand/logo-high-voltage.svg',
}: HeaderProps) {
  const dict = dictionary[lang];

  return (
    <header className="w-full pt-4 pb-8 px-4 flex flex-col items-center text-center">
      {/* Corporate Multi-Logo Hero Container */}
      <div className="relative group flex flex-col items-center max-w-xl mx-auto">
        {/* Soft Radial Ambient Halo Glow behind logo */}
        <div className="absolute -top-6 w-48 h-48 bg-[#FF6500]/25 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF6500]/40 transition-all duration-500" />

        {/* 1. LOGO UTAMA PPA (ATAS) */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-4 p-3 rounded-3xl bg-[var(--bg-card-l1)] border-2 border-[#FF6500]/80 shadow-2xl transition-transform duration-300 hover:scale-105 backdrop-blur-xl">
          <Image
            src={logoUrl || '/brand/logo-ppa.png'}
            alt={`Logo Utama ${companyName}`}
            width={110}
            height={110}
            className="object-contain max-h-full max-w-full"
            priority
          />
          {/* Live Status Pulse Dot */}
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6500] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF6500] border-2 border-[#0B192C]"></span>
          </div>
        </div>

        {/* 2. 3 LOGO OPERASIONAL DEPARTEMEN (BAWAH) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          {/* 1. Support Truck */}
          <div className="flex flex-col items-center gap-1.5 group/logo hover:scale-105 transition-all">
            <div className="w-12 h-12 rounded-2xl p-1.5 bg-[var(--bg-card-l1)] border border-[#FF6500]/50 shadow-md flex items-center justify-center backdrop-blur-md">
              <Image
                src={logoSupportTruck || '/brand/logo-support-truck.svg'}
                alt="Support Truck Logo"
                width={36}
                height={36}
                className="object-contain max-h-full max-w-full"
              />
            </div>
            <span className="text-[10px] font-extrabold text-[var(--text-main)] tracking-tight uppercase">
              1. Support Truck
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-[var(--border-color)]" />

          {/* 2. Dewatering */}
          <div className="flex flex-col items-center gap-1.5 group/logo hover:scale-105 transition-all">
            <div className="w-12 h-12 rounded-2xl p-1.5 bg-[var(--bg-card-l1)] border border-[#00A8FF]/50 shadow-md flex items-center justify-center backdrop-blur-md">
              <Image
                src={logoDewatering || '/brand/logo-dewatering.svg'}
                alt="Dewatering Logo"
                width={36}
                height={36}
                className="object-contain max-h-full max-w-full"
              />
            </div>
            <span className="text-[10px] font-extrabold text-[var(--text-main)] tracking-tight uppercase">
              2. Dewatering
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-[var(--border-color)]" />

          {/* 3. High Voltage */}
          <div className="flex flex-col items-center gap-1.5 group/logo hover:scale-105 transition-all">
            <div className="w-12 h-12 rounded-2xl p-1.5 bg-[var(--bg-card-l1)] border border-[#FFD700]/50 shadow-md flex items-center justify-center backdrop-blur-md">
              <Image
                src={logoHighVoltage || '/brand/logo-high-voltage.svg'}
                alt="High Voltage Logo"
                width={36}
                height={36}
                className="object-contain max-h-full max-w-full"
              />
            </div>
            <span className="text-[10px] font-extrabold text-[var(--text-main)] tracking-tight uppercase">
              3. High Voltage
            </span>
          </div>
        </div>

        {/* Main Title & Tagline */}
        <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-main)] mb-2">
          {companyName}
        </h1>
        <p className="text-sm sm:text-base font-extrabold text-[#FF6500] tracking-wide uppercase mb-2">
          {officialSlogan}
        </p>
        <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] max-w-md mb-6 leading-relaxed">
          {tagline || 'Portal Resmi Informasi & Layanan Internal PT Putra Perkasa Abadi'}
        </p>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <ClayBadge variant="safety" className="gap-1.5 text-[11px] py-1 px-3.5 tracking-wider">
            <PpaIcon name="shield-check" size={13} />
            <span>{dict.safetyStatus}</span>
          </ClayBadge>
          <ClayBadge variant="glass" className="gap-1.5 text-[11px] py-1 px-3">
            <PpaIcon name="badge-check" size={13} className="text-[#FF6500]" />
            <span>{dict.verifiedPortal}</span>
          </ClayBadge>
        </div>
      </div>
    </header>
  );
}
