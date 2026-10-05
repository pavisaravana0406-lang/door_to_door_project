import { CollectionRecord, SWMSHouseholdRecord, ZoneName } from '../types';

/**
 * Aggregate admin analytics, computed from the real record set.
 *
 * Every admin page reads from here so the overview, the collected pages and
 * the missed pages can never disagree with each other. Nothing in this module
 * returns a hardcoded figure.
 */

export const norm = (v?: string | null): string => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Canonical zone list, so an empty zone still appears. */
export const ALL_ZONES: ZoneName[] = [
  'North Zone', 'Central Zone', 'South Zone', 'West Zone', 'East Zone',
];

const ZONE_WORDS = /NORTH|CENTRAL|SOUTH|WEST|EAST/;

/**
 * The zone each operational ward actually belongs to, as used in Neon.
 * This is NOT the contiguous 20-wards-per-zone scheme: the live data pairs
 * North/Ward 04, West/Ward 35, Central/Ward 49, South/Ward 88 and East/Ward 24.
 */
const WARD_TO_ZONE: Record<string, string> = {
  '04': 'North Zone',
  '35': 'West Zone',
  '49': 'Central Zone',
  '88': 'South Zone',
  '24': 'East Zone',
};

/** Resolve a record's zone, tolerating the spellings that arrive from Neon. */
export const zoneOf = (r: { zone?: string | null; ward?: string | null }): string => {
  const z = (r.zone || '').trim();
  if (ZONE_WORDS.test(z.toUpperCase())) {
    const word = z.toUpperCase().match(ZONE_WORDS)![0];
    return `${word[0]}${word.slice(1).toLowerCase()} Zone`;
  }
  const w = (r.ward || '').replace(/\D/g, '');
  if (w && WARD_TO_ZONE[w]) return WARD_TO_ZONE[w];
  return 'Central Zone';
};

/** Canonical vehicle class, since the same vehicle is spelled several ways. */
export type VehicleClass = 'TATA ACE' | 'BOV' | 'PUSH CART' | 'COMPACTOR' | 'OBL' | 'OTHER';

export const vehicleClassOf = (vehicleType?: string | null, vehicleNo?: string | null): VehicleClass => {
  const t = (vehicleType || '').toUpperCase();
  const v = (vehicleNo || '').toUpperCase();
  // A plate like BOV441 carries no separator, so a word-boundary test misses it.
  if (/BOV|BATTERY/.test(t) || v.includes('BOV')) return 'BOV';
  if (/PUSH|CART|PTC/.test(t) || /PUSHCART|PUSH CART|PTC/.test(v)) return 'PUSH CART';
  if (/COMPACTOR/.test(t)) return 'COMPACTOR';
  if (/\bOBL\b|PRIVATE/.test(t)) return 'OBL';
  if (/TATA|ACE|LORRY|TRUCK/.test(t) || /^TN/.test(v)) return 'TATA ACE';
  return 'OTHER';
};

export const VEHICLE_CLASSES: VehicleClass[] = ['TATA ACE', 'BOV', 'PUSH CART', 'OBL'];

/** The reason a door was missed, read from whichever field carries it. */
export const reasonOf = (r: {
  reasonIfNotCollected?: string | null;
  notCoveredReason?: string | null;
  remarks?: string | null;
}): string => (r.reasonIfNotCollected || r.notCoveredReason || r.remarks || 'Other').trim() || 'Other';

export type OutcomeKey = 'collected' | 'partial' | 'not_collected' | 'frequent';

export interface AdminTotals {
  total: number;
  collected: number;
  partial: number;
  notCollected: number;
  frequent: number;
  collectedPercent: number;
  partialPercent: number;
  notCollectedPercent: number;
  /** Streets/houses missed on 2+ consecutive days. */
  frequentPercent: number;
}

