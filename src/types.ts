export type CoverageStatus = 'Covered' | 'Not Covered' | 'Partially Covered';

export interface StreetScanPoint {
  id: number;
  label: string;
  taLabel: string;
  locationName: string;
  taLocationName: string;
  isScanned: boolean;
  scannedAt?: string;
}

export type NotCoveredReason = 
  | 'House Locked' 
  | 'Door Closed' 
  | 'Waste Not Separated' 
  | 'Refused' 
  | 'Vacant House' 
  | 'Not Available'
  | 'Waste Not Given'
  | 'Other';

export interface SWMSHouseholdRecord {
  id: string; // e.g., REC-1001
  houseId: string; // e.g., HID123456
  zone: string; // e.g., East Zone, Central Zone, West Zone, South Zone, North Zone
  ward: string; // e.g., Ward 12
  siName: string; // Sanitary Inspector Name
  siContact: string; // SI Contact Number
  ssName: string; // Sanitary Supervisor Name
  ssContact: string; // SS Contact Number
  cssName: string; // Chief Sanitary Supervisor Name
  driverWorkerName: string; // Driver Name
  driverWorkerContact: string; // Driver Contact Number
  householderName: string; // Householder Name
  householderContact: string; // Householder Contact Number
  streetName: string; // Street Name
  doorNo: string; // Door No
  coverageStatus: CoverageStatus; // Covered | Not Covered
  notCoveredReason?: NotCoveredReason; // Reason if Not Covered
  remarks?: string; // Optional worker remark text
  submittedAt: string;
  // GPS Telemetry & Geocoded Location
  latitude?: number;
  longitude?: number;
  locationName?: string; // e.g. "Kamaraj Salai, Cross Cut Rd, Gandhipuram, Coimbatore - 641012"
  gpsCoordinates?: string; // e.g. "11.0168° N, 76.9558° E"
  gpsAccuracy?: number; // e.g. 3.8 (meters)
  gpsTimestamp?: string;
  // Vehicle Assignment fields
  assignedVehicleId?: string; // e.g. "v-push-cart", "v-tata-ace", "v-bov", "v-obl-pvt"
  vehicleNo?: string; // e.g. "TN 38 BG 4410"
  vehicleType?: string; // e.g. "TATA ACE", "PUSH CART", "BOV"
  completedScansCount?: number;
  streetScans?: StreetScanPoint[];
  proofPhoto?: string;
  photos?: string[];
}

export interface AreaWardStats {
  areaName: string;
  ward: string;
  zone: string;
  totalHouses: number;
  coveredHouses: number;
  notCoveredHouses: number;
}

export interface SWMSDashboardStats {
  totalHouseholds: number; // Total Area Houses
  coveredHouseholds: number; // Covered count
  notCoveredHouseholds: number; // Not Covered count
  todaysEntries: number;
  coveragePercentage: number;
  zoneBreakdown: Array<{ zone: string; covered: number; total: number }>;
  areaBreakdown?: AreaWardStats[];
}

export interface WorkerInfo {
  name: string;
  id: string;
  vehicleNo: string;
  vehicleType: string;
  assignedZone: string;
  assignedWard: string;
  assignedStreet: string;
  siName: string;
  siContact: string;
  ssName: string;
  ssContact: string;
  cssName: string;
  driverName: string;
  driverContact: string;
}

// Legacy Compatibility Types for old components
export type VehicleType = 'Tata Ace' | 'BOV (Battery Operated Vehicle)' | 'Push Cart (PTC)';
export type PropertyType = 'Residence' | 'Commercial' | 'Institution';
export type CollectionStatus = 'Collected' | 'Not Collected' | 'Locked' | 'Refused';
export type WasteType = 'Segregated (Wet & Dry)' | 'Unsegregated' | 'Hazardous / Bio';

export interface StaffDetails {
  zone: string;
  ward: string;
  siName: string;
  siContact: string;
  ssName: string;
  ssContact: string;
  cssName: string;
  cssDriverName?: string;
  workerName: string;
  workerContact: string;
  vehicleType: VehicleType;
  vehicleNo: string;
}

export interface Street {
  id: string;
  name: string;
  zone: string;
  ward: string;
  startDoorNo: number;
  endDoorNo: number;
  totalDoors: number;
}

export interface Household {
  id: string;
  streetId: string;
  streetName: string;
  ward: string;
  zone: string;
  oldDoorNo: string;
  newDoorNo: string;
  propertyType: PropertyType;
  ownerName: string;
  qrCodePayload: string;
}

