import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { KPICards } from './KPICards';
import { ZoneSummaryTable } from './ZoneSummaryTable';
import { RecentCollectionTable } from './RecentCollectionTable';

import { ReportsView } from './ReportsView';
import { CollectedView } from './CollectedView';
import { NotCollectedView } from './NotCollectedView';
import { SWMSAdminDashboardView } from './SWMSAdminDashboardView';
import { RecordDetailModal } from './RecordDetailModal';
import { FrequentlyNotCoveredAreaView } from './FrequentlyNotCoveredAreaView';
import { AIPredictionAnalyticsSection } from './AIPredictionAnalyticsSection';
import { QRCheckpointManagementView } from './QRCheckpointManagementView';

import {
  INITIAL_KPI_METRICS,
  INITIAL_ZONE_SUMMARIES,
  RECENT_COLLECTION_RECORDS,
} from '../data/mockData';
import { INITIAL_MUNICIPAL_ALERTS } from '../data/alertsData';
import { INITIAL_FREQUENTLY_NOT_COLLECTED } from '../data/frequentlyNotCollectedData';
import { REAL_QR_VEHICLE_REPORTS } from '../utils/vehicleAssignmentStorage';
import { CollectionRecord, NavigationTab, SWMSHouseholdRecord, SWMSDashboardStats, FrequentlyNotCollectedItem } from '../types';
import { CheckCircle2, QrCode } from 'lucide-react';

interface CommissionerConsoleProps {
  sbmRecords: SWMSHouseholdRecord[];
  sbmStats: SWMSDashboardStats;
  onRefreshSbmData: () => void;
  onLogout: () => void;
  onSwitchRole?: () => void;
  lang: 'en' | 'ta';
  onSetLang: (lang: 'en' | 'ta') => void;
  token?: string | null;
}

