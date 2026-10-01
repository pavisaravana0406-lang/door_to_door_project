import React from 'react';
import { motion } from 'motion/react';
import { Truck, Package, PackageCheck, PackageX, PackageMinus, Repeat, Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { GroupBreakdown, VehicleBreakdownRow, AdminTotals } from '../utils/adminAnalytics';

export type KpiTone = 'slate' | 'blue' | 'green' | 'amber' | 'rose' | 'violet';

const TONES: Record<KpiTone, { ring: string; value: string; chip: string; glow: string }> = {
  slate:   { ring: 'hover:border-slate-400 hover:shadow-slate-500/20',        value: 'text-slate-700',   chip: 'bg-slate-100 text-slate-600 border-slate-200',        glow: 'from-slate-500/10' },
  blue:    { ring: 'hover:border-blue-400 hover:shadow-blue-500/20',          value: 'text-blue-700',    chip: 'bg-blue-50 text-blue-700 border-blue-200',            glow: 'from-blue-500/10' },
  green:   { ring: 'hover:border-emerald-400 hover:shadow-emerald-500/20',    value: 'text-emerald-700', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',  glow: 'from-emerald-500/10' },
  amber:   { ring: 'hover:border-amber-400 hover:shadow-amber-500/20',        value: 'text-amber-700',   chip: 'bg-amber-50 text-amber-700 border-amber-200',        glow: 'from-amber-500/10' },
  rose:    { ring: 'hover:border-rose-400 hover:shadow-rose-500/20',          value: 'text-rose-700',    chip: 'bg-rose-50 text-rose-700 border-rose-200',            glow: 'from-rose-500/10' },
  violet:  { ring: 'hover:border-violet-400 hover:shadow-violet-500/20',      value: 'text-violet-700',  chip: 'bg-violet-50 text-violet-700 border-violet-200',      glow: 'from-violet-500/10' },
};

export interface AdminKpiSquareProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: KpiTone;
  /** Shown under the value, e.g. the share of the total. */
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  lang?: 'en' | 'ta';
}

/**
 * Square admin KPI tile with a lift-and-glow hover. Clickable tiles double as
 * status filters, which is why the active state is an explicit prop.
 */
export const AdminKpiSquare: React.FC<AdminKpiSquareProps> = ({
  label, value, icon: Icon, tone, hint, active, onClick,
}) => {
  const t = TONES[tone];
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={label}
      className={`group relative w-full rounded-xl bg-white border-2 p-2.5 sm:p-3 flex items-center gap-2.5
        transition-all duration-200 shadow-sm
        hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0
        ${t.ring}
        ${active ? 'ring-2 ring-offset-1 ring-[#1E7A38]' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br ${t.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
      <span className={`relative flex-shrink-0 inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg border ${t.chip} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <div className="relative min-w-0 flex-1">
        <div className={`text-lg sm:text-xl font-black font-num leading-none ${t.value} transition-transform duration-200 group-hover:scale-105`}>
          {value.toLocaleString()}
        </div>
        <div className="mt-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-500 leading-tight truncate">
          {label}
        </div>
        {hint && <div className="text-[9px] font-bold text-slate-400 leading-tight truncate">{hint}</div>}
      </div>
    </Tag>
  );
};

/** The six headline garbage KPIs. */
export const GARBAGE_KPIS: Array<{
  key: 'total' | 'collected' | 'notCollected' | 'partial' | 'frequent';
  label: string;
  labelTa: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: KpiTone;
}> = [
  { key: 'total', label: 'Total Garbage', labelTa: 'மொத்த கழிவு', icon: Package, tone: 'slate' },
  { key: 'collected', label: 'Collected', labelTa: 'சேகரிக்கப்பட்டது', icon: PackageCheck, tone: 'green' },
  { key: 'notCollected', label: 'Not Collected', labelTa: 'சேகரிக்கப்படவில்லை', icon: PackageX, tone: 'rose' },
  { key: 'partial', label: 'Partially Not Collected', labelTa: 'பகுதி சேகரிக்கப்படவில்லை', icon: PackageMinus, tone: 'amber' },
  { key: 'frequent', label: 'Frequently Not Collected', labelTa: 'அடிக்கடி சேகரிக்கப்படவில்லை', icon: Repeat, tone: 'violet' },
];

export interface GarbageKpiGridProps {
  totals: AdminTotals;
  lang?: 'en' | 'ta';
  activeKey?: string | null;
  onSelect?: (key: string | null) => void;
}

export const GarbageKpiGrid: React.FC<GarbageKpiGridProps> = ({ totals, lang = 'en', activeKey, onSelect }) => {
  const valueOf = (k: string): number =>
    k === 'total' ? totals.total
      : k === 'collected' ? totals.collected
      : k === 'notCollected' ? totals.notCollected
      : k === 'partial' ? totals.partial
      : totals.frequent;
  const hintOf = (k: string): string => {
    if (k === 'total') return `${totals.total} doors`;
    if (k === 'collected') return `${totals.collectedPercent}%`;
    if (k === 'notCollected') return `${totals.notCollectedPercent}%`;
    if (k === 'partial') return `${totals.partialPercent}%`;
    return `${totals.frequentPercent}%`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2.5">
      {GARBAGE_KPIS.map(k => (
        <AdminKpiSquare
          key={k.key}
          label={lang === 'ta' ? k.labelTa : k.label}
          value={valueOf(k.key)}
          icon={k.icon}
          tone={k.tone}
          hint={hintOf(k.key)}
          active={activeKey === k.key}
          onClick={() => onSelect?.(activeKey === k.key ? null : k.key)}
        />
      ))}
    </div>
  );
};

/** Horizontal performance bar, coloured by threshold. */
export const performanceTone = (p: number): KpiTone =>
  p >= 80 ? 'green' : p >= 50 ? 'amber' : p > 0 ? 'blue' : 'rose';

const BAR_FILL: Record<KpiTone, string> = {
  slate: 'bg-slate-400', blue: 'bg-blue-500', green: 'bg-emerald-500',
  amber: 'bg-amber-500', rose: 'bg-rose-500', violet: 'bg-violet-500',
};

const BAR_TEXT: Record<KpiTone, string> = {
  slate: 'text-slate-700', blue: 'text-blue-700', green: 'text-emerald-700',
  amber: 'text-amber-700', rose: 'text-rose-700', violet: 'text-violet-700',
};

export interface PerformanceRow {
  key: string;
  label: string;
  sublabel?: string;
  total: number;
  collected?: number;
  partial?: number;
  notCollected?: number;
  frequent?: number;
  performance: number;
  extra?: React.ReactNode;
}

export interface PerformanceListProps {
  rows: PerformanceRow[];
  lang?: 'en' | 'ta';
  emptyText?: string;
  /** Which counts to show as inline chips under the bar. */
  showChips?: boolean;
  onSelect?: (key: string) => void;
}

/**
 * A zone-wise or vehicle-wise performance list: one row per group with a
 * colour-coded performance bar, used on the overview and the collected /
 * not-collected pages.
 */
export const PerformanceList: React.FC<PerformanceListProps> = ({
  rows, lang = 'en', emptyText, showChips = true, onSelect,
}) => {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
        <Layers className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
        <p className="text-xs font-bold text-slate-500">{emptyText || (lang === 'ta' ? 'தரவு இல்லை' : 'No data yet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const tone = performanceTone(r.performance);
        const Tag: any = onSelect ? 'button' : 'div';
        return (
          <motion.div
            key={r.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
          >
            <Tag
              type={onSelect ? 'button' : undefined}
              onClick={onSelect ? () => onSelect(r.key) : undefined}
              className={`w-full text-left bg-white rounded-xl border-2 border-slate-200 shadow-sm px-3 py-2.5
                transition hover:border-slate-300 hover:shadow-md ${onSelect ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900 truncate">{r.label}</span>
                    {r.sublabel && <span className="text-[10px] font-bold text-slate-400 truncate">{r.sublabel}</span>}
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${BAR_FILL[tone]}`}
                      initial={false}
                      animate={{ width: `${Math.max(0, Math.min(100, r.performance))}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm sm:text-lg font-black font-num leading-none ${BAR_TEXT[tone]}`}>
                    {r.performance.toFixed(1)}%
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === 'ta' ? 'செயல்திறன்' : 'Performance'}
                  </div>
                </div>
              </div>

              {showChips && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-600">
                    <Truck className="w-2.5 h-2.5" /> {r.total}
                  </span>
                  {r.collected !== undefined && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {r.collected}
                    </span>
                  )}
                  {!!r.partial && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700">
                      <AlertTriangle className="w-2.5 h-2.5" /> {r.partial}
                    </span>
                  )}
                  {r.notCollected !== undefined && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-[9px] font-bold text-rose-700">
                      <XCircle className="w-2.5 h-2.5" /> {r.notCollected}
                    </span>
                  )}
                  {r.extra}
                </div>
              )}
            </Tag>
          </motion.div>
        );
      })}
    </div>
  );
};

/** Section wrapper so every admin page shares the same heading treatment. */
export const AdminSection: React.FC<{
  title: string;
  titleTa?: string;
  icon: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
  children: React.ReactNode;
  lang?: 'en' | 'ta';
}> = ({ title, titleTa, icon: Icon, right, children, lang = 'en' }) => (
  <section className="space-y-2.5">
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wide text-slate-800">
        <Icon className="w-4 h-4 text-[#1E7A38]" />
        {lang === 'ta' && titleTa ? titleTa : title}
      </h3>
      {right}
    </div>
    {children}
  </section>
);