export interface CollectionRecord {
  id: string | number;
  householdId?: string;
  oldDoorNo?: string;
  newDoorNo?: string;
  streetId?: string;
  streetName?: string;
  ward: string;
  status: any;
  wasteType?: WasteType;
  propertyType?: PropertyType;
  scannedAt?: string;
  workerName: string;
  vehicleType?: VehicleType;
  vehicleNo: string;
  remarks?: string;

  // CCMC-specific mock fields
  date?: string;
  time?: string;
  timestamp?: string;
  zone?: string;
  street?: string;
  workerPhone?: string;
  binLevelPercent?: number;
  supervisor?: string;
  coordinates?: { lat: number; lng: number };
  locationName?: string;
  proofPhoto?: string;
  photos?: string[];
  proofTimestamp?: string;
  reasonIfNotCollected?: string;
  completedScansCount?: number;
  streetScans?: StreetScanPoint[];
  coverageStatus?: CoverageStatus;
  siName?: string;
  siContact?: string;
  ssName?: string;
  ssContact?: string;
  cssName?: string;
  cssContact?: string;
}


export interface DailySummaryStats {
  totalHouseholds: number;
  totalCollectedToday: number;
  totalPending: number;
  totalLockedRefused: number;
  segregatedPercentage: number;
  collectionRatePercentage: number;
  vehicleStats: Record<string, number>;
  streetStats: Array<{
    streetId: string;
    streetName: string;
    total: number;
    collected: number;
    percentage: number;
  }>;
}

export type NavigationTab = 
  | 'overview' 
  | 'reports' 
  | 'collected' 
  | 'not-collected'
  | 'frequently-not-covered-area'
  | 'ai-prediction'
  | 'sbm-admin'
  | 'qr-management';

// CCMC Commissioner Review Console Types
export type AlertCategory = 
  | 'high_missed_houses' 
  | 'worker_not_started' 
  | 'vehicle_delayed' 
  | 'collection_pending_zone' 
  | 'zone_completed';

export type AlertSeverity = 'critical' | 'warning' | 'success';
export type ZoneName = 'North Zone' | 'Central Zone' | 'South Zone' | 'West Zone' | 'East Zone' | 'All';

export interface MunicipalAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  zone: string;
  ward: string;
  streetOrSector: string;
  timeAgo: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
  affectedCount?: number;
  assignedEntity?: string;
  actionRequired?: string;
  details?: string;
}

export interface KPIMetrics {
  totalCollectedToday: number;
  totalCoveredCount: number;
  totalNotCoveredCount: number;
  totalLocationsCount: number;
  overallCoveragePercentage: number;
  frequentlyNotCoveredCount?: number;
}

export interface ZoneSummary {
  zone: string;
  totalLocations: number;
  collectedCount: number;
  notCollectedCount: number;
  coveragePercentage: number;
}

export interface LiveVehicle {
  id: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  zone: string;
  ward: string;
  type: 'BOV' | 'Tata Ace' | 'Push Cart' | string;
  currentPos: [number, number];
  speedKmH: number;
  heading: number;
  status: string;
  fuelOrBattery: number;
  batteryLevel?: number;
  payloadPercent: number;
  lastPingTime: string;
  distanceCoveredKm: number;
  completedStreetsCount?: number;
  pendingStreetsCount?: number;
  coveredStreetsList?: string[];
  pendingStreetsList?: string[];
  currentStreetName?: string;
  assignedRouteStreets?: Array<{
    id: string;
    name: string;
    status: 'Completed' | 'In Progress' | 'Pending';
    households: number;
    collectedHouseholds: number;
    coordinates: [number, number][];
    notes?: string;
  }>;
  routeCoveragePercentage?: number;
  routeStatus?: 'Completed' | 'In Progress' | 'Delayed' | 'Not Started' | string;
  travelledPath: [number, number][];
}

export interface LiveCollector {
  id: string;
  name: string;
  phone: string;
  zone: string;
  ward: string;
  currentPos: [number, number];
  status: string;
  batteryPercent: number;
  assignedVehicleNo: string;
  completedHouses: number;
  totalHouses: number;
  lastActive: string;
}

export interface StreetSegment {
  id: string;
  name: string;
  ward: string;
  zone: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  coordinates: [number, number][];
  totalHouseholds: number;
  collectedHouseholds: number;
  completionTime?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  assignedWorker: string;
  assignedVehicle: string;
  pendingReason?: string;
}

export type ReportType = 'daily' | 'zone' | 'street' | 'worker' | 'vehicle' | 'vehicle-assignment';

