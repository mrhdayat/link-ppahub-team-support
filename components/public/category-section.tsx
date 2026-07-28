'use client';

import * as React from 'react';
import { ClayBadge } from '@/components/ui/clay-badge';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { StaggerContainer } from '@/components/motion/motion-wrappers';

interface CategorySectionProps {
  id?: string;
  categoryName: string;
  icon: string;
  linkCount: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CategorySection({ id, categoryName, icon, linkCount, children, defaultOpen = true }: CategorySectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div id={id} className="w-full max-w-4xl mx-auto mb-8 scroll-mt-24">
      {/* Category Collapsible Header with Left Accent Line */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 mb-3 rounded-2xl text-left font-display font-black text-sm sm:text-base tracking-wider text-[var(--text-main)] glass-panel-l1 border-l-4 border-[#FF6500] hover:border-[#FF6500] transition-all group shadow-lg"
      >
        <div className="flex items-center gap-3">
          <PpaIcon name={icon} size={18} className="text-[#FF6500] group-hover:scale-110 transition-transform" />
          <span className="uppercase text-xs sm:text-sm font-extrabold text-[var(--text-main)] tracking-wider">
            {categoryName}
          </span>
          <ClayBadge variant="navy" className="text-[10px] px-2.5 py-0.5">
            {linkCount} LINK
          </ClayBadge>
        </div>
        <div className={`text-slate-400 group-hover:text-[#FF6500] transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <PpaIcon name="chevron-down" size={18} />
        </div>
      </button>

      {/* Bento Grid Layout for Links */}
      {isOpen && (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children}
        </StaggerContainer>
      )}
    </div>
  );
}
