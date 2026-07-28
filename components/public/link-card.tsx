'use client';

import * as React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { ClayBadge } from '@/components/ui/clay-badge';
import { Language, dictionary } from '@/lib/dictionary';
import { ItemReveal } from '@/components/motion/motion-wrappers';

interface LinkCardProps {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  icon: string;
  clickCount: number;
  lang: Language;
  isFeatured?: boolean;
  isNew?: boolean;
  categoryIconShape?: 'hexagon' | 'squircle' | 'industrial';
}

export function LinkCard({
  id,
  title,
  description,
  url,
  icon,
  clickCount,
  lang,
  isFeatured = false,
  isNew = false,
  categoryIconShape = 'squircle',
}: LinkCardProps) {
  const dict = dictionary[lang];
  const [copied, setCopied] = React.useState(false);
  const [currentClicks, setCurrentClicks] = React.useState(clickCount);

  const handleClick = async () => {
    setCurrentClicks((prev) => prev + 1);
    try {
      fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id }),
      }).catch((err) => console.error('Click log error:', err));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Shape class assignment for category icon box
  const shapeClass =
    categoryIconShape === 'hexagon'
      ? 'shape-hexagon p-3 text-white'
      : categoryIconShape === 'industrial'
      ? 'shape-industrial p-2.5 text-[#FF6500]'
      : 'shape-squircle p-2.5 text-[#FF6500] border border-white/10';

  return (
    <ItemReveal className={isFeatured ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block group text-left h-full"
      >
        <GlassCard
          className={`glass-card-l2 h-full flex flex-col justify-between p-4 sm:p-5 relative ${
            isFeatured ? 'card-top-performer bg-[var(--bg-card-l1)]' : ''
          }`}
        >
          {/* Top Badges Header if Featured or New */}
          {(isFeatured || isNew) && (
            <div className="flex items-center gap-2 mb-3">
              {isFeatured && (
                <ClayBadge variant="gold" className="text-[10px] py-0.5 px-2.5">
                  {dict.topPerformerBadge}
                </ClayBadge>
              )}
              {isNew && (
                <ClayBadge variant="safety" className="text-[10px] py-0.5 px-2">
                  {dict.newBadge}
                </ClayBadge>
              )}
            </div>
          )}

          <div className="flex items-start justify-between gap-4 min-w-0">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              {/* Custom Category Icon Shape Container */}
              <div className={`flex-shrink-0 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 ${shapeClass}`}>
                <PpaIcon name={icon} size={20} />
              </div>

              {/* Titles & Descriptions with CSS variables for clean light/dark mode contrast */}
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-black text-sm sm:text-base text-[var(--text-main)] truncate group-hover:text-[#FF6500] transition-colors">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 font-medium leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Arrow Icon */}
            <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
              <button
                onClick={handleCopyLink}
                title={copied ? dict.linkCopied : dict.copyLink}
                className="p-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[#FF6500]/20 text-[var(--text-muted)] hover:text-[#FF6500] transition-colors border border-[var(--border-color)]"
              >
                <PpaIcon name={copied ? 'check-circle' : 'external-link'} size={14} />
              </button>
              <div className="text-[var(--text-muted)] group-hover:text-[#FF6500] group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-all">
                <PpaIcon name="arrow-up-right" size={20} />
              </div>
            </div>
          </div>

          {/* Footer Click Count */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
            <span className="font-mono">
              {currentClicks.toLocaleString()} {dict.clickCount}
            </span>
            <span className="text-[10px] group-hover:text-[#FF6500] transition-colors">
              PPA Portal →
            </span>
          </div>
        </GlassCard>
      </a>
    </ItemReveal>
  );
}