export interface DailyReportSummary {
  date: string;
  totalTargetHouses: number;
  totalCoveredHouses: number;
  totalMissedHouses: number;
  coveragePercentage: number;
  segregationPercentage: number;
  totalTonnageCollected: number;
  totalActiveVehicles: number;
  totalFieldWorkers: number;
}

export interface WorkerReportItem {
  id: string;
  name: string;
  phone: string;
  zone: string;
  ward: string;
  assignedRoute: string;
  targetHouses: number;
  completedHouses: number;
  siName: string;
  siPhone: string;
  ssName: string;
  ssPhone: string;
  cssName: string;
  cssPhone: string;
  efficiencyPercent: number;
  shiftStartTime: string;
  hoursOnField: number;
  status: string;
  rating: number;
}

export interface VehicleReportItem {
  id: string;
  vehicleNo: string;
  type: string;
  capacity?: string;
  driverName: string;
  driverPhone: string;
  zone: string;
  ward: string;
  assignedWards?: string[];
  assignedStreets?: string[];
  targetHouseholds?: number;
  coveredHouseholds?: number;
  distanceCoveredKm: number;
  tripsToDumpYard: number;
  totalPayloadTons: number;
  fuelOrBattery: number;
  status: string;
  shiftTiming?: string;
  gpsStatus?: string;
}

export interface StreetReportItem {
  id: string;
  streetName: string;
  ward: string;
  zone: string;
  totalHouseholds: number;
  collectedHouseholds: number;
  missedHouseholds: number;
  status: 'Collected' | 'Not Collected';
  rfidScanRate: number;
  timeCompleted?: string;
  workerName: string;
  vehicleNo: string;
  reasonIfNotCollected?: string;
}

export interface MonthlySummaryData {
  month: string;
  year: number;
  totalTonnage: number;
  avgDailyCoveragePercent: number;
  totalHousesAudited: number;
  totalFleetTrips: number;
  segregationCompliancePercent: number;
  complaintsResolvedPercent: number;
  zoneRankings: Array<{
    zone: string;
    score: number;
    tonnage: number;
    coverage: number;
  }>;
  dailyTrends: Array<{
    day: number;
    date: string;
    coverage: number;
    tonnage: number;
  }>;
}

export interface FrequentlyNotCollectedItem {
  id: string;
  houseId: string;
  doorNo: string;
  streetName: string;
  ward: string;
  zone: string;
  householderName: string;
  householderPhone: string;
  consecutiveDaysMissed: number;
  totalMissedThisMonth: number;
  primaryReason: NotCoveredReason | string;
  lastMissedDate: string;
  lastWorkerName: string;
  lastWorkerPhone: string;
  supervisorName: string;
  supervisorPhone: string;
  coordinates: { lat: number; lng: number };
  remarks?: string;
  actionStatus: 'Pending' | 'Notice Sent' | 'Special Dispatch' | 'Resolved';
}

