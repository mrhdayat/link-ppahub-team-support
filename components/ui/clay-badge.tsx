'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ClayBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'safety' | 'navy' | 'glass' | 'gold';
}

export const ClayBadge = React.forwardRef<HTMLSpanElement, ClayBadgeProps>(
  ({ className, variant = 'safety', children, ...props }, ref) => {
    const variantClasses = {
      safety: 'clay-badge-3d text-xs px-3 py-1',
      navy: 'clay-badge-navy-3d text-xs px-3 py-1 border border-white/15',
      glass: 'bg-white/10 backdrop-blur-md text-[var(--text-main)] border border-white/20 rounded-full px-3 py-1 text-xs shadow-inner',
      gold: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full px-3 py-1 text-xs shadow-md border border-amber-300/40',
    };

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1.5 font-bold tracking-wider uppercase shadow-md transition-all', variantClasses[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

ClayBadge.displayName = 'ClayBadge';
