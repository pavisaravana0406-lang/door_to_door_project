// Official CCMC Zone → Ward reference list.
// Coimbatore City Municipal Corporation has 100 wards total,
// divided equally across 5 administrative zones (20 wards each).
// This is the master list used to populate Ward filters/dropdowns
// across the app, independent of how many wards currently have
// live collection/vehicle/worker records.

export const WARDS_BY_ZONE: Record<string, string[]> = {
  'North Zone': Array.from({ length: 20 }, (_, i) => `Ward ${i + 1}`),
  'West Zone': Array.from({ length: 20 }, (_, i) => `Ward ${i + 21}`),
  'Central Zone': Array.from({ length: 20 }, (_, i) => `Ward ${i + 41}`),
  'South Zone': Array.from({ length: 20 }, (_, i) => `Ward ${i + 61}`),
  'East Zone': Array.from({ length: 20 }, (_, i) => `Ward ${i + 81}`),
};

export const ZONE_NAMES = Object.keys(WARDS_BY_ZONE);

export const ALL_WARDS: string[] = ZONE_NAMES.flatMap((z) => WARDS_BY_ZONE[z]);

/** Returns the 20 wards belonging to a zone, or all 100 wards if zone is 'All' / unrecognized. */
export function getWardsForZone(zone: string): string[] {
  if (zone === 'All' || !WARDS_BY_ZONE[zone]) return ALL_WARDS;
  return WARDS_BY_ZONE[zone];
}
