'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { NeuButton } from '@/components/ui/neu-button';
import { PpaIcon, IconName } from '@/components/ui/ppa-icon';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  icon?: IconName;
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
  icon,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md"
          >
            <GlassCard className="p-6 border border-[var(--border-color)] shadow-2xl bg-[var(--bg-card-l1)] space-y-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-2xl flex-shrink-0 border ${
                    isDestructive
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-[#FF6500]/20 text-[#FF6500] border-[#FF6500]/30'
                  }`}
                >
                  <PpaIcon name={icon || (isDestructive ? 'trash' : 'shield-alert')} size={24} />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-[var(--text-main)]">{title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{message}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <NeuButton variant="outline" size="sm" onClick={onCancel} className="px-4">
                  {cancelText}
                </NeuButton>
                <NeuButton
                  variant={isDestructive ? 'outline' : 'safety'}
                  size="sm"
                  onClick={onConfirm}
                  className={
                    isDestructive
                      ? 'bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-600/30 px-4'
                      : 'px-4'
                  }
                >
                  {confirmText}
                </NeuButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
