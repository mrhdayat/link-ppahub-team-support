'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowOnHover?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glowOnHover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-card rounded-2xl p-5 relative overflow-hidden',
          glowOnHover && 'hover:border-[#FF6500]/40 hover:shadow-[0_10px_30px_-5px_rgba(255,101,0,0.18)]',
          className
        )}
        {...props}
      >
        {/* Subtle inner highlight top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