export interface GroupBreakdown {
  key: string;
  label: string;
  total: number;
  collected: number;
  partial: number;
  notCollected: number;
  frequent: number;
  /** 0..100 */
  performance: number;
  vehicles: number;
}

export interface VehicleBreakdownRow extends GroupBreakdown {
  vehicleNo: string;
  vehicleType: string;
  workerName: string;
  workers: number;
}

export interface AdminAnalytics {
  totals: AdminTotals;
  byZone: GroupBreakdown[];
  byVehicleType: GroupBreakdown[];
  byVehicle: VehicleBreakdownRow[];
  frequentByVehicle: VehicleBreakdownRow[];
  partialByVehicle: VehicleBreakdownRow[];
  frequentByZone: GroupBreakdown[];
  partialByZone: GroupBreakdown[];
}

/** Records that count as collected, partially collected or missed. */
const outcomeOf = (r: { status?: string; coverageStatus?: string }): OutcomeKey => {
  const cov = r.coverageStatus || r.status || '';
  if (/partial/i.test(cov)) return 'partial';
  if (/covered/i.test(cov) && !/not/i.test(cov)) return 'collected';
  return 'not_collected';
};

/** Consecutive missed days, injected by the caller so the streaks are shared. */
export type StreakLookup = (r: SWMSHouseholdRecord | CollectionRecord) => number;

const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

const empty = (key: string, label: string): GroupBreakdown => ({
  key, label, total: 0, collected: 0, partial: 0, notCollected: 0, frequent: 0, performance: 0, vehicles: 0,
});

const bump = (g: GroupBreakdown, outcome: OutcomeKey, streak: number, frequent: boolean): void => {
  g.total++;
  if (outcome === 'collected') g.collected++;
  else if (outcome === 'partial') g.partial++;
  else g.notCollected++;
  if (frequent) g.frequent++;
};

const finish = (g: GroupBreakdown): GroupBreakdown => ({
  ...g,
  performance: pct(g.collected, g.total),
});

