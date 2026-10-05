import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Truck, AlertTriangle, Search, MapPin, DoorOpen, PackageMinus, CheckCircle2, XCircle,
} from 'lucide-react';
import { AdminSection, AdminKpiSquare } from './AdminKpi';
import { AdminAnalytics } from '../utils/adminAnalytics';
import { CollectionRecord, SWMSHouseholdRecord } from '../types';

interface VehicleMissViewProps {
  records: (SWMSHouseholdRecord | CollectionRecord)[];
  analytics: AdminAnalytics;
  lang?: 'en' | 'ta';
  /** 'partial' reads the partially-collected tier, 'frequent' the chronic tier. */
  tier: 'partial' | 'frequent';
  onBackToOverview?: () => void;
  onInspectRecord?: (r: CollectionRecord) => void;
}

const TONE = {
  partial: {
    title: 'Partially Not Collected',
    titleTa: 'பகுதி சேகரிக்கப்படவில்லை',
    blurb: 'Houses where some QR checkpoints were completed but the street was not finished.',
    blurbTa: 'சில QR புள்ளிகள் முடிந்தாலும் தெரு முடியாத வீடுகள்.',
    icon: PackageMinus,
    tone: 'amber' as const,
  },
  frequent: {
    title: 'Frequently Not Collected',
    titleTa: 'அடிக்கடி சேகரிக்கப்படவில்லை',
    blurb: 'Houses missed two days running or more, by vehicle.',
    blurbTa: 'தொடர்ந்து இரண்டு அல்லது அதிக நாட்கள் விடுபட்ட வீடுகள், வாகன வாரியாக.',
    icon: AlertTriangle,
    tone: 'violet' as const,
  },
};

/**
 * Vehicle-wise view of the partially and frequently missed tiers.
 *
 * Both tiers answer the same operational question — which vehicle is leaving
 * doors behind — so they share this component rather than duplicating it.
 */
export const VehicleMissView: React.FC<VehicleMissViewProps> = ({
  records, analytics, lang = 'en', tier, onBackToOverview, onInspectRecord,
}) => {
  const cfg = TONE[tier];
  const Icon = cfg.icon;
  const [query, setQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');

  const vehicleRows = useMemo(
    () => (tier === 'partial' ? analytics.partialByVehicle : analytics.frequentByVehicle),
    [analytics, tier]
  );

  /** The individual doors in this tier, for the table below the summaries. */
  const doors = useMemo(() => {
    const out: Array<{
      id: string; door: string; street: string; ward: string; zone: string;
      vehicleNo: string; vehicleType: string; worker: string; streak: number; reason: string;
    }> = [];
    for (const r of (records || [])) {
      const a = r as any;
      const cov = a.coverageStatus || a.status || '';
      if (tier === 'partial' && !/partial/i.test(cov)) continue;
      if (tier === 'frequent' && !/not\s*collected/i.test(cov)) continue;
      out.push({
        id: String(a.id),
        door: a.doorNo || a.newDoorNo || '—',
        street: a.streetName || a.street || '—',
        ward: a.ward || '—',
        zone: a.zone || '—',
        vehicleNo: a.vehicleNo || '—',
        vehicleType: a.vehicleType || '—',
        worker: a.workerName || a.driverWorkerName || '—',
        streak: a.consecutiveDaysMissed ?? 1,
        reason: a.reasonIfNotCollected || a.notCoveredReason || a.remarks || '—',
      });
    }
    return out;
  }, [records, tier]);

  const filteredDoors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doors.filter(d => {
      if (zoneFilter !== 'All' && d.zone !== zoneFilter) return false;
      if (!q) return true;
      return [d.door, d.street, d.ward, d.zone, d.vehicleNo, d.worker, d.reason]
        .some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [doors, query, zoneFilter]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    for (const d of doors) if (d.zone) set.add(d.zone);
    return ['All', ...[...set].sort()];
  }, [doors]);

  const tierTotal = tier === 'partial' ? analytics.totals.partial : analytics.totals.frequent;
  const affectedVehicles = vehicleRows.length;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Icon className="w-5 h-5 text-amber-600" />
              {lang === 'ta' ? cfg.titleTa : cfg.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {lang === 'ta' ? cfg.blurbTa : cfg.blurb}
            </p>
          </div>
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="flex-shrink-0 text-[11px] font-black text-emerald-700 hover:underline"
            >
              {lang === 'ta' ? 'அவுட்டியம்' : '← Overview'}
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          <AdminKpiSquare
            label={lang === 'ta' ? cfg.titleTa : cfg.title}
            value={tierTotal}
            icon={cfg.icon}
            tone={cfg.tone}
            
          />
          <AdminKpiSquare
            label={lang === 'ta' ? 'பாதிக்கப்பட்ட வாகனங்கள்' : 'Vehicles Affected'}
            value={affectedVehicles}
            icon={Truck}
            tone="rose"
            
          />
          <AdminKpiSquare
            label={lang === 'ta' ? 'மொத்த வீடுகள்' : 'Total Doors'}
            value={analytics.totals.total}
            icon={DoorOpen}
            tone="slate"
            
          />
        </div>
      </div>

      {/* Door detail */}
      <AdminSection
        title={`Doors in this tier (${filteredDoors.length})`}
        titleTa={`இந்த வகையின் வீடுகள் (${filteredDoors.length})`}
        icon={DoorOpen}
        lang={lang}
      >
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-2.5 sm:p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={lang === 'ta' ? 'கதவு, தெரு அல்லது வாகனம்...' : 'Search door, street, vehicle or worker...'}
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none placeholder:font-medium placeholder:text-slate-400"
              />
            </div>
            <select
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
              className="flex-shrink-0 h-[42px] px-3 rounded-xl border-2 border-slate-200 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
            >
              {zones.map(z => (
                <option key={z} value={z}>{z === 'All' ? (lang === 'ta' ? 'அனைத்தும்' : 'All Zones') : z}</option>
              ))}
            </select>
          </div>

          {filteredDoors.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
              <DoorOpen className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-500">
                {doors.length === 0
                  ? (lang === 'ta' ? 'இந்த வகையில் வீடுகள் இல்லை' : 'No doors in this tier')
                  : (lang === 'ta' ? 'பொருத்தமான வீடு இல்லை' : 'No doors match your search')}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredDoors.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: Math.min(i * 0.02, 0.15) }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-slate-300 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                      <span>Door {d.door}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate text-slate-700 font-bold">{d.street}</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-0.5 truncate">
                      {[d.zone, d.ward, d.worker].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                  <span className="flex-shrink-0 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-600 font-mono">
                    {d.vehicleNo}
                  </span>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-black ${
                    tier === 'partial'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-violet-50 border-violet-200 text-violet-700'
                  }`}>
                    {tier === 'partial' ? <AlertTriangle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                    {tier === 'partial' ? 'Partial' : `${d.streak}d`}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AdminSection>
    </div>
  );
};

/** Page for the partially-collected tier. */
export const PartiallyNotCollectedView: React.FC<
  Omit<VehicleMissViewProps, 'tier'>
> = props => <VehicleMissView {...props} tier="partial" />;

/** Page for the frequently-missed tier, vehicle-wise. */
export const FrequentlyNotCollectedVehicleView: React.FC<
  Omit<VehicleMissViewProps, 'tier'>
> = props => <VehicleMissView {...props} tier="frequent" />;