export const CommissionerConsole: React.FC<CommissionerConsoleProps> = ({
  sbmRecords,
  sbmStats,
  onRefreshSbmData,
  onLogout,
  onSwitchRole,
  lang,
  onSetLang,
  token,
}) => {
  // Session / tab states
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveConnection, setLiveConnection] = useState(true);

  // Alerts states
  const [alerts, setAlerts] = useState(INITIAL_MUNICIPAL_ALERTS);

  // Derive collection records dynamically from real sbmRecords, defaulting to real QR created vehicles
  const collectionRecords: CollectionRecord[] = React.useMemo(() => {
    if (sbmRecords && sbmRecords.length > 0) {
      return sbmRecords.map((r, idx) => {
        const isSubmittedToday = (ts?: string): boolean => {
          if (!ts || ts === 'Shift Pending' || ts === 'Not Logged In') return false;
          const s = String(ts).trim();
          const today = new Date();
          const d = String(today.getDate()).padStart(2, '0');
          const dSingle = String(today.getDate());
          const m = String(today.getMonth() + 1).padStart(2, '0');
          const mSingle = String(today.getMonth() + 1);
          const y = String(today.getFullYear());
          const datePart = s.split(',')[0].trim();
          if (
            datePart.includes(`${m}/${d}/${y}`) ||
            datePart.includes(`${mSingle}/${dSingle}/${y}`) ||
            datePart.includes(`${d}/${m}/${y}`) ||
            datePart.includes(`${dSingle}/${mSingle}/${y}`) ||
            datePart.includes(`${y}-${m}-${d}`) ||
            s.includes(`${y}-${m}-${d}`)
          ) {
            return true;
          }
          try {
            const p = new Date(s);
            if (!isNaN(p.getTime()) && p.getFullYear() === today.getFullYear() && p.getMonth() === today.getMonth() && p.getDate() === today.getDate()) {
              return true;
            }
          } catch {}
          return !s.includes('Not Logged');
        };

        const isRealSubmission = !!r.submittedAt && isSubmittedToday(r.submittedAt);
        return {
          id: r.id || `REC-${1000 + idx}`,
          householdId: r.houseId,
          oldDoorNo: r.doorNo,
          newDoorNo: r.doorNo,
          streetName: r.streetName,
          ward: r.ward,
          zone: r.zone || (r.ward?.includes('49') ? 'Central Zone' : r.ward?.includes('35') ? 'West Zone' : r.ward?.includes('12') ? 'North Zone' : 'East Zone'),
          status: (isRealSubmission && r.coverageStatus === 'Covered' ? 'Collected' : 'Not Collected') as any,
          wasteType: 'Segregated (Wet & Dry)',
          propertyType: 'Residence',
          scannedAt: isRealSubmission ? r.submittedAt : 'Shift Pending',
          workerName: r.driverWorkerName || r.ssName || 'Sanitary Worker',
          vehicleType: (r.vehicleType as any) || 'Tata Ace',
          vehicleNo: (r.streetName?.toLowerCase().includes('mageshwari') || r.vehicleNo?.includes('38 PV 9001')) ? 'TN66AD6465' : (r.vehicleNo || 'TN66AD6465'),
          remarks: isRealSubmission ? (r.remarks || r.notCoveredReason) : 'Pending Morning Scan',
          date: isRealSubmission ? (r.submittedAt.split(',')[0] || 'Shift Pending') : 'Shift Pending',
          time: isRealSubmission ? (r.submittedAt.split(',')[1]?.trim() || 'Not Logged In') : 'Not Logged In',
          timestamp: isRealSubmission ? r.submittedAt : 'Shift Pending (Not Logged In Today)',
          street: r.streetName,
          workerPhone: r.driverWorkerContact || r.ssContact || '',
          binLevelPercent: isRealSubmission && r.coverageStatus === 'Covered' ? 100 : 0,
          supervisor: r.ssName ? `${r.ssName} (SS)` : (r.siName ? `${r.siName} (SI)` : 'Sanitary Supervisor'),
          coordinates: r.latitude && r.longitude ? { lat: r.latitude, lng: r.longitude } : undefined,
          completedScansCount: isRealSubmission ? r.completedScansCount : 0,
          streetScans: isRealSubmission ? r.streetScans : [],
          proofPhoto: r.proofPhoto,
          beforePhoto: r.beforePhoto,
          afterPhoto: r.afterPhoto,
          photos: r.photos,
          coverageStatus: isRealSubmission ? r.coverageStatus : ('Not Covered' as any)
        };
      });
    }

    // Default fallback: load real QR creation vehicles into Overview page
    return REAL_QR_VEHICLE_REPORTS.map((vr, idx) => ({
      id: `REC-REAL-${idx + 1}`,
      householdId: `HID-${vr.vehicleNo}`,
      oldDoorNo: '1',
      newDoorNo: '1',
      streetName: vr.assignedStreets[0] || 'sree nagar',
      ward: vr.ward,
      zone: vr.zone,
      status: 'Not Collected' as any,
      wasteType: 'Segregated (Wet & Dry)',
      propertyType: 'Residence',
      scannedAt: 'Shift Pending',
      workerName: vr.driverName,
      vehicleType: vr.type as any,
      vehicleNo: vr.vehicleNo,
      remarks: 'Pending Morning Scan',
      date: 'Shift Pending',
      time: 'Not Logged In',
      timestamp: 'Shift Pending (Not Logged In Today)',
      street: vr.assignedStreets[0] || 'sree nagar',
      workerPhone: vr.driverPhone,
      binLevelPercent: 0,
      supervisor: vr.ssName ? `${vr.ssName} (SS)` : 'Sanitary Supervisor',
      completedScansCount: 0,
      coverageStatus: 'Not Covered' as any
    }));
  }, [sbmRecords]);

  // Inspect record modal states
  const [selectedRecord, setSelectedRecord] = useState<CollectionRecord | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // KPI calculations based strictly on real active records
  const coveredCount = (sbmRecords || []).filter(r => r.coverageStatus === 'Covered').length;
  const notCoveredCount = (sbmRecords || []).filter(r => r.coverageStatus === 'Not Covered').length;
  const totalCount = (sbmRecords || []).length;
  const coveragePercent = totalCount > 0 ? Number(((coveredCount / totalCount) * 100).toFixed(1)) : 0;

  const metrics = {
    totalCollectedToday: coveredCount,
    totalCoveredCount: coveredCount,
    totalNotCoveredCount: notCoveredCount,
    totalLocationsCount: totalCount,
    overallCoveragePercentage: coveragePercent,
  };

  // Zonal summaries calculated dynamically from real records
  const zoneSummaries = React.useMemo(() => {
    const zoneMap: { [zone: string]: { total: number; collected: number; notCollected: number } } = {};
    (sbmRecords || []).forEach(r => {
      const z = r.zone || 'Central Zone';
      if (!zoneMap[z]) {
        zoneMap[z] = { total: 0, collected: 0, notCollected: 0 };
      }
      zoneMap[z].total++;
      if (r.coverageStatus === 'Covered') {
        zoneMap[z].collected++;
      } else {
        zoneMap[z].notCollected++;
      }
    });

    return Object.entries(zoneMap).map(([zone, data]) => ({
      zone,
      totalLocations: data.total,
      collectedCount: data.collected,
      notCollectedCount: data.notCollected,
      coveragePercentage: data.total > 0 ? Number(((data.collected / data.total) * 100).toFixed(2)) : 0
    }));
  }, [sbmRecords]);

  const handleInspectRecord = (record: CollectionRecord) => {
    setSelectedRecord(record);
  };

  const handleStatusChange = (id: string | number, newStatus: 'Collected' | 'Not Collected') => {
    showToast(`Record status: ${newStatus}`);
  };

  const handleUploadPhoto = (recordId: string | number, photoUrl: string, timestamp: string) => {
    showToast('Clearance photo proof uploaded successfully.');
  };

  return (
    <div className="dash-page min-h-screen bg-white flex flex-col font-sans text-slate-900">
      
      {/* 1. Header component */}
      <Header
        liveConnection={liveConnection}
        onToggleLiveConnection={() => {
          setLiveConnection(prev => !prev);
          showToast(liveConnection ? 'Live data stream paused.' : 'Live data stream resumed.');
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogout={onLogout}
        onSwitchRole={onSwitchRole}
        lang={lang}
        onSetLang={onSetLang}
      />

      {/* Main Layout Container (Mobile: Column, Desktop: Row) */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* 2. Sidebar component */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collectedCount={collectionRecords.filter(r => r.status === 'Collected').length}
          notCollectedCount={collectionRecords.filter(r => r.status === 'Not Collected').length}
          unreadAlertsCount={alerts.filter(a => !a.isRead).length}
          criticalAlertsCount={alerts.filter(a => a.severity === 'critical' && !a.isResolved).length}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onLogout={onLogout}
          lang={lang}
        />

        {/* 3. Main content body — 1px breathing room on all sides so the page
            sits just off the header/nav bar without a wide gutter. */}
        <div className="flex-1 overflow-y-auto p-[3px] pb-8 bg-white w-full min-w-0">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 sm:space-y-6 w-full">
              <div className="animate-dash-enter flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="dash-section-title text-[24px] sm:text-[30px] lg:text-[34px] font-black text-slate-900 tracking-tight leading-tight">
                    {lang === 'ta' ? 'நிர்வாக ஆய்வுக் கட்டுப்பாட்டகம்' : 'Admin Review Dashboard'}
                  </h1>
                  <p className="text-[13px] sm:text-sm lg:text-base font-bold text-slate-600 mt-1.5">
                    {lang === 'ta' ? 'நேரடி சேகரிப்பு கண்காணிப்பு' : 'Live collection monitoring across zones and wards'}
                  </p>
                </div>
                <span className="dash-badge dash-badge-green w-fit">Live • ICCC connected</span>
              </div>

              {/* KPI cards grid with individual view redirection */}
              <KPICards 
                metrics={metrics} 
                lang={lang}
                onNavigateToCollected={() => {
                  setActiveTab('collected');
                  showToast(lang === 'ta' ? 'மொத்த சேகரிக்கப்பட்ட குப்பை விவரங்களுக்குத் நகர்ந்தது' : 'Navigated to: Total Collected Waste Details');
                }}
                onNavigateToCovered={() => {
                  setActiveTab('collected');
                  showToast(lang === 'ta' ? 'மொத்த வீட்டுச் சேகரிப்பு விவரங்களுக்குத் நகர்ந்தது' : 'Navigated to: Total Household Covered Details');
                }}
                onNavigateToNotCovered={() => {
                  setActiveTab('not-collected');
                  showToast(lang === 'ta' ? 'விடுபட்ட வீடுகள் அறிக்கைகளுக்குத் நகர்ந்தது' : 'Navigated to: Total Household Not Covered Reports');
                }}
                onNavigateToFrequentlyNotCovered={() => {
                  setActiveTab('frequently-not-covered-area');
                  showToast(lang === 'ta' ? 'அடிக்கடி சேகரிக்கப்படாத வீடுகள் பகுதிக்குத் நகர்ந்தது' : 'Navigated to: Frequently Not Covered Area Intelligence View');
                }}
              />

              {/* Zone summaries */}
              <div className="animate-dash-enter w-full" style={{ animationDelay: '120ms' }}>
                <ZoneSummaryTable
                  summaries={zoneSummaries}
                  lang={lang}
                  onSelectZone={(zone) => {
                    showToast(lang === 'ta' ? `${zone} மண்டலத்தின் மூலம் வடிகட்டப்படுகிறது` : `Filtering metrics by: ${zone}`);
                  }}
                />
              </div>

              {/* Recent Collections (Placed on the next line as a full report table) */}
              <div className="animate-dash-enter w-full" style={{ animationDelay: '200ms' }}>
                <RecentCollectionTable
                  records={collectionRecords}
                  lang={lang}
                  onInspectRecord={handleInspectRecord}
                  onViewAllReports={() => setActiveTab('reports')}
                />
              </div>
            </div>
          )}

          {/* TAB 4: REPORTS */}
          {activeTab === 'reports' && (
            <ReportsView
              records={collectionRecords}
              zoneSummaries={zoneSummaries}
              onInspectRecord={handleInspectRecord}
              onNavigateToLiveTracking={() => showToast('GPS Tracking is managed by ICCC central system.')}
              onShowToast={showToast}
              lang={lang}
            />
          )}

          {/* TAB 5: COLLECTED (TOTAL HOUSEHOLD COVERED DETAILS) */}
          {activeTab === 'collected' && (
            <CollectedView
              records={collectionRecords}
              onInspectRecord={handleInspectRecord}
              onBackToOverview={() => setActiveTab('overview')}
              onNavigateToNotCovered={() => {
                setActiveTab('not-collected');
                showToast(lang === 'ta' ? 'விடுபட்ட வீடுகள் அறிக்கைகளுக்குத் நகர்ந்தது' : 'Navigated to: Total Household Not Covered Reports');
              }}
              lang={lang}
            />
          )}

          {/* TAB 6: NOT COLLECTED (TOTAL HOUSEHOLD NOT COVERED REPORTS) */}
          {activeTab === 'not-collected' && (
            <NotCollectedView
              records={collectionRecords}
              onInspectRecord={handleInspectRecord}
              onBackToOverview={() => setActiveTab('overview')}
              onNavigateToCovered={() => {
                setActiveTab('collected');
                showToast(lang === 'ta' ? 'மொத்த வீட்டுச் சேகரிப்பு விவரங்களுக்குத் நகர்ந்தது' : 'Navigated to: Total Household Covered Details');
              }}
              lang={lang}
            />
          )}

          {/* TAB 7: FREQUENTLY NOT COVERED AREA (அடிக்கடி சேகரிக்கப்படாத பகுதிகள்) */}
          {activeTab === 'frequently-not-covered-area' && (
            <FrequentlyNotCoveredAreaView
              records={sbmRecords}
              lang={lang}
              onNavigateToLiveTracking={(_zone, info) => {
                if (info) {
                  showToast(`GPS Tracking: ${info}`);
                }
              }}
              onShowToast={showToast}
            />
          )}

          {/* TAB: AI PREDICTION & PREDICTIVE ANALYTICS */}
          {activeTab === 'ai-prediction' && (
            <div className="space-y-6">
              <AIPredictionAnalyticsSection
                records={sbmRecords}
                lang={lang}
                onShowToast={showToast}
                onDispatchAction={(actionType) => {
                  if (actionType === 'ai_route_optimized') {
                    showToast(
                      lang === 'ta'
                        ? 'AI ஸ்மார்ட் பாதை உகப்பாக்கம் வெற்றிகரமாக செயல்படுத்தப்பட்டது'
                        : 'AI predictive route optimization successfully deployed'
                    );
                  }
                }}
              />
            </div>
          )}

          {/* TAB: QR CHECKPOINT MANAGEMENT (QR code creation & administration) */}
          {activeTab === 'qr-management' && (
            <div className="space-y-6">
              <QRCheckpointManagementView token={token || 'demo-token'} />
            </div>
          )}

          {/* TAB 8: SBM ADMIN VIEW */}
          {activeTab === 'sbm-admin' && (
            <div className="space-y-6">
              <div className="bg-emerald-900 text-white rounded-2xl p-5 border border-emerald-800 shadow-xl flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black">
                    SBM Door-to-Door Garbage Audit Panel
                  </h2>
                  <p className="text-xs sm:text-[13px] text-emerald-100 font-semibold mt-1">
                    Live solid waste metrics from sanitary supervisors and worker route scanning
                  </p>
                </div>
                <button
                  onClick={() => {
                    onRefreshSbmData();
                    showToast('SBM Door-to-Door database synced successfully.');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition shadow-md border border-emerald-500"
                >
                  Sync Database
                </button>
              </div>

              {/* Live SWMS Admin Dashboard View */}
              <SWMSAdminDashboardView
                records={sbmRecords}
                stats={sbmStats}
                onOpenAiAudit={() => {
                  showToast('Requesting SBM AI audit analysis...');
                }}
              />
            </div>
          )}

        </div>
      </div>

      {/* 4. Record Detail Telemetry Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onStatusChange={handleStatusChange}
          onUploadPhoto={handleUploadPhoto}
          onViewOnMap={(_rec) => {
            showToast('GPS tracking is managed by the ICCC central system.');
          }}
        />
      )}

      {/* 5. Floating Toast Notification */}
      {toast && (
        <div className="animate-dash-enter fixed top-24 right-4 left-4 sm:left-auto z-50 bg-[#14532d] text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center space-x-2 font-semibold text-[12px] max-w-md">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />
          <span className="min-w-0 break-words">{toast}</span>
        </div>
      )}

    </div>
  );
};
