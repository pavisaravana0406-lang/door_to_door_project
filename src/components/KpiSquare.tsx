import React from 'react';
import { motion } from 'motion/react';
import { GIcon } from './icons/GIcon';

export interface KpiSquareProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  /** Accent colour used for the value, icon and hover ring. */
  tone: 'blue' | 'green' | 'amber' | 'rose';
  /** Google Material icon name — renders a crisp GIcon instead of `icon`. */
  gicon?: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  lang?: 'en' | 'ta';
}

const TONES: Record<KpiSquareProps['tone'], { ring: string; value: string; chip: string; chipIcon: string; card: string }> = {
  blue:   { ring: 'hover:border-blue-400',    value: 'text-blue-700',    chip: 'bg-blue-50 border-blue-200',          chipIcon: 'text-blue-600',    card: 'swms-kpi-tone-blue' },
  green:  { ring: 'hover:border-emerald-500', value: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200',    chipIcon: 'text-emerald-600', card: 'swms-kpi-tone-green' },
  amber:  { ring: 'hover:border-amber-500',   value: 'text-amber-700',   chip: 'bg-amber-50 border-amber-200',      chipIcon: 'text-amber-600',   card: 'swms-kpi-tone-amber' },
  rose:   { ring: 'hover:border-rose-400',    value: 'text-rose-700',    chip: 'bg-rose-50 border-rose-200',        chipIcon: 'text-rose-500',    card: 'swms-kpi-tone-rose' },
};

/**
 * Square KPI tile with a lift-and-glow hover, used across the worker dashboards.
 */
export const KpiSquare: React.FC<KpiSquareProps> = ({
  label,
  value,
  icon: Icon,
  tone,
  gicon,
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
      className={`swms-kpi ${t.card} ${t.ring}
        ${active ? 'ring-2 ring-[#00875A] ring-offset-2' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`swms-kpi-icon ${t.chip}`}>
        {gicon
          ? <GIcon name={gicon} size={28} filled className={t.chipIcon} />
          : <Icon className={`h-5 w-5 ${t.chipIcon}`} />}
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
