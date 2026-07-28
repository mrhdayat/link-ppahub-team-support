'use client';

import * as React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { ClayBadge } from '@/components/ui/clay-badge';
import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { LinkManager, AdminLink, AdminCategory } from '@/components/admin/link-manager';
import { CategoryManager } from '@/components/admin/category-manager';
import { ReorderList, ReorderItem } from '@/components/admin/reorder-list';
import { SiteSettingsForm } from '@/components/admin/site-settings-form';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = React.useState<'links' | 'reorder' | 'categories' | 'analytics' | 'settings'>('links');
  const [timeGreeting, setTimeGreeting] = React.useState('Selamat Datang');
  
  const [links, setLinks] = React.useState<AdminLink[]>([]);
  const [categories, setCategories] = React.useState<AdminCategory[]>([]);
  const [analytics, setAnalytics] = React.useState<{
    totalClicks: number;
    activeLinks: number;
    totalCategories: number;
    topLinks: { id: string; title_id: string; clickCount: number }[];
    dailyTrends: { day: string; clicks: number }[];
  }>({
    totalClicks: 0,
    activeLinks: 0,
    totalCategories: 0,
    topLinks: [],
    dailyTrends: [],
  });

  // Determine personalized time greeting
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setTimeGreeting('Selamat Pagi');
    else if (hour < 15) setTimeGreeting('Selamat Siang');
    else if (hour < 18) setTimeGreeting('Selamat Sore');
    else setTimeGreeting('Selamat Malam');
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      const [resLinks, resCats, resAnalytics] = await Promise.all([
        fetch('/api/admin/links').then((res) => res.json()),
        fetch('/api/admin/categories').then((res) => res.json()),
        fetch('/api/admin/analytics').then((res) => res.json()),
      ]);

      if (Array.isArray(resLinks)) setLinks(resLinks);
      if (Array.isArray(resCats)) setCategories(resCats);
      if (resAnalytics && !resAnalytics.error) setAnalytics(resAnalytics);
    } catch (error) {
      console.error('Dashboard data load error:', error);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveReorder = async (updatedItems: ReorderItem[]) => {
    try {
      const res = await fetch('/api/admin/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reorderItems: ReorderItem[] = links.map((l) => ({
    id: l.id,
    title_id: l.title_id,
    categoryName: l.category?.name_id || 'Umum',
    order: (l as any).order || 0,
    icon: l.icon,
  }));

  return (
    <div className="space-y-8">
      {/* Time Greeting Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-[#1E3E62] to-[#0B192C] border border-white/20 shadow-xl text-white">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>{timeGreeting}, Admin Support Berjaya</span>
            <span className="inline-block animate-bounce">👋</span>
          </h2>
          <p className="text-xs text-slate-200 font-medium mt-0.5">
            Portal Administrasi Link Hub Support Berjaya — Berjaya di darat, laut dan udara
          </p>
        </div>
        <ClayBadge variant="safety" className="text-xs py-1 px-3.5 self-start sm:self-auto shadow-md">
          SUPPORT BERJAYA PORTAL
        </ClayBadge>
      </div>

      {/* Top Overview Metric Cards with Clear Contrast Variables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5 border border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card-l1)] shadow-md">
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)]">Total Klik Link Hub</p>
            <h3 className="text-3xl font-black text-[#FF6500] mt-1">{analytics.totalClicks}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <PpaIcon name="bar-chart-3" size={12} />
              <span>Real-time aggregate</span>
            </p>
          </div>
          <PpaIcon name="gauge" containerVariant="clay" size={24} />
        </GlassCard>

        <GlassCard className="p-5 border border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card-l1)] shadow-md">
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)]">Link Aktif Terdaftar</p>
            <h3 className="text-3xl font-black text-[var(--text-main)] mt-1">{analytics.activeLinks}</h3>
            <p className="text-[11px] font-medium text-[var(--text-muted)] mt-1">Tayang di halaman publik</p>
          </div>
          <PpaIcon name="link" containerVariant="glass" size={24} />
        </GlassCard>

        <GlassCard className="p-5 border border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card-l1)] shadow-md">
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)]">Kategori Department</p>
            <h3 className="text-3xl font-black text-[var(--text-main)] mt-1">{analytics.totalCategories}</h3>
            <p className="text-[11px] font-medium text-[var(--text-muted)] mt-1">Divisi & unit kerja PPA</p>
          </div>
          <PpaIcon name="folder" containerVariant="glass" size={24} />
        </GlassCard>
      </div>

      {/* Navigation Tabs with High Contrast Variables */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border-color)] no-scrollbar">
        {[
          { id: 'links', label: 'Kelola Link', icon: 'link' },
          { id: 'reorder', label: 'Atur Urutan (DND)', icon: 'grip-vertical' },
          { id: 'categories', label: 'Kategori', icon: 'folder' },
          { id: 'analytics', label: 'Analitik Klik', icon: 'bar-chart-3' },
          { id: 'settings', label: 'Pengaturan Situs', icon: 'sparkles' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#1E3E62] text-white border border-[#FF6500]/60 shadow-lg'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            <PpaIcon name={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'links' && (
          <LinkManager links={links} categories={categories} onRefresh={loadData} />
        )}

        {activeTab === 'reorder' && (
          <GlassCard className="p-6 border border-[var(--border-color)] max-w-2xl bg-[var(--bg-card-l1)]">
            <ReorderList items={reorderItems} onSave={handleSaveReorder} />
          </GlassCard>
        )}

        {activeTab === 'categories' && (
          <CategoryManager categories={categories} onRefresh={loadData} />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <GlassCard className="p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-[var(--text-main)] mb-1">Tren Klik Harian</h3>
                  <p className="text-xs text-[var(--text-muted)]">Grafik interaktif total interaksi link publik per hari.</p>
                </div>
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] text-xs">
                  <button className="px-2.5 py-1 rounded-lg bg-[#FF6500] text-white font-bold">7 Hari</button>
                  <button className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold">30 Hari</button>
                </div>
              </div>
              <AnalyticsChart data={analytics.dailyTrends} />
            </GlassCard>

            <GlassCard className="p-6 border border-[var(--border-color)] max-w-xl bg-[var(--bg-card-l1)]">
              <h3 className="font-bold text-sm text-[var(--text-main)] mb-3">Top 5 Link Paling Sering Diklik</h3>
              <div className="space-y-2">
                {analytics.topLinks.map((tl, idx) => (
                  <div key={tl.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#FF6500]">#{idx + 1}</span>
                      <span className="text-xs font-semibold text-[var(--text-main)]">{tl.title_id}</span>
                    </div>
                    <ClayBadge variant="navy" className="text-[10px]">
                      {tl.clickCount} klik
                    </ClayBadge>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'settings' && <SiteSettingsForm />}
      </div>
    </div>
  );
}
