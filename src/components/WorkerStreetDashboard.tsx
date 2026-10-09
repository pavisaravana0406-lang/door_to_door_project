import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Layers, CheckCircle2, AlertTriangle, XCircle, Search, QrCode, Truck, UserCheck,
  RefreshCw, ChevronDown, Building2, MapPin, MapPinned,
} from 'lucide-react';
import { KpiSquare } from './KpiSquare';
import { StreetHistoryRow } from './StreetHistoryRow';
import {
  buildStreetProgress, summariseStreets, matchesSearch, isSingleScanVehicleType,
  totalCheckpointsFor, STATUS_LABEL,
} from '../utils/streetProgress';
import { StreetDashboard, SWMSHouseholdRecord, SWMSAssignment } from '../types';

export type WorkerDashboardMode = 'tata_ace' | 'cart';

interface WorkerStreetDashboardProps {
  mode: WorkerDashboardMode;
  dashboard: { streets?: StreetDashboard[] } | null;
  records: SWMSHouseholdRecord[];
  assignment: SWMSAssignment | null;
  lang: 'en' | 'ta';
  loading?: boolean;
  onOpenScanner: () => void;
  onRefresh?: () => void;
}

const FILTERS = [
  { key: 'all', label: 'All', labelTa: 'அனைத்தும்', icon: Layers },
  { key: 'covered', label: 'Collected', labelTa: 'சேகரிக்கப்பட்டது', icon: CheckCircle2 },
  { key: 'partial', label: 'Partially Collected', labelTa: 'பகுதி சேகரிப்பு', icon: AlertTriangle },
  { key: 'not_collected', label: 'Not Collected', labelTa: 'சேகரிக்கப்படவில்லை', icon: XCircle },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

/**
 * Vehicle-type specific worker dashboard.
 *
 * TATA ACE works street by street across 5 QR checkpoints, so it gets the
 * street-count KPIs and the expandable per-QR history. BOV and push cart work
 * a single QR, so their dashboard is a household/door view instead.
 */
export const WorkerStreetDashboard: React.FC<WorkerStreetDashboardProps> = ({
  mode,
  dashboard,
  records,
  assignment,
  lang = 'en',
  loading,
  onOpenScanner,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [bump, setBump] = useState(0);

  // Re-read localStorage when the parent refreshes or a scan is saved.
  useEffect(() => { setBump(b => b + 1); }, [dashboard, records]);

  const isCart = mode === 'cart';
  const vehicleType = assignment?.vehicleType || (isCart ? 'PUSH CART' : 'TATA ACE');
  const totalCheckpoints = totalCheckpointsFor(vehicleType);

  const allRows = useMemo(
    () => buildStreetProgress(dashboard?.streets ?? [], records, vehicleType),
    // bump forces a re-read of the live scan state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dashboard, records, vehicleType, bump]
  );

  const summary = useMemo(() => summariseStreets(allRows), [allRows]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRows) if (r.zone) set.add(r.zone);
    return ['All', ...[...set].sort()];
  }, [allRows]);

  const filtered = useMemo(() => {
    return allRows.filter(r => {
      if (zoneFilter !== 'All' && r.zone !== zoneFilter) return false;
      if (filter !== 'all' && r.status !== filter) return false;
      return matchesSearch(r, query);
    });
  }, [allRows, query, filter, zoneFilter]);

  const houses = isCart ? (records?.length ?? 0) : summary.totalStreets;

  /** Tapping a KPI filters the list below AND auto-scrolls to its details. */
  const historyRef = useRef<HTMLDivElement>(null);
  const scrollToDetails = () => {
    window.setTimeout(() => {
      historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── FLOATING SCAN QR — fixed to the bottom of the viewport ── */}
      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <motion.button
          type="button"
          onClick={onOpenScanner}
          whileTap={{ scale: 0.95 }}
          aria-label={lang === 'ta' ? 'QR ஸ்கேன் செய்' : 'Scan QR'}
          title={lang === 'ta' ? 'QR ஸ்கேன் செய்' : 'Scan QR'}
          className="pointer-events-auto h-12 sm:h-14 px-4 sm:px-6 rounded-full
            bg-gradient-to-r from-[#00875A] to-[#00704A] hover:from-[#00704A] hover:to-[#005c3e]
            text-white font-black text-xs sm:text-sm tracking-wide uppercase
            border-2 border-emerald-400/40 flex items-center justify-center gap-2
            transition-colors"
          style={{ boxShadow: '0 10px 28px -6px rgba(0,135,90,0.65)' }}
        >
          <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>{lang === 'ta' ? 'QR ஸ்கேன்' : 'SCAN QR'}</span>
        </motion.button>
      </div>

      {/* ── KPI SQUARES ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiSquare
          label={isCart
            ? (lang === 'ta' ? 'மொத்த வீடுகள்' : 'Total Houses')
            : (lang === 'ta' ? 'தெருக்கள்' : 'Total Streets')}
          value={houses}
          icon={isCart ? Building2 : MapPinned}
          gicon={isCart ? 'home' : 'location_on'}
          tone="blue"
          lang={lang}
          onClick={() => { setFilter('all'); scrollToDetails(); }}
          active={filter === 'all'}
        />

        <KpiSquare
          label={lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
          value={isCart ? allRows.filter(r => r.status === 'covered').length : summary.collectedStreets}
          icon={CheckCircle2}
          gicon="check_circle"
          tone="green"
          hint={`${totalCheckpoints}/${totalCheckpoints}`}
          lang={lang}
          onClick={() => { setFilter(filter === 'covered' ? 'all' : 'covered'); scrollToDetails(); }}
          active={filter === 'covered'}
        />

        <KpiSquare
          label={lang === 'ta' ? 'பகுதி சேகரிப்பு' : 'Partially'}
          value={summary.partialStreets}
          icon={AlertTriangle}
          gicon="warning"
          tone="amber"
          hint={totalCheckpoints > 1 ? '3-4/5' : ''}
          lang={lang}
          onClick={() => { setFilter(filter === 'partial' ? 'all' : 'partial'); scrollToDetails(); }}
          active={filter === 'partial'}
        />

        <KpiSquare
          label={lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}
          value={summary.notCollectedStreets}
          icon={XCircle}
          gicon="cancel"
          tone="rose"
          hint={totalCheckpoints > 1 ? '0-2/5' : ''}
          lang={lang}
          onClick={() => { setFilter(filter === 'not_collected' ? 'all' : 'not_collected'); scrollToDetails(); }}
          active={filter === 'not_collected'}
        />
      </div>

      {/* ── SCAN PROGRESS STRIP ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {isCart ? <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0" /> : <Truck className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
            <span className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide truncate">
              {isCart
                ? (lang === 'ta' ? 'வீடு வாரியான சேகரிப்பு' : 'Door-wise collection')
                : (lang === 'ta' ? 'தெரு வாரியான கழிவு சேகரிப்பு' : 'Street-wise garbage collection')}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-black text-slate-600">
              {vehicleType}
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-black font-num text-slate-900 flex-shrink-0">
            {summary.scannedScans}/{summary.totalScans} <span className="text-slate-400 text-[10px]">QR</span>
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
            initial={false}
            animate={{ width: `${summary.totalScans ? (summary.scannedScans / summary.totalScans) * 100 : 0}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* ── SEARCH BAR (below the KPI cards) ────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-2.5 sm:p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={lang === 'ta'
                ? 'தெரு அல்லது வார்டு பெயரை தேடுங்கள்...'
                : 'Search by street name or ward...'}
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
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(filter === f.key ? 'all' : f.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] sm:text-[11px] font-black transition active:scale-95 ${
                    filter === f.key
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  {lang === 'ta' ? f.labelTa : f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(query || filter !== 'all' || zoneFilter !== 'All') && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">
              {lang === 'ta'
                ? `${filtered.length} தெருகள் காட்டப்படுகின்றன`
                : `${filtered.length} of ${allRows.length} streets shown`}
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

      {/* ── HISTORY (recent scans) ───────────────────────────────── */}
      <div ref={historyRef} className="space-y-2.5 scroll-mt-24">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-emerald-700" />
            {lang === 'ta' ? 'சமீபத்திய ஸ்கேன்கள்' : 'Recent Scans'}
          </h3>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">
            {lang === 'ta'
              ? 'QR ஐத் தட்டச்சு செய்து குறிப்பு சேர்க்கலாம்'
              : 'Tap a red QR to add a remark'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
            <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              {allRows.length === 0
                ? (lang === 'ta' ? 'இன்னும் ஸ்கேன் இல்லை' : 'No scans yet')
                : (lang === 'ta' ? 'பொருத்தமான தெரு இல்லை' : 'No streets match your search')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((row, i) => (
              <motion.div
                key={`${row.streetId}-${row.streetName}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
              >
                <StreetHistoryRow
                  row={row}
                  lang={lang}
                  defaultOpen={i === 0 && row.points.some(p => !p.isScanned)}
                  onRemarkChange={() => setBump(b => b + 1)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500 pt-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-emerald-50 border-2 border-emerald-400 inline-flex items-center justify-center">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          </span>
          {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : STATUS_LABEL.covered}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-rose-50 border-2 border-rose-300 inline-flex items-center justify-center">
            <XCircle className="w-2.5 h-2.5 text-rose-500" />
          </span>
          {lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : STATUS_LABEL.not_collected}
        </span>
      </div>
    </div>
  );
};
