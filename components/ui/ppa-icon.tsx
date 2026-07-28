'use client';

import * as React from 'react';
import {
  Briefcase,
  Users,
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
  HeartPulse,
  UserCheck,
  BadgeCheck,
  CalendarDays,
  Truck,
  Gauge,
  BarChart3,
  Globe,
  Share2,
  Building2,
  Link as LinkIcon,
  Folder,
  ChevronDown,
  Search,
  Lock,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Layers,
  ArrowUpRight,
  GripVertical,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconName =
  | 'briefcase'
  | 'users'
  | 'clipboard-check'
  | 'shield-alert'
  | 'shield-check'
  | 'heart-pulse'
  | 'user-check'
  | 'badge-check'
  | 'calendar-days'
  | 'truck'
  | 'gauge'
  | 'bar-chart-3'
  | 'globe'
  | 'share-2'
  | 'building-2'
  | 'link'
  | 'folder'
  | 'chevron-down'
  | 'search'
  | 'lock'
  | 'logout'
  | 'sparkles'
  | 'sun'
  | 'moon'
  | 'layers'
  | 'arrow-up-right'
  | 'grip-vertical'
  | 'plus'
  | 'trash'
  | 'edit'
  | 'eye'
  | 'check-circle'
  | 'x-circle'
  | 'clock'
  | 'external-link';

interface PpaIconProps {
  name: string;
  className?: string;
  size?: number;
  containerVariant?: 'clay' | 'glass' | 'none';
}

const iconMap: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  users: Users,
  'clipboard-check': ClipboardCheck,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  'heart-pulse': HeartPulse,
  'user-check': UserCheck,
  'badge-check': BadgeCheck,
  'calendar-days': CalendarDays,
  truck: Truck,
  gauge: Gauge,
  'bar-chart-3': BarChart3,
  globe: Globe,
  'share-2': Share2,
  'building-2': Building2,
  link: LinkIcon,
  folder: Folder,
  'chevron-down': ChevronDown,
  search: Search,
  lock: Lock,
  logout: LogOut,
  sparkles: Sparkles,
  sun: Sun,
  moon: Moon,
  layers: Layers,
  'arrow-up-right': ArrowUpRight,
  'grip-vertical': GripVertical,
  plus: Plus,
  trash: Trash2,
  edit: Edit,
  eye: Eye,
  'check-circle': CheckCircle2,
  'x-circle': XCircle,
  clock: Clock,
  'external-link': ExternalLink,
};

export function PpaIcon({ name, className, size = 20, containerVariant = 'none' }: PpaIconProps) {
  const Component = iconMap[name] || LinkIcon;

  const iconElement = (
    <Component
      size={size}
      strokeWidth={2.2}
      className={cn('transition-all duration-200 group-hover:scale-110 group-hover:stroke-[#FF6500]', className)}
    />
  );

  if (containerVariant === 'clay') {
    return (
      <div className="clay-icon-box p-2.5 rounded-xl flex items-center justify-center text-[#FF6500] group-hover:text-white transition-colors duration-200">
        {iconElement}
      </div>
    );
  }

  if (containerVariant === 'glass') {
    return (
      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-slate-300 group-hover:text-[#FF6500] group-hover:border-[#FF6500]/40 transition-all duration-200">
        {iconElement}
      </div>
    );
  }

  return iconElement;
}
