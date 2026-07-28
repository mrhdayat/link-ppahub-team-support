'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PpaIcon } from '@/components/ui/ppa-icon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface PpaToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function PpaToastContainer({ toasts, onDismiss }: PpaToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="pointer-events-auto w-full p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 relative overflow-hidden bg-[var(--bg-card-l1)] border-[var(--border-color)]"
          >
            {/* Left Status Icon Pill */}
            <div
              className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : toast.type === 'error'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : toast.type === 'warning'
                  ? 'bg-[#FF6500]/20 text-[#FF6500] border-[#FF6500]/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              <PpaIcon
                name={
                  toast.type === 'success'
                    ? 'shield-check'
                    : toast.type === 'error'
                    ? 'trash'
                    : toast.type === 'warning'
                    ? 'shield-alert'
                    : 'sparkles'
                }
                size={20}
              />
            </div>

            {/* Content */}
            <div className="flex-1 pr-6">
              <h4 className="font-display font-black text-sm text-[var(--text-main)] leading-tight">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <PpaIcon name="x" size={14} />
            </button>

            {/* Bottom Accent Line */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 ${
                toast.type === 'success'
                  ? 'bg-emerald-500'
                  : toast.type === 'error'
                  ? 'bg-red-500'
                  : toast.type === 'warning'
                  ? 'bg-[#FF6500]'
                  : 'bg-blue-500'
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook helper for simple Toast Management
export function usePpaToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);

      // Auto dismiss after 3.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    dismissToast,
  };
}
