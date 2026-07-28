'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Language, dictionary } from '@/lib/dictionary';
import { Header } from './header';
import { SearchBar } from './search-bar';
import { CategorySection } from './category-section';
import { LinkCard } from './link-card';
import { Footer } from './footer';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { ThemeSwitcher } from './theme-switcher';
import { LangToggle } from './lang-toggle';
import { NeuButton } from '@/components/ui/neu-button';
import { GlassCard } from '@/components/ui/glass-card';

export interface PublicLink {
  id: string;
  title_id: string;
  title_en: string;
  description_id?: string | null;
  description_en?: string | null;
  url: string;
  icon: string;
  clickCount: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isActive: boolean;
  createdAt?: Date | string | null;
}

export interface PublicCategory {
  id: string;
  name_id: string;
  name_en: string;
  icon: string;
  order: number;
  links: PublicLink[];
}

export interface SiteSettingsData {
  companyName?: string;
  companySubtitle?: string;
  officialSlogan?: string;
  logoUrl?: string;
  logoSupportTruck?: string;
  logoDewatering?: string;
  logoHighVoltage?: string;
  tagline_id?: string;
  tagline_en?: string;
  themeDefault?: string;
  announcementBanner?: string | null;
  isMaintenanceMode?: boolean;
  showFeaturedSection?: boolean;
  contactEmail?: string;
  contactPhone?: string | null;
  footerCopyright?: string;
}

interface LinkHubClientProps {
  categories: PublicCategory[];
  siteSettings?: SiteSettingsData | null;
}

