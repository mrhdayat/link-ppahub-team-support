'use client';

import * as React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { NeuButton } from '@/components/ui/neu-button';
import { PpaIcon } from '@/components/ui/ppa-icon';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <GlassCard className="w-full max-w-md p-6 border border-white/20 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isDestructive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#FF6500]/20 text-[#FF6500]'}`}>
            <PpaIcon name={isDestructive ? 'trash' : 'shield-alert'} size={24} />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <NeuButton variant="outline" size="sm" onClick={onCancel}>
            {cancelText}
          </NeuButton>
          <NeuButton
            variant={isDestructive ? 'outline' : 'safety'}
            size="sm"
            onClick={onConfirm}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700 text-white border-none' : ''}
          >
            {confirmText}
          </NeuButton>
        </div>
      </GlassCard>
    </div>
  );
}
