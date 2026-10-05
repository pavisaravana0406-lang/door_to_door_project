import React from 'react';
import { KPIMetrics } from '../types';
import { GIcon } from './icons/GIcon';
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 text-blue-700 flex-shrink-0 flex items-center justify-center">
            <GIcon name="other_houses" size={34} filled />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] sm:text-sm font-extrabold text-blue-950 flex items-center justify-between gap-2">
              <span>{lang === 'ta' ? 'மொத்த வீடுகள்' : 'Total Households'}</span>
              <span className="dash-badge dash-badge-blue flex-shrink-0">
                {lang === 'ta' ? 'அனைத்தும்' : 'All'}
              </span>
            </div>
            <div className="text-[30px] sm:text-[34px] font-bold text-slate-900 tracking-tight my-2 font-num leading-none">
              <AnimatedCounter value={metrics.totalCollectedToday} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] text-blue-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'விவரங்கள்' : 'View details'} <GIcon name="arrow_forward" size={14} />
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex-shrink-0 flex items-center justify-center">
            <GIcon name="check_circle" size={34} filled />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 flex items-center justify-between gap-2">
              <span>{lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}</span>
              <span className="dash-badge dash-badge-green flex-shrink-0">
                <GIcon name="check_circle" size={14} /> {typeof coveredPercent === 'string' && coveredPercent.includes('%') ? coveredPercent : `${coveredPercent}%`}
              </span>
            </div>
            <div className="text-[30px] sm:text-[34px] font-bold text-slate-900 tracking-tight my-2 font-num leading-none">
              <AnimatedCounter value={metrics.totalCoveredCount} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'View collected'} <GIcon name="arrow_forward" size={14} />
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 text-amber-600 flex-shrink-0 flex items-center justify-center">
            <GIcon name="cancel" size={34} filled />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 flex items-center justify-between gap-2">
              <span>{lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}</span>
              <span className="dash-badge dash-badge-amber flex-shrink-0">
                <GIcon name="warning" size={14} /> {typeof notCoveredPercent === 'string' && notCoveredPercent.includes('%') ? notCoveredPercent : `${notCoveredPercent}%`}
              </span>
            </div>
            <div className="text-[30px] sm:text-[34px] font-bold text-slate-900 tracking-tight my-2 font-num leading-none">
              <AnimatedCounter value={metrics.totalNotCoveredCount} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] text-amber-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'அறிக்கைகள்' : 'View reports'} <GIcon name="arrow_forward" size={14} />
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-100 text-rose-500 flex-shrink-0 flex items-center justify-center">
            <GIcon name="repeat" size={34} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 flex items-center justify-between gap-2">
              <span>{lang === 'ta' ? 'அடிக்கடி விடுபட்ட வீடுகள்' : 'Frequently Missed'}</span>
              <span className="dash-badge dash-badge-red flex-shrink-0">
                <GIcon name="error" size={14} /> {typeof frequentlyPercent === 'string' && frequentlyPercent.includes('%') ? frequentlyPercent : `${frequentlyPercent}%`}
              </span>
            </div>
            <div className="text-[30px] sm:text-[34px] font-bold text-slate-900 tracking-tight my-2 font-num leading-none flex items-baseline gap-1.5">
              <AnimatedCounter value={frequentlyCount} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] text-red-800 font-bold flex items-center gap-0.5 flex-shrink-0">
                {lang === 'ta' ? 'வீட்டு வாரியான பார்வை' : 'Household view'} <GIcon name="arrow_forward" size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};