export interface FrequentlyNotCoveredAreaSummary {
  areaId: string;
  areaName: string;
  streetName: string;
  ward: string;
  zone: string;
  totalHouses: number;
  uncoveredHouses: number;
  uncoveredPercentage: number;
  consecutiveDaysMissed: number;
  primaryReason: string;
  obstacleType: 'Lockout' | 'Segregation_Failure' | 'Narrow_Access' | 'Road_Work' | 'Refused' | 'Vacant';
  supervisorName: string;
  supervisorPhone: string;
  assignedDriver: string;
  assignedVehicle: string;
  coordinates: { lat: number; lng: number };
  lastAttemptTime: string;
  status: 'Critical Attention' | 'Warning' | 'Dispatched' | 'Cleared';
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// CCMC Field Collection Module — Auto-Assigned Vehicle/Worker + QR Checkpoint Collection
// ═══════════════════════════════════════════════════════════════════════════════════════

export type FieldRole = 'admin' | 'driver' | 'worker';

/** Vehicle/worker assignment auto-loaded from the backend after login. Never typed manually. */
export interface SWMSAssignment {
  userId: number;
  username: string;
  role: FieldRole;
  fullName?: string | null;
  vehicleId?: number | null;
  vehicleType?: string | null;
  vehicleName?: string | null;
  /** Hidden for Pushcart users — only worker details shown. */
  vehicleNumber?: string | null;
  workerId?: number | null;
  workerName?: string | null;
  workerCode?: string | null;
  workerPhone?: string | null;
  isPushcart: boolean;
  zone?: string | null;
  ward?: string | null;
}

export type CheckpointStatus = 'Collected' | 'Not Collected' | 'Pending';

/** QR checkpoint metadata resolved by the backend after a scan. QR payload is ONLY the id (e.g. E-SCAN1). */
export interface QRCheckpoint {
  qrId: string;
  position: number;
  streetId: number;
  streetName: string;
  zone: string;
  ward: string;
  area?: string | null;
  status: CheckpointStatus;
  recordedAt?: string | null;
  remarks?: string | null;
  photos?: string[] | null;
  // Rich checkpoint details (fetched AFTER scan, not encoded in the QR)
  zoneCode?: string | null;
  checkpointNumber?: number | null;
  households?: number;
  workerName?: string | null;
  workerCode?: string | null;
  workerContact?: string | null;
  siName?: string | null;
  siContact?: string | null;
  ssName?: string | null;
  ssContact?: string | null;
  cssName?: string | null;
  cssContact?: string | null;
}

export interface StreetDashboard {
  streetId: number;
  streetName: string;
  zone: string;
  ward: string;
  area?: string | null;
  checkpoints: QRCheckpoint[];
}

export interface SWMSCollectionStats {
  totalStreets: number;
  totalCheckpoints: number;
  collectedCheckpoints: number;
  notCollectedCheckpoints: number;
  pendingCheckpoints: number;
  coveragePercentage: number;
  status: 'Covered' | 'Partially Covered' | 'Not Covered';
}

export interface SWMSDashboardData {
  success: boolean;
  stats: SWMSCollectionStats;
  streets: StreetDashboard[];
  message?: string | null;
}

export interface CheckpointResolveResponse {
  success: boolean;
  checkpoint: QRCheckpoint;
  assignment: SWMSAssignment;
  alreadySubmitted: boolean;
  existingRecord?: {
    status: string;
    remarks?: string | null;
    scannedAt?: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  message?: string | null;
}

export interface CollectionSubmitResponse {
  success: boolean;
  message: string;
  record?: any;
  stats?: SWMSCollectionStats;
  duplicate: boolean;
}

export const NOT_COLLECTED_REASONS = [
  'Vehicle not arrived',
  'Vehicle breakdown',
  'Worker unavailable',
  'Road blocked',
  'Waste not ready',
  'Heavy rain',
  'Other',
] as const;

export type NotCollectedReasonOption = typeof NOT_COLLECTED_REASONS[number];

// ── QR Checkpoint Management (Admin) Types ───────────────────────────────────────────────

export interface QRStaffInfo {
  id: number;
  staffCode: string;
  staffName: string;
  staffPhone: string | null;
  role: string;
}

export interface QROptionStreet {
  id: number;
  streetName: string;
  zone: string;
  ward: string;
  area: string | null;
}

export interface QROptionWorker {
  id: number;
  workerCode: string;
  workerName: string;
  workerPhone: string | null;
}

export interface QROptionsResult {
  success: boolean;
  zones: { zone: string; zoneCode: string }[];
  streets: QROptionStreet[];
  workers: QROptionWorker[];
  staff: { SI: QRStaffInfo[]; SS: QRStaffInfo[]; CSS: QRStaffInfo[] };
}

export interface QRCheckpointAdmin {
  id: number;
  qrId: string;
  zone: string;
  zoneCode: string;
  ward: string;
  streetName: string;
  doorNo?: string | null;
  area: string | null;
  checkpointNumber: number;
  households: number;
  workerName: string | null;
  workerCode: string | null;
  workerContact: string | null;
  siName: string | null;
  siContact: string | null;
  ssName: string | null;
  ssContact: string | null;
  cssName: string | null;
  cssContact: string | null;
  status: string;
  position: number;
  createdAt: string | null;
  imageUrl: string;
}

export interface QRZoneSummary {
  zone: string;
  zoneCode: string;
  streets: number;
  checkpoints: number;
  generatedQrs: string[];
}

export interface QRAdminListResult {
  success: boolean;
  zones: QRZoneSummary[];
  checkpoints: QRCheckpointAdmin[];
}

export interface QRCreateResult {
  success: boolean;
  message: string;
  checkpoints: QRCheckpointAdmin[];
  qrLabels: { qrId: string; filename: string }[];
  duplicateQrs?: string[];
}

export interface QRGenerateSinglePayload {
  zone: string;
  ward: string;
  streetId: number;
  households: number;
  doorNo?: string | null;
  workerId?: number | null;
  siName?: string | null;
  siContact?: string | null;
  ssName?: string | null;
  ssContact?: string | null;
  cssName?: string | null;
  cssContact?: string | null;
}


