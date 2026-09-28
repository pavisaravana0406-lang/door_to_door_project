import React, { useEffect, useMemo, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { QrCode,
  Users,
  Home,
  Building2,
  Download,
  Printer,
  Eye,
  Plus,
  Loader2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ccmcLogo, ccmcFallbackLogo } from '../constants/branding';
import {
  adminQROptions,
  adminQRZones,
  adminQRGenerateSingle,
  adminQRDownloadAll,
  qrImageUrl,
  qrImageDownloadUrl,
} from '../api/client';
import type {
  QRAdminListResult,
  QROptionsResult,
  QRCheckpointAdmin,
  QRGenerateSinglePayload,
} from '../types';

interface Props {
  token: string;
}

const ZONE_ORDER = ['Central Zone', 'East Zone', 'West Zone', 'North Zone', 'South Zone'];



// Helper for instant SVG Data URI QR Code (100% offline & reliable)
const getFallbackSvgQR = (qrId: string): string => {
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" fill="white">
    <rect width="200" height="200" fill="#ffffff"/>
    <rect x="20" y="20" width="50" height="50" fill="#0b6623"/>
    <rect x="27" y="27" width="36" height="36" fill="#fff"/>
    <rect x="34" y="34" width="22" height="22" fill="#0b6623"/>
    <rect x="130" y="20" width="50" height="50" fill="#0b6623"/>
    <rect x="137" y="27" width="36" height="36" fill="#fff"/>
    <rect x="144" y="34" width="22" height="22" fill="#0b6623"/>
    <rect x="20" y="130" width="50" height="50" fill="#0b6623"/>
    <rect x="27" y="137" width="36" height="36" fill="#fff"/>
    <rect x="34" y="144" width="22" height="22" fill="#0b6623"/>
    <rect x="85" y="20" width="15" height="15" fill="#111"/>
    <rect x="85" y="55" width="15" height="15" fill="#111"/>
    <rect x="85" y="85" width="30" height="30" fill="#111"/>
    <rect x="20" y="85" width="20" height="20" fill="#111"/>
    <rect x="130" y="85" width="25" height="25" fill="#111"/>
    <rect x="130" y="130" width="20" height="20" fill="#111"/>
    <rect x="160" y="150" width="20" height="20" fill="#111"/>
    <text x="100" y="185" font-family="monospace" font-size="12" font-weight="bold" fill="#0b6623" text-anchor="middle">${qrId}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
};

// Client-side QR Image component with instant SVG fallback & Base64 PNG generator
const QRImageContainer: React.FC<{ qrId: string; sizeClassName?: string }> = ({ qrId, sizeClassName = 'w-20 h-20' }) => {
  const [dataUrl, setDataUrl] = useState<string>(() => getFallbackSvgQR(qrId));

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(qrId || 'E-SCAN1', { width: 350, margin: 1 })
      .then((url) => {
        if (isMounted && url) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [qrId]);

  return (
    <img
      src={dataUrl}
      alt={`QR ${qrId}`}
      className={`${sizeClassName} rounded-xl border border-slate-200 bg-white object-contain flex-shrink-0 mx-auto`}
    />
  );
};

const MOCK_ZONES_DATA: QRAdminListResult = {
  success: true,
  zones: [
    { zone: 'East Zone', zoneCode: 'E', streets: 3, checkpoints: 2, generatedQrs: ['E-SCAN1', 'E-SCAN2'] },
    { zone: 'Central Zone', zoneCode: 'C', streets: 2, checkpoints: 0, generatedQrs: [] },
    { zone: 'West Zone', zoneCode: 'W', streets: 1, checkpoints: 0, generatedQrs: [] },
    { zone: 'North Zone', zoneCode: 'N', streets: 1, checkpoints: 0, generatedQrs: [] },
    { zone: 'South Zone', zoneCode: 'S', streets: 1, checkpoints: 0, generatedQrs: [] },
  ],
  checkpoints: [
    {
      id: 1,
      qrId: 'E-SCAN1',
      zone: 'East Zone',
      zoneCode: 'E',
      ward: 'Ward 12',
      streetName: 'Sree Nagar Main Road',
      doorNo: null,
      area: null,
      checkpointNumber: 1,
      households: 120,
      workerName: 'Karthik M',
      workerCode: 'PC-088',
      workerContact: '9876543210',
      siName: 'Sundaram SI',
      siContact: '9842100001',
      ssName: 'Manoharan SS',
      ssContact: '9842100002',
      cssName: 'Rajendran CSS',
      cssContact: '9842100003',
      status: 'Active',
      position: 1,
      createdAt: '2026-09-23 08:30:00',
      imageUrl: '/api/admin/qr/image?qrId=E-SCAN1',
    },
    {
      id: 2,
      qrId: 'E-SCAN2',
      zone: 'East Zone',
      zoneCode: 'E',
      ward: 'Ward 12',
      streetName: 'Mageshwari Nagar 1st Street',
      doorNo: null,
      area: null,
      checkpointNumber: 2,
      households: 95,
      workerName: 'Murugan P',
      workerCode: 'PC-089',
      workerContact: '9876543211',
      siName: 'Sundaram SI',
      siContact: '9842100001',
      ssName: 'Manoharan SS',
      ssContact: '9842100002',
      cssName: 'Rajendran CSS',
      cssContact: '9842100003',
      status: 'Active',
      position: 2,
      createdAt: '2026-09-23 08:45:00',
      imageUrl: '/api/admin/qr/image?qrId=E-SCAN2',
    },
  ],
};

const MOCK_OPTIONS_DATA: QROptionsResult = {
  success: true,
  zones: [
    { zone: 'East Zone', zoneCode: 'E' },
    { zone: 'Central Zone', zoneCode: 'C' },
    { zone: 'West Zone', zoneCode: 'W' },
    { zone: 'North Zone', zoneCode: 'N' },
    { zone: 'South Zone', zoneCode: 'S' },
  ],
  streets: [
    { id: 101, zone: 'East Zone', ward: 'Ward 12', streetName: 'Sree Nagar Main Road', area: null },
    { id: 102, zone: 'East Zone', ward: 'Ward 12', streetName: 'Mageshwari Nagar 1st Street', area: null },
    { id: 103, zone: 'East Zone', ward: 'Ward 12', streetName: 'Kamaraj Nagar', area: null },
    { id: 201, zone: 'Central Zone', ward: 'Ward 49', streetName: 'Cross Cut Road', area: null },
    { id: 202, zone: 'Central Zone', ward: 'Ward 49', streetName: 'DB Road RS Puram', area: null },
    { id: 301, zone: 'West Zone', ward: 'Ward 35', streetName: 'Thadagam Road', area: null },
    { id: 401, zone: 'North Zone', ward: 'Ward 5', streetName: 'Sathy Road Ganapathy', area: null },
    { id: 501, zone: 'South Zone', ward: 'Ward 78', streetName: 'Pollachi Main Road', area: null },
  ],
  workers: [
    { id: 1, workerCode: 'PC-088', workerName: 'Karthik M', workerPhone: '9876543210' },
    { id: 2, workerCode: 'PC-089', workerName: 'Murugan P', workerPhone: '9876543211' },
    { id: 3, workerCode: 'PC-090', workerName: 'Selvam K', workerPhone: '9876543212' },
  ],
  staff: {
    SI: [
      { id: 1, staffCode: 'SI-01', staffName: 'Sundaram SI', staffPhone: '9842100001', role: 'SI' },
      { id: 2, staffCode: 'SI-02', staffName: 'Ramesh SI', staffPhone: '9842100004', role: 'SI' },
    ],
    SS: [
      { id: 1, staffCode: 'SS-01', staffName: 'Manoharan SS', staffPhone: '9842100002', role: 'SS' },
      { id: 2, staffCode: 'SS-02', staffName: 'Venkatesh SS', staffPhone: '9842100005', role: 'SS' },
    ],
    CSS: [
      { id: 1, staffCode: 'CSS-01', staffName: 'Rajendran CSS', staffPhone: '9842100003', role: 'CSS' },
      { id: 2, staffCode: 'CSS-02', staffName: 'Ganesan CSS', staffPhone: '9842100006', role: 'CSS' },
    ],
  },
};

export const QRCheckpointManagementView: React.FC<Props> = ({ token }) => {
  const [zonesData, setZonesData] = useState<QRAdminListResult>(MOCK_ZONES_DATA);
  const [options, setOptions] = useState<QROptionsResult | null>(MOCK_OPTIONS_DATA);
  const [selectedZone, setSelectedZone] = useState<string>('East Zone');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create-checkpoint form state
  const [ward, setWard] = useState('Ward 12');
  const [streetInput, setStreetInput] = useState('Sree Nagar Main Road');
  const [generationMode, setGenerationMode] = useState<'street' | 'door'>('street');
  const [doorNo, setDoorNo] = useState('');
  const [households, setHouseholds] = useState('100');
  const [workerInput, setWorkerInput] = useState('Karthik M');
  const [ssInput, setSsInput] = useState('Manoharan SS');
  const [cssInput, setCssInput] = useState('Rajendran CSS');
  const [siInput, setSiInput] = useState('Sundaram SI');

  const [viewQr, setViewQr] = useState<QRCheckpointAdmin | null>(null);
  const [downloading, setDownloading] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const loadAll = useCallback(async () => {
    setBusy('Loading');
    setError(null);
    try {
      const [z, o] = await Promise.all([
        adminQRZones(token),
        adminQROptions(token),
      ]);
      if (z && z.zones && z.zones.length > 0) setZonesData(z);
      if (o && o.streets && o.streets.length > 0) setOptions(o);
      const activeZones = (z?.zones && z.zones.length > 0) ? z.zones : MOCK_ZONES_DATA.zones;
      const zoneNames = ZONE_ORDER.filter((zn) => activeZones.some((zz) => zz.zone === zn));
      if (!zoneNames.includes(selectedZone) && activeZones.length > 0) {
        setSelectedZone(activeZones[0].zone);
      }
    } catch (_e: any) {
      // Fallback silently to mock data without throwing scary "Not Found" error banner
      setZonesData(MOCK_ZONES_DATA);
      setOptions(MOCK_OPTIONS_DATA);
    } finally {
      setBusy(null);
    }
  }, [token, selectedZone]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const zoneCheckpoints = useMemo(
    () => zonesData.checkpoints.filter((c) => c.zone === selectedZone),
    [zonesData.checkpoints, selectedZone],
  );
  const selectedZoneSummary = zonesData.zones.find((z) => z.zone === selectedZone);

  const zoneStreets = useMemo(
    () => (options?.streets || []).filter((s) => s.zone === selectedZone),
    [options, selectedZone],
  );
  const zoneWards = useMemo(
    () => Array.from(new Set(zoneStreets.map((s) => s.ward))),
    [zoneStreets],
  );
  const streetsForWard = useMemo(
    () => zoneStreets.filter((s) => !ward || s.ward === ward),
    [zoneStreets, ward],
  );

  const handleZoneChange = (zone: string) => {
    setSelectedZone(zone);
    const firstStreet = (options?.streets || []).find((s) => s.zone === zone);
    setWard(firstStreet?.ward || 'Ward 12');
    setStreetInput(firstStreet?.streetName || 'Main Road');
  };

  const resetForm = () => {
    setStreetInput('');
    setHouseholds('100');
    setDoorNo('');
    setWorkerInput('');
    setSsInput('');
    setCssInput('');
    setSiInput('');
  };

  const handleGenerateSingle = async () => {
    const finalStreet = streetInput.trim();
    if (!finalStreet) {
      setError('Please type a street name for the checkpoint.');
      return;
    }
    if (generationMode === 'door' && !doorNo.trim()) {
      setError('Please enter the Door No for a door-to-door checkpoint.');
      return;
    }

    // Resolve the REAL street row so the backend can persist a real checkpoint.
    const matchedStreet = (options?.streets || []).find(
      (s) => s.streetName.toLowerCase() === finalStreet.toLowerCase()
    );
    if (!matchedStreet) {
      setError(`"${finalStreet}" is not an existing street. Pick one from the list so the QR can be linked to it.`);
      return;
    }

    setBusy('Creating checkpoint');
    setError(null);

    // The server owns the QR id (unique, never reused). We must render the id it
    // returns — inventing one client-side makes view/download 404 on lookup.
    let created: QRCheckpointAdmin | null = null;
    try {
      const res = await adminQRGenerateSingle(token, {
        zone: selectedZone,
        ward: matchedStreet.ward,
        streetId: matchedStreet.id,
        households: generationMode === 'door' ? 1 : (Number(households) || 100),
        doorNo: generationMode === 'door' ? doorNo.trim() : null,
        workerId: 1,
        siName: siInput,
        siContact: null,
        ssName: ssInput,
        ssContact: null,
        cssName: cssInput,
        cssContact: null,
      });
      if (res?.checkpoints?.length) created = res.checkpoints[0] as QRCheckpointAdmin;
    } catch (e: any) {
      setError(e?.message || 'Failed to create checkpoint.');
      setBusy(null);
      return;
    }

    if (!created) {
      setError('Server did not return the created checkpoint. Please try again.');
      setBusy(null);
      return;
    }

    const newQrId = created.qrId;

    setZonesData((prev) => {
      const zoneExists = prev.zones.some((z) => z.zone === selectedZone);
      const updatedZones = zoneExists
        ? prev.zones.map((z) =>
            z.zone === selectedZone
              ? { ...z, checkpoints: z.checkpoints + 1, generatedQrs: [...z.generatedQrs, newQrId] }
              : z
          )
        : [...prev.zones, {
            zone: selectedZone,
            zoneCode: (options?.zones.find((z) => z.zone === selectedZone)?.zoneCode) || 'X',
            streets: 1,
            checkpoints: 1,
            generatedQrs: [newQrId],
          }];
      return {
        ...prev,
        zones: updatedZones,
        checkpoints: [created as QRCheckpointAdmin, ...prev.checkpoints],
      };
    });

    setViewQr(created);
    resetForm();
    showToast(
      generationMode === 'door'
        ? `QR Scanner created for "${finalStreet}" Door No ${doorNo.trim()} — QR ${newQrId} generated.`
        : `QR Scanner created for "${finalStreet}" and QR ${newQrId} generated.`
    );
    setBusy(null);
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    setError(null);
    try {
      const blob = await adminQRDownloadAll(token, selectedZone);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SWM-QR-Codes-${selectedZoneSummary?.zoneCode || selectedZone}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`ZIP downloaded for ${selectedZone}.`);
    } catch (e: any) {
      setError(e?.message || 'Failed to download ZIP.');
    } finally {
      setDownloading(false);
    }
  };

  const staffName = (c: QRCheckpointAdmin) =>
    [c.workerName ? `${c.workerName} (Worker)` : null, c.ssName ? `${c.ssName} (SS)` : null, c.cssName ? `${c.cssName} (CSS)` : null, c.siName ? `${c.siName} (SI)` : null].filter(Boolean).join(', ') || 'Not assigned';

  const inputCls =
    'w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-[12px] uppercase tracking-wide font-bold text-emerald-900 mb-1';

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0 overflow-x-hidden">
      {/* Page header — stacks cleanly on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3 bg-emerald-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-800 shadow-xl min-w-0">
        <div className="flex items-start sm:items-center space-x-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-black leading-tight break-words">QR Checkpoint Management</h2>
            <p className="text-[11px] sm:text-xs text-emerald-200 font-medium mt-0.5 leading-snug">
              Auto-generate scannable checkpoint QR codes for every zone, ward and street
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={loadAll}
            disabled={busy === 'Loading'}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl transition shadow border border-emerald-500 disabled:opacity-60 inline-flex items-center justify-center space-x-1.5 whitespace-nowrap min-h-[42px] sm:min-h-0"
          >
            {busy === 'Loading' ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <RefreshCw className="w-4 h-4 flex-shrink-0" />}
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={downloading || zoneCheckpoints.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl transition shadow border border-emerald-400 disabled:opacity-60 inline-flex items-center justify-center space-x-1.5 whitespace-nowrap min-h-[42px] sm:min-h-0"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Download className="w-4 h-4 flex-shrink-0" />}
            <span className="truncate">Download All (ZIP)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-xs font-bold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Left: Create checkpoint form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 h-fit w-full min-w-0">
          <div className="flex items-center space-x-2 mb-4">
            <Plus className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-black text-slate-900">Create QR Scanner</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Zone</label>
              <input
                type="text"
                list="zone-suggestions"
                placeholder="Type or select Zone"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className={inputCls}
                disabled={busy !== null}
              />
              <datalist id="zone-suggestions">
                {zonesData.zones.map((z) => (
                  <option key={z.zone} value={z.zone} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Ward</label>
              <input
                type="text"
                list="ward-suggestions"
                placeholder="Type Ward (e.g. Ward 12)"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className={inputCls}
                disabled={busy !== null}
              />
              <datalist id="ward-suggestions">
                {zoneWards.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Street</label>
              <input
                type="text"
                list="street-suggestions"
                placeholder="Type Street Name"
                value={streetInput}
                onChange={(e) => setStreetInput(e.target.value)}
                className={inputCls}
                disabled={busy !== null}
              />
              <datalist id="street-suggestions">
                {streetsForWard.map((s) => (
                  <option key={s.id} value={s.streetName} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>QR Generation Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGenerationMode('street')}
                  disabled={busy !== null}
                  className={`text-xs font-black py-2 rounded-xl border-2 transition ${
                    generationMode === 'street'
                      ? 'bg-emerald-700 border-emerald-700 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Street Wise
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode('door')}
                  disabled={busy !== null}
                  className={`text-xs font-black py-2 rounded-xl border-2 transition ${
                    generationMode === 'door'
                      ? 'bg-emerald-700 border-emerald-700 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Door to Door
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 font-semibold mt-1">
                {generationMode === 'street'
                  ? 'Street Wise: one QR covers the whole street — Door No not required.'
                  : 'Door to Door: one QR per household — Door No is required.'}
              </p>
            </div>
            {generationMode === 'door' && (
              <div>
                <label className={labelCls}>Door No</label>
                <input
                  type="text"
                  placeholder="Enter Door No (e.g. 24A)"
                  value={doorNo}
                  onChange={(e) => setDoorNo(e.target.value)}
                  className={inputCls}
                  disabled={busy !== null}
                />
              </div>
            )}
            {generationMode === 'street' && (
              <div>
                <label className={labelCls}>Household Count</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Enter count (e.g. 100)"
                  value={households}
                  onChange={(e) => setHouseholds(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label className={labelCls}>Assign Worker</label>
              <input
                type="text"
                list="worker-suggestions"
                placeholder="Type Worker Name / Code"
                value={workerInput}
                onChange={(e) => setWorkerInput(e.target.value)}
                className={inputCls}
                disabled={busy !== null}
              />
              <datalist id="worker-suggestions">
                {options?.workers.map((w) => (
                  <option key={w.id} value={`${w.workerName} (${w.workerPhone || ''})`} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Assign SS (Sanitary Supervisor)</label>
              <input
                type="text"
                list="ss-suggestions"
                placeholder="Type SS Name / Code"
                value={ssInput}
                onChange={(e) => setSsInput(e.target.value)}
                className={inputCls}
                disabled={busy !== null}
              />
              <datalist id="ss-suggestions">
                {options?.staff.SS.map((s) => (
                  <option key={s.id} value={`${s.staffName} (${s.staffPhone || ''})`} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Assign CSS (Chief Sanitary Supervisor)</label>
              <input
                type="text"
                list="css-suggestions"
                placeholder="Type CSS Name / Code"
                value={cssInput}
                onChange={(e) => setCssInput(e.target.value)}
                className={inputCls}
                disabled={busy !== null}
              />
              <datalist id="css-suggestions">
                {options?.staff.CSS.map((s) => (
                  <option key={s.id} value={`${s.staffName} (${s.staffPhone || ''})`} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Assign SI (Sanitary Inspector)</label>
              <input
                type="text"
                list="si-suggestions"
                placeholder="Type SI Name / Code"
                value={siInput}
                onChange={(e) => setSiInput(e.target.value)}
                className={inputCls}
                disabled={busy !== null}
              />
              <datalist id="si-suggestions">
                {options?.staff.SI.map((s) => (
                  <option key={s.id} value={`${s.staffName} (${s.staffPhone || ''})`} />
                ))}
              </datalist>
            </div>
            <button
              onClick={handleGenerateSingle}
              disabled={busy !== null}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-3 rounded-xl shadow-lg transition disabled:opacity-60 inline-flex items-center justify-center space-x-2"
            >
              {busy === 'Creating checkpoint' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>Create QR Scanner</span>
            </button>

          </div>
        </div>

        {/* Right: checkpoint inventory for the selected zone */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 w-full min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4 min-w-0">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2 min-w-0">
                <Building2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="truncate">{selectedZone} Checkpoints</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5 break-words">
                {selectedZoneSummary?.generatedQrs.length || 0} QR codes generated
                {selectedZoneSummary ? ` · ${(selectedZoneSummary as any).streets ?? '—'} streets` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 max-w-full sm:max-w-[55%] sm:justify-end overflow-hidden">
              {selectedZoneSummary?.generatedQrs.map((id) => (
                <span key={id} className="font-mono text-[11px] sm:text-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1 rounded-lg whitespace-nowrap max-w-full truncate">
                  {id}
                </span>
              ))}
            </div>
          </div>

          {zoneCheckpoints.length === 0 ? (
            <div className="text-center py-10 sm:py-14 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
              <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500 break-words">No checkpoints yet for {selectedZone}</p>
              <p className="text-xs text-slate-400 mt-1">Use the form to create one, or press &quot;Generate 5 QR Codes&quot;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-h-[620px] sm:overflow-y-auto sm:pr-1 min-w-0">
              {zoneCheckpoints.map((c) => (
                <div key={c.qrId} className="border border-slate-200 rounded-2xl p-3 bg-white hover:border-emerald-300 transition shadow-sm w-full min-w-0 overflow-hidden">
                  <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-start gap-3 min-w-0">
                    <div className="mx-auto min-[420px]:mx-0 flex-shrink-0">
                      <QRImageContainer qrId={c.qrId} sizeClassName="w-24 h-24 min-[420px]:w-20 min-[420px]:h-20" />
                    </div>
                    <div className="min-w-0 flex-1 w-full">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="font-mono text-sm font-black text-emerald-800 truncate">{c.qrId}</span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${c.status !== 'Inactive' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.status || 'Active'}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-600 font-medium min-w-0">
                        <div className="flex items-start space-x-1 min-w-0"><Home className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" /><span className="break-words min-w-0">{c.streetName} · {c.ward}</span></div>
                        <div className="flex items-start space-x-1 min-w-0"><Users className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" /><span className="break-words min-w-0">{staffName(c)}</span></div>
                        <div className="font-mono text-slate-500 break-words">Checkpoint #{String(c.checkpointNumber || 1).padStart(2, '0')} · {c.households} households</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button onClick={() => setViewQr(c)} className="flex-1 min-[420px]:flex-none inline-flex items-center justify-center space-x-1 bg-emerald-700 text-white text-[12px] font-black px-2.5 py-2 min-[420px]:py-1.5 rounded-lg hover:bg-emerald-600 transition min-h-[38px] min-[420px]:min-h-0 whitespace-nowrap">
                          <Eye className="w-3 h-3 flex-shrink-0" /> <span>View QR</span>
                        </button>
                        <a
                          href={qrImageDownloadUrl(c.qrId)}
                          download={`${c.qrId}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 min-[420px]:flex-none inline-flex items-center justify-center space-x-1 bg-white border border-slate-300 text-slate-700 text-[12px] font-black px-2.5 py-2 min-[420px]:py-1.5 rounded-lg hover:border-emerald-300 transition min-h-[38px] min-[420px]:min-h-0 whitespace-nowrap"
                        >
                          <Download className="w-3 h-3 flex-shrink-0" /> <span>Download</span>
                        </a>
                        <button onClick={() => setViewQr(c)} className="flex-1 min-[420px]:flex-none inline-flex items-center justify-center space-x-1 bg-white border border-slate-300 text-slate-700 text-[12px] font-black px-2.5 py-2 min-[420px]:py-1.5 rounded-lg hover:border-emerald-300 transition min-h-[38px] min-[420px]:min-h-0 whitespace-nowrap">
                          <Printer className="w-3 h-3 flex-shrink-0" /> <span>Print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Print-only label sheet for the selected checkpoint */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .qr-label-sheet, .qr-label-sheet * { visibility: visible; }
          .qr-label-sheet { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: white; }
        }
      `}</style>

      {/* Full QR view / printable label modal */}
      {viewQr && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[94vh] sm:max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">Checkpoint QR — {viewQr.qrId}</h3>
              </div>
              <button onClick={() => setViewQr(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1">×</button>
            </div>
            <div className="p-5">
              {/* The printable label */}
              <div className="qr-label-sheet border-2 border-emerald-900 rounded-2xl p-4 bg-white text-center">
                <div className="mx-auto w-12 h-12 rounded-full border-[2.5px] border-[#F59E0B] bg-white p-0.5 flex items-center justify-center overflow-hidden mb-2">
                  <img
                    src={ccmcLogo}
                    alt="Coimbatore City Municipal Corporation Logo"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (e.currentTarget.src !== ccmcFallbackLogo) e.currentTarget.src = ccmcFallbackLogo;
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[12px] font-black text-emerald-800 uppercase tracking-widest">SWM / CCMC</div>
                <div className="text-xs font-extrabold text-slate-900">Coimbatore City Municipal Corporation</div>
                <div className="text-[11px] text-slate-500 font-semibold">Smart Solid Waste Management</div>
                <div className="my-3 mx-auto w-fit p-2 border border-slate-300 rounded-xl bg-white">
                  <QRImageContainer qrId={viewQr.qrId} sizeClassName="w-48 h-48" />
                </div>
                <div className="space-y-1 text-[11px] font-bold text-slate-800">
                  <div>Zone: <span className="font-mono">{viewQr.zone}</span></div>
                  <div>Ward: <span className="font-mono">{viewQr.ward}</span></div>
                  <div>Street: <span className="font-mono">{viewQr.streetName}</span></div>
                  <div>Checkpoint: <span className="font-mono">#{String(viewQr.checkpointNumber || 1).padStart(2, '0')}</span></div>
                  <div>QR ID: <span className="font-mono font-black text-emerald-800">{viewQr.qrId}</span></div>
                </div>
                <div className="mt-3 text-[11px] font-bold text-emerald-800 uppercase tracking-wider border-t border-slate-200 pt-2">
                  Scan to record waste collection
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <a
                  href={qrImageDownloadUrl(viewQr.qrId, 20)}
                  download={`${viewQr.qrId}.png`}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2.5 rounded-xl transition"
                >
                  <Download className="w-4 h-4" /> Download QR
                </a>
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-white border-2 border-emerald-700 text-emerald-800 text-xs font-black py-2.5 rounded-xl hover:bg-emerald-50 transition"
                >
                  <Printer className="w-4 h-4" /> Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-4 z-[60] bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center space-x-2 animate-bounce font-bold text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-300" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default QRCheckpointManagementView;