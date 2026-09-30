import React, { useState, useEffect, useMemo } from 'react';
import { CoverageStatus, NotCoveredReason, SWMSHouseholdRecord, StreetScanPoint } from '../types';
import { playChimeTone } from '../utils/audioHelper';
import { HouseholdLocationMapModal } from './HouseholdLocationMapModal';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  User, 
  MapPin, 
  Building2, 
  Truck, 
  Lock,
  ShieldCheck, 
  FileText,
  MoreVertical,
  Sparkles,
  X,
  SlidersHorizontal,
  Navigation,
  Crosshair,
  ExternalLink,
  RefreshCw,
  Compass,
  Edit3,
  Pencil,
  Save,
  Check,
  Globe,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { ccmcLogo, ccmcFallbackLogo, smartCityLogo, smartCityFallbackLogo } from '../constants/branding';
import { getStreetScanRoute } from './SWMSStreetScanQRCard';

/**
 * Authoritative checkpoint details resolved from the SWMS backend (Neon).
 * Supplied after a scan so the form shows the exact street, zone, ward and
 * worker recorded for that QR id rather than a guess.
 */
export interface ScannedCheckpointInfo {
  qrId?: string;
  position?: number;
  checkpointNumber?: number;
  streetName?: string;
  zone?: string;
  ward?: string;
  households?: number;
  workerName?: string;
  workerContact?: string;
  siName?: string;
  siContact?: string;
  ssName?: string;
  ssContact?: string;
  cssName?: string;
  cssContact?: string;
}

/** Which of the two mandatory proof photos the camera is capturing. */
type PhotoSlot = 'before' | 'after';

interface SWMSHouseholdFormViewProps {
  scannedHouseId?: string;
  scannedCheckpoint?: ScannedCheckpointInfo | null;
  lang?: 'en' | 'ta';
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
  assignedVehicleId?: string;
  onBackToScanner: () => void;
  onSubmitSuccess: (record: SWMSHouseholdRecord, status: CoverageStatus) => void;
}

// Clean any full URL or prefix into a pure alphanumeric House ID
const cleanHouseId = (rawId?: string): string => {
  if (!rawId) return 'HID100101';
  let cleaned = rawId.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1].trim();
  }
  if (cleaned.includes('?')) {
    cleaned = cleaned.split('?')[0].trim();
  }
  return cleaned || 'HID100101';
};

