import { SWMSHouseholdRecord } from '../types';

/**
 * Consecutive missed-collection streaks.
 *
 * A "streak" is the number of consecutive calendar days, ending on the most
 * recent miss, on which the same house was reported Not Covered. A house that
 * was collected in between breaks the run, so a gap resets the count.
 *
 * submittedAt is stored as "MM/DD/YYYY, hh:mm AM" (en-US locale), so the
 * calendar day is the leading 10 characters.
 */

const dayKeyOf = (submittedAt?: string): string => {
  if (!submittedAt) return '';
  const head = submittedAt.split(',')[0].trim();
  const m = head.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  const parsed = new Date(submittedAt);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const previousDay = (dayKey: string): string => {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
};

/** Stable key for a house, so repeated submissions map to the same door. */
export const houseKeyOf = (r: Pick<SWMSHouseholdRecord, 'houseId' | 'doorNo' | 'streetName' | 'ward'>): string =>
  (r.houseId || '').trim()
  || [r.ward, r.streetName, r.doorNo].map((p) => (p || '').trim().toUpperCase()).join('|');

/**
 * Live missed-day streak per house, keyed by houseKeyOf. This is the number of
 * consecutive days missed counting back from the house's most recent miss.
 * A day on which the house was covered breaks the run, so a house that has been
 * serviced drops out of the benchmark tiers even if it was missed for a while
 * earlier.
 */
export const buildHouseStreaks = (records: SWMSHouseholdRecord[]): Map<string, number> => {
  // key -> set of dayKeys on which this house was not collected
  const missedDays = new Map<string, Set<string>>();

  for (const r of records) {
    const day = dayKeyOf(r.submittedAt);
    if (!day) continue;
    if (r.coverageStatus === 'Covered') continue; // a covered day breaks the run
    const key = houseKeyOf(r);
    if (!key) continue;
    if (!missedDays.has(key)) missedDays.set(key, new Set());
    missedDays.get(key)!.add(day);
  }

  const streaks = new Map<string, number>();

  for (const [key, days] of missedDays) {
    const sorted = [...days].sort(); // oldest first
    let run = 0;
    let lastDay = '';

    for (const day of sorted) {
      // A covered day, or simply no record for a day, leaves a gap of at
      // least 2 and so breaks the run.
      run = lastDay && previousDay(day) === lastDay ? run + 1 : 1;
      lastDay = day;
    }

    // The trailing run is the live streak. A house that was missed for a while
    // but has since been collected drops out of the benchmark tiers, which is
    // what a "needs intervention now" watchlist should do.
    streaks.set(key, run);
  }

  return streaks;
};

/**
 * Benchmark buckets used across the frequently-missed screens.
 * 2-3 days is the "watch" tier, more than 3 days is the severe tier.
 */
export const STREAK_BENCHMARKS = {
  watch: { min: 2, max: 3, key: 'watch' as const },
  severe: { min: 4, max: Number.POSITIVE_INFINITY, key: 'severe' as const },
};

export const inWatchTier = (streak: number): boolean => streak >= 2 && streak <= 3;
export const inSevereTier = (streak: number): boolean => streak > 3;
