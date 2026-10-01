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

const TONES: Record<KpiSquareProps['tone'], { ring: string; value: string; chip: string; chipIcon: string }> = {
  blue:   { ring: 'hover:border-blue-400',    value: 'text-blue-700',    chip: 'bg-blue-50 border-blue-200',          chipIcon: 'text-blue-600' },
  green:  { ring: 'hover:border-emerald-500', value: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200',    chipIcon: 'text-emerald-600' },
  amber:  { ring: 'hover:border-amber-500',   value: 'text-amber-700',   chip: 'bg-amber-50 border-amber-200',      chipIcon: 'text-amber-600' },
  rose:   { ring: 'hover:border-rose-400',    value: 'text-rose-700',    chip: 'bg-rose-50 border-rose-200',        chipIcon: 'text-rose-500' },
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
      className={`swms-kpi ${t.ring}
        ${active ? 'ring-2 ring-[#00875A] ring-offset-2' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`swms-kpi-icon ${t.chip}`}>
        <Icon className={`h-5 w-5 ${t.chipIcon}`} />
      </span>

      <span className={`swms-kpi-figure ${t.value}`}>
        {value.toLocaleString()}
      </span>

      <span className="swms-kpi-label">{label}</span>

      {hint && (
        <span className="swms-kpi-hint">{hint}</span>
      )}
    </Tag>
  );
};
