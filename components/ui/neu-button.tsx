'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'safety' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs rounded-lg font-medium',
      md: 'px-4 py-2 text-sm rounded-xl font-semibold',
      lg: 'px-6 py-3 text-base rounded-2xl font-bold',
    };

    const variantClasses = {
      primary: 'bg-[#1E3E62] text-white hover:bg-[#0B192C] shadow-lg shadow-[#0B192C]/20 border border-white/10',
      secondary: 'neu-button text-[var(--text-main)]',
      safety: 'bg-[#FF6500] text-white hover:bg-[#FF8A00] shadow-lg shadow-[#FF6500]/25 border border-white/20',
      outline: 'bg-transparent border border-[var(--border-color)] text-[var(--text-main)] hover:border-[#FF6500]/50',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.98]',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeuButton.displayName = 'NeuButton';
