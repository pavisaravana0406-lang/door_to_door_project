import React from 'react';
import { motion } from 'motion/react';

export interface KpiSquareProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  /** Accent colour used for the value, icon and hover ring. */
  tone: 'blue' | 'green' | 'amber' | 'rose';
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  lang?: 'en' | 'ta';
}

const TONES: Record<KpiSquareProps['tone'], { ring: string; value: string; chip: string; glow: string }> = {
  blue:   { ring: 'hover:border-blue-400 hover:shadow-blue-500/20',   value: 'text-blue-700',   chip: 'bg-blue-50 text-blue-700 border-blue-200',   glow: 'from-blue-500/10' },
  green:  { ring: 'hover:border-emerald-400 hover:shadow-emerald-500/20', value: 'text-emerald-700', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', glow: 'from-emerald-500/10' },
  amber:  { ring: 'hover:border-amber-400 hover:shadow-amber-500/20',  value: 'text-amber-700',  chip: 'bg-amber-50 text-amber-700 border-amber-200',   glow: 'from-amber-500/10' },
  rose:   { ring: 'hover:border-rose-400 hover:shadow-rose-500/20',    value: 'text-rose-700',   chip: 'bg-rose-50 text-rose-700 border-rose-200',     glow: 'from-rose-500/10' },
};

/**
 * Square KPI tile with a lift-and-glow hover, used across the worker dashboards.
 */
export const KpiSquare: React.FC<KpiSquareProps> = ({
  label,
  value,
  icon: Icon,
  tone,
  hint,
  active,
  onClick,
  lang = 'en',
}) => {
  const t = TONES[tone];
  const Tag: any = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={hint || label}
      className={`group relative w-full aspect-square rounded-2xl bg-white border-2 p-3 sm:p-4
        flex flex-col items-center justify-center text-center gap-1.5
        transition-all duration-200 shadow-sm
        hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] active:translate-y-0
        ${t.ring}
        ${active ? 'ring-2 ring-offset-1 ring-[#00875A]' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* soft colour wash that intensifies on hover */}
      <span
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${t.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
      />

      <span className={`relative inline-flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11 rounded-xl border ${t.chip} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>

      <span
        className={`relative text-2xl sm:text-3xl font-black font-num leading-none ${t.value} transition-transform duration-200 group-hover:scale-105`}
      >
        {value.toLocaleString()}
      </span>

      <span className="relative text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-slate-500 leading-tight px-1">
        {label}
      </span>

      {hint && (
        <span className="relative text-[9px] sm:text-[10px] font-bold text-slate-400 leading-tight">
          {hint}
        </span>
      )}
    </Tag>
  );
};
