import { QRCheckpoint, StreetDashboard, StreetScanPoint, SWMSHouseholdRecord } from '../types';

/**
 * Street-level QR progress for the worker dashboards.
 *
 * Progress is merged from three places, in priority order:
 *   1. live scan state in localStorage (what the worker just did)
 *   2. checkpoints already stored on the record for that street
 *   3. the checkpoint status reported by the dashboard API
 *
 * A TATA ACE street has 5 printed checkpoints. BOV and push cart have one.
 */

export const TATA_ACE_CHECKPOINTS = 5;
export const SINGLE_CHECKPOINT = 1;

export const SCAN_STORAGE_KEY = 'ccmc_street_5scans';
export const REMARKS_STORAGE_KEY = 'ccmc_qr_point_remarks';

export type StreetProgressStatus = 'covered' | 'partial' | 'not_collected';

/** Vehicle types that work a street with a single QR rather than five. */
const SINGLE_SCAN_TYPES = ['PUSH CART', 'PUSHCART', 'PTC', 'BOV', 'COMPACTOR', 'OBL'];

export const isSingleScanVehicleType = (vehicleType?: string | null): boolean => {
  const t = (vehicleType || '').toUpperCase();
  return SINGLE_SCAN_TYPES.some((s) => t.includes(s));
};

export const isTataAceType = (vehicleType?: string | null): boolean =>
  (vehicleType || '').toUpperCase().includes('TATA') || (vehicleType || '').toUpperCase().includes('ACE');

export const totalCheckpointsFor = (vehicleType?: string | null): number =>
  isSingleScanVehicleType(vehicleType) ? SINGLE_CHECKPOINT : TATA_ACE_CHECKPOINTS;

const norm = (v?: string | null): string => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Live per-street scan state written by the household form. */
export const readLiveScans = (): Record<string, StreetScanPoint[]> => {
  try {
    const raw = localStorage.getItem(SCAN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

/** Per-QR-point remarks, keyed `street|point`. */
export const readQrRemarks = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(REMARKS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const writeQrRemark = (street: string, point: number, remark: string): void => {
  try {
    const all = readQrRemarks();
    const key = `${street}|${point}`;
    if (remark && remark.trim()) all[key] = remark.trim();
    else delete all[key];
    localStorage.setItem(REMARKS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* storage full or unavailable — the remark simply does not persist */
  }
};

export const remarkKey = (street: string, point: number): string => `${street}|${point}`;

export interface StreetQrPoint {
  position: number;
  qrId: string;
  isScanned: boolean;
  scannedAt?: string;
  hasPhotos: boolean;
  photoCount: number;
  remark?: string;
  status?: string;
}

export interface StreetProgress {
  streetId: string | number;
  streetName: string;
  zone: string;
  ward: string;
  totalCheckpoints: number;
  scannedCount: number;
  /** 0..1 */
  ratio: number;
  status: StreetProgressStatus;
  points: StreetQrPoint[];
  lastScannedAt?: string;
}

export const statusFromCount = (scanned: number, total: number): StreetProgressStatus => {
  if (total <= 1) return scanned >= 1 ? 'covered' : 'not_collected';
  if (scanned >= total) return 'covered';
  if (scanned >= 3) return 'partial';
  return 'not_collected';
};

export const STATUS_LABEL: Record<StreetProgressStatus, string> = {
  covered: 'Collected',
  partial: 'Partially Collected',
  not_collected: 'Not Collected',
};

/**
 * Build one row per street the worker is responsible for. `streets` comes from
 * the dashboard API; `records` and localStorage fill in what has been scanned.
 */
export const buildStreetProgress = (
  streets: StreetDashboard[],
  records: SWMSHouseholdRecord[],
  vehicleType?: string | null,
): StreetProgress[] => {
  const total = totalCheckpointsFor(vehicleType);
  const live = readLiveScans();
  const remarks = readQrRemarks();
  const liveByStreet = new Map<string, StreetScanPoint[]>();
  for (const [k, v] of Object.entries(live)) {
    if (Array.isArray(v)) liveByStreet.set(norm(k), v);
  }

  // Records give the backend's view of a street's scans.
  const recordByStreet = new Map<string, SWMSHouseholdRecord>();
  for (const r of records) {
    const k = norm(r.streetName);
    if (!k) continue;
    const prev = recordByStreet.get(k);
    // Keep the most recent record per street.
    if (!prev || (r.submittedAt || '') > (prev.submittedAt || '')) recordByStreet.set(k, r);
  }

  return streets.map((s) => {
    const key = norm(s.streetName);
    const rec = recordByStreet.get(key);
    const liveScans = liveByStreet.get(key);
    const checkpoints = s.checkpoints || [];

    const points: StreetQrPoint[] = [];
    for (let p = 1; p <= total; p++) {
      const cp = checkpoints.find((c: QRCheckpoint) => Number(c.checkpointNumber ?? c.position) === p);
      const livePoint = liveScans?.find(ls => Number(ls.id) === p);
      const recPoint = rec?.streetScans?.find(rs => Number(rs.id) === p);

      const isScanned = !!(livePoint?.isScanned || recPoint?.isScanned || cp?.status === 'Collected');
      const photos = [livePoint?.beforePhoto, livePoint?.afterPhoto, recPoint?.beforePhoto, recPoint?.afterPhoto]
        .filter(Boolean).length;
      const remark = remarks[remarkKey(s.streetName, p)];

      points.push({
        position: p,
        qrId: cp?.qrId || (isScanned ? `${s.streetName}-P${p}` : `${s.streetName}-P${p}`),
        isScanned,
        scannedAt: livePoint?.scannedAt || recPoint?.scannedAt || cp?.recordedAt,
        hasPhotos: photos >= 2,
        photoCount: photos,
        remark,
        status: cp?.status,
      });
    }

    const scannedCount = points.filter(p => p.isScanned).length;
    const lastScannedAt = points
      .map(p => p.scannedAt)
      .filter(Boolean)
      .sort()
      .pop();

    return {
      streetId: s.streetId,
      streetName: s.streetName,
      zone: s.zone || rec?.zone || '',
      ward: s.ward || rec?.ward || '',
      totalCheckpoints: total,
      scannedCount,
      ratio: total > 0 ? scannedCount / total : 0,
      status: statusFromCount(scannedCount, total),
      points,
      lastScannedAt,
    };
  });
};

export interface StreetProgressSummary {
  totalStreets: number;
  collectedStreets: number;
  partialStreets: number;
  notCollectedStreets: number;
  totalScans: number;
  scannedScans: number;
}

export const summariseStreets = (rows: StreetProgress[]): StreetProgressSummary => {
  const s: StreetProgressSummary = {
    totalStreets: rows.length,
    collectedStreets: 0,
    partialStreets: 0,
    notCollectedStreets: 0,
    totalScans: 0,
    scannedScans: 0,
  };
  for (const r of rows) {
    if (r.status === 'covered') s.collectedStreets++;
    else if (r.status === 'partial') s.partialStreets++;
    else s.notCollectedStreets++;
    s.totalScans += r.totalCheckpoints;
    s.scannedScans += r.scannedCount;
  }
  return s;
};

/** Case/space-insensitive match on ward, street or zone. */
export const matchesSearch = (row: StreetProgress, query: string): boolean => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  return [row.streetName, row.ward, row.zone].some(v => (v || '').toLowerCase().includes(q));
};
