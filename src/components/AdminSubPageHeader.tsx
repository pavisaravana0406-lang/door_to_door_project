import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface AdminSubPageHeaderProps {
  icon: string;
  iconAlt: string;
  iconFallback?: string;
  title: string;
  titleTa?: string;
  lang?: 'en' | 'ta';
  /** Count block on the right, e.g. "Collected Count". */
  statLabel: string;
  statValue: number;
  statSuffix: string;
  tone: 'green' | 'rose' | 'amber';
  onBack?: () => void;
  /** Cross-navigation button, e.g. "View Not Collected". */
  navLabel?: string;
  navTone?: 'rose' | 'green' | 'amber';
  onNav?: () => void;
}

const TONE = {
  green: {
    border: 'border-emerald-200/90',
    imgBorder: 'border-emerald-500/60',
    statBg: 'bg-emerald-50 border-emerald-200',
    statIcon: 'text-[#1E7A38]',
    statText: 'text-[#0f5c2e]',
    chipBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  rose: {
    border: 'border-rose-200/90',
    imgBorder: 'border-rose-600/60',
    statBg: 'bg-rose-50 border-rose-200',
    statIcon: 'text-[#C5221F]',
    statText: 'text-[#C5221F]',
    chipBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  amber: {
    border: 'border-amber-200/90',
    imgBorder: 'border-amber-500/60',
    statBg: 'bg-amber-50 border-amber-200',
    statIcon: 'text-amber-600',
    statText: 'text-amber-700',
    chipBg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
};

const StatIcon: React.FC<{ tone: 'green' | 'rose' | 'amber' }> = ({ tone }) => {
  if (tone === 'rose') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="w-6 h-6">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * Shared header for the collected / not-collected / missed sub-pages.
 *
 * They previously each carried their own copy of the banner, which drifted
 * apart and left the back link crammed against the title on narrow screens.
 * This stacks the breadcrumb, then the identity, then the stat row.
 */
export const AdminSubPageHeader: React.FC<AdminSubPageHeaderProps> = ({
  icon, iconAlt, iconFallback, title, titleTa, lang = 'en',
  statLabel, statValue, statSuffix, tone, onBack,
  navLabel, onNav,
}) => {
  const t = TONE[tone];

  return (
    <div className={`bg-white rounded-2xl border ${t.border} shadow-sm overflow-hidden`}>
      {/* Breadcrumb row — full width, so it never collides with the title */}
      {onBack && (
        <div className="px-4 sm:px-5 pt-3.5 pb-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-500 hover:text-[#1E7A38] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {lang === 'ta' ? 'டாஷ்போர்டிற்குத் திரும்பு' : 'Back to Dashboard'}
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="hidden sm:inline opacity-60">
              {lang === 'ta' ? titleTa || title : title}
            </span>
          </button>
        </div>
      )}

      <div className="px-4 sm:px-5 pb-4 pt-3 space-y-3.5">
        {/* Identity row */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 ${t.imgBorder} bg-white p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center`}>
            <img
              src={icon}
              alt={iconAlt}
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (iconFallback && e.currentTarget.src !== iconFallback) {
                  e.currentTarget.src = iconFallback;
                }
              }}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-900 min-w-0 break-words">
            {lang === 'ta' && titleTa ? titleTa : title}
          </h1>
        </div>

        {/* Stat row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`${t.statBg} border px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5`}>
            <span className={t.statIcon}><StatIcon tone={tone} /></span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 leading-none">
                {statLabel}
              </div>
              <div className={`text-xl sm:text-2xl font-black leading-tight ${t.statText}`}>
                {statValue.toLocaleString()}{' '}
                <span className="text-[11px] font-normal text-slate-500">{statSuffix}</span>
              </div>
            </div>
          </div>

          {navLabel && onNav && (
            <button
              type="button"
              onClick={onNav}
              className={`${t.chipBg} text-[11px] sm:text-xs font-bold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap`}
            >
              {navLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
