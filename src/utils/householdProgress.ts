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

/**
 * Keep only the records belonging to the signed-in worker.
 *
 * The dashboard is fed every household record in the system, so without this
 * a cart worker saw other workers' doors in their own history. Records are
 * matched on vehicle number where present, otherwise on the worker name.
 */
export const filterToOwnRecords = (
  records: SWMSHouseholdRecord[],
  me?: { vehicleNumber?: string | null; vehicleType?: string | null; fullName?: string | null; username?: string | null; workerName?: string | null } | null,
): SWMSHouseholdRecord[] => {
  if (!me) return records || [];
  // A placeholder vehicle such as 'v-push-cart' is shared by every cart, so it
  // cannot identify this worker. Fall back to the name in that case.
  const vNum = isPlaceholderVehicle(me.vehicleNumber) ? '' : norm(me.vehicleNumber);
  const name = norm(me.fullName || me.workerName || me.username);

  // Prefer an exact plate match, but require the driver name to agree too.
  // Carts in the same zone share one vehicle code (PUSHCART_CENTRAL_01), so a
  // plate-only match would still leak one cart worker's doors into another's.
  if (vNum) {
    return (records || []).filter(r => {
      if (isPlaceholderVehicle(r.vehicleNo) || norm(r.vehicleNo) !== vNum) return false;
      return !name || !norm(r.driverWorkerName) || norm(r.driverWorkerName) === name;
    });
  }

  // Otherwise fall back to the worker's name on the record.
  if (name) {
    return (records || []).filter(r => norm(r.driverWorkerName) === name);
  }

  // No usable identity. Showing everything would leak one cart worker's doors
  // into another's dashboard, so show nothing rather than the wrong records.
  // A shared placeholder like 'v-push-cart' cannot identify an owner either,
  // because every cart recorded it.
  return [];
};

/** True when a record's vehicle value is a shared placeholder, not a real identity. */
export const isPlaceholderVehicle = (v?: string | null): boolean => {
  const n = norm(v);
  return !n || n.startsWith('V') || n === 'PUSHCART' || n === 'BOV' || n === 'PUSHCARTCART';
};

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
