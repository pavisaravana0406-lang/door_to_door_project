import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, CheckCircle2, XCircle, Search, RefreshCw, ChevronDown, MapPin,
  MessageSquare, Save, X as XIcon, Camera, User,
} from 'lucide-react';
import { KpiSquare } from './KpiSquare';
import {
  buildHouseholdProgress, summariseHouseholds, matchesHouseholdSearch, householdKey,
  filterToOwnRecords,
  type HouseholdProgress, type HouseholdStatus,
} from '../utils/householdProgress';
import { writeQrRemark } from '../utils/streetProgress';
import { SWMSHouseholdRecord, SWMSAssignment } from '../types';

interface WorkerHouseholdDashboardProps {
  dashboard: { streets?: any[] } | null;
  records: SWMSHouseholdRecord[];
  assignment: SWMSAssignment | null;
  lang: 'en' | 'ta';
  loading?: boolean;
  onOpenScanner: () => void;
  onRefresh?: () => void;
}

const STATUS_STYLE: Record<HouseholdStatus, { chip: string; dot: string; text: string }> = {
  collected: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', text: 'Collected' },
  not_collected: { chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', text: 'Not Collected' },
};

/**
 * Dashboard for BOV and push cart workers.
 *
 * These vehicles collect door to door, so the unit of work is the household:
 * total households, collected and not collected, followed by a search bar and
 * the history of doors worked.
 */
export const WorkerHouseholdDashboard: React.FC<WorkerHouseholdDashboardProps> = ({
  records,
  assignment,
  lang = 'en',
  loading,
  onOpenScanner,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | HouseholdStatus>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bump, setBump] = useState(0);
  const [editing, setEditing] = useState<{ row: HouseholdProgress; draft: string } | null>(null);

  useEffect(() => { setBump(b => b + 1); }, [records]);

  // Only this worker's doors, never another worker's.
  const myRecords = useMemo(
    () => filterToOwnRecords(records || [], assignment),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, assignment, bump]
  );

  const allRows = useMemo(
    () => buildHouseholdProgress(myRecords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myRecords, bump]
  );

  const summary = useMemo(() => summariseHouseholds(allRows), [allRows]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRows) if (r.zone) set.add(r.zone);
    return ['All', ...[...set].sort()];
  }, [allRows]);
  const [zoneFilter, setZoneFilter] = useState('All');

  const filtered = useMemo(() => {
    return allRows.filter(r => {
      if (zoneFilter !== 'All' && r.zone !== zoneFilter) return false;
      if (filter !== 'all' && r.status !== filter) return false;
      return matchesHouseholdSearch(r, query);
    });
  }, [allRows, query, filter, zoneFilter]);

  const vehicleLabel = assignment?.vehicleType
    || (assignment?.isPushcart ? 'PUSH CART' : 'BOV');

  /** Tapping a KPI filters the list below AND auto-scrolls to its details. */
  const historyRef = useRef<HTMLDivElement>(null);
  const scrollToDetails = () => {
    window.setTimeout(() => {
      historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── FLOATING SCAN QR ── */}
      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <motion.button
          type="button"
          onClick={onOpenScanner}
          whileTap={{ scale: 0.95 }}
          aria-label={lang === 'ta' ? 'QR ஸ்கேன் செய்' : 'Scan QR'}
          className="pointer-events-auto h-12 sm:h-14 px-4 sm:px-6 rounded-full
            bg-gradient-to-r from-[#00875A] to-[#00704A] hover:from-[#00704A] hover:to-[#005c3e]
            text-white font-black text-xs sm:text-sm tracking-wide uppercase
            border-2 border-emerald-400/40 flex items-center justify-center gap-2 transition-colors"
          style={{ boxShadow: '0 10px 28px -6px rgba(0,135,90,0.65)' }}
        >
          <ScanIcon />
          <span>{lang === 'ta' ? 'QR ஸ்கேன்' : 'SCAN QR'}</span>
        </motion.button>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <KpiSquare
          label={lang === 'ta' ? 'மொத்த வீடுகள்' : 'Total Households'}
          value={summary.totalHouseholds}
          icon={Home}
          gicon="home"
          tone="blue"
          lang={lang}
          onClick={() => { setFilter('all'); scrollToDetails(); }}
          active={filter === 'all'}
        />
        <KpiSquare
          label={lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
          value={summary.collectedHouseholds}
          icon={CheckCircle2}
          gicon="check_circle"
          tone="green"
          hint={`${summary.collectedPercent}%`}
          lang={lang}
          onClick={() => { setFilter(filter === 'collected' ? 'all' : 'collected'); scrollToDetails(); }}
          active={filter === 'collected'}
        />
        <KpiSquare
          label={lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}
          value={summary.notCollectedHouseholds}
          icon={XCircle}
          gicon="cancel"
          tone="rose"
          lang={lang}
          onClick={() => { setFilter(filter === 'not_collected' ? 'all' : 'not_collected'); scrollToDetails(); }}
          active={filter === 'not_collected'}
        />
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-2.5 sm:p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={lang === 'ta'
                ? 'வீடு எண், பெயர் அல்லது தெரு தேடுங்கள்...'
                : 'Search door no, name or street...'}
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition placeholder:font-medium placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(s => !s)}
            className={`flex-shrink-0 h-[42px] px-3 rounded-xl border-2 flex items-center gap-1.5 transition active:scale-95 ${showFilters || zoneFilter !== 'All'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
            title={lang === 'ta' ? 'வடிகட்டு' : 'Filters'}
          >
            <MapPin className="w-4 h-4" />
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex-shrink-0 h-[42px] w-[42px] rounded-xl border-2 border-slate-200 text-slate-500 hover:border-slate-300 flex items-center justify-center transition active:scale-95"
              title={lang === 'ta' ? 'புதுப்பி' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <select
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border-2 border-slate-200 focus:border-emerald-500 outline-none bg-white"
            >
              {zones.map(z => (
                <option key={z} value={z}>{z === 'All' ? (lang === 'ta' ? 'அனைத்து மண்டலங்கள்' : 'All Zones') : z}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'collected', 'not_collected'] as const).map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(filter === k ? 'all' : k)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] sm:text-[11px] font-black transition active:scale-95 ${
                    filter === k
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {k === 'all' ? <Home className="w-3.5 h-3.5" /> : k === 'collected' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {lang === 'ta'
                    ? (k === 'all' ? 'அனைத்தும்' : k === 'collected' ? 'சேகரிக்கப்பட்டது' : 'சேகரிக்கப்படவில்லை')
                    : (k === 'all' ? 'All' : k === 'collected' ? 'Collected' : 'Not Collected')}
                </button>
              ))}
            </div>
          </div>
        )}

        {(query || filter !== 'all' || zoneFilter !== 'All') && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">
              {lang === 'ta'
                ? `${filtered.length} வீடுகள் காட்டப்படுகின்றன`
                : `${filtered.length} of ${allRows.length} households shown`}
            </span>
            <button
              type="button"
              onClick={() => { setQuery(''); setFilter('all'); setZoneFilter('All'); }}
              className="text-[10px] sm:text-[11px] font-black text-emerald-700 hover:underline"
            >
              {lang === 'ta' ? 'அழி' : 'Clear'}
            </button>
          </div>
        )}
      </div>

      {/* ── HISTORY ── */}
      <div ref={historyRef} className="space-y-2.5 scroll-mt-24">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-700" />
            {lang === 'ta' ? 'சமீபத்திய வீடுகள்' : 'Recent Households'}
          </h3>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">
            {lang === 'ta'
              ? 'வீட்டைத் தட்டச்சு செய்து குறிப்பு சேர்க்கலாம்'
              : 'Tap a missed door to add a remark'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
            <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              {allRows.length === 0
                ? (lang === 'ta' ? 'இன்னும் வீடு இல்லை' : 'No households yet — scan a QR to start')
                : (lang === 'ta' ? 'பொருத்தமான வீடு இல்லை' : 'No households match your search')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((row, i) => {
              const style = STATUS_STYLE[row.status];
              const isEditing = editing?.row.id === row.id;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                  className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span className="truncate">Door {row.doorNo}</span>
                        <span className="text-slate-400 font-bold">•</span>
                        <span className="truncate text-slate-600 font-bold">{row.householderName}</span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5 truncate">
                        {[row.streetName, row.zone, row.ward].filter(Boolean).join(' • ')}
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black flex-shrink-0 ${style.chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {style.text}
                    </span>

                    {row.status === 'not_collected' && (
                      <button
                        type="button"
                        onClick={() => setEditing(isEditing ? null : { row, draft: row.remark || '' })}
                        className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition active:scale-95 ${
                          row.remark
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                        title={row.remark
                          ? (lang === 'ta' ? 'குறிப்பை மாற்று' : 'Edit remark')
                          : (lang === 'ta' ? 'குறிப்பு சேர்க்க' : 'Add remark')}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Reason / photos / remark detail */}
                  <AnimatePresence initial={false}>
                    {(isEditing || row.reason || row.remark || row.submittedAt) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="border-t border-slate-100 overflow-hidden"
                      >
                        <div className="p-3 sm:p-3.5 bg-slate-50/60 space-y-2">
                          {row.reason && !isEditing && (
                            <div className="flex items-start gap-2 text-[10px] sm:text-[11px] font-bold text-rose-700">
                              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <span className="break-words">
                                <span className="font-black">Reason:</span> {row.reason}
                              </span>
                            </div>
                          )}

                          {row.hasPhotos && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                              <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                              {lang === 'ta' ? 'முன் & பிறகு படங்கள்' : 'Before & after photos'}
                            </div>
                          )}

                          {row.submittedAt && (
                            <div className="text-[10px] font-bold text-slate-400 font-mono">{row.submittedAt}</div>
                          )}

                          {row.remark && !isEditing && (
                            <div className="flex items-start gap-2 text-[10px] sm:text-[11px] font-bold text-slate-700">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span className="break-words"><span className="font-black text-amber-700">Remark:</span> {row.remark}</span>
                            </div>
                          )}

                          {isEditing && (
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  autoFocus
                                  value={editing.draft}
                                  onChange={e => setEditing({ row, draft: e.target.value })}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      writeQrRemark(householdKey(row.streetName, row.doorNo), 1, editing.draft);
                                      setBump(b => b + 1);
                                      setEditing(null);
                                    }
                                    if (e.key === 'Escape') setEditing(null);
                                  }}
                                  placeholder={lang === 'ta' ? 'காரணம்...' : 'Why was this door missed?'}
                                  className="w-full pl-7 pr-2 py-1.5 text-[11px] font-bold rounded-lg border border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-300 outline-none bg-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  writeQrRemark(householdKey(row.streetName, row.doorNo), 1, editing.draft);
                                  setBump(b => b + 1);
                                  setEditing(null);
                                }}
                                className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0 transition active:scale-95"
                                title={lang === 'ta' ? 'சேமி' : 'Save remark'}
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex-shrink-0 transition active:scale-95"
                                title={lang === 'ta' ? 'ரத்து' : 'Cancel'}
                              >
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/** Small QR glyph used in the floating button, matching the TATA ACE dashboard. */
const ScanIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" opacity="0.6" />
    <rect x="3" y="14" width="7" height="7" rx="1" opacity="0.6" />
    <path d="M14 14h3v3h-3zM19 19h2v2h-2zM14 20h2M20 14h1" />
  </svg>
);
