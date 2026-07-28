'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PPA_EASING = [0.22, 1, 0.36, 1] as const;

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const itemRevealVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: PPA_EASING,
    },
  },
};

export function StaggerContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ItemReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={itemRevealVariants}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInWrapper({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: PPA_EASING, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