export const buildAdminAnalytics = (
  records: (SWMSHouseholdRecord | CollectionRecord)[],
  streakOf: StreakLookup = () => 1,
): AdminAnalytics => {
  const rows = records || [];

  const zoneMap = new Map<string, GroupBreakdown>();
  for (const z of ALL_ZONES) zoneMap.set(z, empty(z, z));
  const typeMap = new Map<string, GroupBreakdown>();
  for (const t of [...VEHICLE_CLASSES, 'OTHER' as VehicleClass]) typeMap.set(t, empty(t, t));

  const vehMap = new Map<string, VehicleBreakdownRow>();
  const partialType = new Map<string, GroupBreakdown>();
  const frequentType = new Map<string, GroupBreakdown>();
  const partialZone = new Map<string, GroupBreakdown>();
  const frequentZone = new Map<string, GroupBreakdown>();

  const totals = empty('total', 'Total');

  for (const r of rows) {
    const anyR = r as any;
    const zone = zoneOf(anyR);
    const vType = (anyR.vehicleType || '') as string;
    const vNo = norm(anyR.vehicleNo) || 'UNKNOWN';
    const vc = vehicleClassOf(vType, anyR.vehicleNo);
    const worker = anyR.workerName || anyR.driverWorkerName || 'Unassigned';
    const outcome = outcomeOf(anyR);
    const streak = streakOf(r) || 1;
    // Missed two days running or more: the chronic tier.
    const frequent = outcome === 'not_collected' && streak >= 2;

    const zg = zoneMap.get(zone) || (zoneMap.set(zone, empty(zone, zone)), zoneMap.get(zone)!);
    const tg = typeMap.get(vc) || (typeMap.set(vc, empty(vc, vc)), typeMap.get(vc)!);

    bump(totals, outcome, streak, frequent);
    bump(zg, outcome, streak, frequent);
    bump(tg, outcome, streak, frequent);

    if (!(zg as any).vehicleSet) (zg as any).vehicleSet = new Set<string>();
    (zg as any).vehicleSet.add(vNo);
    if (!(tg as any).vehicleSet) (tg as any).vehicleSet = new Set<string>();
    (tg as any).vehicleSet.add(vNo);

    // Vehicle-level rows
    const vKey = `${vc}|${vNo}`;
    if (!vehMap.has(vKey)) {
      vehMap.set(vKey, {
        key: vKey, label: vNo, vehicleNo: vNo, vehicleType: vType || vc,
        workerName: worker, workers: 0, total: 0, collected: 0, partial: 0,
        notCollected: 0, frequent: 0, performance: 0, vehicles: 1,
        workerSet: new Set<string>(),
      } as any);
    }
    const vg = vehMap.get(vKey)!;
    bump(vg, outcome, streak, frequent);
    ((vg as any).workerSet as Set<string>).add(worker);
    vg.workerName = ((vg as any).workerSet as Set<string>).size === 1 ? worker : `${(vg as any).workerSet.size} workers`;

    if (outcome === 'partial') {
      if (!partialType.has(vc)) partialType.set(vc, empty(vc, vc));
      bump(partialType.get(vc)!, outcome, streak, false);
      if (!partialZone.has(zone)) partialZone.set(zone, empty(zone, zone));
      bump(partialZone.get(zone)!, outcome, streak, false);
    }
    if (frequent) {
      if (!frequentType.has(vc)) frequentType.set(vc, empty(vc, vc));
      bump(frequentType.get(vc)!, outcome, streak, true);
      if (!frequentZone.has(zone)) frequentZone.set(zone, empty(zone, zone));
      bump(frequentZone.get(zone)!, outcome, streak, true);
    }
  }

  // Freeze the vehicle counts collected in Sets above.
  for (const g of [...zoneMap.values(), ...typeMap.values()]) {
    const s = (g as any).vehicleSet as Set<string> | undefined;
    g.vehicles = s ? s.size : 0;
    delete (g as any).vehicleSet;
  }
  for (const v of vehMap.values()) {
    v.workers = ((v as any).workerSet as Set<string>).size;
    delete (v as any).workerSet;
  }

  const byVehicle: VehicleBreakdownRow[] = [...vehMap.values()]
    // Dashboards track only the 3 door-to-door fleet classes — OBL / OTHER
    // records still count in the headline totals, never as table rows.
    .filter(v => (VEHICLE_CLASSES as string[]).includes(v.key.split('|')[0]))
    .map(v => finish(v) as VehicleBreakdownRow)
    .sort((a, b) => b.total - a.total);
  const sortBy = (m: Map<string, GroupBreakdown>): GroupBreakdown[] =>
    ALL_ZONES.filter(z => m.has(z)).map(z => finish(m.get(z)!));

  return {
    totals: {
      total: totals.total,
      collected: totals.collected,
      partial: totals.partial,
      notCollected: totals.notCollected,
      frequent: totals.frequent,
      collectedPercent: pct(totals.collected, totals.total),
      partialPercent: pct(totals.partial, totals.total),
      notCollectedPercent: pct(totals.notCollected, totals.total),
      frequentPercent: pct(totals.frequent, totals.total),
    },
    byZone: ALL_ZONES.map(z => finish(zoneMap.get(z)!)),
    /**
     * Only the 3 door-to-door fleet classes are listed — OBL / OTHER never
     * get rows (they still count in the headline totals above).
     */
    byVehicleType: [...VEHICLE_CLASSES]
      .map(t => typeMap.get(t)!)
      .map(finish),
    byVehicle,
    frequentByVehicle: byVehicle.filter(v => v.frequent > 0).sort((a, b) => b.frequent - a.frequent),
    partialByVehicle: byVehicle.filter(v => v.partial > 0).sort((a, b) => b.partial - a.partial),
    frequentByZone: sortBy(frequentZone),
    partialByZone: sortBy(partialZone),
  };
};
