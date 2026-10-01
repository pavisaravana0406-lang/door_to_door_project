import React from 'react';
import {
  Truck, Package, PackageCheck, PackageX, PackageMinus, Repeat, Layers, MapPin,
  CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import { GroupBreakdown, VehicleBreakdownRow, AdminTotals } from '../utils/adminAnalytics';

export type KpiTone = 'slate' | 'blue' | 'green' | 'amber' | 'rose' | 'violet';

const TONES: Record<KpiTone, { value: string; iconColor: string; bar: string }> = {
  slate:  { value: 'text-slate-900',   iconColor: 'text-indigo-600',  bar: '#6366f1' },
  blue:   { value: 'text-blue-700',    iconColor: 'text-blue-600',    bar: '#2563eb' },
  green:  { value: 'text-emerald-700', iconColor: 'text-emerald-600', bar: '#16a34a' },
  amber:  { value: 'text-amber-700',   iconColor: 'text-amber-600',   bar: '#f59e0b' },
  rose:   { value: 'text-rose-700',    iconColor: 'text-rose-500',    bar: '#dc2626' },
  violet: { value: 'text-violet-700',  iconColor: 'text-violet-600',  bar: '#7c3aed' },
};

export interface AdminKpiSquareProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: KpiTone;
  /** Shown under the label, e.g. the share of the total. */
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}

/**
 * Hotspot-style KPI card: top row (icon + tiny label … % pill),
 * big figure, sub-label, bottom progress bar.
 * Each tone gets its own pastel fill so cards are instantly separable.
 */
