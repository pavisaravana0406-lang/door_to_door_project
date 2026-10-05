import React, { useState, useEffect, useCallback } from 'react';
import { SWMSHouseholdRecord, SWMSDashboardStats, SWMSAssignment } from './types';
import { SWMSWorkerApp } from './components/SWMSWorkerApp';
import { AIAssistantModal } from './components/AIAssistantModal';
import { LanguageSelectionModal } from './components/LanguageSelectionModal';
import { CheckCircle2 } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { CommissionerConsole } from './components/CommissionerConsole';
import { INITIAL_SWMS_RECORDS } from './data/mockData';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchSWMSData, authMe, authLogout } from './api/client';
import { isSubmissionComplete } from './utils/missedStreaks';
import { isPlaceholderVehicle } from './utils/householdProgress';

const normKey = (v?: string | null): string => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const recordOwnerKey = (r: SWMSHouseholdRecord): string => {
  const driver = normKey(r.driverWorkerName);
  if (!isPlaceholderVehicle(r.vehicleNo)) return `veh:${normKey(r.vehicleNo)}|${driver}`;
  return driver ? `drv:${driver}` : '';
};

/**
 * Strip the proof photos from the cached copy of a record.
 *
 * Each before/after pair is close to a megabyte of base64, so a handful of
 * doors overflows the ~5MB localStorage budget. The write then throws and the
 * worker is left staring at a button that never stops saying "Submitting".
 * The record in memory keeps its photos, so the success screen and the admin
 * views still show them; only the offline cache is slimmed.
 */
const withoutPhotos = (r: SWMSHouseholdRecord) => ({
  ...r,
  beforePhoto: undefined,
  afterPhoto: undefined,
  proofPhoto: undefined,
  photos: undefined,
  streetScans: (r.streetScans || []).map(s => ({ ...s, beforePhoto: undefined, afterPhoto: undefined })),
});

/** Write the record cache, degrading rather than throwing when storage is full. */
const persistRecords = (records: SWMSHouseholdRecord[]): void => {
  const key = 'swms_household_records';
  try {
    localStorage.setItem(key, JSON.stringify(records.map(withoutPhotos)));
  } catch {
    try {
      // Photos already stripped, so if this still fails it is record count.
      // Keep the most recent 50 and let the server hold the history.
      localStorage.setItem(key, JSON.stringify(records.slice(0, 50).map(withoutPhotos)));
    } catch {
      console.warn('[SWMS] could not cache records locally; continuing without the cache');
    }
  }
};


