import { SWMSHouseholdRecord } from '../types';
import { readQrRemarks, remarkKey } from './streetProgress';

/**
 * Household-level progress for BOV and push cart workers.
 *
 * These vehicles walk door to door rather than sweeping a street, so their
 * unit of work is the household, not the street and its five QR points. Each
 * submitted record is one door.
 */

export type HouseholdStatus = 'collected' | 'not_collected';

export interface HouseholdProgress {
  id: string;
  doorNo: string;
  streetName: string;
  zone: string;
  ward: string;
  householderName: string;
  status: HouseholdStatus;
  submittedAt?: string;
  reason?: string;
  remark?: string;
  hasPhotos: boolean;
}

const norm = (v?: string | null): string => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const isCollected = (r: SWMSHouseholdRecord): boolean => r.coverageStatus === 'Covered';

export const buildHouseholdProgress = (records: SWMSHouseholdRecord[]): HouseholdProgress[] => {
  const remarks = readQrRemarks();

  return (records || [])
    .map((r, idx) => {
      const remark = remarks[remarkKey(`${r.streetName}#${r.doorNo}`, 1)];
      return {
        id: r.id || `HH-${idx}`,
        doorNo: r.doorNo || '—',
        streetName: r.streetName || '—',
        zone: r.zone || '',
        ward: r.ward || '',
        householderName: r.householderName || 'Resident',
        status: (isCollected(r) ? 'collected' : 'not_collected') as HouseholdStatus,
        submittedAt: r.submittedAt,
        reason: r.notCoveredReason,
        remark,
        hasPhotos: !!(r.beforePhoto && r.afterPhoto),
      };
    })
    .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
};

export interface HouseholdSummary {
  totalHouseholds: number;
  collectedHouseholds: number;
  notCollectedHouseholds: number;
  collectedPercent: number;
}

export const summariseHouseholds = (rows: HouseholdProgress[]): HouseholdSummary => {
  const collected = rows.filter(r => r.status === 'collected').length;
  const total = rows.length;
  return {
    totalHouseholds: total,
    collectedHouseholds: collected,
    notCollectedHouseholds: total - collected,
    collectedPercent: total > 0 ? Math.round((collected / total) * 100) : 0,
  };
};

/** Match on door number, householder, street, ward or zone. */
export const matchesHouseholdSearch = (row: HouseholdProgress, query: string): boolean => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  return [row.doorNo, row.streetName, row.ward, row.zone, row.householderName, row.reason, row.remark]
    .some(v => (v || '').toLowerCase().includes(q));
};

export const householdKey = (street: string, door: string): string => `${street}#${door}`;

export const householdNormKey = (street: string, door: string): string =>
  `${norm(street)}#${norm(door)}`;
