'use client';

import * as React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { NeuButton } from '@/components/ui/neu-button';
import { PpaIcon, IconName } from '@/components/ui/ppa-icon';
import { ClayBadge } from '@/components/ui/clay-badge';
import { LinkCard } from '@/components/public/link-card';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export interface AdminCategory {
  id: string;
  name_id: string;
  name_en: string;
}

export interface AdminLink {
  id: string;
  title_id: string;
  title_en: string;
  description_id?: string | null;
  description_en?: string | null;
  url: string;
  icon: string;
  categoryId: string;
  category?: AdminCategory;
  isActive: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  clickCount: number;
}

interface LinkManagerProps {
  links: AdminLink[];
  categories: AdminCategory[];
  onRefresh: () => void;
}

const AVAILABLE_ICONS: IconName[] = [
  'briefcase',
  'users',
  'clipboard-check',
  'shield-alert',
  'shield-check',
  'heart-pulse',
  'user-check',
  'badge-check',
  'calendar-days',
  'truck',
  'gauge',
  'bar-chart-3',
  'globe',
  'share-2',
  'building-2',
  'link',
];

export function LinkManager({ links, categories, onRefresh }: LinkManagerProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  // Form State
  const [title_id, setTitleId] = React.useState('');
  const [title_en, setTitleEn] = React.useState('');
  const [description_id, setDescId] = React.useState('');
  const [description_en, setDescEn] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [icon, setIcon] = React.useState('link');
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id || '');
  const [isActive, setIsActive] = React.useState(true);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const resetForm = () => {
    setEditingId(null);
    setTitleId('');
    setTitleEn('');
    setDescId('');
    setDescEn('');
    setUrl('');
    setIcon('link');
    setCategoryId(categories[0]?.id || '');
    setIsActive(true);
    setStartDate('');
    setEndDate('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (link: AdminLink) => {
    setEditingId(link.id);
    setTitleId(link.title_id);
    setTitleEn(link.title_en);
    setDescId(link.description_id || '');
    setDescEn(link.description_en || '');
    setUrl(link.url);
    setIcon(link.icon);
    setCategoryId(link.categoryId);
    setIsActive(link.isActive);
    setStartDate(link.startDate ? new Date(link.startDate).toISOString().slice(0, 16) : '');
    setEndDate(link.endDate ? new Date(link.endDate).toISOString().slice(0, 16) : '');
    setIsModalOpen(true);
  };

  const handleDuplicate = (link: AdminLink) => {
    setEditingId(null); // Create new link
    setTitleId(`${link.title_id} (Copy)`);
    setTitleEn(`${link.title_en} (Copy)`);
    setDescId(link.description_id || '');
    setDescEn(link.description_en || '');
    setUrl(link.url);
    setIcon(link.icon);
    setCategoryId(link.categoryId);
    setIsActive(link.isActive);
    setStartDate('');
    setEndDate('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id: editingId,
      title_id,
      title_en,
      description_id,
      description_en,
      url,
      icon,
      categoryId,
      isActive,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    try {
      const res = await fetch('/api/admin/links', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await fetch(`/api/admin/links?id=${deleteTargetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)]">Daftar Link Hub</h2>
          <p className="text-xs text-[var(--text-muted)] font-medium">Kelola URL, teks ID/EN, ikon & jadwal penayangan link.</p>
        </div>
        <NeuButton variant="safety" size="md" onClick={openCreateModal}>
          <PpaIcon name="plus" size={16} />
          <span>Tambah Link Baru</span>
        </NeuButton>
      </div>

      {/* Link Table / Grid */}
      <div className="space-y-3">
        {links.map((link) => (
          <GlassCard key={link.id} className="p-4 flex items-center justify-between gap-4 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <PpaIcon name={link.icon} containerVariant="clay" size={18} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[var(--text-main)] truncate">{link.title_id}</h4>
                  <ClayBadge variant={link.isActive ? 'safety' : 'glass'} className="text-[9px] px-1.5 py-0.5">
                    {link.isActive ? 'Aktif' : 'Nonaktif'}
                  </ClayBadge>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate font-mono mt-0.5">{link.url}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <NeuButton variant="secondary" size="sm" onClick={() => handleDuplicate(link)} title="Duplikasi Link">
                <PpaIcon name="sparkles" size={14} />
              </NeuButton>
              <NeuButton variant="secondary" size="sm" onClick={() => openEditModal(link)} title="Edit Link">
                <PpaIcon name="edit" size={14} />
              </NeuButton>
              <NeuButton variant="outline" size="sm" onClick={() => setDeleteTargetId(link.id)} title="Hapus Link" className="text-red-500 hover:border-red-500/50">
                <PpaIcon name="trash" size={14} />
              </NeuButton>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Link Hub?"
        message="Link yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?"
        confirmText="Hapus Permanen"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Modal CRUD Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <GlassCard className="w-full max-w-2xl p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-base text-[var(--text-main)]">
                {editingId ? 'Edit Link Hub' : 'Tambah Link Hub Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Judul (Bahasa Indonesia) *</label>
                  <input
                    type="text"
                    required
                    value={title_id}
                    onChange={(e) => setTitleId(e.target.value)}
                    placeholder="mis: Portal Safety PPA"
                    className="neu-input w-full p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Judul (English) *</label>
                  <input
                    type="text"
                    required
                    value={title_en}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. PPA Safety Portal"
                    className="neu-input w-full p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Deskripsi (Bahasa Indonesia)</label>
                  <input
                    type="text"
                    value={description_id}
                    onChange={(e) => setDescId(e.target.value)}
                    placeholder="Deskripsi singkat link"
                    className="neu-input w-full p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Deskripsi (English)</label>
                  <input
                    type="text"
                    value={description_en}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Short link description"
                    className="neu-input w-full p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-main)] mb-1">Target URL *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="neu-input w-full p-2.5 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Kategori Department *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="neu-input w-full p-2.5 rounded-xl bg-[var(--bg-secondary)]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[var(--bg-primary)] text-[var(--text-main)]">
                        {c.name_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Pilih Ikon PPA</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="neu-input flex-1 p-2.5 rounded-xl bg-[var(--bg-secondary)]"
                    >
                      {AVAILABLE_ICONS.map((i) => (
                        <option key={i} value={i} className="bg-[var(--bg-primary)] text-[var(--text-main)]">
                          {i}
                        </option>
                      ))}
                    </select>
                    <PpaIcon name={icon} containerVariant="clay" size={18} />
                  </div>
                </div>
              </div>

              {/* Schedule Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-color)]">
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Mulai Tayang (Auto Show)</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="neu-input w-full p-2 rounded-xl text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-main)] mb-1">Selesai Tayang (Auto Hide)</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="neu-input w-full p-2 rounded-xl text-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="pt-3">
                <label className="block font-bold text-[var(--text-main)] mb-2">Real-time Live Preview Card</label>
                <LinkCard
                  id="preview"
                  title={title_id || 'Judul Preview Link'}
                  description={description_id || 'Deskripsi link akan tampil seperti ini di halaman publik.'}
                  url={url || 'https://ppa.co.id'}
                  icon={icon}
                  clickCount={0}
                  lang="id"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <NeuButton type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</NeuButton>
                <NeuButton type="submit" variant="safety" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Link'}
                </NeuButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