export const AdminKpiSquare: React.FC<AdminKpiSquareProps> = ({
  label, value, icon: Icon, tone, hint, active, onClick,
}) => {
  const t = TONES[tone];
  const Tag: any = onClick ? 'button' : 'div';
  const pct = hint?.includes('%') ? hint : undefined;
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={`${label}: ${value.toLocaleString()}${hint ? ` (${hint})` : ''}`}
      aria-pressed={onClick ? !!active : undefined}
      className={`swms-kpi swms-kpi-tone-${tone} ${active ? 'ring-2 ring-[#1E7A38] ring-offset-2' : ''} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className="swms-kpi-top">
        <span className="swms-kpi-label-row">
          <span className="swms-kpi-icon">
            <Icon className={`h-4 w-4 ${t.iconColor}`} />
          </span>
          <span className="swms-kpi-label">{label}</span>
        </span>
        {pct && <span className="swms-kpi-pct">{pct}</span>}
      </span>
      <span className={`swms-kpi-figure ${t.value}`}>{value.toLocaleString()}</span>
      {hint && !pct && <span className="swms-kpi-hint">{hint}</span>}
      {hint && pct && <span className="swms-kpi-hint">{label}</span>}
      <span className="swms-kpi-bar" aria-hidden="true">
        <span style={{ width: pct ? pct.replace('%','') + '%' : '100%', background: t.bar }} />
      </span>
    </Tag>
  );
};

/** The headline garbage KPIs. */
export const GARBAGE_KPIS: Array<{
  key: 'total' | 'collected' | 'notCollected' | 'partial' | 'frequent';
  label: string;
  labelTa: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: KpiTone;
}> = [
  { key: 'total', label: 'Total Garbage', labelTa: 'மொத்த கழிவு', icon: Package, tone: 'blue' },
  { key: 'collected', label: 'Collected', labelTa: 'சேகரிக்கப்பட்டது', icon: PackageCheck, tone: 'green' },
  { key: 'notCollected', label: 'Not Collected', labelTa: 'சேகரிக்கப்படவில்லை', icon: PackageX, tone: 'rose' },
  { key: 'partial', label: 'Partially Not Collected', labelTa: 'பகுதி சேகரிக்கப்படவில்லை', icon: PackageMinus, tone: 'amber' },
  { key: 'frequent', label: 'Frequently Not Collected', labelTa: 'அடிக்கடி சேகரிக்கப்படவில்லை', icon: Repeat, tone: 'violet' },
];

export const GarbageKpiGrid: React.FC<{
  totals: AdminTotals;
  lang?: 'en' | 'ta';
  activeKey?: string | null;
  onSelect?: (key: string | null) => void;
}> = ({ totals, lang = 'en', activeKey, onSelect }) => {
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
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
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

export interface PerformanceTableRow {
  key: string;
  label: string;
  sublabel?: string;
  total: number;
  collected?: number;
  partial?: number;
  notCollected?: number;
  frequent?: number;
  performance: number;
}

const perfChip = (p: number, total: number): { cls: string; text: string } => {
  // A group with no activity is "no data", not a failing score.
  if (total === 0) return { cls: 'swms-chip swms-chip-neutral', text: 'No data' };
  if (p >= 80) return { cls: 'swms-chip swms-chip-good', text: 'Strong' };
  if (p >= 50) return { cls: 'swms-chip swms-chip-warn', text: 'Moderate' };
  if (p > 0) return { cls: 'swms-chip swms-chip-info', text: 'Low' };
  return { cls: 'swms-chip swms-chip-bad', text: 'None' };
};

/**
 * Zone-wise or vehicle-wise performance as a data table.
 *
 * This was a stack of progress bars, which read as a status widget and hid
 * the underlying counts. A table shows every figure for every row, including
 * the ones that are zero, so the numbers can be compared at a glance.
 */
export const PerformanceTable: React.FC<{
  rows: PerformanceTableRow[];
  lang?: 'en' | 'ta';
  /** Which breakdown columns to show. */
  columns?: Array<'total' | 'collected' | 'partial' | 'notCollected' | 'frequent'>;
  labelHeader?: string;
  emptyText?: string;
}> = ({
  rows, lang = 'en', columns = ['total', 'collected', 'partial', 'notCollected'],
  labelHeader, emptyText,
}) => {
  if (!rows.length) {
    return (
      <div className="py-10 text-center">
        <Layers className="w-7 h-7 text-slate-300 mx-auto mb-2" />
        <p className="swms-meta">{emptyText || (lang === 'ta' ? 'தரவு இல்லை' : 'No data yet')}</p>
      </div>
    );
  }

  const COL: Record<string, { head: string; headTa: string }> = {
    total: { head: 'Total', headTa: 'மொத்தம்' },
    collected: { head: 'Collected', headTa: 'சேகரிக்கப்பட்டது' },
    partial: { head: 'Partial', headTa: 'பகுதி' },
    notCollected: { head: 'Missed', headTa: 'விடுபட்டவை' },
    frequent: { head: 'Chronic', headTa: 'தொடர்ச்சி' },
  };

  const totals = columns.reduce<Record<string, number>>((acc, c) => {
    acc[c] = rows.reduce((n, r) => n + (Number((r as any)[c]) || 0), 0);
    return acc;
  }, {});
  const overall = totals.total ? (totals.collected / totals.total) * 100 : 0;

  return (
    <div className="swms-table-wrap">
      <table className="swms-table">
        <thead>
          <tr>
            <th>{labelHeader || (lang === 'ta' ? 'பெயர்' : 'Name')}</th>
            {columns.map(c => (
              <th key={c} className="num">{lang === 'ta' ? COL[c].headTa : COL[c].head}</th>
            ))}
            <th className="num">%</th>
            <th>{lang === 'ta' ? 'நிலை' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const chip = perfChip(r.performance, r.total);
            return (
              <tr key={r.key}>
                <td>
                  <div className="swms-row-title">{r.label}</div>
                  {r.sublabel && <div className="swms-meta">{r.sublabel}</div>}
                </td>
                {columns.map(c => {
                  const v = Number((r as any)[c]) || 0;
                  return (
                    <td key={c} className={`num ${v === 0 ? 'swms-zero' : ''}`}>
                      {v.toLocaleString()}
                    </td>
                  );
                })}
                <td className="num">
                  {r.total === 0
                    ? <span className="swms-zero">—</span>
                    : <span className={r.performance >= 50 ? 'text-emerald-700' : 'text-rose-700'}>
                        {r.performance.toFixed(1)}%
                      </span>}
                </td>
                <td><span className={chip.cls}>{chip.text}</span></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>{lang === 'ta' ? 'மொத்தம்' : 'Total'}</td>
            {columns.map(c => (
              <td key={c} className="num">{totals[c].toLocaleString()}</td>
            ))}
            <td className="num">{overall.toFixed(1)}%</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

/** Back-compat alias so existing call sites keep working. */
export const PerformanceList = PerformanceTable;

export interface VehicleTableRow extends PerformanceTableRow {
  vehicleNo: string;
  vehicleType: string;
  workerName: string;
}

/**
 * Per-vehicle table. Every vehicle the fleet has is listed, including the
 * ones with no activity, so a class like PUSH CART or BOV never silently
 * disappears from the overview.
 */
export const VehiclePerformanceTable: React.FC<{
  rows: VehicleBreakdownRow[] | GroupBreakdown[];
  lang?: 'en' | 'ta';
  emptyText?: string;
  /** Extra chip rendered in the last column, e.g. "3 chronic". */
  tierField?: 'partial' | 'frequent';
}> = ({ rows, lang = 'en', emptyText, tierField }) => (
  <PerformanceTable
    lang={lang}
    emptyText={emptyText}
    labelHeader={lang === 'ta' ? 'வாகனம்' : 'Vehicle'}
    rows={rows.map((v: any) => ({
      key: v.key,
      label: v.label || v.vehicleNo || '—',
      sublabel: [v.vehicleType, v.workerName].filter(Boolean).join(' • '),
      total: v.total,
      collected: v.collected,
      partial: v.partial,
      notCollected: v.notCollected,
      frequent: v.frequent,
      performance: v.performance,
      ...(tierField && v[tierField] ? { sublabelHint: v[tierField] } : {}),
    }))}
  />
);

export const ZonePerformanceTable: React.FC<{
  rows: GroupBreakdown[];
  lang?: 'en' | 'ta';
}> = ({ rows, lang }) => (
  <PerformanceTable
    lang={lang}
    labelHeader={lang === 'ta' ? 'மண்டலம்' : 'Zone'}
    rows={rows.map(z => ({
      key: z.key,
      label: z.label,
      sublabel: `${z.vehicles} ${lang === 'ta' ? 'வாகனங்கள்' : 'vehicles'}`,
      total: z.total,
      collected: z.collected,
      partial: z.partial,
      notCollected: z.notCollected,
      frequent: z.frequent,
      performance: z.performance,
    }))}
  />
);

/** Section wrapper so every admin page shares the same heading treatment. */
export const AdminSection: React.FC<{
  title: string;
  titleTa?: string;
  icon: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
  children: React.ReactNode;
  lang?: 'en' | 'ta';
}> = ({ title, titleTa, icon: Icon, right, children, lang = 'en' }) => (
  <section className="swms-panel">
    <div className="swms-panel-head">
      <h3 className="swms-section flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-[#1E7A38] flex-shrink-0" />
        <span>{lang === 'ta' && titleTa ? titleTa : title}</span>
      </h3>
      {right}
    </div>
    {children}
  </section>
);

export { Truck, MapPin, CheckCircle2, AlertTriangle, XCircle };
