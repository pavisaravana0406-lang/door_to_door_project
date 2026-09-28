import React from 'react';
import { TrendingUp, ArrowRight, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { KPIMetrics } from '../types';
import { 
  TotalHouseholdsLogo,
  CollectedTruckLogo,
  NotCollectedDustbinLogo
} from './icons/KpiLogos';
import { 
  frequentlyNotCollectedIcon, 
  frequentlyNotCollectedFallbackIcon 
} from '../constants/branding';
import { AnimatedCounter } from './AnimatedCounter';

interface KPICardsProps {
  metrics: KPIMetrics;
  lang?: 'en' | 'ta';
  onNavigateToLiveTracking?: () => void;
  onNavigateToCollected?: () => void;
  onNavigateToCovered?: () => void;
  onNavigateToNotCovered?: () => void;
  onNavigateToFrequentlyNotCovered?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ 
  metrics, 
  lang = 'en',
  onNavigateToLiveTracking,
  onNavigateToCollected,
  onNavigateToCovered,
  onNavigateToNotCovered,
  onNavigateToFrequentlyNotCovered,
}) => {
  const total = metrics.totalCollectedToday || metrics.totalLocationsCount || 0;
  const coveredPercent = total > 0 ? ((metrics.totalCoveredCount / total) * 100).toFixed(1) : '0%';
  const notCoveredPercent = total > 0 ? ((metrics.totalNotCoveredCount / total) * 100).toFixed(1) : '0%';
  const frequentlyCount = metrics.frequentlyNotCoveredCount ?? 0;
  const frequentlyPercent = total > 0 ? (((frequentlyCount) / total) * 100).toFixed(1) : '0%';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* 1. BLUE accent — Total Households (soft blue tinted card) */}
      <div 
        onClick={onNavigateToCollected || onNavigateToLiveTracking}
        title={lang === 'ta' ? 'மொத்த குப்பை சேகரிப்பு விவரங்கள் மற்றும் ஜிபிஎஸ் வரைபடம் காண்க' : 'Click to view Total Waste Collection Details & GPS Map'}
        className="dash-card dash-card-accent-blue animate-dash-enter p-5 h-full cursor-pointer group relative overflow-hidden select-none bg-[#f5f9ff]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-blue-300 bg-white p-1.5 flex-shrink-0 flex items-center justify-center transition-colors duration-250 group-hover:border-blue-500 group-hover:bg-blue-100">
            <TotalHouseholdsLogo className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] sm:text-base font-extrabold text-blue-950 flex items-center justify-between gap-2">
              <span className="truncate">{lang === 'ta' ? 'மொத்த வீடுகள்' : 'Total Households'}</span>
              <span className="dash-badge dash-badge-blue flex-shrink-0">
                {lang === 'ta' ? 'அனைத்தும்' : 'All'}
              </span>
            </div>
            <div className="text-5xl sm:text-[52px] font-black text-slate-900 tracking-tight my-2 font-num leading-none">
              <AnimatedCounter value={metrics.totalCollectedToday} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1 text-sm font-bold text-slate-700 min-w-0">
                <TrendingUp className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 transition-colors duration-250 group-hover:text-blue-800" />
                <span className="truncate">{lang === 'ta' ? 'பதிவு செய்யப்பட்டவை' : 'Registered'}</span>
              </div>
              <span className="text-xs text-blue-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'விவரங்கள்' : 'View details'} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GREEN accent — Household Collected (white card, soft green) */}
      <div 
        onClick={onNavigateToCovered || onNavigateToCollected}
        title={lang === 'ta' ? 'சேகரிக்கப்பட்ட வீடுகளின் விவரங்கள் காண்க' : 'Click to view Total Household Collected Details & Cleared Locations'}
        className="dash-card dash-card-accent-green animate-dash-enter p-5 h-full cursor-pointer group relative overflow-hidden select-none bg-[#f4faf5]"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-emerald-200 bg-[#e9f5ed] p-1.5 flex-shrink-0 flex items-center justify-center transition-colors duration-250 group-hover:border-emerald-500 group-hover:bg-emerald-100">
            <CollectedTruckLogo className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] sm:text-base font-extrabold text-slate-900 flex items-center justify-between gap-2">
              <span className="truncate">{lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}</span>
              <span className="dash-badge dash-badge-green flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" /> {typeof coveredPercent === 'string' && coveredPercent.includes('%') ? coveredPercent : `${coveredPercent}%`}
              </span>
            </div>
            <div className="text-5xl sm:text-[52px] font-black text-slate-900 tracking-tight my-2 font-num leading-none">
              <AnimatedCounter value={metrics.totalCoveredCount} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-bold text-slate-700 truncate">{lang === 'ta' ? 'சேகரிப்பு முடிவு' : 'Serviced doors'}</span>
              <span className="text-xs text-emerald-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'View collected'} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AMBER accent — Household Not Collected (white card, soft amber) */}
      <div 
        onClick={onNavigateToNotCovered}
        title={lang === 'ta' ? 'விடுபட்ட வீடுகளின் அறிக்கைகள் காண்க' : 'Click to view Total Household Not Collected Reports & Missed Locations'}
        className="dash-card dash-card-accent-amber animate-dash-enter p-5 h-full cursor-pointer group relative overflow-hidden select-none bg-[#fffaef]"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-amber-200 bg-[#fef3e2] p-1.5 flex-shrink-0 flex items-center justify-center transition-colors duration-250 group-hover:border-amber-500 group-hover:bg-amber-100">
            <NotCollectedDustbinLogo className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] sm:text-base font-extrabold text-slate-900 flex items-center justify-between gap-2">
              <span className="truncate">{lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}</span>
              <span className="dash-badge dash-badge-amber flex-shrink-0">
                <AlertTriangle className="w-3 h-3" /> {typeof notCoveredPercent === 'string' && notCoveredPercent.includes('%') ? notCoveredPercent : `${notCoveredPercent}%`}
              </span>
            </div>
            <div className="text-5xl sm:text-[52px] font-black text-slate-900 tracking-tight my-2 font-num leading-none">
              <AnimatedCounter value={metrics.totalNotCoveredCount} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-bold text-slate-700 truncate">{lang === 'ta' ? 'மீண்டும் செல்ல வேண்டும்' : 'Requires re-visit'}</span>
              <span className="text-xs text-amber-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'அறிக்கைகள்' : 'View reports'} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RED accent — Frequently Not Collected (white card, soft red) */}
      <div 
        onClick={onNavigateToFrequentlyNotCovered}
        title={lang === 'ta' ? 'அடிக்கடி சேகரிக்கப்படாத வீடுகள் விவரங்கள் காண்க' : 'Click to view Frequently Not Collected Household Intelligence'}
        className="dash-card dash-card-accent-red animate-dash-enter p-5 h-full cursor-pointer group relative overflow-hidden select-none bg-[#fef5f4]"
        style={{ animationDelay: '180ms' }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-red-200 bg-[#fdecea] p-1.5 flex-shrink-0 flex items-center justify-center transition-colors duration-250 group-hover:border-red-400 group-hover:bg-red-100">
            <img
              src={frequentlyNotCollectedIcon}
              alt="Frequently Not Collected Household"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== frequentlyNotCollectedFallbackIcon) {
                  e.currentTarget.src = frequentlyNotCollectedFallbackIcon;
                }
              }}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] sm:text-base font-extrabold text-slate-900 flex items-center justify-between gap-2">
              <span className="truncate">{lang === 'ta' ? 'அடிக்கடி விடுபட்ட வீடுகள்' : 'Frequently Missed'}</span>
              <span className="dash-badge dash-badge-red flex-shrink-0">
                <AlertOctagon className="w-3 h-3" /> {typeof frequentlyPercent === 'string' && frequentlyPercent.includes('%') ? frequentlyPercent : `${frequentlyPercent}%`}
              </span>
            </div>
            <div className="text-5xl sm:text-[52px] font-black text-slate-900 tracking-tight my-2 font-num leading-none flex items-baseline gap-1.5">
              <AnimatedCounter value={frequentlyCount} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-bold text-slate-700 truncate">{lang === 'ta' ? 'பூட்டப்பட்டது & விடுபட்டவை' : 'Locked houses'}</span>
              <span className="text-xs text-red-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'வீட்டு வாரியான பார்வை' : 'Household view'} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};