export const SWMSHouseholdFormView: React.FC<SWMSHouseholdFormViewProps> = ({
  scannedHouseId = 'HID100101',
  scannedCheckpoint = null,
  lang = 'ta',
  onSetLanguage,
  onToggleLang,
  assignedVehicleId = 'v-obl-pvt',
  onBackToScanner,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState<{
    houseId: string;
    zone: string;
    ward: string;
    vehicleType: string;
    vehicleNo: string;
    siName: string;
    siContact: string;
    ssName: string;
    ssContact: string;
    cssName: string;
    driverWorkerName: string;
    driverWorkerContact: string;
    householderName: string;
    householderContact: string;
    streetName: string;
    doorNo: string;
    coverageStatus: CoverageStatus;
    notCoveredReason?: NotCoveredReason;
    remarks: string;
  }>({
    houseId: cleanHouseId(scannedHouseId),
    zone: 'East Zone',
    ward: 'Ward 24',
    vehicleType: 'TATA ACE',
    vehicleNo: assignedVehicleId && !assignedVehicleId.includes('v-') ? assignedVehicleId : 'TN66AD6465',
    siName: 'S.R.GERALD SATHIYA PUNITHAN',
    siContact: '9442504589',
    ssName: 'vibin',
    ssContact: '9442504589',
    cssName: 'vengatesh',
    driverWorkerName: 'murali',
    driverWorkerContact: '9677971375',
    householderName: 'murali (140 Households)',
    householderContact: '9677971375',
    streetName: 'sree nagar',
    doorNo: assignedVehicleId === 'v-push-cart' ? '' : '45',
    coverageStatus: 'Not Covered' as CoverageStatus,
    notCoveredReason: 'Other' as NotCoveredReason,
    remarks: ''
  });

  const isPushCart = (() => {
    if (formData?.vehicleType) {
      const vUpper = formData.vehicleType.toUpperCase();
      if (vUpper.includes('PUSH') || vUpper.includes('PTC') || vUpper.includes('CART')) {
        return true;
      }
      if (vUpper.includes('TATA') || vUpper.includes('ACE') || vUpper.includes('BOV') || vUpper.includes('AUTO') || vUpper.includes('TRUCK')) {
        return false;
      }
    }
    if (assignedVehicleId) {
      const aUpper = assignedVehicleId.toUpperCase();
      if (aUpper.includes('PUSH') || aUpper.includes('PTC') || aUpper.includes('CART')) {
        return true;
      }
      if (aUpper.includes('ACE') || aUpper.includes('TATA') || aUpper.includes('BOV') || aUpper.includes('PVT')) {
        return false;
      }
    }
    return assignedVehicleId === 'v-push-cart';
  })();

  const isBov = (() => {
    const fromType = formData?.vehicleType?.toUpperCase() || '';
    if (fromType.includes('BOV')) return true;
    return (assignedVehicleId || '').toUpperCase().includes('BOV');
  })();

  /**
   * Only TATA ACE has five printed checkpoints on the street (the QR cards
   * generate the -P2..-P5 variants for TATA ACE only). Push carts and BOVs
   * only ever get a single QR per street, so requiring 5/5 for them made
   * their status impossible to ever reach 'Covered'.
   */
  const isSingleScanVehicle = isPushCart || isBov;
  const singleScanLabel = isPushCart ? 'Pushcart' : 'BOV';

  // Helper to format exact real-time live scan timestamp (e.g. "11:32 AM" or "01:27 PM")
  const getLiveScanTimeStr = (): string => {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hrStr}:${minStr} ${ampm}`;
  };

  // Helper to check if a timestamp string is from an old legacy mock test run (e.g. 01:24 PM)
  const isLegacyMockTime = (t?: string): boolean => {
    if (!t) return false;
    return t.includes('01:24') || t.includes('01:27') || t.includes('01:28') || t.includes('1:24') || t.includes('1:27') || t.includes('1:28');
  };

  // Resolve the scanned QR into street/officer details.
  // Preference order:
  //   1. scannedCheckpoint — authoritative data fetched from the backend (Neon)
  //   2. JSON payload embedded in the QR
  //   3. Static street-card table (offline fallback for legacy CCMC-QR cards)
  useEffect(() => {
    if (!scannedHouseId) return;
    let parsed: any = null;
    if (scannedCheckpoint) {
      parsed = scannedCheckpoint;
    } else {
      try {
        parsed = JSON.parse(scannedHouseId);
      } catch {
        parsed = getStreetScanRoute(scannedHouseId);
      }
    }

    if (parsed && typeof parsed === 'object') {
      const rawZone = parsed.zone ? parsed.zone.toString() : '';
      const zoneName = rawZone
        ? (rawZone.toUpperCase().includes('EAST') ? 'East Zone'
          : rawZone.toUpperCase().includes('CENTRAL') ? 'Central Zone'
          : rawZone.toUpperCase().includes('WEST') ? 'West Zone'
          : rawZone.toUpperCase().includes('NORTH') ? 'North Zone'
          : rawZone.toUpperCase().includes('SOUTH') ? 'South Zone'
          : rawZone)
        : 'East Zone';
      const rawWard = parsed.ward || parsed.wardNo || '';
      const wardName = rawWard
        ? (rawWard.toString().startsWith('Ward') ? rawWard.toString() : `Ward ${rawWard}`)
        : 'Ward 24';

      setFormData(prev => ({
        ...prev,
        streetName: parsed.streetName || 'sree nagar',
        ward: wardName,
        zone: zoneName,
        vehicleType: parsed.vehicleType || 'TATA ACE',
        vehicleNo: parsed.vehicleNo || prev.vehicleNo || 'TN66AD6465',
        siName: parsed.siName || 'S.R.GERALD SATHIYA PUNITHAN',
        siContact: parsed.siContact || '9442504589',
        ssName: parsed.ssName || 'vibin',
        ssContact: parsed.ssContact || '9442504589',
        cssName: parsed.cssName || 'vengatesh',
        driverWorkerName: parsed.workerName || 'murali',
        driverWorkerContact: parsed.workerContact || '9677971375',
        householderName: `${parsed.workerName || 'Worker'} (${parsed.households || 30} Households)`,
        householderContact: parsed.workerContact || '9677971375',
      }));

      const targetStreetName = parsed.streetName || 'sree nagar';

      // Which of the 5 checkpoints this QR marks as scanned.
      // Authoritative source is the checkpoint's position from the backend;
      // otherwise fall back to the -P{n} suffix, else point 1.
      const lowerCode = scannedHouseId.toLowerCase();
      let targetPoint: number | null = null;
      const posFromApi = Number(scannedCheckpoint?.position ?? scannedCheckpoint?.checkpointNumber ?? 0);
      if (posFromApi >= 1 && posFromApi <= 5) {
        targetPoint = posFromApi;
      } else {
        const match = lowerCode.match(/(?:-|_|\b)p([1-5])(?:\b|_|\.)/);
        if (match) {
          targetPoint = parseInt(match[1], 10);
        } else {
          const scanNum = lowerCode.match(/-scan(\d+)/);
          const n = scanNum ? parseInt(scanNum[1], 10) : 0;
          targetPoint = n >= 1 && n <= 5 ? n : 1;
        }
      }

      const SCAN_KEY = 'ccmc_street_5scans';
      let baseScans: StreetScanPoint[] = [
        { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'Point 1 QR', taLocationName: 'புள்ளி 1 QR', isScanned: false },
        { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Point 2 QR', taLocationName: 'புள்ளி 2 QR', isScanned: false },
        { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Point 3 QR', taLocationName: 'புள்ளி 3 QR', isScanned: false },
        { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Point 4 QR', taLocationName: 'புள்ளி 4 QR', isScanned: false },
        { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Point 5 QR', taLocationName: 'புள்ளி 5 QR', isScanned: false },
      ];

      try {
        const raw = localStorage.getItem(SCAN_KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj[targetStreetName] && Array.isArray(obj[targetStreetName])) {
            // Clean legacy mock test timestamps (e.g. 01:24 PM)
            baseScans = obj[targetStreetName].map((sc: StreetScanPoint) => {
              if (isLegacyMockTime(sc.scannedAt)) {
                return { ...sc, isScanned: false, scannedAt: undefined };
              }
              return sc;
            });
          }
        }
      } catch (e) { /* ignore */ }

      // Update scan states: mark ONLY the actually scanned targetPoint with real live timestamp
      const liveTime = getLiveScanTimeStr();
      const updatedScans = baseScans.map(sc => {
        if (targetPoint && sc.id === targetPoint) {
          return {
            ...sc,
            isScanned: true,
            scannedAt: liveTime
          };
        }
        return sc;
      });

      // Move to the page for the checkpoint that was just scanned, so its
      // before/after pair is what the worker is looking at.
      setCurrentScanPage(targetPoint || 1);

      try {
        const raw = localStorage.getItem(SCAN_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[targetStreetName] = updatedScans;
        localStorage.setItem(SCAN_KEY, JSON.stringify(obj));
      } catch (e) { /* ignore */ }

      setStreetScans(updatedScans);
    }
  }, [scannedHouseId, scannedCheckpoint]);

  // 5 Scan Checkpoints State for Vehicle Mode (Scans 1 to 5 updated one by one per scanned QR checkpoint)
  const [streetScans, setStreetScans] = useState<StreetScanPoint[]>(() => [
    { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'Point 1 QR', taLocationName: 'புள்ளி 1 QR', isScanned: false },
    { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Point 2 QR', taLocationName: 'புள்ளி 2 QR', isScanned: false },
    { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Point 3 QR', taLocationName: 'புள்ளி 3 QR', isScanned: false },
    { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Point 4 QR', taLocationName: 'புள்ளி 4 QR', isScanned: false },
    { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Point 5 QR', taLocationName: 'புள்ளி 5 QR', isScanned: false },
  ]);

  // Compute vehicle coverage state
  const completedScansCount = streetScans.filter(s => s.isScanned).length;

  /** A checkpoint is only complete once scanned AND both photos are captured. */
  const isScanComplete = (s: StreetScanPoint): boolean =>
    s.isScanned && !!s.beforePhoto && !!s.afterPhoto;

  const completedScansWithPhotos = streetScans.filter(isScanComplete).length;

  /**
   * TATA ACE runs as 5 separate pages: scan N, photograph N, submit, then move
   * to the next page. This is the page the worker is currently on.
   */
  const [currentScanPage, setCurrentScanPage] = useState<number>(1);
  const TOTAL_SCAN_PAGES = 5;

  const activePhotoScanId = isSingleScanVehicle ? 1 : currentScanPage;
  const activePhotoScan = useMemo(
    () => streetScans.find(s => s.id === activePhotoScanId) || streetScans[0],
    [streetScans, activePhotoScanId]
  );

  /**
   * True when a QR for a checkpoint other than the current page is scanned. The
   * UI follows the QR that was actually scanned, so the worker is never looking
   * at the wrong checkpoint's photos.
   */
  const outOfOrderScanId = useMemo(() => {
    if (isSingleScanVehicle) return 0;
    const found = streetScans.find(s => s.isScanned && s.id !== currentScanPage && !isScanComplete(s));
    return found ? found.id : 0;
  }, [streetScans, currentScanPage, isSingleScanVehicle]);

  // Reset all 5 checkpoints to Pending X
  const handleResetAllScans = () => {
    const freshScans: StreetScanPoint[] = [
      { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'Point 1 QR', taLocationName: 'புள்ளி 1 QR', isScanned: false },
      { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Point 2 QR', taLocationName: 'புள்ளி 2 QR', isScanned: false },
      { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Point 3 QR', taLocationName: 'புள்ளி 3 QR', isScanned: false },
      { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Point 4 QR', taLocationName: 'புள்ளி 4 QR', isScanned: false },
      { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Point 5 QR', taLocationName: 'புள்ளி 5 QR', isScanned: false },
    ];
    setStreetScans(freshScans);
    if (formData.streetName) {
      try {
        const SCAN_KEY = 'ccmc_street_5scans';
        const raw = localStorage.getItem(SCAN_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[formData.streetName] = freshScans;
        localStorage.setItem(SCAN_KEY, JSON.stringify(obj));
      } catch (e) { /* ignore */ }
    }
  };

  /**
   * A scanned, photographed TATA ACE checkpoint is a collection, so the form
   * sits on 'Covered' from the first successful scan rather than flipping to
   * "Not Covered" until all five are done.
   */
  useEffect(() => {
    if (!isSingleScanVehicle) {
      setFormData(prev => ({ ...prev, coverageStatus: 'Covered', notCoveredReason: undefined }));
    }
  }, [isSingleScanVehicle, completedScansWithPhotos]);

  // Sync streetScans to localStorage whenever updated
  useEffect(() => {
    if (!formData.streetName) return;
    try {
      const SCAN_KEY = 'ccmc_street_5scans';
      const raw = localStorage.getItem(SCAN_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj[formData.streetName] = streetScans;
      localStorage.setItem(SCAN_KEY, JSON.stringify(obj));
    } catch (e) { /* ignore */ }
  }, [streetScans, formData.streetName]);

  const [scanWarnMsg, setScanWarnMsg] = useState<string | null>(null);
  // The two mandatory proof photos belong to the checkpoint currently shown in
  // the photo panel, so each of the 5 scans keeps its own pair. For the
  // single-scan vehicles there is only ever checkpoint 1.
  const beforePhoto: string | null = activePhotoScan?.beforePhoto || null;
  const afterPhoto: string | null = activePhotoScan?.afterPhoto || null;
  // Which slot the live camera is currently filling.
  const [cameraSlot, setCameraSlot] = useState<PhotoSlot>('before');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /** Write a captured photo into the active checkpoint's record. */
  const updateActiveScanPhotos = (slot: PhotoSlot, dataUrl: string | null) => {
    if (!activePhotoScan) return;
    setStreetScans(prev => prev.map(s => {
      if (s.id !== activePhotoScan.id) return s;
      const next = slot === 'before'
        ? { ...s, beforePhoto: dataUrl || undefined }
        : { ...s, afterPhoto: dataUrl || undefined };
      return { ...next, photosCapturedAt: next.beforePhoto && next.afterPhoto ? getLiveScanTimeStr() : next.photosCapturedAt };
    }));
  };

  // Live WebCam / Camera Viewfinder State & Refs
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const setPhotoForSlot = (slot: PhotoSlot, dataUrl: string) => {
    updateActiveScanPhotos(slot, dataUrl);
  };

  const openCameraFor = (slot: PhotoSlot) => {
    setCameraSlot(slot);
    handleStartCamera('environment');
  };

  const handleStartCamera = async (mode: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setIsCameraModalOpen(true);
    setCameraFacingMode(mode);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available');
      }

      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live camera stream error, opening fallback file camera:', err);
      setCameraError(lang === 'ta' ? 'கேமரா நேரலை இயங்கவில்லை. கேமரா கோப்பைப் பயன்படுத்தவும்.' : 'Live camera unavailable. Using device camera selector.');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      setIsCameraModalOpen(false);
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraModalOpen(false);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoForSlot(cameraSlot, dataUrl);
      playChimeTone('success');
    }
    handleStopCamera();
  };

  const handleToggleFacingMode = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    handleStartCamera(nextMode);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slot = cameraSlot;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoForSlot(slot, dataUrl);
        playChimeTone('success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (slot: PhotoSlot) => {
    updateActiveScanPhotos(slot, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScanCardClick = (scan: StreetScanPoint) => {
    // Tapping a finished scan reopens its page so the worker can review or
    // recapture its photos. Forward jumps are not allowed.
    if (scan.isScanned) {
      if (isSingleScanVehicle || scan.id <= currentScanPage) {
        setCurrentScanPage(scan.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    playChimeTone('warning');
    // Each scan is submitted on its own, so any checkpoint may be scanned in any
    // order — the QR itself decides which page the worker is taken to.
    setScanWarnMsg(
      lang === 'ta'
        ? `⚠️ ஸ்கேன் ${scan.id}: QR கேமரா மூலம் ஸ்கேன் செய்தால் மட்டுமே பச்சையாக மாறும்!`
        : `⚠️ Scan ${scan.id}: Must be scanned using QR Camera to turn green!`
    );
    setTimeout(() => setScanWarnMsg(null), 4500);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [editToast, setEditToast] = useState<string | null>(null);

  // Scan-lock: check if this houseId has already been submitted
  const SCAN_LOCK_KEY = 'ccmc_scanned_addresses';
  const getScanLocked = (hId: string) => {
    try {
      const raw = localStorage.getItem(SCAN_LOCK_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj[hId] || null;
    } catch { return null; }
  };
  const [scanLockedData, setScanLockedData] = useState<any>(() => getScanLocked(cleanHouseId(scannedHouseId)));
  const isAlreadyScanned = false; // allow viewing live page

  // GPS Telemetry
  const [gpsLat, setGpsLat] = useState<number>(11.01684);
  const [gpsLng, setGpsLng] = useState<number>(76.95582);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3.2);
  const [gpsLocationName, setGpsLocationName] = useState<string>('Kamaraj Salai, Coimbatore');
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'live'>('locked');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (isSubmitting) return;

    /**
     * Each scan is submitted on its own: the worker scans a QR, photographs it,
     * presses Submit, and the run is recorded. There is no "go to the next
     * scan" step — the worker returns to the dashboard and comes back for the
     * next QR when they are ready.
     */
    if (!isSingleScanVehicle) {
      const pageScan = streetScans.find(s => s.id === currentScanPage);
      if (!pageScan?.isScanned) {
        setScanWarnMsg(lang === 'ta'
          ? `⚠️ ஸ்கேன் ${currentScanPage} QR ஐ முதலில் ஸ்கேன் செய்யவும்.`
          : `⚠️ Scan the Scan ${currentScanPage} QR first, then take its photos.`);
        setTimeout(() => setScanWarnMsg(null), 5000);
        return;
      }
      if (!pageScan.beforePhoto || !pageScan.afterPhoto) {
        setScanWarnMsg(lang === 'ta'
          ? `⚠️ ஸ்கேன் ${currentScanPage} க்கு முன் & பிறகு படங்கள் இரண்டும் தேவை.`
          : `⚠️ Scan ${currentScanPage} needs its BEFORE and AFTER photos.`);
        setTimeout(() => setScanWarnMsg(null), 5000);
        return;
      }
    } else if (!beforePhoto || !afterPhoto) {
      // Single-scan vehicles (BOV / push cart) need one before/after pair.
      const missing = !beforePhoto && !afterPhoto
        ? (lang === 'ta' ? 'குப்பை எடுக்கும் முன் & பிறகு படங்கள் இரண்டும் கட்டாயம்.'
                          : 'Both the BEFORE and AFTER photos are required.')
        : !beforePhoto
        ? (lang === 'ta' ? 'குப்பை எடுக்கும் முன் படம் கட்டாயம்.'
                          : 'The BEFORE photo is required.')
        : (lang === 'ta' ? 'குப்பை எடுக்கும் பிறகு படம் கட்டாயம்.'
                          : 'The AFTER photo is required.');
      setScanWarnMsg(`⚠️ ${missing}`);
      setTimeout(() => setScanWarnMsg(null), 5000);
      return;
    }

    setIsSubmitting(true);
    playChimeTone('success');

    const timestampStr = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    /**
     * Submitting means this checkpoint was collected: it was scanned and both
     * proof photos are attached. The street as a whole may still have QR
     * points outstanding, so the remaining count travels in the record for the
     * dashboard, but the outcome of this submission is a collection.
     */
    const finalCoverageStatus: CoverageStatus = isSingleScanVehicle
      ? formData.coverageStatus
      : 'Covered';

    let finalDoorNo = formData.doorNo ? formData.doorNo.trim() : '';
    if (!finalDoorNo) {
      if (isSingleScanVehicle) {
        finalDoorNo = lang === 'ta' ? 'விருப்பத்திற்குரியது (Pushcart)' : 'Optional ()';
      } else {
        finalDoorNo = "45";
      }
    }

    // Freeze the photos onto this checkpoint before the record is built, so the
    // submitted record definitely carries the pair the worker just captured.
    const finalScans = streetScans.map(s =>
      s.id === currentScanPage && s.beforePhoto && s.afterPhoto
        ? { ...s, photosCapturedAt: s.photosCapturedAt || getLiveScanTimeStr() }
        : s
    );

    const fallbackRecord: SWMSHouseholdRecord = {
      id: `REC-${Date.now()}`,
      houseId: formData.houseId || scannedHouseId,
      zone: formData.zone || "East Zone",
      ward: formData.ward || "Ward 12",
      siName: formData.siName || "K. Rajan",
      siContact: formData.siContact || "9876543210",
      ssName: formData.ssName || "M. Selvam",
      ssContact: formData.ssContact || "9876543211",
      cssName: formData.cssName || "S. Kumar",
      driverWorkerName: formData.driverWorkerName || "P. Murugan",
      driverWorkerContact: formData.driverWorkerContact || "9876543212",
      householderName: formData.householderName || "Ramanathan",
      householderContact: formData.householderContact || "9840123456",
      streetName: formData.streetName || "Kamaraj Salai",
      doorNo: finalDoorNo,
      coverageStatus: finalCoverageStatus,
      notCoveredReason: finalCoverageStatus === 'Not Covered' ? 'Other' : undefined,
      remarks: formData.remarks || `${completedScansCount}/5 QR Checkpoints Scanned (${finalCoverageStatus})`,
      latitude: gpsLat,
      longitude: gpsLng,
      gpsCoordinates: `${gpsLat.toFixed(5)}° N, ${gpsLng.toFixed(5)}° E`,
      locationName: gpsLocationName,
      gpsAccuracy: gpsAccuracy,
      gpsTimestamp: timestampStr,
      assignedVehicleId: assignedVehicleId || 'v-tata-ace',
      vehicleNo: formData.vehicleNo || (formData.vehicleType ? (assignedVehicleId || 'TN66AD6465') : 'TN66AD6465'),
      vehicleType: formData.vehicleType || 'TATA ACE',
      completedScansCount: completedScansCount,
      streetScans: finalScans,
      // Every checkpoint carries its own pair; the record-level fields keep the
      // first pair so older admin views still render something meaningful.
      proofPhoto: finalScans.find(s => s.afterPhoto)?.afterPhoto || afterPhoto || undefined,
      beforePhoto: finalScans.find(s => s.beforePhoto)?.beforePhoto || beforePhoto || undefined,
      afterPhoto: finalScans.find(s => s.afterPhoto)?.afterPhoto || afterPhoto || undefined,
      photos: finalScans.flatMap(s => [s.beforePhoto, s.afterPhoto]).filter(Boolean) as string[],
      submittedAt: timestampStr
    };

    // The just-captured pair is stored against its own checkpoint, so the
    // dashboard counts this scan straight away.
    setStreetScans(finalScans);

    onSubmitSuccess(fallbackRecord, finalCoverageStatus);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 w-full max-w-full overflow-x-hidden relative font-sans">
      
      {/* ── TOP GREEN CCMC HEADER (Image 1 Exact Layout) ── */}
      <div className="bg-[#044D29] px-2.5 sm:px-4 py-2 border-b border-[#033A1F] sticky top-0 z-30 shadow-md text-white max-w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Back button + CCMC Emblem + Smart City + Titles */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-none">
            <button
              type="button"
              onClick={onBackToScanner}
              className="w-8 h-8 rounded-full bg-[#02381C] hover:bg-[#012713] text-white flex items-center justify-center border border-emerald-600/40 shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
              title="Back to Scanner"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>

            {/* CCMC Emblem */}
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-xs flex-shrink-0 flex items-center justify-center">
              <img
                src={ccmcLogo}
                alt="Coimbatore City Municipal Corporation Emblem"
                referrerPolicy="no-referrer"
                onError={(e) => { if (e.currentTarget.src !== ccmcFallbackLogo) e.currentTarget.src = ccmcFallbackLogo; }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Smart City Logo */}
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-xs flex-shrink-0 flex items-center justify-center">
              <img
                src={smartCityLogo}
                alt="Smart City Mission Logo"
                referrerPolicy="no-referrer"
                onError={(e) => { if (e.currentTarget.src !== smartCityFallbackLogo) e.currentTarget.src = smartCityFallbackLogo; }}
                className="w-full h-full object-contain p-0.5"
              />
            </div>

            {/* Municipal Title */}
            <div className="min-w-0 flex flex-col justify-center leading-none">
              <div className="text-[11px] sm:text-sm font-black tracking-tight text-[#FFEB3B] truncate leading-tight drop-shadow-xs">
                Coimbatore City
              </div>
              <div className="text-[10px] sm:text-xs font-black tracking-tight text-[#FFEB3B] truncate leading-tight mt-0.5 drop-shadow-xs">
                Municipal Corporation
              </div>
              <div className="text-[9px] sm:text-[11px] font-black tracking-wider text-[#00E5FF] uppercase leading-tight mt-0.5 drop-shadow-xs truncate">
                SANITARY FIELD WORKER
              </div>
            </div>
          </div>

          {/* Right: Language Pill — wraps to its own line on very narrow screens
              so it never squeezes the CCMC title out of alignment. */}
          <div className="bg-[#02381C] border border-emerald-600/40 rounded-full p-0.5 flex items-center shadow-xs flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                if (onSetLanguage) onSetLanguage('ta');
                else if (lang !== 'ta' && onToggleLang) onToggleLang();
              }}
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                lang === 'ta'
                  ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Globe className={`w-3 h-3 ${lang === 'ta' ? 'text-slate-950' : 'text-emerald-300'}`} />
              <span>தமிழ்</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSetLanguage) onSetLanguage('en');
                else if (lang !== 'en' && onToggleLang) onToggleLang();
              }}
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Subheader Pill Bar (Field Officer | KAMARAJ SALAI | ICCC Live) */}
        <div className="mt-2 pt-1.5 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-[11px] font-bold min-w-0">
          <div className="bg-[#02381C] text-white px-2.5 py-0.5 rounded-full border border-emerald-600/40 flex items-center gap-1 min-w-0 max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span className="truncate">
              Field Officer: {formData.driverWorkerName || assignedVehicleId || '—'}
            </span>
          </div>

          <div className="bg-white text-[#044D29] px-3 py-0.5 rounded-full shadow-sm font-black text-[11px] sm:text-xs uppercase tracking-wider font-mono truncate max-w-[150px] sm:max-w-none">
            {formData.streetName || 'KAMARAJ SALAI'}
          </div>

          <div className="bg-[#02381C] text-white px-2.5 py-0.5 rounded-full border border-emerald-600/40 flex items-center gap-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span>ICCC Live</span>
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto w-full max-w-full overflow-x-hidden p-2.5 sm:p-4 space-y-3.5 sm:space-y-4 text-xs text-slate-800 pb-28">
        
        {/* Toast feedback */}
        {editToast && (
          <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{editToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditToast(null)}
              className="text-white hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* FIRST CARD: Location & Resident Summary */}
        <div className="bg-white p-3 sm:p-4 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-3 max-w-full overflow-hidden">
          {/* Header row: badges + Details. Stacks cleanly on narrow screens
              instead of relying on flex-wrap, which pushed the button around. */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 border border-emerald-200 text-[#00875A] flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00875A]" />
              </div>
              <div className="flex items-center gap-1 flex-wrap min-w-0">
                <span className="bg-[#00875A] text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase whitespace-nowrap">
                  {formData.vehicleType || 'TATA ACE'}
                </span>
                <span className="bg-[#8B5CF6] text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {formData.zone || 'East Zone'}
                </span>
                <span className="bg-[#FEF08A] text-slate-900 border border-amber-300 text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {formData.ward || 'Ward 12'}
                </span>
              </div>
            </div>

            {/* Action button: Details */}
            <div className="flex items-center flex-shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowMoreDetails(true)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1 cursor-pointer transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Details</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate max-w-full">
                {formData.streetName || 'Kamaraj Salai'}
              </h3>
              {formData.doorNo && !formData.doorNo.toLowerCase().includes('optional') && !formData.doorNo.includes('விருப்பத்திற்குரியது') ? (
                <span className="text-xs font-mono font-extrabold text-[#044D29] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Door #{formData.doorNo}
                </span>
              ) : isSingleScanVehicle ? (
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                  {lang === 'ta' ? 'கதவு எண்: விருப்பத்திற்குரியது (Pushcart)' : 'Door No: Optional (Pushcart)'}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1 flex-wrap min-w-0">
              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{formData.householderName || 'Ramanathan'}</span>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-slate-700">{formData.householderContact || '9840123456'}</span>
            </p>
            <p className="text-xs text-slate-500 font-medium truncate">
              Officers: SI {formData.siName || 'K. Rajan'} ({formData.siContact || '9876543210'}) • Driver {formData.driverWorkerName || 'P. Murugan'}
            </p>
          </div>
        </div>

        {/* SECOND CARD: STREET COVERAGE STATUS (VEHICLE / PUSHCART) */}
        {isSingleScanVehicle ? (
          <div className="bg-white p-4 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  {lang === 'ta' ? 'சேகரிப்பு நிலை (புஷ்கார்ட்)' : 'COVERAGE STATUS (PUSHCART)'}
                </h4>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                formData.coverageStatus === 'Covered'
                  ? 'bg-emerald-100 text-[#00875A] border-emerald-300'
                  : 'bg-[#FFEAEA] text-[#DC2626] border-red-200'
              }`}>
                {formData.coverageStatus === 'Covered'
                  ? (lang === 'ta' ? 'சேகரிக்கப்பட்டது ✓' : 'Covered ✓')
                  : (lang === 'ta' ? 'சேகரிக்கப்படவில்லை ✕' : 'Not Covered ✕')}
              </span>
            </div>

            {/* Subheader Instruction */}
            <div className="border-t border-slate-100 pt-2 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>{lang === 'ta' ? 'புஷ்கார்ட் குப்பை சேகரிப்பு நிலையைத் தேர்ந்தெடுக்கவும்:' : 'Select Pushcart Waste Collection Status:'}</span>
              <span className="text-[11px] text-slate-400 font-mono">Tap option</span>
            </div>

            {/* Covered / Not Covered Cards Selection */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Covered */}
              <button
                type="button"
                onClick={() => {
                  playChimeTone('success');
                  setFormData(prev => ({ ...prev, coverageStatus: 'Covered', notCoveredReason: undefined }));
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition active:scale-95 cursor-pointer text-center ${
                  formData.coverageStatus === 'Covered'
                    ? 'bg-[#E6F4EA] border-[#00D084] text-[#00875A] shadow-sm ring-2 ring-[#00D084]/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 font-black text-white ${
                  formData.coverageStatus === 'Covered' ? 'bg-[#00A86B]' : 'bg-slate-400'
                }`}>
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-sm font-black leading-tight">
                  {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Covered'}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  100% {lang === 'ta' ? 'நிறைவு' : 'Completed'}
                </span>
              </button>

              {/* Option 2: Not Covered */}
              <button
                type="button"
                onClick={() => {
                  playChimeTone('warning');
                  setFormData(prev => ({ ...prev, coverageStatus: 'Not Covered', notCoveredReason: 'Other' as NotCoveredReason }));
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition active:scale-95 cursor-pointer text-center ${
                  formData.coverageStatus === 'Not Covered'
                    ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B] shadow-sm ring-2 ring-[#EF4444]/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 font-black text-white ${
                  formData.coverageStatus === 'Not Covered' ? 'bg-[#EF4444]' : 'bg-slate-400'
                }`}>
                  <X className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-sm font-black leading-tight">
                  {lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Covered'}
                </span>
                <span className="text-[11px] font-bold text-rose-700 mt-0.5">
                  0% {lang === 'ta' ? 'விடுபட்டது' : 'Missed'}
                </span>
              </button>
            </div>

            {/* Reason selector if Not Covered */}
            {formData.coverageStatus === 'Not Covered' && (
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 space-y-2 animate-fadeIn">
                <label className="block text-[11px] font-black text-rose-900">
                  {lang === 'ta' ? 'சேகரிக்கப்படாததற்கான காரணம்:' : 'Reason for Not Covered:'}
                </label>
                <select
                  value={formData.notCoveredReason || 'Other'}
                  onChange={(e) => setFormData({ ...formData, notCoveredReason: e.target.value as NotCoveredReason })}
                  className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="Door Closed">{lang === 'ta' ? 'வீடு பூட்டப்பட்டுள்ளது (Door Closed)' : 'House Closed / Lockout'}</option>
                  <option value="Segregation Issue">{lang === 'ta' ? 'கழிவு பிரிக்கப்படவில்லை (Segregation Issue)' : 'Unsegregated Waste Refusal'}</option>
                  <option value="Road Block">{lang === 'ta' ? 'பாதை அடைப்பு (Road Block)' : 'Narrow Lane / Obstacle'}</option>
                  <option value="Other">{lang === 'ta' ? 'மற்ற காரணங்கள் (Other Reason)' : 'Other Reason'}</option>
                </select>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder={lang === 'ta' ? 'கூடுதல் விவரங்கள் / குறிப்பு உள்ளிடவும்...' : 'Enter additional remarks / details...'}
                  className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>
            )}

            {/* Bottom Alert Banner for Pushcart */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              formData.coverageStatus === 'Covered'
                ? 'bg-emerald-50 border-emerald-200 text-[#00875A]'
                : 'bg-[#FFEAEA] border-[#FCA5A5] text-[#991B1B]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white ${
                  formData.coverageStatus === 'Covered' ? 'bg-[#00A86B]' : 'bg-[#DC2626]'
                }`}>
                  {formData.coverageStatus === 'Covered' ? '✓' : '!'}
                </div>
                <div>
                  <h5 className="text-sm font-black leading-tight">
                    {formData.coverageStatus === 'Covered'
                      ? (lang === 'ta' ? 'தெரு சேகரிக்கப்பட்டது (Covered)' : 'STREET COVERED (PUSHCART)')
                      : (lang === 'ta' ? 'சேகரிக்கப்படவில்லை (Not Covered)' : 'NOT COVERED (PUSHCART)')}
                  </h5>
                  <p className="text-xs font-semibold opacity-90 mt-0.5">
                    {formData.coverageStatus === 'Covered'
                      ? (lang === 'ta' ? 'புஷ்கார்ட் மூலம் அனைத்துக் குப்பைகளும் சேகரிக்கப்பட்டது ✓' : 'Pushcart door-to-door collection complete ✓')
                      : (lang === 'ta' ? 'குப்பை சேகரிப்பு விடுபட்டது ⚠️' : 'Waste collection incomplete or missed ⚠️')}
                  </p>
                </div>
              </div>

              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                formData.coverageStatus === 'Covered' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`} />
            </div>
          </div>
        ) : (
          <div className="bg-white p-3 sm:p-4 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-3 sm:space-y-3.5 max-w-full overflow-hidden">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center space-x-1.5 min-w-0">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide truncate">
                  STREET COVERAGE STATUS (VEHICLE)
                </h4>
              </div>
              <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border flex-shrink-0 ${
                completedScansWithPhotos === 5
                  ? 'bg-emerald-100 text-[#00875A] border-emerald-300'
                  : completedScansWithPhotos === 4
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-[#FFEAEA] text-[#DC2626] border-red-200'
              }`}>
                {completedScansWithPhotos === 5 ? 'Covered' : completedScansWithPhotos === 4 ? 'Partially Covered' : 'Not Covered'}
              </span>
            </div>

            {/* Subheader */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-2.5 min-w-0">
              <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs font-black text-slate-800 min-w-0">
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00875A] flex-shrink-0" />
                <span className="truncate">
                  {isSingleScanVehicle
                    ? 'Checkpoint (1 photo pair)'
                    : `Scan ${currentScanPage} of ${TOTAL_SCAN_PAGES} (${completedScansWithPhotos} complete)`}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => handleResetAllScans()}
                  className="text-[10px] sm:text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 transition cursor-pointer"
                  title="Reset all 5 checkpoints to Pending X"
                >
                  Reset Scans
                </button>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                  {lang === 'ta' ? 'கேமரா ஸ்கேன்' : 'Camera QR'}
                </span>
              </div>
            </div>

            {/* Warning msg if user tries to tap cards manually */}
            {scanWarnMsg && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-2.5 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="truncate">{scanWarnMsg}</span>
                </div>
                <button type="button" onClick={() => setScanWarnMsg(null)} className="text-amber-700 hover:text-amber-900 font-black cursor-pointer flex-shrink-0">
                  ✕
                </button>
              </div>
            )}

            {/* TATA ACE runs one page at a time: only the current page's
                checkpoint is shown and editable, so photos cannot be mixed up
                between scans. The strip underneath is progress, not navigation. */}
            {!isSingleScanVehicle && (
              <div className="space-y-3">
                {/* Page progress strip — read-only */}
                <div className="grid grid-cols-5 gap-0.5 xs:gap-1 sm:gap-2.5 w-full">
                  {streetScans.map((scan) => {
                    const isDone = isScanComplete(scan);
                    const isCurrent = scan.id === currentScanPage;
                    return (
                      <div
                        key={scan.id}
                        className={`flex flex-col items-center justify-center py-1.5 xs:py-2 px-0 rounded-xl sm:rounded-2xl border sm:border-2 text-center select-none min-w-0 ${
                          isDone
                            ? 'bg-[#E6F4EA] border-[#00D084] text-slate-900'
                            : isCurrent
                            ? 'bg-amber-50 border-amber-400 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        } ${isCurrent ? 'ring-2 ring-offset-1 ring-emerald-500' : ''}`}
                        title={isDone
                          ? `Scan ${scan.id}: complete ✓`
                          : isCurrent
                          ? `Scan ${scan.id}: current page`
                          : `Scan ${scan.id}: not started`}
                      >
                        <div className={`w-5 h-5 xs:w-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black mb-0.5 sm:mb-1 shadow-2xs flex-shrink-0 ${
                          isDone ? 'bg-[#00A86B] text-white' : isCurrent ? 'bg-amber-500 text-white' : 'bg-slate-300 text-white'
                        }`}>
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] sm:text-xs">{scan.id}</span>
                          )}
                        </div>
                        <span className="text-[9px] xs:text-[10px] sm:text-xs font-black truncate w-full leading-tight text-slate-900">
                          Scan {scan.id}
                        </span>
                        <span className={`text-[8px] xs:text-[9px] sm:text-[11px] font-bold mt-0.5 leading-tight truncate w-full ${
                          isDone ? 'text-[#00A86B] font-mono' : isCurrent ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          {isDone ? (scan.scannedAt || 'Done ✓') : isCurrent ? (lang === 'ta' ? 'தற்போது' : 'Current') : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* The single card for this page */}
                <div
                  onClick={() => {
                    const s = streetScans.find(x => x.id === currentScanPage);
                    if (s) handleScanCardClick(s);
                  }}
                  className={`w-full rounded-2xl border-2 p-4 sm:p-5 flex items-center gap-4 cursor-pointer transition active:scale-[0.99] ${
                    isScanComplete(activePhotoScan)
                      ? 'bg-[#E6F4EA] border-[#00D084]'
                      : activePhotoScan?.isScanned
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-[#FEF2F2] border-[#FCA5A5]'
                  }`}
                  title={
                    isScanComplete(activePhotoScan)
                      ? `Scan ${currentScanPage} complete`
                      : `Scan ${currentScanPage}: QR Camera scan required`
                  }
                >
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-white text-lg flex-shrink-0 ${
                    isScanComplete(activePhotoScan) ? 'bg-[#00A86B]' : activePhotoScan?.isScanned ? 'bg-amber-500' : 'bg-[#EF4444]'
                  }`}>
                    {isScanComplete(activePhotoScan) ? <Check className="w-6 h-6 stroke-[3]" /> : currentScanPage}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                      {lang === 'ta' ? `ஸ்கேன் ${currentScanPage} — ${activePhotoScan?.locationName || ''}` : `Scan ${currentScanPage} — ${activePhotoScan?.locationName || 'Point QR'}`}
                    </div>
                    <div className={`text-[11px] sm:text-xs font-bold mt-0.5 ${
                      isScanComplete(activePhotoScan) ? 'text-[#00A86B]' : activePhotoScan?.isScanned ? 'text-amber-700' : 'text-[#DC2626]'
                    }`}>
                      {isScanComplete(activePhotoScan)
                        ? (lang === 'ta' ? 'ஸ்கேன் + படங்கள் முடிந்தது ✓' : `Scanned ${activePhotoScan?.scannedAt || ''} with photos ✓`)
                        : activePhotoScan?.isScanned
                        ? (lang === 'ta' ? 'ஸ்கேன் செய்தது — படங்கள் எடுக்கவும்' : 'QR scanned — now take the BEFORE and AFTER photos')
                        : (lang === 'ta' ? 'QR கேமரா மூலம் ஸ்கேன் செய்யவும்' : 'Tap and scan this QR with the camera')}
                    </div>
                  </div>
                  {isScanComplete(activePhotoScan) ? (
                    <Check className="w-5 h-5 text-[#00A86B] flex-shrink-0" />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* Single-scan vehicles keep the original 5-up grid */}
            {isSingleScanVehicle && (
              <div className="grid grid-cols-5 gap-0.5 xs:gap-1 sm:gap-2.5 w-full">
                {streetScans.map((scan) => {
                  const isDone = isScanComplete(scan);
                  const scannedOnly = scan.isScanned && !isDone;
                  return (
                    <div
                      key={scan.id}
                      onClick={() => handleScanCardClick(scan)}
                      className={`flex flex-col items-center justify-center py-1.5 xs:py-2 sm:py-3 px-0 rounded-xl sm:rounded-2xl border sm:border-2 text-center select-none cursor-pointer transition active:scale-95 min-w-0 ${
                        isDone ? 'bg-[#E6F4EA] border-[#00D084] text-slate-900' : scannedOnly ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                      }`}
                    >
                      <div className={`w-5 h-5 xs:w-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black mb-0.5 sm:mb-1 shadow-2xs flex-shrink-0 ${
                        isDone ? 'bg-[#00A86B] text-white' : scannedOnly ? 'bg-amber-500 text-white' : 'bg-[#EF4444] text-white'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : scannedOnly ? <Camera className="w-3 h-3" /> : <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
                      </div>
                      <span className="text-[9px] xs:text-[10px] sm:text-xs font-black truncate w-full leading-tight text-slate-900">Scan {scan.id}</span>
                      <span className={`text-[8px] xs:text-[9px] sm:text-[11px] font-bold mt-0.5 leading-tight truncate w-full ${isDone ? 'text-[#00A86B] font-mono' : scannedOnly ? 'text-amber-700' : 'text-[#DC2626]'}`}>
                        {isDone ? (scan.scannedAt || 'Done ✓') : scannedOnly ? (lang === 'ta' ? 'படம் தேவை' : 'Photos due') : 'Pending X'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Page guidance for the current scan */}
            {!isSingleScanVehicle && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] sm:text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>
                  {lang === 'ta'
                    ? `ஸ்கேன் ${currentScanPage} / ${TOTAL_SCAN_PAGES} — QR ஐ ஸ்கேன் செய்து, முன் & பிறகு படங்களை எடுத்து, சேமி பொத்தியவரை அடுத்து ஸ்கேனுக்குச் செல்லவும்.`
                    : `Scan ${currentScanPage} of ${TOTAL_SCAN_PAGES} — scan this QR, take its BEFORE and AFTER photos, then save to move to the next scan.`}
                  <span className="ml-1 font-mono">({completedScansWithPhotos}/{TOTAL_SCAN_PAGES} complete)</span>
                </span>
              </div>
            )}

            {/* Bottom Alert Banner inside Second Card */}
            <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 sm:gap-3 ${
              completedScansWithPhotos === 5
                ? 'bg-emerald-50 border-emerald-200 text-[#00875A]'
                : completedScansWithPhotos === 4
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-[#FFEAEA] border-[#FCA5A5] text-[#991B1B]'
            }`}>
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white text-sm sm:text-base ${
                  completedScansWithPhotos === 5
                    ? 'bg-[#00A86B]'
                    : completedScansWithPhotos === 4
                    ? 'bg-amber-600'
                    : 'bg-[#DC2626]'
                }`}>
                  {completedScansWithPhotos === 5 ? '✓' : '!'}
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs sm:text-sm font-black leading-tight text-[#C53030] break-words sm:truncate">
                    {completedScansWithPhotos === 5
                      ? 'STREET COVERED (5/5 CHECKPOINTS)'
                      : completedScansWithPhotos === 4
                      ? 'PARTIALLY COVERED (4/5 CHECKPOINTS)'
                      : `NOT COVERED (${completedScansCount}/5 CHECKPOINTS)`}
                  </h5>
                  <p className="text-[11px] sm:text-xs font-semibold text-[#991B1B] mt-0.5 break-words sm:truncate">
                    {completedScansWithPhotos === 5
                      ? 'All 5 checkpoints scanned • 100% Covered ✓'
                      : `${5 - completedScansCount} or fewer checkpoints scanned • Not Covered ⚠️ (${5 - completedScansCount} pending)`}
                  </p>
                </div>
              </div>

              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                completedScansWithPhotos === 5 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`} />
            </div>
          </div>
        )}

        {/* THIRD CARD: PROOF PHOTO COLLECTION (mandatory) */}
        <div className="bg-white p-4 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-3">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            className="hidden"
            id="photo-capture-input"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                {lang === 'ta' ? 'புகைப்படம் சேகரிப்பு (PROOF PHOTO)' : 'PROOF PHOTO COLLECTION'}
              </h4>
            </div>
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
              beforePhoto && afterPhoto
                ? 'bg-emerald-100 text-[#00875A] border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {beforePhoto && afterPhoto
                ? (lang === 'ta' ? '2/2 படங்கள் ✓' : '2/2 Photos ✓')
                : (lang === 'ta' ? 'கட்டாயம் / Mandatory' : 'Mandatory')}
            </span>
          </div>

          {/* Shows which of the 5 checkpoints this photo pair belongs to */}
          {!isSingleScanVehicle && (
            <div className="text-[11px] font-black text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
              {lang === 'ta'
                ? `ஸ்கேன் ${activePhotoScan?.id ?? 1} க்கான படங்கள்`
                : `Photos for Scan ${activePhotoScan?.id ?? 1} of 5`}
            </div>
          )}

          <div className="border-t border-slate-100 pt-2.5 space-y-3">
            {(!beforePhoto || !afterPhoto) && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <span>
                  {lang === 'ta'
                    ? 'குப்பை எடுக்கும் முன் & பிறகு படங்கள் இரண்டும் கட்டாயம்.'
                    : 'Both the BEFORE and AFTER photos are required to submit.'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([['before', beforePhoto, 'BEFORE', lang === 'ta' ? 'சேகரிப்புக்கு முன்' : 'Before Collection'],
                 ['after', afterPhoto, 'AFTER', lang === 'ta' ? 'சேகரிப்புக்கு பிறகு' : 'After Collection']] as const).map(
                ([slot, photo, tag, caption]) => (
                  <div key={slot} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        photo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tag}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">{caption}</span>
                    </div>

                    {photo ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-900 shadow-sm">
                        <img
                          src={photo}
                          alt={tag}
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {tag} ✓
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(slot)}
                          className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                          title={lang === 'ta' ? 'புகைப்படத்தை நீக்கு' : 'Remove Photo'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-40 sm:h-48 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/40 flex flex-col items-center justify-center gap-1.5 text-rose-400">
                        <ImageIcon className="w-7 h-7" />
                        <span className="text-[10px] font-bold">
                          {lang === 'ta' ? 'படம் இல்லை' : 'No photo'}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => openCameraFor(slot)}
                      className={`w-full flex items-center justify-center gap-2 font-black py-2.5 px-3 rounded-2xl text-xs transition active:scale-95 cursor-pointer border select-none ${
                        photo
                          ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          : 'bg-[#00875A] text-white border-emerald-600/40 hover:bg-[#00704A]'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>
                        {photo
                          ? (lang === 'ta' ? 'மீண்டும் எடு' : 'Retake')
                          : (lang === 'ta' ? 'படம் எடு' : 'Take Photo')}
                      </span>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM BUTTON (Image 2 Exact Layout) */}
        <div className="pt-2 sticky bottom-0 z-30 pb-3 bg-white/90 backdrop-blur-xs space-y-2">
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isSubmitting}
            className={`w-full text-white font-black py-4 px-4 rounded-2xl text-sm sm:text-base transition shadow-xl flex items-center justify-center space-x-2 border active:scale-98 cursor-pointer disabled:opacity-60 ${
              (isSingleScanVehicle
                ? formData.coverageStatus === 'Covered'
                : isScanComplete(activePhotoScan))
                ? 'bg-[#00875A] hover:bg-[#00704A] border-emerald-500/40'
                : 'bg-[#B91C1C] hover:bg-[#991B1B] border-red-500/40'
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white transform rotate-45" />
            )}
            <span className="font-black text-white text-base">
              {isSubmitting
                ? (lang === 'ta' ? 'சமர்ப்பிக்கப்படுகிறது...' : 'Submitting Status...')
                : isSingleScanVehicle
                ? (!beforePhoto || !afterPhoto)
                  ? (!beforePhoto && !afterPhoto
                    ? (lang === 'ta' ? '📷 முன் & பிறகு படங்கள் எடுக்கவும்' : '📷 Take BEFORE & AFTER Photos')
                    : !beforePhoto
                      ? (lang === 'ta' ? '📷 முன் படம் எடுக்கவும்' : '📷 Take BEFORE Photo')
                      : (lang === 'ta' ? '📷 பிறகு படம் எடுக்கவும்' : '📷 Take AFTER Photo'))
                  : formData.coverageStatus === 'Covered'
                    ? (lang === 'ta' ? 'சேகரிக்கப்பட்டது நிலை சமர்ப்பி (Submit Covered)' : 'Submit Covered Status')
                    : (lang === 'ta' ? '⚠️ சேகரிக்கப்படவில்லை நிலை சமர்ப்பி' : '⚠️ Submit Not Covered Status')
                /* TATA ACE: submit this scan on its own — the worker returns to
                   the dashboard and returns for the next QR when ready. */
                : !activePhotoScan?.isScanned
                ? (lang === 'ta' ? `📷 ஸ்கேன் ${currentScanPage} QR ஐ ஸ்கேன் செய்யவும்` : `📷 Scan the Scan ${currentScanPage} QR first`)
                : (!beforePhoto || !afterPhoto)
                ? (!beforePhoto && !afterPhoto
                  ? (lang === 'ta' ? '📷 முன் & பிறகு படங்கள் எடுக்கவும்' : '📷 Take BEFORE & AFTER Photos')
                  : !beforePhoto
                    ? (lang === 'ta' ? '📷 முன் படம் எடுக்கவும்' : '📷 Take BEFORE Photo')
                    : (lang === 'ta' ? '📷 பிறகு படம் எடுக்கவும்' : '📷 Take AFTER Photo'))
                : (lang === 'ta'
                  ? `✅ ஸ்கேன் ${currentScanPage} சமர்ப்பி (${completedScansWithPhotos}/${TOTAL_SCAN_PAGES})`
                  : `Submit Scan ${currentScanPage} (${completedScansWithPhotos}/${TOTAL_SCAN_PAGES})`)}
            </span>
          </button>
        </div>

      </form>

      {/* EDIT HOUSEHOLD & OFFICER DETAILS MODAL (Image 3 & Image 4 Exact Layout) */}
      {showMoreDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white border-2 border-emerald-500 rounded-[24px] sm:rounded-[28px] max-w-full sm:max-w-[640px] w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">

            {/* Modal Header */}
            <div className="bg-[#166534] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-black text-white tracking-tight leading-tight truncate">
                    ✏️ Edit Household &amp; Officer Details
                  </h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-emerald-100 truncate mt-0.5 font-mono">
                    {formData.houseId || 'HID100101'} • {formData.streetName || 'Kamaraj Salai'} • {formData.ward || 'Ward 12'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreDetails(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 5 Editable Card Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-slate-800 bg-[#F4F6F5]">

              {/* 1. ZONE & WARD */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>ZONE &amp; WARD</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Zone</label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="East Zone">East Zone</option>
                      <option value="Central Zone">Central Zone</option>
                      <option value="West Zone">West Zone</option>
                      <option value="North Zone">North Zone</option>
                      <option value="South Zone">South Zone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ward</label>
                    <select
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Ward 12">Ward 12</option>
                      <option value="Ward 14">Ward 14</option>
                      <option value="Ward 15">Ward 15</option>
                      <option value="Ward 18">Ward 18</option>
                      <option value="Ward 20">Ward 20</option>
                      <option value="Ward 24">Ward 24</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. SANITARY INSPECTOR (SI) */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SANITARY INSPECTOR (SI)</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SI Name</label>
                    <input
                      type="text"
                      value={formData.siName}
                      onChange={(e) => setFormData({ ...formData, siName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="K. Rajan"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SI Contact</label>
                    <input
                      type="text"
                      value={formData.siContact}
                      onChange={(e) => setFormData({ ...formData, siContact: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* 3. SUPERVISORS (SS & CSS) */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>SUPERVISORS (SS &amp; CSS)</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SS Name</label>
                    <input
                      type="text"
                      value={formData.ssName}
                      onChange={(e) => setFormData({ ...formData, ssName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="M. Selvam"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">CSS Name</label>
                    <input
                      type="text"
                      value={formData.cssName}
                      onChange={(e) => setFormData({ ...formData, cssName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="S. Kumar"
                    />
                  </div>
                </div>
              </div>

              {/* 4. DRIVER & VEHICLE */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4" />
                  <span>DRIVER &amp; VEHICLE</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle Type</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                    >
                      <option value="TATA ACE">TATA ACE</option>
                      <option value="PUSH CART">PUSH CART</option>
                      <option value="BOV">BOV</option>
                      <option value="COMPACTOR">COMPACTOR</option>
                      <option value="OBL PRIVATE">OBL PRIVATE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleNo}
                      onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g. TN66AE6121"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={formData.driverWorkerName}
                      onChange={(e) => setFormData({ ...formData, driverWorkerName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="P. Murugan"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Contact</label>
                    <input
                      type="text"
                      value={formData.driverWorkerContact}
                      onChange={(e) => setFormData({ ...formData, driverWorkerContact: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="9876543212"
                    />
                  </div>
                </div>
              </div>

              {/* 5. HOUSEHOLDER INFO & ADDRESS */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>HOUSEHOLDER INFO &amp; ADDRESS</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Householder</label>
                    <input
                      type="text"
                      value={formData.householderName}
                      onChange={(e) => setFormData({ ...formData, householderName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Ramanathan"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.householderContact}
                      onChange={(e) => setFormData({ ...formData, householderContact: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="9840123456"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Name</label>
                    <input
                      type="text"
                      value={formData.streetName}
                      onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Kamaraj Salai"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {lang === 'ta' ? 'கதவு எண் (Door No)' : 'Door No'}{' '}
                      {isSingleScanVehicle ? (
                        <span className="text-amber-600 font-extrabold">
                          ({lang === 'ta' ? 'விருப்பத்திற்குரியது - Pushcart' : 'Optional - Pushcart'})
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">
                          ({lang === 'ta' ? 'கட்டாயம்' : 'Required'})
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.doorNo}
                      onChange={(e) => setFormData({ ...formData, doorNo: e.target.value })}
                      className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        isSingleScanVehicle ? 'border-amber-300 focus:ring-amber-500' : 'border-slate-300'
                      }`}
                      placeholder={
                        isSingleScanVehicle
                          ? (lang === 'ta' ? 'விருப்பத்திற்குரியது (Pushcart)...' : 'Optional for ' + singleScanLabel + '...')
                          : 'e.g. 45 or 12A'
                      }
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 italic">Changes apply immediately to this entry</span>
              <button
                type="button"
                onClick={() => {
                  setShowMoreDetails(false);
                  setEditToast('✅ Changes saved successfully!');
                  setTimeout(() => setEditToast(null), 3500);
                }}
                className="bg-[#166534] hover:bg-[#113B22] text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; Apply Changes</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── LIVE CAMERA VIEWFINDER MODAL ── */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none animate-fadeIn">
          {/* Top Bar */}
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between text-white border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-sm font-black tracking-wide">
                {lang === 'ta' ? 'புகைப்படம் எடுக்கவும் (Live Camera)' : 'Take Photo (Live Camera)'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleStopCamera}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition active:scale-95"
              title="Close Camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Stream Container */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Target Framing Guide */}
            <div className="absolute inset-8 sm:inset-16 border-2 border-emerald-400/60 rounded-3xl pointer-events-none flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              </div>
              <div className="text-center text-xs font-bold text-white bg-black/50 backdrop-blur-xs py-1.5 px-4 rounded-full self-center border border-white/20">
                {lang === 'ta' ? 'குப்பை சேகரிப்பு சான்றை படமெடுக்கவும்' : 'Frame waste collection proof'}
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              </div>
            </div>

            {/* Camera error message fallback */}
            {cameraError && (
              <div className="absolute top-4 inset-x-4 bg-rose-600/90 text-white text-xs font-bold p-3 rounded-2xl backdrop-blur-md text-center">
                {cameraError}
              </div>
            )}
          </div>

          {/* Bottom Shutter & Controls Bar */}
          <div className="bg-slate-900/95 backdrop-blur-md px-6 py-5 flex items-center justify-around text-white border-t border-slate-800">
            {/* Flip Camera Button */}
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer active:scale-95 border border-slate-700 shadow-md"
              title="Switch Camera"
            >
              <RefreshCw className="w-5 h-5 text-emerald-300" />
              <span className="text-[9px] mt-0.5">Flip</span>
            </button>

            {/* Main Shutter Button */}
            <button
              type="button"
              onClick={handleSnapPhoto}
              className="w-20 h-20 rounded-full border-4 border-white bg-emerald-600 hover:bg-emerald-500 active:scale-90 transition shadow-2xl flex items-center justify-center cursor-pointer relative"
              title="Snap Photo"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner">
                <div className="w-13 h-13 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-white" />
                </div>
              </div>
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleStopCamera}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer active:scale-95 border border-slate-700 shadow-md"
              title="Cancel"
            >
              <X className="w-5 h-5 text-rose-400" />
              <span className="text-[9px] mt-0.5">Cancel</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};



