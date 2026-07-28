'use client';

import * as React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { NeuButton } from '@/components/ui/neu-button';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { PpaToastContainer, usePpaToast } from '@/components/ui/ppa-toast';
import { AdminCategory } from './link-manager';

interface CategoryManagerProps {
  categories: AdminCategory[];
  onRefresh: () => void;
}

export function CategoryManager({ categories, onRefresh }: CategoryManagerProps) {
  const { toasts, addToast, dismissToast } = usePpaToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [name_id, setNameId] = React.useState('');
  const [name_en, setNameEn] = React.useState('');
  const [icon, setIcon] = React.useState('folder');
  const [loading, setLoading] = React.useState(false);

  const resetForm = () => {
    setEditingId(null);
    setNameId('');
    setNameEn('');
    setIcon('folder');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setNameId(cat.name_id);
    setNameEn(cat.name_en);
    setIcon((cat as any).icon || 'folder');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id: editingId,
      name_id,
      name_en,
      icon,
    };

    try {
      const res = await fetch('/api/admin/categories', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        onRefresh();
        addToast(
          'success',
          editingId ? 'Kategori Diperbarui!' : 'Kategori Baru Berhasil Dibuat!',
          `Kategori "${name_id}" telah disimpan.`
        );
      } else {
        addToast('error', 'Gagal Menyimpan Kategori', 'Sistem gagal menyimpan kategori.');
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal Koneksi Server', 'Periksa koneksi jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${deleteTargetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
        addToast('warning', 'Kategori Dihapus', 'Kategori departemen telah dihapus.');
      } else {
        addToast('error', 'Gagal Menghapus Kategori', 'Tidak dapat menghapus kategori ini.');
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal Koneksi Server', 'Periksa koneksi jaringan Anda.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Stack */}
      <PpaToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)]">Kategori Department</h2>
          <p className="text-xs text-[var(--text-muted)] font-medium">Pengelompokan divisi & departemen Support Berjaya PPA.</p>
        </div>
        <NeuButton variant="safety" size="md" onClick={openCreateModal}>
          <PpaIcon name="plus" size={16} />
          <span>Tambah Kategori</span>
        </NeuButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <GlassCard key={cat.id} className="p-4 flex items-center justify-between border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-sm">
            <div className="flex items-center gap-3">
              <PpaIcon name={(cat as any).icon || 'folder'} containerVariant="clay" size={18} />
              <div>
                <h4 className="font-bold text-sm text-[var(--text-main)]">{cat.name_id}</h4>
                <p className="text-xs text-[var(--text-muted)] font-medium">{cat.name_en}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NeuButton variant="secondary" size="sm" onClick={() => openEditModal(cat)}>
                <PpaIcon name="edit" size={14} />
              </NeuButton>
              <NeuButton variant="outline" size="sm" onClick={() => setDeleteTargetId(cat.id)} className="text-red-500 hover:border-red-500/50">
                <PpaIcon name="trash" size={14} />
              </NeuButton>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Kategori Departemen?"
        message="Menghapus kategori ini akan menghapus semua link di dalamnya. Lanjutkan?"
        confirmText="Hapus Kategori"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <GlassCard className="w-full max-w-md p-6 border border-[var(--border-color)] bg-[var(--bg-card-l1)] shadow-2xl">
            <h3 className="font-bold text-base text-[var(--text-main)] mb-4">
              {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-main)] mb-1">Nama Kategori (Bahasa Indonesia) *</label>
                <input
                  type="text"
                  required
                  value={name_id}
                  onChange={(e) => setNameId(e.target.value)}
                  placeholder="mis: Operasional Mining"
                  className="neu-input w-full p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-main)] mb-1">Nama Kategori (English) *</label>
                <input
                  type="text"
                  required
                  value={name_en}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Mining Operations"
                  className="neu-input w-full p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-main)] mb-1">Ikon Kategori</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="mis: truck, briefcase, globe"
                  className="neu-input w-full p-2.5 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <NeuButton type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</NeuButton>
                <NeuButton type="submit" variant="safety" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Kategori'}
                </NeuButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
