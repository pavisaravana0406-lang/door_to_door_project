import React, { useEffect, useState, useCallback } from 'react';
import {
  Truck,
  LogOut,
  RefreshCw,
  QrCode,
  Globe,
  AlertTriangle,
  UserCheck,
  X,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Camera,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ccmcLogo, ccmcFallbackLogo, smartCityLogo, smartCityFallbackLogo } from '../constants/branding';
import { fetchDashboard } from '../api/client';
import type {
  SWMSAssignment,
  SWMSDashboardData,
  SWMSCollectionStats,
  QRCheckpoint,
  SWMSHouseholdRecord,
} from '../types';
import { AnimatedCounter } from './AnimatedCounter';

interface SWMSCollectionDashboardViewProps {
  lang?: 'en' | 'ta';
  token: string | null;
  assignment?: SWMSAssignment | null;
  records?: SWMSHouseholdRecord[];
  userName?: string;
  workerInfo?: any;
  onLogout?: () => void;
  onOpenScanner: () => void;
  onOpenStreetCoverageView?: () => void;
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
  onOpenVehicleAssignment?: () => void;
  refreshKey?: number;
}

export const getVehicleRouteDetails = (inputStr?: string) => {
  const clean = (inputStr || '').replace(/[\s\-_]/g, '').toUpperCase();
  if (clean.includes('AD6465') || clean.includes('YOGARAJ')) {
    return { streetName: 'MAGESHWARI NAGAR', vehicleType: 'TATA ACE', vehicleNo: 'TN66AD6465' };
  }
  if (clean.includes('AE6121')) {
    return { streetName: 'sree nagar', vehicleType: 'TATA ACE', vehicleNo: 'TN66AE6121' };
  }
  if (clean.includes('AM0219') || clean.includes('KARTHIK')) {
    return { streetName: 'PALANI AANDAVAR KOVIL VEEDHI', vehicleType: 'TATA ACE', vehicleNo: 'TN66AM0219' };
  }
  if (clean.includes('AQ1153') || clean.includes('SELVARAJ')) {
    return { streetName: 'KGK MAIN ROAD', vehicleType: 'TATA ACE', vehicleNo: 'TN66AQ1153' };
  }
  if (clean.includes('PO982') || clean.includes('SATHYA')) {
    return { streetName: 'MUTHUSAMY SERKAI VEEDHI', vehicleType: 'TATA ACE', vehicleNo: 'TN66PO982' };
  }
  if (clean.includes('AP0965') || clean.includes('PANEERSELVAM')) {
    return { streetName: 'MARUTHI ENVUE', vehicleType: 'BOV', vehicleNo: 'TN66AP0965' };
  }
  if (clean.includes('AC1906') || clean.includes('ARUNACHALAM')) {
    return { streetName: 'MADHURA ENCLAVE', vehicleType: 'TATA ACE', vehicleNo: 'TN66AC1906' };
  }
  if (clean.includes('AQ1287')) {
    return { streetName: 'KK NAGAR', vehicleType: 'TATA ACE', vehicleNo: 'TN66AQ1287' };
  }
  if (clean.includes('AC9176')) {
    return { streetName: 'RANGANATHAN KOVIL STREET', vehicleType: 'TATA ACE', vehicleNo: 'TN66AC9176' };
  }
  if (clean.includes('AD8373')) {
    return { streetName: 'ponni nagar', vehicleType: 'TATA ACE', vehicleNo: 'TN66AD8373' };
  }
  if (clean.includes('AQ1114')) {
    return { streetName: 'ponni nagar', vehicleType: 'TATA ACE', vehicleNo: 'TN66AQ1114' };
  }
  if (clean.includes('AQ0794')) {
    return { streetName: 'MARIYAMMAN KOVIL STREET', vehicleType: 'BOV', vehicleNo: 'TN66AQ0794' };
  }
  if (clean.includes('AP1181')) {
    return { streetName: 'RAMASAMY KOONARCUT ROAD', vehicleType: 'BOV', vehicleNo: 'TN66AP1181' };
  }
  if (clean.includes('PUSHCART10')) {
    return { streetName: 'ALAGAACHI THOTTAM', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART10_SOUTH' };
  }
  if (clean.includes('PUSHCART9')) {
    return { streetName: 'NAGAMMA NAYAGAR VEEDHI', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART9_SOUTH' };
  }
  if (clean.includes('PUSHCART8')) {
    return { streetName: 'VISAGA GARDEN', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART8' };
  }
  if (clean.includes('PUSHCART7')) {
    return { streetName: 'MEENAKSHI NAGAR', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART7' };
  }
  if (clean.includes('PUSHCART6')) {
    return { streetName: 'BAARI NAGAR VEEDHI CUT ROAD', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART6' };
  }
  if (clean.includes('PUSHCART5')) {
    return { streetName: 'BAJANA KOVIL VEEDHI', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART5' };
  }
  if (clean.includes('PUSHCART4')) {
    return { streetName: 'LAKSHMI MILLS SIGNAL', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART4' };
  }
  if (clean.includes('PUSHCART3')) {
    return { streetName: 'KANDHASAMY LAYOUT', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART3' };
  }
  if (clean.includes('PUSHCART2')) {
    return { streetName: 'M.G.R.VEEDHI', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART2' };
  }
  if (clean.includes('PUSHCART')) {
    return { streetName: 'THIYAGIKUMAR STREET', vehicleType: 'PUSH CART', vehicleNo: 'PUSHCART' };
  }
  if (clean.includes('BOV')) {
    return { streetName: 'KALYANAM SUNDHARAM STREET', vehicleType: 'BOV', vehicleNo: 'BOV' };
  }
  return { streetName: 'MAGESHWARI NAGAR', vehicleType: 'TATA ACE', vehicleNo: 'TN66AD6465' };
};

export const SWMSCollectionDashboardView: React.FC<SWMSCollectionDashboardViewProps> = ({
  lang = 'en',
  token,
  assignment,
  records = [],
  userName = 'Field Officer',
  onLogout,
  onOpenScanner,
  onOpenStreetCoverageView,
  onToggleLang,
  onSetLanguage,
  refreshKey = 0,
}) => {
  const [dashboard, setDashboard] = useState<SWMSDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<'collected' | 'notcollected' | 'frequent' | 'total' | null>(null);
  const [lightboxData, setLightboxData] = useState<LightboxPhotoData | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setError('Session missing. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboard(token);
      setDashboard(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load the collection dashboard.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const stats = dashboard?.stats;
  const allCheckpoints: QRCheckpoint[] = (dashboard?.streets ?? []).flatMap(s => s.checkpoints);
  const collectedList = allCheckpoints.filter(c => c.status === 'Collected');
  const notCollectedList = allCheckpoints.filter(c => c.status === 'Not Collected');
  const frequentStreets = (dashboard?.streets ?? []).filter(s => s.checkpoints.every(c => c.status !== 'Collected'));
  const frequentList = frequentStreets.flatMap(s => s.checkpoints);
  const isPushcart = !!assignment?.isPushcart;
  const vehicleType = assignment?.vehicleType || (isPushcart ? 'Pushcart' : 'Vehicle');
  const vehicleNumber = assignment?.vehicleNumber || (isPushcart ? (assignment?.workerCode || 'PTC') : '');
  const vehicleNo = isPushcart
    ? (assignment?.workerCode || 'Pushcart')
    : (assignment?.vehicleNumber
        ? `${assignment?.vehicleType ? `${assignment.vehicleType} ` : ''}${assignment.vehicleNumber}`
        : (assignment?.vehicleType || 'Vehicle'));
  const applyLang = (l: 'en' | 'ta') => {
    if (onSetLanguage) onSetLanguage(l);
    else if (onToggleLang) onToggleLang();
  };

  return (
    <div className="dash-page w-full min-h-screen bg-white pb-28 font-sans max-w-full overflow-x-hidden text-slate-900">
      {/* ── GREEN CCMC HEADER (admin-style, dark enterprise green) ── */}
      <header className="w-full select-none text-white shadow-md sticky top-0 z-30 bg-[#14532d]">
        {/* Top Main Green Bar */}
        <div className="bg-[#14532d] px-2.5 sm:px-4 lg:px-5 pt-2 pb-2 border-b border-[#0f3d22] flex items-center justify-between gap-1 sm:gap-4">
          {/* Left: CCMC Emblem + Smart City Logo + Municipal Titles */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-sm relative flex-shrink-0 flex items-center justify-center"
                title="Coimbatore City Municipal Corporation Emblem"
              >
                <img
                  src={ccmcLogo}
                  alt="Coimbatore City Municipal Corporation Logo"
                  referrerPolicy="no-referrer"
                  onError={(e) => { if (e.currentTarget.src !== ccmcFallbackLogo) e.currentTarget.src = ccmcFallbackLogo; }}
                  className="w-full h-full object-contain"
                />
              </div>
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-sm relative flex-shrink-0 flex items-center justify-center"
                title="Smart City Mission"
              >
                <img
                  src={smartCityLogo}
                  alt="Smart City Mission Logo"
                  referrerPolicy="no-referrer"
                  onError={(e) => { if (e.currentTarget.src !== smartCityFallbackLogo) e.currentTarget.src = smartCityFallbackLogo; }}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            </div>

            {/* Municipal Titles — compact 2-line stack on mobile, full text from sm up */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="sm:hidden flex flex-col leading-none">
                <div className="text-[12.5px] font-black tracking-tight text-white leading-[1.15] drop-shadow">
                  Coimbatore City Municipal
                </div>
                <div className="text-[12.5px] font-black tracking-tight text-white leading-[1.15] drop-shadow">
                  Corporation
                </div>
                <div className="text-[9px] font-black tracking-wide text-amber-300 uppercase leading-none mt-1 drop-shadow">
                  Integrated Command &amp; Control Center
                </div>
              </div>
              <div className="hidden sm:flex sm:flex-col sm:justify-center leading-tight">
                <span className="text-lg lg:text-[24px] font-black tracking-tight text-white drop-shadow leading-tight">Coimbatore City Municipal Corporation</span>
                <span className="text-[13px] lg:text-[15px] font-black tracking-wider text-amber-300 uppercase drop-shadow mt-1">Integrated Command and Control Center (ICCC)</span>
              </div>
            </div>
          </div>

          {/* Right: Vehicle Pill + Language + Logout */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">

            {/* Vehicle / Worker pill (like admin profile pill) — icon-only on mobile, full on larger */}
            <div
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 bg-[#166534] hover:bg-[#113B22] border border-emerald-400/40 rounded-full px-1.5 sm:px-2.5 py-1 shadow-sm flex-shrink-0"
              title={`${vehicleNo}`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white shadow-xs flex items-center justify-center border border-emerald-200 flex-shrink-0 overflow-hidden" title="Assigned Vehicle">
                {isPushcart ? <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E7A38]" /> : <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E7A38]" />}
              </div>
              <div className="text-left pr-1">
                <div className="text-xs sm:text-sm font-black text-white leading-tight font-mono whitespace-nowrap truncate">{vehicleNumber || vehicleNo}</div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-200 tracking-wider leading-none mt-0.5">{vehicleType}</div>
              </div>
            </div>

            {/* Desktop / Tablet Segmented Language Pill (>= sm) - exact admin style */}
            <div className="hidden sm:flex bg-[#113B22] border border-emerald-500/40 rounded-full p-0.5 items-center shadow-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => applyLang('ta')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                  lang === 'ta'
                    ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
                title="தமிழ் மொழியைத் தேர்வு செய்"
              >
                <Globe className={`w-3 h-3 ${lang === 'ta' ? 'text-slate-950' : 'text-emerald-300'}`} />
                <span>தமிழ்</span>
              </button>
              <button
                type="button"
                onClick={() => applyLang('en')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
                title="Select English Language"
              >
                <span>English</span>
              </button>
            </div>

            {/* Mobile Single Toggle Pill (< sm) */}
            <button
              type="button"
              onClick={onToggleLang}
              className="sm:hidden px-2 py-1 rounded-full text-[10px] font-black bg-[#113B22] border border-emerald-400/40 text-amber-300 hover:text-white flex items-center gap-1 shadow-xs flex-shrink-0 cursor-pointer active:scale-95"
              title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
            >
              <Globe className="w-3 h-3 text-emerald-300" />
              <span>{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
            </button>

            {/* Logout Button (exact admin style) */}
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center gap-1 bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white font-bold px-3 py-1.5 rounded-full text-xs transition-all shadow-md border border-rose-400/50 cursor-pointer active:scale-95 flex-shrink-0"
              title="Logout Portal / வெளியேறு"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-bold">{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
            </button>
            <button
              onClick={onLogout}
              className="sm:hidden p-1.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white shadow-md border border-rose-400/50 cursor-pointer active:scale-95 flex-shrink-0 flex items-center justify-center"
              title="Logout Portal / வெளியேறு"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Line 2 (Mobile only): Full-width vehicle/worker pill */}
        <div className="sm:hidden flex items-center justify-between gap-2 px-2.5 pb-1.5 pt-1 border-t border-[#166534] bg-[#166534]/50">
          <div
            className="flex items-center gap-1.5 bg-[#166534] border border-emerald-400/40 rounded-full pl-1 pr-2 py-1 shadow-sm flex-shrink-0 min-w-0 max-w-[58%]"
            title={`${vehicleNo}`}
          >
            <div className="w-5 h-5 rounded-md bg-white shadow-xs flex items-center justify-center border border-emerald-200 flex-shrink-0 overflow-hidden" title="Assigned Vehicle">
              {isPushcart ? <UserCheck className="w-3 h-3 text-[#1E7A38]" /> : <Truck className="w-3 h-3 text-[#1E7A38]" />}
            </div>
            <div className="text-left leading-none min-w-0">
              <div className="text-[10px] font-black text-white font-mono truncate">{vehicleNumber || vehicleNo}</div>
              <div className="text-[8.5px] font-semibold text-emerald-200 tracking-wider truncate mt-0.5">{vehicleType}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            <span className="text-[9.5px] font-bold text-emerald-100 whitespace-nowrap">East Zone</span>
            <span className="w-1 h-1 rounded-full bg-amber-300 flex-shrink-0"></span>
            <span className="text-[9.5px] font-bold text-amber-300 whitespace-nowrap">Ward 24</span>
          </div>
        </div>
      </header>

      {/* ── BODY — full screen width. Extra bottom padding clears the fixed SCAN pill. ── */}
      <div className="px-3 sm:px-5 lg:px-8 pt-4 sm:pt-6 pb-28 sm:pb-24 space-y-4 sm:space-y-5 w-full max-w-none mx-0">
        {loading && !dashboard && (
          <div className="dash-card animate-dash-enter flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            <div className="text-sm sm:text-base font-bold text-emerald-900">{lang === 'ta' ? 'ஏற்றுகிறது...' : 'Loading collection status...'}</div>
          </div>
        )}

        {error && !loading && !dashboard && (
          <div className="dash-card animate-dash-enter border-red-200 p-6 flex flex-col items-center text-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-[#fdecea] border border-red-200 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-700" />
            </span>
            <div className="text-sm sm:text-base font-bold text-red-900">{error}</div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={load}
                className="dash-btn flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-5 py-2.5 rounded-full cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
              <button
                onClick={onLogout}
                className="dash-btn flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-sm font-bold px-5 py-2.5 rounded-full cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}

        {dashboard && stats && (() => {
          const currentVehicleKey = assignment?.vehicleNumber || vehicleNumber || vehicleNo || userName;
          const routeInfo = getVehicleRouteDetails(currentVehicleKey);

          const latestStreetName = routeInfo.streetName;
          const latestVehicleType = routeInfo.vehicleType;
          const latestVehicleNo = routeInfo.vehicleNo;

          // Compute exact live scan checkpoint count for current vehicle's street route
          let latestScansCount = 0;
          try {
            const SCAN_KEY = 'ccmc_street_5scans';
            const raw = localStorage.getItem(SCAN_KEY);
            if (raw) {
              const obj = JSON.parse(raw);
              const streetData = obj[latestStreetName];
              if (Array.isArray(streetData)) {
                latestScansCount = streetData.filter((s: any) => s.isScanned).length;
              }
            }
          } catch { /* ignore */ }

          // Filter records for THIS logged-in vehicle ONLY
          const myVehicleRecords = (records || []).filter(r => 
            (r.streetName && r.streetName.toLowerCase().trim() === latestStreetName.toLowerCase().trim()) ||
            (r.vehicleNo && r.vehicleNo.replace(/[\s\-_]/g, '').toUpperCase() === latestVehicleNo.replace(/[\s\-_]/g, '').toUpperCase())
          );

          if (latestScansCount === 0 && myVehicleRecords.length > 0) {
            const rec = myVehicleRecords[0];
            latestScansCount = typeof rec.completedScansCount === 'number'
              ? rec.completedScansCount
              : (rec.coverageStatus === 'Covered' ? 5 : rec.coverageStatus === 'Partially Covered' ? 4 : 0);
          }

          const isPushcartType = latestVehicleType === 'PUSH CART' || latestVehicleNo.includes('PUSH');
          const minScansNeeded = isPushcartType ? 1 : 3;
          const liveTotalCheckpoints = isPushcartType ? 1 : 5;

          const isFullyCovered = latestScansCount >= minScansNeeded;
          const isPartiallyCovered = latestScansCount > 0 && latestScansCount < minScansNeeded;

          const liveCollected = latestScansCount;
          const liveNotCollected = Math.max(0, liveTotalCheckpoints - latestScansCount);
          const liveMissedStreets = Math.max(0, liveTotalCheckpoints - latestScansCount);

          const liveCoveragePercent = Math.round((latestScansCount / liveTotalCheckpoints) * 100);

          const liveOverallStatus = isFullyCovered
            ? (lang === 'ta' ? 'சேகரிக்கப்பட்டது (Collected)' : 'Collected (At least 3 Scans Done)')
            : isPartiallyCovered
            ? (lang === 'ta' ? `பகுதி சேகரிப்பு (${latestScansCount}/5 ஸ்கேன்)` : `Partially Scanned (${latestScansCount}/5 Scanned)`)
            : (lang === 'ta' ? 'உள்நுழைந்தது (0/5 ஸ்கேன்)' : 'Logged In (0/5 Scanned)');

          const totalStreets = stats?.totalStreets ?? 1;

          return (
            <>
              {/* ── KPI CARDS — icon above text on mobile so labels are never clipped ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <button
                  onClick={() => setViewFilter('collected')}
                  className="dash-card dash-card-accent-green animate-dash-enter p-3 sm:p-5 text-left cursor-pointer group bg-[#f4faf5]"
                >
                  <div className="flex flex-col xs:flex-row items-start gap-2 sm:items-center sm:gap-3">
                    <span className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#e9f5ed] border border-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors duration-250 group-hover:bg-emerald-100 group-hover:border-emerald-500">
                      <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-700" />
                    </span>
                    <div className="min-w-0 w-full flex-1">
                      <div className="text-[10px] sm:text-sm font-extrabold uppercase tracking-wide sm:tracking-wider text-emerald-900 leading-tight break-words">{lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Total Collected'}</div>
                      <div className="text-3xl sm:text-5xl font-black text-slate-900 font-num leading-none mt-0.5 sm:mt-1"><AnimatedCounter value={liveCollected} /></div>
                      <div className="text-[10px] sm:text-sm text-slate-600 font-bold mt-0.5 sm:mt-1 leading-tight break-words">{liveCollected}/{liveTotalCheckpoints} {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'collected'} • {liveCoveragePercent}%</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setViewFilter('notcollected')}
                  className="dash-card dash-card-accent-red animate-dash-enter p-3 sm:p-5 text-left cursor-pointer group bg-[#fef5f4]"
                  style={{ animationDelay: '60ms' }}
                >
                  <div className="flex flex-col xs:flex-row items-start gap-2 sm:items-center sm:gap-3">
                    <span className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#fdecea] border border-red-200 flex items-center justify-center flex-shrink-0 transition-colors duration-250 group-hover:bg-red-100 group-hover:border-red-400">
                      <XCircle className="w-5 h-5 sm:w-7 sm:h-7 text-red-700" />
                    </span>
                    <div className="min-w-0 w-full flex-1">
                      <div className="text-[10px] sm:text-sm font-extrabold uppercase tracking-wide sm:tracking-wider text-red-900 leading-tight break-words">{lang === 'ta' ? 'சேகரிக்கவில்லை' : 'Not Collected'}</div>
                      <div className="text-3xl sm:text-5xl font-black text-slate-900 font-num leading-none mt-0.5 sm:mt-1"><AnimatedCounter value={liveNotCollected} /></div>
                      <div className="text-[10px] sm:text-sm text-slate-600 font-bold mt-0.5 sm:mt-1 leading-tight break-words">{liveNotCollected}/{liveTotalCheckpoints} {lang === 'ta' ? 'நிலுவையில்' : 'pending'}</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setViewFilter('frequent')}
                  className="dash-card dash-card-accent-amber animate-dash-enter p-3 sm:p-5 text-left cursor-pointer group bg-[#fffaef]"
                  style={{ animationDelay: '120ms' }}
                >
                  <div className="flex flex-col xs:flex-row items-start gap-2 sm:items-center sm:gap-3">
                    <span className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#fef3e2] border border-amber-200 flex items-center justify-center flex-shrink-0 transition-colors duration-250 group-hover:bg-amber-100 group-hover:border-amber-500">
                      <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-amber-700" />
                    </span>
                    <div className="min-w-0 w-full flex-1">
                      <div className="text-[10px] sm:text-sm font-extrabold uppercase tracking-wide sm:tracking-wider text-amber-900 leading-tight break-words">{lang === 'ta' ? 'அடிக்கடி சேகரிக்கவில்லை' : 'Frequently Missed'}</div>
                      <div className="text-3xl sm:text-5xl font-black text-slate-900 font-num leading-none mt-0.5 sm:mt-1">
                        <AnimatedCounter value={liveMissedStreets} />
                      </div>
                      <div className="text-[10px] sm:text-sm text-slate-600 font-bold mt-0.5 sm:mt-1 leading-tight break-words">{lang === 'ta' ? 'சேகரிக்காத தெருக்கள்' : liveMissedStreets === 1 ? 'street missed' : 'streets missed'}</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setViewFilter('total')}
                  className="dash-card dash-card-accent-blue animate-dash-enter p-3 sm:p-5 text-left cursor-pointer group bg-[#f5f9ff]"
                  style={{ animationDelay: '180ms' }}
                >
                  <div className="flex flex-col xs:flex-row items-start gap-2 sm:items-center sm:gap-3">
                    <span className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#e8f0fe] border border-blue-200 flex items-center justify-center flex-shrink-0 transition-colors duration-250 group-hover:bg-blue-100 group-hover:border-blue-400">
                      <QrCode className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700" />
                    </span>
                    <div className="min-w-0 w-full flex-1">
                      <div className="text-[10px] sm:text-sm font-extrabold uppercase tracking-wide sm:tracking-wider text-blue-900 leading-tight break-words">{lang === 'ta' ? 'மொத்த QR' : 'Total QR'}</div>
                      <div className="text-3xl sm:text-5xl font-black text-slate-900 font-num leading-none mt-0.5 sm:mt-1"><AnimatedCounter value={liveTotalCheckpoints} /></div>
                      <div className="text-[10px] sm:text-sm text-slate-600 font-bold mt-0.5 sm:mt-1 leading-tight break-words">{latestScansCount}/5 {lang === 'ta' ? 'ஸ்கேன் செய்யப்பட்டது' : 'scanned'}</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* ── OVERALL COVERAGE — clean status card ── */}
              <div className="dash-card animate-dash-enter p-3 sm:p-5 flex items-center justify-between gap-2 sm:gap-3" style={{ animationDelay: '240ms' }}>
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <span className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-black text-sm sm:text-lg shadow flex-shrink-0 ${
                    liveCoveragePercent === 100 ? 'bg-emerald-600' : liveCoveragePercent > 0 ? 'bg-amber-500' : 'bg-rose-600'
                  }`}>
                    {liveCoveragePercent}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="dash-badge dash-badge-green mb-1">{lang === 'ta' ? 'மொத்த சேகரிப்பு நிலை' : 'Overall Collection Status'}</div>
                    <div className="text-sm sm:text-xl font-black text-slate-900 leading-tight break-words">
                      {liveOverallStatus}
                    </div>
                    <div className="mt-2 h-2.5 w-full max-w-[9rem] sm:max-w-[14rem] rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${liveCoveragePercent === 100 ? 'bg-emerald-600' : liveCoveragePercent > 0 ? 'bg-amber-500' : 'bg-rose-600'}`}
                        style={{ width: `${liveCoveragePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] sm:text-[13px] font-extrabold uppercase tracking-wide sm:tracking-wider text-slate-500 whitespace-nowrap">{lang === 'ta' ? 'தெருக்கள்' : 'Streets'}</div>
                  <div className="text-2xl sm:text-4xl font-black text-slate-900 font-num">{totalStreets}</div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── FLOATING SCAN BUTTON — solid professional pill ── */}
      <div className="fixed bottom-4 sm:bottom-5 left-0 right-0 z-40 flex items-center justify-center pointer-events-none px-4">
        <button
          onClick={onOpenScanner}
          className="dash-btn pointer-events-auto flex items-center gap-2.5 sm:gap-3 pl-2 pr-5 sm:pr-7 py-2 sm:py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black shadow-lg border border-emerald-600 cursor-pointer"
          title="Scan QR Code / க்யூஆர் ஸ்கேன் செய்யவும்"
        >
          <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow border border-emerald-200 flex-shrink-0">
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-xs sm:text-sm font-black tracking-[0.25em] uppercase">{lang === 'ta' ? 'ஸ்கேன்' : 'SCAN'}</span>
            <span className="text-[11px] sm:text-[13px] text-emerald-100 font-bold mt-0.5">{lang === 'ta' ? 'க்யூஆர் குறியீடு' : 'QR Code'}</span>
          </span>
        </button>
      </div>

      {/* ── QR DETAILS SHEET (opens by tapping a KPI card) ── */}
      {viewFilter && (() => {
        const currentVehicleKey = assignment?.vehicleNumber || vehicleNumber || vehicleNo || userName;
        const routeInfo = getVehicleRouteDetails(currentVehicleKey);
        const latestStreetName = routeInfo.streetName;
        const latestVehicleNo = routeInfo.vehicleNo;

        let latestScansCount = 0;
        try {
          const raw = localStorage.getItem('ccmc_street_5scans');
          if (raw) {
            const obj = JSON.parse(raw);
            const streetData = obj[latestStreetName];
            if (Array.isArray(streetData)) {
              latestScansCount = streetData.filter((s: any) => s.isScanned).length;
            }
          }
        } catch {}

        const isPushcartType = routeInfo.vehicleType === 'PUSH CART' || latestVehicleNo.includes('PUSH');
        const liveTotalCheckpoints = isPushcartType ? 1 : 5;

        const routeCheckpoints: QRCheckpoint[] = Array.from({ length: liveTotalCheckpoints }, (_, i) => {
          const cpNo = i + 1;
          let isScanned = i < latestScansCount;
          let timeStr = '';

          try {
            const raw = localStorage.getItem('ccmc_street_5scans');
            if (raw) {
              const obj = JSON.parse(raw);
              const streetArr = obj[latestStreetName];
              if (Array.isArray(streetArr) && streetArr[i]) {
                isScanned = !!streetArr[i].isScanned;
                timeStr = streetArr[i].scannedTime || '';
              }
            }
          } catch {}

          return {
            qrId: `CP-${latestVehicleNo}-P${cpNo}`,
            position: cpNo,
            streetId: cpNo,
            streetName: `${latestStreetName} (Checkpoint ${cpNo})`,
            zone: 'SOUTH',
            ward: '87',
            status: isScanned ? 'Collected' : 'Not Collected',
            area: latestStreetName,
            households: 25,
            scannedAt: isScanned ? (timeStr || 'Scanned Today') : undefined,
          };
        });

        const activeCollectedList = routeCheckpoints.filter(c => c.status === 'Collected');
        const activeNotCollectedList = routeCheckpoints.filter(c => c.status === 'Not Collected');

        const activeCheckpoints =
          viewFilter === 'collected' ? (activeCollectedList.length > 0 ? activeCollectedList : collectedList)
          : viewFilter === 'notcollected' ? (activeNotCollectedList.length > 0 ? activeNotCollectedList : notCollectedList)
          : viewFilter === 'frequent' ? (activeNotCollectedList.length > 0 ? activeNotCollectedList : frequentList)
          : routeCheckpoints;

        return (
          <QRDetailsSheet
            lang={lang}
            filter={viewFilter}
            title={
              viewFilter === 'collected'
                ? (lang === 'ta' ? 'சேகரிக்கப்பட்ட QR விவரங்கள்' : 'Collected QR Details')
                : viewFilter === 'notcollected'
                  ? (lang === 'ta' ? 'சேகரிக்கப்படாத QR விவரங்கள்' : 'Not Collected QR Details')
                  : viewFilter === 'frequent'
                    ? (lang === 'ta' ? 'அடிக்கடி சேகரிக்காத தெருக்கள்' : 'Frequently Not Collected Streets')
                    : (lang === 'ta' ? 'அனைத்து QR விவரங்கள்' : 'All QR Details')
            }
            checkpoints={activeCheckpoints}
            stats={stats}
            onClose={() => setViewFilter(null)}
            setLightboxData={setLightboxData}
          />
        );
      })()}

      {lightboxData && (
        <ScanPhotoLightboxModal
          data={lightboxData}
          lang={lang}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
};

interface QRDetailsSheetProps {
  lang: 'en' | 'ta';
  filter: 'collected' | 'notcollected' | 'frequent' | 'total';
  title: string;
  checkpoints: QRCheckpoint[];
  stats?: SWMSCollectionStats | null;
  onClose: () => void;
  setLightboxData: (data: LightboxPhotoData | null) => void;
}

const statusMetaOf = (status: string, lang: 'en' | 'ta') => {
  switch (status) {
    case 'Collected':
      return {
        label: lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected',
        chip: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
        dot: 'bg-[#059669]',
        icon: 'check' as const,
      };
    case 'Not Collected':
      return {
        label: lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected',
        chip: 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]',
        dot: 'bg-[#E11D48]',
        icon: 'x' as const,
      };
    default:
      return {
        label: lang === 'ta' ? 'நிலுவையில்' : 'Pending',
        chip: 'bg-slate-50 text-slate-500 border-slate-200',
        dot: 'bg-slate-300',
        icon: 'clock' as const,
      };
  }
};

const QRDetailsSheet: React.FC<QRDetailsSheetProps> = ({
  lang,
  filter,
  title,
  checkpoints,
  stats,
  onClose,
  setLightboxData,
}) => {
  const accent =
    filter === 'collected' ? 'bg-[#34A853]'
    : filter === 'notcollected' ? 'bg-[#EA4335]'
    : filter === 'frequent' ? 'bg-[#FBBC05]'
    : 'bg-[#4285F4]';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-stretch justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className={`${accent} text-white px-4 py-3.5 flex items-center justify-between gap-2 flex-shrink-0`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              {filter === 'collected' ? <CheckCircle2 className="w-4 h-4" /> : filter === 'notcollected' ? <XCircle className="w-4 h-4" /> : filter === 'frequent' ? <Clock className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-black truncate">{title}</div>
              <div className="text-[11px] text-white/85 font-semibold">{checkpoints.length} {lang === 'ta' ? 'சரிபார்ப்பு புள்ளிகள்' : 'checkpoints'}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-3 space-y-2.5">
          {checkpoints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
              <QrCode className="w-10 h-10 text-slate-300" />
              <div className="text-sm font-black text-slate-500">{lang === 'ta' ? 'இந்தப் பிரிவில் QR இல்லை' : 'No QR checkpoints in this section'}</div>
              <div className="text-[12px] text-slate-400">{lang === 'ta' ? 'பிறகு உங்கள் சேகரிப்பை புதுப்பிக்கவும்' : 'Refresh after your next collection'}</div>
            </div>
          )}

          {checkpoints.map((cp) => {
            const meta = statusMetaOf(cp.status, lang);
            return (
              <div key={cp.qrId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Top row: QR id + status */}
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-4 h-4 text-slate-500" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-black font-mono tracking-wide truncate">{cp.qrId}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{cp.zone} • {cp.ward}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black border flex-shrink-0 ${meta.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>

                {/* Street + households */}
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-black text-slate-800 min-w-0">
                    <MapPin className="w-4 h-4 text-[#1E7A38] flex-shrink-0" />
                    <span className="truncate">{cp.streetName}</span>
                  </div>
                  {cp.households ? (
                    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full px-2 py-0.5 text-[11px] font-black flex-shrink-0">
                      <Users className="w-3 h-3" /> {cp.households} {lang === 'ta' ? 'வீடுகள்' : 'hh'}
                    </span>
                  ) : null}
                </div>

                {/* Field team */}
                {(cp.workerName || cp.ssName || cp.cssName || cp.siName) && (
                  <div className="px-3.5 pb-3 space-y-1.5">
                    <div className="border-t border-slate-100 pt-2 space-y-1">
                      {cp.workerName && (
                        <div className="flex items-center justify-between gap-2 py-0.5">
                          <span className="text-[11px] font-black text-emerald-700 flex-shrink-0">{lang === 'ta' ? 'பணியாளர்' : 'Worker'}:</span>
                          <span className="text-[12px] font-bold text-slate-700 text-right min-w-0 truncate">{cp.workerName}{cp.workerContact ? ` • ${cp.workerContact}` : ''}</span>
                        </div>
                      )}
                      {cp.ssName && (
                        <div className="flex items-center justify-between gap-2 py-0.5">
                          <span className="text-[11px] font-black text-emerald-700 flex-shrink-0">SS:</span>
                          <span className="text-[12px] font-bold text-slate-700 text-right min-w-0 truncate">{cp.ssName}{cp.ssContact ? ` • ${cp.ssContact}` : ''}</span>
                        </div>
                      )}
                      {cp.cssName && (
                        <div className="flex items-center justify-between gap-2 py-0.5">
                          <span className="text-[11px] font-black text-emerald-700 flex-shrink-0">CSS:</span>
                          <span className="text-[12px] font-bold text-slate-700 text-right min-w-0 truncate">{cp.cssName}{cp.cssContact ? ` • ${cp.cssContact}` : ''}</span>
                        </div>
                      )}
                      {cp.siName && (
                        <div className="flex items-center justify-between gap-2 py-0.5">
                          <span className="text-[11px] font-black text-emerald-700 flex-shrink-0">{lang === 'ta' ? 'ஆய்வாளர்' : 'SI'}:</span>
                          <span className="text-[12px] font-bold text-slate-700 text-right min-w-0 truncate">{cp.siName}{cp.siContact ? ` • ${cp.siContact}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recorded time / remarks */}
                {(cp.recordedAt || cp.remarks || cp.status === 'Collected') && (
                  <div className="px-3.5 pb-3 space-y-2">
                    {cp.recordedAt && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                        <Clock className="w-3 h-3" />
                        {lang === 'ta' ? 'பதிவு நேரம்' : 'Recorded at'}: {cp.recordedAt}
                      </div>
                    )}
                    {cp.remarks && (
                      <div className={`mt-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${cp.status === 'Not Collected' ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        {lang === 'ta' ? 'குறிப்பு' : 'Remarks'}: {cp.remarks}
                      </div>
                    )}

                    {/* Scan Proof Photos — only real uploaded photos are shown.
                        Previously this fell back to hardcoded stock images, which
                        fabricated "proof" for collections that had no photos. */}
                    {cp.status === 'Collected' && (cp.photos?.length ?? 0) > 0 && (
                      <div className="mt-2 bg-sky-50/80 border border-sky-200/80 rounded-xl p-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black text-sky-900 uppercase">
                          <span className="flex items-center gap-1">
                            <Camera className="w-3 h-3 text-sky-700" />
                            {lang === 'ta' ? 'சான்று புகைப்படங்கள்' : 'Scan Proof Photos'}
                          </span>
                          <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            {cp.photos!.length} {lang === 'ta' ? 'படங்கள்' : 'Photos'} ✓
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {cp.photos!.slice(0, 5).map((photoUrl, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => {
                                setLightboxData({
                                  photos: cp.photos!,
                                  title: cp.qrId,
                                  vehicleNo: 'TN66AD6465',
                                  streetName: cp.streetName,
                                  workerName: cp.workerName || 'Field Sanitary Worker',
                                  scannedAt: cp.recordedAt || 'Today',
                                  currentIndex: pIdx,
                                });
                              }}
                              className="aspect-square rounded-lg overflow-hidden border border-sky-300 hover:border-amber-400 hover:scale-105 transition cursor-pointer relative bg-black/10"
                              title={`View Photo ${pIdx + 1}`}
                            >
                              <img src={photoUrl} alt={`Proof ${pIdx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-black text-center">
                                #{pIdx + 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer summary with bar */}
        {stats && (
          <div className="px-4 py-3 border-t border-slate-200 bg-[#F6F9F7] flex-shrink-0">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-600">
              <span>{lang === 'ta' ? 'சேகரிப்பு சுருக்கம்' : 'Collection Summary'}</span>
              <span>✓ {stats.collectedCheckpoints} {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'collected'}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-200 overflow-hidden flex">
              <div className="bg-[#34A853] h-full" style={{ width: `${stats.coveragePercentage}%` }} />
              <div className="bg-[#EA4335] h-full flex-1" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-1">
              {stats.coveragePercentage}% {lang === 'ta' ? 'வீத முன்னேற்றம்' : 'coverage'} • {stats.totalCheckpoints} {lang === 'ta' ? 'மொத்த QR' : 'total QR'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface LightboxPhotoData {
  photos: string[];
  title: string;
  vehicleNo: string;
  streetName: string;
  workerName: string;
  scannedAt?: string;
  currentIndex?: number;
}

export const ScanPhotoLightboxModal: React.FC<{
  data: LightboxPhotoData;
  lang: 'en' | 'ta';
  onClose: () => void;
}> = ({ data, lang, onClose }) => {
  const [idx, setIdx] = useState(data.currentIndex || 0);

  const prev = () => setIdx(i => (i > 0 ? i - 1 : data.photos.length - 1));
  const next = () => setIdx(i => (i < data.photos.length - 1 ? i + 1 : 0));

  const photoSlotNames = [
    { en: 'Photo 1: Vehicle Front & Plate', ta: 'புகைப்படம் 1: முன்பக்க எண் பலகை' },
    { en: 'Photo 2: Left Side Waste Loading', ta: 'புகைப்படம் 2: இடது பக்கம் கழிவு' },
    { en: 'Photo 3: Right Side Waste Loading', ta: 'புகைப்படம் 3: வலது பக்கம் கழிவு' },
    { en: 'Photo 4: Rear & Dumping Area', ta: 'புகைப்படம் 4: பின்புறம்' },
    { en: 'Photo 5: Final Collection Proof', ta: 'புகைப்படம் 5: சேகரிப்பு ஆதார சான்று' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 text-white animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="w-full max-w-xl flex items-center justify-between gap-2 border-b border-white/20 pb-3">
        <div>
          <div className="text-xs font-black text-amber-400 uppercase tracking-wide">
            {lang === 'ta' ? 'Tata Ace 5 சான்று புகைப்படங்கள்' : 'Tata Ace 5 Proof Photos'}
          </div>
          <div className="text-sm font-black text-white">{data.streetName}</div>
          <div className="text-[11px] text-emerald-300 font-mono">{data.vehicleNo} • {data.workerName}</div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer border border-white/30 active:scale-95 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 w-full max-w-xl flex items-center justify-center my-3 overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl">
        <img
          src={data.photos[idx]}
          alt={`Scan Photo ${idx + 1}`}
          className="max-h-full max-w-full object-contain"
        />

        {/* Previous / Next Arrows */}
        {data.photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center border border-white/30 cursor-pointer active:scale-95 transition"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center border border-white/30 cursor-pointer active:scale-95 transition"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        <div className="absolute bottom-3 inset-x-3 bg-black/80 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/20">
          <div className="text-xs font-black text-amber-300">
            {lang === 'ta'
              ? (photoSlotNames[idx]?.ta || `புகைப்படம் ${idx + 1}`)
              : (photoSlotNames[idx]?.en || `Photo ${idx + 1}`)}
          </div>
          <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
            {idx + 1} / {data.photos.length} {lang === 'ta' ? 'புகைப்படங்கள்' : 'Photos'} {data.scannedAt ? `• ${data.scannedAt}` : ''}
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="w-full max-w-xl flex items-center justify-center gap-2 overflow-x-auto py-2">
        {data.photos.map((p, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition flex-shrink-0 cursor-pointer ${
              i === idx ? 'border-amber-400 scale-105 ring-2 ring-amber-400/50' : 'border-white/30 opacity-60 hover:opacity-100'
            }`}
          >
            <img src={p} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};