export default function App() {
  const [records, setRecords] = useState<SWMSHouseholdRecord[]>(() => {
    const saved = localStorage.getItem('swms_household_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any legacy dummy records & sanitize vehicle numbers
          const realOnly = parsed
            .filter(
              (r: any) =>
                r &&
                r.id &&
                !r.id.startsWith('REC-100') &&
                !r.houseId?.startsWith('HID10010')
            )
            .map((r: any) => {
              if (r.streetName?.toLowerCase().includes('mageshwari') || r.vehicleNo?.includes('38 PV 9001')) {
                return { ...r, vehicleNo: 'TN66AD6465', vehicleType: 'TATA ACE' };
              }
              return r;
            });
          return realOnly;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_SWMS_RECORDS;
  });

  const [stats, setStats] = useState<SWMSDashboardStats>(() => {
    const saved = localStorage.getItem('swms_household_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const covered = INITIAL_SWMS_RECORDS.filter(r => r.coverageStatus === 'Covered').length;
    const notCovered = INITIAL_SWMS_RECORDS.filter(r => r.coverageStatus === 'Not Covered').length;
    const total = INITIAL_SWMS_RECORDS.length;
    return {
      totalHouseholds: total,
      coveredHouseholds: covered,
      notCoveredHouseholds: notCovered,
      todaysEntries: covered,
      coveragePercentage: total > 0 ? Math.round((covered / total) * 100) : 0,
      zoneBreakdown: [
        { zone: "Central Zone", covered: 0, total: 0 },
        { zone: "East Zone", covered: 0, total: 0 },
        { zone: "West Zone", covered: 0, total: 0 },
        { zone: "North Zone", covered: 0, total: 0 },
        { zone: "South Zone", covered: 0, total: 0 }
      ]
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Global Language State ('en' | 'ta') - Default to English 'en'
  const [lang, setLang] = useState<'en' | 'ta'>(() => {
    const saved = localStorage.getItem('ccmc_lang');
    return (saved === 'en' || saved === 'ta') ? saved : 'en';
  });
  // Currently assigned vehicle ('v-push-cart' | 'v-tata-ace' | 'v-bov' | 'v-obl-pvt')
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>(() => {
    return localStorage.getItem('ccmc_assigned_vehicle') || 'v-push-cart';
  });
  // Initial Language Selection Modal opens automatically after login
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // User Session State - Default to null so initial link load always opens the Login Screen first
  const [user, setUser] = useState<{ role: 'worker' | 'admin'; name: string } | null>(null);
  // Officer profile info (area, cssContact, vehicles) from login
  const [workerInfo, setWorkerInfo] = useState<any>(null);
  // Backend session token + auto-loaded vehicle/worker assignment
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ccmc_session_token');
  });
  const [assignment, setAssignment] = useState<SWMSAssignment | null>(() => {
    const saved = localStorage.getItem('ccmc_assignment');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSuccess = (loggedInUser: { role: 'worker' | 'admin'; name: string; token?: string; assignment?: SWMSAssignment; workerInfo?: any }) => {
    setUser({ role: loggedInUser.role, name: loggedInUser.name });
    localStorage.setItem('ccmc_session', JSON.stringify({ role: loggedInUser.role, name: loggedInUser.name }));

    if (loggedInUser.token) {
      setToken(loggedInUser.token);
      localStorage.setItem('ccmc_session_token', loggedInUser.token);
    }
    if (loggedInUser.assignment) {
      setAssignment(loggedInUser.assignment);
      localStorage.setItem('ccmc_assignment', JSON.stringify(loggedInUser.assignment));
      const isPush = !!loggedInUser.assignment.isPushcart;
      const vehId = isPush ? 'v-push-cart' : 'v-tata-ace';
      setAssignedVehicleId(vehId);
      localStorage.setItem('ccmc_assigned_vehicle', vehId);
    }
    if (loggedInUser.workerInfo) {
      setWorkerInfo(loggedInUser.workerInfo);
      localStorage.setItem('ccmc_worker_info', JSON.stringify(loggedInUser.workerInfo));
    }

    if (loggedInUser.role === 'worker') {
      // Worker login: reset all cached street scan states so all 5 vehicle scan points start 100% fresh in RED (Pending X)
      localStorage.removeItem('ccmc_street_5scans');
      localStorage.removeItem('ccmc_scanned_addresses');
      sessionStorage.clear();
      setIsLangModalOpen(true);
    } else {
      setIsLangModalOpen(false);
    }
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setWorkerInfo(null);
    setToken(null);
    setAssignment(null);
    localStorage.removeItem('ccmc_session');
    localStorage.removeItem('ccmc_worker_info');
    localStorage.removeItem('ccmc_session_token');
    localStorage.removeItem('ccmc_assignment');
    setIsLangModalOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    const t = localStorage.getItem('ccmc_session_token');

    // Clear the session and return to the login screen immediately. Revoking
    // the token on the server is best-effort and must never block the user —
    // awaiting it first left the UI frozen whenever the server was slow.
    clearSession();
    showToast('Session logged out.');

    if (t) {
      try {
        await authLogout(t);
      } catch {
        // Token expires on its own; nothing else to do.
      }
    }
  }, [clearSession, showToast]);

  const handleSetLang = (newLang: 'en' | 'ta') => {
    setLang(newLang);
    localStorage.setItem('ccmc_lang', newLang);
    showToast(newLang === 'ta' ? 'தமிழ் மொழி மாற்றப்பட்டது' : 'Language set to English');
  };

  // Save records and stats to local storage on change.
  // Routed through persistRecords so the photos are stripped and a full quota
  // cannot throw from inside an effect.
  useEffect(() => {
    persistRecords(records);
  }, [records]);

  useEffect(() => {
    localStorage.setItem('swms_household_stats', JSON.stringify(stats));
  }, [stats]);

  const isAuthError = (e: any) => /401|403|session|expired|auth/i.test(String(e?.message || ''));

  const fetchSwmsData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const live = await fetchSWMSData(token);
      const liveRecords = Array.isArray(live?.records) ? live.records : [];
      if (liveRecords.length === 0) {
        setIsLoading(false);
        return;
      }
      setRecords(prev => {
        const merged = [...liveRecords, ...prev.filter(p => !liveRecords.some(l => l.id === p.id))];
        persistRecords(merged);
        return merged;
      });
      if (live?.stats) {
        setStats(live.stats);
        localStorage.setItem('swms_household_stats', JSON.stringify(live.stats));
      }
      showToast('Live SWMS data synced from Neon DB.');
    } catch (e: any) {
      if (isAuthError(e)) {
        clearSession();
        showToast('Session expired. Please log in again.');
      }
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [token, clearSession]);

  // Validate restored token on startup — never trust localStorage alone.
  useEffect(() => {
    const savedToken = localStorage.getItem('ccmc_session_token');
    const savedSession = localStorage.getItem('ccmc_session');
    if (!savedToken || !savedSession) {
      clearSession();
      return;
    }
    try {
      const parsed = JSON.parse(savedSession);
      if (!parsed?.role || !parsed?.name) {
        clearSession();
        return;
      }
      setUser({ role: parsed.role, name: parsed.name });
    } catch {
      clearSession();
      return;
    }
    authMe(savedToken)
      .then((res) => {
        if (res?.user) {
          setAssignment(res.user);
          localStorage.setItem('ccmc_assignment', JSON.stringify(res.user));
          setToken(savedToken);
        } else {
          clearSession();
        }
      })
      .catch(() => {
        // Invalid/expired token → force login screen.
        clearSession();
      });
  }, [clearSession]);

  useEffect(() => {
    fetchSwmsData();
  }, [fetchSwmsData]);

  const handleRecordCreated = (newRecord: SWMSHouseholdRecord) => {
    // A record is only published to the admin dashboard once the worker's run is
    // genuinely finished. For a 5-scan vehicle that means all 5 checkpoints are
    // scanned AND each carries its own before/after photo; otherwise the record
    // stays out of the dashboard rather than showing as partially done.
    if (!isSubmissionComplete(newRecord)) {
      console.warn('[SWMS] withheld incomplete record from admin dashboard', newRecord.id, {
        scans: (newRecord.streetScans || []).filter(s => s.isScanned).length,
        scansWithPhotos: (newRecord.streetScans || []).filter(s => s.isScanned && s.beforePhoto && s.afterPhoto).length,
      });
      return;
    }

    setRecords(prev => {
      // Replace only this worker's own record for the same door. The previous
      // filter keyed on street alone, so a cart submitting a door wiped a
      // different cart's record for that same street, and both carts' records
      // shared one list.
      const vehicle = normKey(newRecord.vehicleNo);
      const driver = normKey(newRecord.driverWorkerName);
      const key = !isPlaceholderVehicle(newRecord.vehicleNo) && vehicle
        ? `veh:${vehicle}|${driver}`
        : (driver ? `drv:${driver}` : '');
      const doorKey = `${normKey(newRecord.streetName)}#${normKey(newRecord.doorNo)}`;
      const filtered = prev.filter(r => {
        if (r.id === newRecord.id) return false;
        if (!key) return true; // no owner recorded, cannot safely dedupe
        if (recordOwnerKey(r) !== key) return true; // someone else's record
        return `${normKey(r.streetName)}#${normKey(r.doorNo)}` !== doorKey;
      });
      const updated = [newRecord, ...filtered];
      persistRecords(updated);
      return updated;
    });

    setStats(prev => {
      setRecords(currentRecords => {
        const covered = currentRecords.filter(r => r.coverageStatus === 'Covered').length;
        const notCovered = currentRecords.filter(r => r.coverageStatus === 'Not Covered').length;
        const total = currentRecords.length;
        return currentRecords;
      });

      const isCovered = newRecord.coverageStatus === 'Covered';
      const total = prev.totalHouseholds > 0 ? prev.totalHouseholds : 1;
      const covered = isCovered ? Math.max(1, prev.coveredHouseholds + 1) : prev.coveredHouseholds;
      const notCovered = !isCovered ? prev.notCoveredHouseholds : Math.max(0, prev.notCoveredHouseholds - 1);
      return {
        ...prev,
        totalHouseholds: total,
        coveredHouseholds: covered,
        notCoveredHouseholds: notCovered,
        todaysEntries: prev.todaysEntries + 1,
        coveragePercentage: total > 0 ? Math.round((covered / total) * 100) : 100
      };
    });
  };

  const handleSelectLanguage = (selectedLang: 'en' | 'ta') => {
    setLang(selectedLang);
    setIsLangModalOpen(false);
    showToast(selectedLang === 'ta' ? 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது' : 'English Language Selected');
  };

  // Role switching without re-login removed (was an auth bypass).
  // To use a different role, log out and log in with that role's credentials.
  const handleRequireReloginForRoleSwitch = () => {
    showToast('Please log out and log in with the other role.');
  };

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  // Admin users directly enter Commissioner Command Console
  if (user.role === 'admin') {
    return (
      <ErrorBoundary>
        <CommissionerConsole
          sbmRecords={records}
          sbmStats={stats}
          onRefreshSbmData={fetchSwmsData}
          onLogout={handleLogout}
          onSwitchRole={handleRequireReloginForRoleSwitch}
          lang={lang}
          onSetLang={handleSetLang}
          token={token}
          userName={user.name}
        />
      </ErrorBoundary>
    );
  }

  // If Language Selection modal is active right after field worker login, render it
  if (isLangModalOpen) {
    return (
      <ErrorBoundary>
        <LanguageSelectionModal
          isOpen={true}
          currentLang={lang}
          onSelectLanguage={handleSelectLanguage}
          onClose={() => {
            setIsLangModalOpen(false);
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white sm:bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
        {/* Main App Stage - Official CCMC Header is directly integrated into SWMSWorkerApp */}
        <main className="flex-1 w-full flex flex-col justify-start items-stretch bg-white p-0">
          <SWMSWorkerApp
            stats={stats}
            records={records}
            lang={lang}
            token={token}
            assignment={assignment}
            assignedVehicleId={assignedVehicleId}
            onSetAssignedVehicle={(vId) => {
              setAssignedVehicleId(vId);
              localStorage.setItem('ccmc_assigned_vehicle', vId);
            }}
            userName={user.name || 'Karthik Muthusamy'}
            workerInfo={workerInfo}
            onLogout={handleLogout}
            onSetLanguage={setLang}
            onOpenLanguageModal={() => setIsLangModalOpen(true)}
            onRefreshData={fetchSwmsData}
            onRecordCreated={handleRecordCreated}
          />
        </main>

        {/* Gemini AI Audit Modal */}
        <AIAssistantModal
          isOpen={isAiModalOpen}
          lang={lang}
          onClose={() => setIsAiModalOpen(false)}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center space-x-2 animate-bounce font-medium text-xs">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

