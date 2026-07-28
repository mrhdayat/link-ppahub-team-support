'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GlassCard } from '@/components/ui/glass-card';
import { NeuButton } from '@/components/ui/neu-button';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { ClayBadge } from '@/components/ui/clay-badge';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('admin@ppa.co.id');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('PIN / Password administrator tidak valid.');
        setLoading(false);
      } else {
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        {/* Top Back Link */}
        <div className="mb-4 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[#FF6500] transition-colors">
            <PpaIcon name="arrow-up-right" size={14} className="rotate-180" />
            <span>Kembali ke Link Hub Support Berjaya</span>
          </Link>
        </div>

        <GlassCard className="p-8 border border-[var(--border-color)] shadow-2xl bg-[var(--bg-card-l1)]">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="relative w-20 h-20 mx-auto mb-3 p-2 rounded-2xl bg-[var(--bg-card-l1)] border border-[#FF6500]/50 shadow-xl flex items-center justify-center">
              <Image
                src="/brand/logo-ppa.png"
                alt="Logo Support Berjaya"
                width={70}
                height={70}
                className="object-contain"
                priority
              />
            </div>
            <h2 className="font-display text-xl font-black tracking-tight text-[var(--text-main)]">
              ADMINISTRATOR LOGIN
            </h2>
            <p className="text-xs text-[#FF6500] font-bold uppercase mt-0.5">
              Support Berjaya Link Hub
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
              <PpaIcon name="x-circle" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-1.5">
                PIN Akses / Password Admin
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan PIN atau Password Administrator"
                  className="neu-input w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-wider text-center"
                />
              </div>
            </div>

            <NeuButton
              type="submit"
              variant="safety"
              size="lg"
              disabled={loading}
              className="w-full mt-3"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Login...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PpaIcon name="lock" size={16} />
                  <span>Masuk ke Dashboard</span>
                </div>
              )}
            </NeuButton>
          </form>

          {/* Secure Portal Badge */}
          <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center">
            <ClayBadge variant="glass" className="text-[10px]">
              Internal Protected Portal — Support Berjaya PPA
            </ClayBadge>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
