'use client';

import * as React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { NeuButton } from '@/components/ui/neu-button';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { ClayBadge } from '@/components/ui/clay-badge';

export function SiteSettingsForm() {
  const [companyName, setCompanyName] = React.useState('Support Berjaya');
  const [companySubtitle, setCompanySubtitle] = React.useState('PPA Link Hub');
  const [officialSlogan, setOfficialSlogan] = React.useState('Support Berjaya, Berjaya di darat, laut dan udara');
  const [logoUrl, setLogoUrl] = React.useState('/brand/logo-ppa.png');
  const [logoSupportTruck, setLogoSupportTruck] = React.useState('/brand/logo-support-truck.svg');
  const [logoDewatering, setLogoDewatering] = React.useState('/brand/logo-dewatering.svg');
  const [logoHighVoltage, setLogoHighVoltage] = React.useState('/brand/logo-high-voltage.svg');
  const [tagline_id, setTaglineId] = React.useState('');
  const [tagline_en, setTaglineEn] = React.useState('');
  const [themeDefault, setThemeDefault] = React.useState('glass');
  const [announcementBanner, setAnnouncementBanner] = React.useState('');
  const [isMaintenanceMode, setIsMaintenanceMode] = React.useState(false);
  const [showFeaturedSection, setShowFeaturedSection] = React.useState(true);
  const [contactEmail, setContactEmail] = React.useState('it.support@ppa.co.id');
  const [contactPhone, setContactPhone] = React.useState('+62 21 500-PPA');
  const [footerCopyright, setFooterCopyright] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.companyName) setCompanyName(data.companyName);
          if (data.companySubtitle) setCompanySubtitle(data.companySubtitle);
          if (data.officialSlogan) setOfficialSlogan(data.officialSlogan);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.logoSupportTruck) setLogoSupportTruck(data.logoSupportTruck);
          if (data.logoDewatering) setLogoDewatering(data.logoDewatering);
          if (data.logoHighVoltage) setLogoHighVoltage(data.logoHighVoltage);
          if (data.tagline_id) setTaglineId(data.tagline_id);
          if (data.tagline_en) setTaglineEn(data.tagline_en);
          if (data.themeDefault) setThemeDefault(data.themeDefault);
          if (data.announcementBanner !== undefined) setAnnouncementBanner(data.announcementBanner || '');
          if (data.isMaintenanceMode !== undefined) setIsMaintenanceMode(Boolean(data.isMaintenanceMode));
          if (data.showFeaturedSection !== undefined) setShowFeaturedSection(Boolean(data.showFeaturedSection));
          if (data.contactEmail) setContactEmail(data.contactEmail);
          if (data.contactPhone) setContactPhone(data.contactPhone);
          if (data.footerCopyright) setFooterCopyright(data.footerCopyright);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companySubtitle,
          officialSlogan,
          logoUrl,
          logoSupportTruck,
          logoDewatering,
          logoHighVoltage,
          tagline_id,
          tagline_en,
          themeDefault,
          announcementBanner,
          isMaintenanceMode,
          showFeaturedSection,
          contactEmail,
          contactPhone,
          footerCopyright,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Save Status Alert */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <PpaIcon name="check-circle" size={18} />
            <span>Semua pengaturan portal publik & logo operasional berhasil disimpan!</span>
          </div>
          <ClayBadge variant="safety" className="text-[10px]">LIVE UPDATED</ClayBadge>
        </div>
      )}

      {/* Section 1: Identitas Branding */}
      <GlassCard className="p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-md">
        <h3 className="text-base font-black text-[var(--text-main)] mb-1 flex items-center gap-2">
          <PpaIcon name="building-2" size={18} className="text-[#FF6500]" />
          <span>Identitas Branding & Logo Utama</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">Atur nama instansi, slogan korporat, dan URL file logo resmi.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">Nama Perusahaan / Branding *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="mis: Support Berjaya"
              className="neu-input w-full p-3 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">Sub-judul Perusahaan *</label>
            <input
              type="text"
              required
              value={companySubtitle}
              onChange={(e) => setCompanySubtitle(e.target.value)}
              placeholder="mis: PPA Link Hub"
              className="neu-input w-full p-3 rounded-xl"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-main)] mb-1">Slogan Resmi Perusahaan *</label>
            <input
              type="text"
              required
              value={officialSlogan}
              onChange={(e) => setOfficialSlogan(e.target.value)}
              placeholder="mis: Support Berjaya, Berjaya di darat, laut dan udara"
              className="neu-input w-full p-3 rounded-xl uppercase font-bold text-[#FF6500]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-main)] mb-1">URL Logo Utama (Atas)</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/brand/logo-ppa.png"
              className="neu-input w-full p-3 rounded-xl font-mono text-xs"
            />
          </div>
        </div>
      </GlassCard>

      {/* Section 2: 3 Logo Departemen Operasional (Support Truck, Dewatering, High Voltage) */}
      <GlassCard className="p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-md">
        <h3 className="text-base font-black text-[var(--text-main)] mb-1 flex items-center gap-2">
          <PpaIcon name="truck" size={18} className="text-[#FF6500]" />
          <span>Pengaturan 3 Logo Departemen Operasional (Bawah)</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">Kustomisasi URL logo untuk Support Truck, Dewatering, dan High Voltage.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">1. Logo Support Truck</label>
            <input
              type="text"
              value={logoSupportTruck}
              onChange={(e) => setLogoSupportTruck(e.target.value)}
              placeholder="/brand/logo-support-truck.svg"
              className="neu-input w-full p-3 rounded-xl font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">2. Logo Dewatering</label>
            <input
              type="text"
              value={logoDewatering}
              onChange={(e) => setLogoDewatering(e.target.value)}
              placeholder="/brand/logo-dewatering.svg"
              className="neu-input w-full p-3 rounded-xl font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">3. Logo High Voltage</label>
            <input
              type="text"
              value={logoHighVoltage}
              onChange={(e) => setLogoHighVoltage(e.target.value)}
              placeholder="/brand/logo-high-voltage.svg"
              className="neu-input w-full p-3 rounded-xl font-mono text-xs"
            />
          </div>
        </div>
      </GlassCard>

      {/* Section 3: Tagline & Tema Default */}
      <GlassCard className="p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-md">
        <h3 className="text-base font-black text-[var(--text-main)] mb-1 flex items-center gap-2">
          <PpaIcon name="sparkles" size={18} className="text-[#FF6500]" />
          <span>Tagline Bilingual & Tema Publik</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">Pengaturan teks penjelas halaman utama dan tampilan visual default.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">Tagline (Bahasa Indonesia)</label>
            <input
              type="text"
              value={tagline_id}
              onChange={(e) => setTaglineId(e.target.value)}
              placeholder="Portal Resmi Informasi & Layanan Internal PT Putra Perkasa Abadi"
              className="neu-input w-full p-3 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">Tagline (English)</label>
            <input
              type="text"
              value={tagline_en}
              onChange={(e) => setTaglineEn(e.target.value)}
              placeholder="Official Portal for Internal Services & Information PT Putra Perkasa Abadi"
              className="neu-input w-full p-3 rounded-xl"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-main)] mb-1">Tema Default Pengunjung Publik</label>
            <select
              value={themeDefault}
              onChange={(e) => setThemeDefault(e.target.value)}
              className="neu-input w-full p-3 rounded-xl bg-[var(--bg-secondary)]"
            >
              <option value="glass" className="bg-[var(--bg-primary)] text-[var(--text-main)]">Glassmorphism (Ambient Radial Navy Glow)</option>
              <option value="dark" className="bg-[var(--bg-primary)] text-[var(--text-main)]">Dark Mode (Solid Slate Corporate Navy)</option>
              <option value="light" className="bg-[var(--bg-primary)] text-[var(--text-main)]">Light Mode (Clean Crisp Light)</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Section 4: Pengumuman & Mode Situs */}
      <GlassCard className="p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-md">
        <h3 className="text-base font-black text-[var(--text-main)] mb-1 flex items-center gap-2">
          <PpaIcon name="shield-alert" size={18} className="text-[#FF6500]" />
          <span>Running Announcement & Fitur Tambahan</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">Aktifkan pengumuman berjalan, mode pemeliharaan, atau highlight link populer.</p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">Banner Teks Pengumuman (Running Banner)</label>
            <input
              type="text"
              value={announcementBanner}
              onChange={(e) => setAnnouncementBanner(e.target.value)}
              placeholder="mis: 📢 Informasi: Pemeliharaan sistem server MyHRIS pada tanggal 30..."
              className="neu-input w-full p-3 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[#FF6500]/50 transition-all">
              <div>
                <span className="font-bold text-[var(--text-main)] block">Tampilkan Highlight Top Performers</span>
                <span className="text-[10px] text-[var(--text-muted)]">Berikan badge khusus pada link dengan klik tertinggi</span>
              </div>
              <input
                type="checkbox"
                checked={showFeaturedSection}
                onChange={(e) => setShowFeaturedSection(e.target.checked)}
                className="w-4 h-4 accent-[#FF6500]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer hover:border-red-500/50 transition-all">
              <div>
                <span className="font-bold text-red-500 block">Mode Pemeliharaan (Maintenance)</span>
                <span className="text-[10px] text-[var(--text-muted)]">Tampilkan pesan maintenance bagi pengunjung publik</span>
              </div>
              <input
                type="checkbox"
                checked={isMaintenanceMode}
                onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
            </label>
          </div>
        </div>
      </GlassCard>

      {/* Section 5: Kontak Support & Footer Copyright */}
      <GlassCard className="p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-md">
        <h3 className="text-base font-black text-[var(--text-main)] mb-1 flex items-center gap-2">
          <PpaIcon name="user-check" size={18} className="text-[#FF6500]" />
          <span>Kontak IT Support & Copyright Footer</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">Atur email, nomor bantuan IT support, dan teks hak cipta di bagian bawah.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">Email IT Support *</label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="it.support@ppa.co.id"
              className="neu-input w-full p-3 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-main)] mb-1">Telepon / Hotline Support</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+62 21 500-PPA"
              className="neu-input w-full p-3 rounded-xl font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-main)] mb-1">Teks Footer Copyright</label>
            <input
              type="text"
              value={footerCopyright}
              onChange={(e) => setFooterCopyright(e.target.value)}
              placeholder="© 2026 PT Putra Perkasa Abadi — Support Berjaya. All Rights Reserved."
              className="neu-input w-full p-3 rounded-xl"
            />
          </div>
        </div>
      </GlassCard>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <NeuButton type="submit" variant="safety" size="lg" disabled={loading} className="px-8 py-3 font-bold text-sm">
          {loading ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}
        </NeuButton>
      </div>
    </form>
  );
}