export function LinkHubClient({ categories, siteSettings }: LinkHubClientProps) {
  const [lang, setLang] = React.useState<Language>('id');
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const dict = dictionary[lang];

  // Dynamic Site Settings values
  const companyName = siteSettings?.companyName || 'Support Berjaya';
  const companySubtitle = siteSettings?.companySubtitle || 'PPA Link Hub';
  const officialSlogan = siteSettings?.officialSlogan || 'Support Berjaya, Berjaya di darat, laut dan udara';
  const logoUrl = siteSettings?.logoUrl || '/brand/logo-ppa.png';
  const logoSupportTruck = siteSettings?.logoSupportTruck || '/brand/logo-support-truck.svg';
  const logoDewatering = siteSettings?.logoDewatering || '/brand/logo-dewatering.svg';
  const logoHighVoltage = siteSettings?.logoHighVoltage || '/brand/logo-high-voltage.svg';
  const tagline = lang === 'en' ? siteSettings?.tagline_en : siteSettings?.tagline_id;
  const announcementBanner = siteSettings?.announcementBanner;
  const isMaintenanceMode = Boolean(siteSettings?.isMaintenanceMode);
  const showFeaturedSection = siteSettings?.showFeaturedSection !== false;
  const contactEmail = siteSettings?.contactEmail || 'it.support@ppa.co.id';
  const footerCopyright = siteSettings?.footerCopyright;

  // Scroll Listener for Progress and Navbar Animation
  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const now = new Date();

  // Optimized Max Click calculation with useMemo (Performance Skill)
  const maxClicks = React.useMemo(() => {
    let max = 0;
    categories.forEach((cat) => {
      cat.links.forEach((l) => {
        if (l.clickCount > max) max = l.clickCount;
      });
    });
    return max;
  }, [categories]);

  // Filter categories and links with useMemo (Performance Skill)
  const filteredCategories = React.useMemo(() => {
    return categories
      .filter((cat) => (selectedCategory ? cat.id === selectedCategory : true))
      .map((cat) => {
        const catName = lang === 'en' ? cat.name_en : cat.name_id;
        const filteredLinks = cat.links.filter((link) => {
          if (!link.isActive) return false;
          if (link.startDate && new Date(link.startDate) > now) return false;
          if (link.endDate && new Date(link.endDate) < now) return false;

          if (!search.trim()) return true;
          const query = search.toLowerCase();
          const title = (lang === 'en' ? link.title_en : link.title_id).toLowerCase();
          const desc = ((lang === 'en' ? link.description_en : link.description_id) || '').toLowerCase();
          const url = link.url.toLowerCase();

          return title.includes(query) || desc.includes(query) || url.includes(query) || catName.toLowerCase().includes(query);
        });

        return {
          ...cat,
          links: filteredLinks,
        };
      })
      .filter((cat) => cat.links.length > 0);
  }, [categories, selectedCategory, lang, search, now]);

  // Assign shape per category type
  const getShapeForCategory = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('k3') || lower.includes('safety')) return 'hexagon';
    if (lower.includes('karir') || lower.includes('career')) return 'squircle';
    return 'industrial';
  };

  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-primary)]">
        <GlassCard className="max-w-md p-8 border border-red-500/30 text-center shadow-2xl bg-[var(--bg-card-l1)]">
          <PpaIcon name="shield-alert" size={48} className="mx-auto text-red-500 mb-4 animate-pulse" />
          <h2 className="font-display font-black text-xl text-[var(--text-main)] mb-2">
            Mode Pemeliharaan Sistem
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
            Portal Link Hub {companyName} saat ini sedang dalam pemeliharaan rutin oleh tim IT Support. Silakan coba beberapa saat lagi.
          </p>
          <a href={`mailto:${contactEmail}`}>
            <NeuButton variant="safety" size="md">
              Hubungi IT Support ({contactEmail})
            </NeuButton>
          </a>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full relative pt-20">
      {/* Top Scroll Indicator Progress Line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/20 z-[100]">
        <div
          className="h-full bg-gradient-to-r from-[#FF6500] via-[#FF8A00] to-amber-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Dynamic Announcement Running Banner */}
      {announcementBanner && (
        <div className="w-full bg-gradient-to-r from-[#FF6500] to-[#FF8A00] text-white py-2 px-4 text-xs font-bold text-center shadow-md flex items-center justify-center gap-2">
          <PpaIcon name="sparkles" size={14} />
          <span>{announcementBanner}</span>
        </div>
      )}

      {/* ANIMATED SMOOTH TOP STICKY NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out flex items-center px-4 sm:px-8 ${
          isScrolled
            ? 'h-14 sm:h-16 navbar-solid border-b border-[var(--border-color)] shadow-xl'
            : 'h-16 sm:h-20 bg-transparent border-b border-transparent shadow-none'
        }`}
      >
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
          {/* Left Brand Badge */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-[var(--bg-card-l1)] p-0.5 border border-[#FF6500]/50 shadow-md">
              <Image
                src={logoUrl || '/brand/logo-ppa.png'}
                alt={`Logo ${companyName}`}
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-none flex flex-col justify-center">
              <span className="font-display font-black text-xs sm:text-sm text-[var(--text-main)] tracking-tight block uppercase">
                {companyName}
              </span>
              <span className="text-[9px] text-[#FF6500] font-bold uppercase hidden sm:block mt-0.5">
                {companySubtitle}
              </span>
            </div>
          </div>

          {/* Right Top Controls: Theme, Lang, Admin Login */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeSwitcher />
            <LangToggle currentLang={lang} onLanguageChange={setLang} />
            <Link href="/admin/login">
              <NeuButton variant="outline" size="sm" className="gap-1.5 text-xs font-semibold px-3 py-1.5 flex items-center">
                <PpaIcon name="lock" size={13} />
                <span className="hidden sm:inline">{dict.adminLoginBtn}</span>
              </NeuButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header Hero Section */}
      <Header
        lang={lang}
        tagline={tagline}
        companyName={companyName}
        officialSlogan={officialSlogan}
        logoUrl={logoUrl}
        logoSupportTruck={logoSupportTruck}
        logoDewatering={logoDewatering}
        logoHighVoltage={logoHighVoltage}
      />

      {/* Single Main Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={dict.searchPlaceholder}
      />

      {/* Horizontal Quick Jump Category Filter Tabs */}
      <div className="w-full max-w-4xl mx-auto px-4 mb-8 overflow-x-auto pb-2 flex items-center gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-[#FF6500] text-white shadow-lg shadow-[#FF6500]/25'
              : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
          }`}
        >
          Semua Category ({categories.reduce((acc, c) => acc + c.links.length, 0)})
        </button>
        {categories.map((cat) => {
          const catName = lang === 'en' ? cat.name_en : cat.name_id;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-[#1E3E62] text-white border border-[#FF6500]/60 shadow-lg'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
              }`}
            >
              <PpaIcon name={cat.icon} size={14} />
              <span>{catName}</span>
            </button>
          );
        })}
      </div>

      {/* Categories & Bento Grid Links */}
      {filteredCategories.length > 0 ? (
        filteredCategories.map((cat) => {
          const categoryName = lang === 'en' ? cat.name_en : cat.name_id;
          const shape = getShapeForCategory(categoryName);

          return (
            <CategorySection
              key={cat.id}
              id={`cat-${cat.id}`}
              categoryName={categoryName}
              icon={cat.icon}
              linkCount={cat.links.length}
            >
              {cat.links.map((link) => {
                const title = lang === 'en' ? link.title_en : link.title_id;
                const description = lang === 'en' ? link.description_en : link.description_id;
                const isFeatured = showFeaturedSection && link.clickCount > 0 && link.clickCount >= maxClicks;
                const isNew = link.createdAt
                  ? new Date().getTime() - new Date(link.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
                  : false;

                return (
                  <LinkCard
                    key={link.id}
                    id={link.id}
                    title={title}
                    description={description}
                    url={link.url}
                    icon={link.icon}
                    clickCount={link.clickCount}
                    lang={lang}
                    isFeatured={isFeatured}
                    isNew={isNew}
                    categoryIconShape={shape}
                  />
                );
              })}
            </CategorySection>
          );
        })
      ) : (
        <div className="w-full max-w-xl mx-auto py-12 text-center text-[var(--text-muted)] bg-[var(--bg-card-l1)] rounded-3xl border border-[var(--border-color)] backdrop-blur-md">
          <PpaIcon name="shield-alert" size={36} className="mx-auto mb-3 text-[#FF6500]" />
          <p className="font-bold text-base text-[var(--text-main)]">{dict.noLinksFound}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Coba gunakan kata kunci pencarian lain.</p>
        </div>
      )}

      {/* Contact IT Support Banner */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-12">
        <GlassCard className="p-6 border border-[#FF6500]/40 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="font-display font-extrabold text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
              <PpaIcon name="building-2" size={18} className="text-[#FF6500]" />
              <span>{dict.contactAdmin}</span>
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Hubungi tim IT Support — {companyName} untuk pendaftaran link portal baru.
            </p>
          </div>
          <a href={`mailto:${contactEmail}`}>
            <NeuButton variant="safety" size="sm" className="whitespace-nowrap">
              <span>Hubungi IT Support ({contactEmail})</span>
            </NeuButton>
          </a>
        </GlassCard>
      </div>

      {/* Footer */}
      <Footer lang={lang} copyrightText={footerCopyright} />
    </div>
  );
}
