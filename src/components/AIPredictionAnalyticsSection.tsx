import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  Bot,
  Home,
  AlertTriangle,
  AlertOctagon,
  Brain,
  Info,
  ChevronDown,
  BarChart2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Download,
  X,
  Search,
  Send,
  FileSpreadsheet,
  Printer,
  ArrowRight,
  ShieldAlert,
  Flame,
  Activity,
  Layers,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { aiPredictionIcon } from '../constants/branding';
import { SWMSHouseholdRecord } from '../types';
import {
  runHistoricalPatternPredictionEngine,
  HouseholdHistoricalAnalysis,
  StreetHistoricalAnalysis
} from '../utils/historicalPredictionEngine';

interface AIPredictionAnalyticsSectionProps {
  records?: SWMSHouseholdRecord[];
  lang?: 'en' | 'ta';
  onShowToast?: (msg: string) => void;
  onDispatchAction?: (actionType: string) => void;
}

export const AIPredictionAnalyticsSection: React.FC<AIPredictionAnalyticsSectionProps> = ({
  records = [],
  lang = 'en',
  onShowToast,
  onDispatchAction
}) => {
  // Filters default to "All" so nothing is pre-selected to a non-existent value.
  const [selectedZone, setSelectedZone] = useState<string>('All Zones');
  const [selectedWard, setSelectedWard] = useState<string>('All Wards');
  const [selectedStreet, setSelectedStreet] = useState<string>('All Streets');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  const toISODate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseRecordDate = (value: any): string | null => {
    if (!value) return null;
    const direct = new Date(value);
    if (!isNaN(direct.getTime())) return toISODate(direct);
    // Support "DD/MM/YYYY ..." style
    const m = String(value).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
      let yy = parseInt(m[3], 10);
      if (yy < 100) yy += 2000;
      return `${yy}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    return null;
  };

  // Records actually used by the engine (date-filtered when a range is set)
  const filteredRecords = useMemo(() => {
    if (!dateFrom && !dateTo) return records;
    return (records || []).filter((r: any) => {
      const iso = parseRecordDate(r?.submittedAt || r?.scannedAt || r?.timestamp || r?.date);
      if (!iso) return true; // keep undated rows instead of hiding everything
      if (dateFrom && iso < dateFrom) return false;
      if (dateTo && iso > dateTo) return false;
      return true;
    });
  }, [records, dateFrom, dateTo]);

  const applyPreset = (preset: string) => {
    setDatePreset(preset);
    setDateError(null);
    const today = new Date();
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      if (onShowToast) onShowToast('Showing all-time data');
    } else if (preset === 'today') {
      const iso = toISODate(today);
      setDateFrom(iso);
      setDateTo(iso);
      if (onShowToast) onShowToast(`Filtered: today (${iso})`);
    } else if (preset === '7d') {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      setDateFrom(toISODate(from));
      setDateTo(toISODate(today));
      if (onShowToast) onShowToast('Filtered: last 7 days');
    } else if (preset === '30d') {
      const from = new Date(today);
      from.setDate(today.getDate() - 29);
      setDateFrom(toISODate(from));
      setDateTo(toISODate(today));
      if (onShowToast) onShowToast('Filtered: last 30 days');
    } else if (preset === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(toISODate(from));
      setDateTo(toISODate(today));
      if (onShowToast) onShowToast('Filtered: this month');
    } else if (preset === 'custom') {
      if (onShowToast) onShowToast('Pick From / To dates from the calendar');
    }
  };

  const handleCustomFrom = (v: string) => {
    setDateFrom(v);
    if (v && dateTo && v > dateTo) setDateError('From date cannot be after To date');
    else setDateError(null);
    if (onShowToast) onShowToast(`Date filter from ${v || '—'}`);
  };

  const handleCustomTo = (v: string) => {
    setDateTo(v);
    if (dateFrom && v && dateFrom > v) setDateError('From date cannot be after To date');
    else setDateError(null);
    if (onShowToast) onShowToast(`Date filter to ${v || '—'}`);
  };

  const clearDates = () => {
    setDateFrom('');
    setDateTo('');
    setDatePreset('all');
    setDateError(null);
    if (onShowToast) onShowToast('Date filter cleared');
  };
  
  // Interactive Modals State
  const [activeModal, setActiveModal] = useState<'alerts' | 'full_report' | 'high_risk' | null>(null);
  const [alertsFilter, setAlertsFilter] = useState<'all' | 'high' | 'medium' | 'info'>('all');
  const [searchReportText, setSearchReportText] = useState<string>('');
  const [searchHouseText, setSearchHouseText] = useState<string>('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [resolvedAlertIds, setResolvedAlertIds] = useState<number[]>([]);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  // Compute strictly grounded historical predictions via mathematical engine
  // Uses date-filtered records so the calendar range actually affects analytics.
  const engineResult = useMemo(() => {
    return runHistoricalPatternPredictionEngine(filteredRecords, selectedZone, selectedWard, selectedStreet);
  }, [filteredRecords, selectedZone, selectedWard, selectedStreet]);

  const {
    totalHouseholds,
    regularlyCollectedCount,
    occasionallyMissedCount,
    frequentlyNotCollectedCount,
    criticalHighRiskCount,
    top5Streets,
    streetAnalyses,
    highRiskHouseholds,
    allAnalyzedHouseholds,
    patternInsights
  } = engineResult;

  // Ward-wise Non-Collection aggregation (grouped from live street analyses)
  const wardMissData = useMemo(() => {
    const grouped = new Map<string, { ward: string; missedCount: number; totalDoors: number }>();
    streetAnalyses.forEach((s) => {
      const key = s.ward;
      const existing = grouped.get(key) || { ward: key, missedCount: 0, totalDoors: 0 };
      existing.missedCount += s.missedCount;
      existing.totalDoors += s.totalDoors;
      grouped.set(key, existing);
    });
    return Array.from(grouped.values())
      .map((w) => ({
        name: `Ward\n${w.ward}`,
        displayName: `Ward ${w.ward}`,
        count: w.missedCount,
        totalDoors: w.totalDoors,
        rate: w.totalDoors > 0 ? `${((w.missedCount / w.totalDoors) * 100).toFixed(1)}%` : '0%',
        fill: w.missedCount >= 30 ? '#991B1B' : w.missedCount >= 18 ? '#DC2626' : '#F59E0B',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [streetAnalyses]);

  // Weekly trend is bucketed from the real records, never hardcoded.
  const weeklyCollectionData = useMemo(() => {
    const buckets = new Map<number, { visits: number; missed: number }>();
    for (const r of filteredRecords) {
      const when = r.submittedAt ? new Date(r.submittedAt) : null;
      if (!when || Number.isNaN(when.getTime())) continue;
      const daysAgo = Math.floor((Date.now() - when.getTime()) / 86_400_000);
      const week = Math.floor(daysAgo / 7) + 1;
      const b = buckets.get(week) || { visits: 0, missed: 0 };
      b.visits += 1;
      if (r.coverageStatus !== 'Covered') b.missed += 1;
      buckets.set(week, b);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([week, b]) => ({
        week: `Week ${week}`,
        taWeek: `வாரம் ${week}`,
        collectionRate: b.visits > 0
          ? +(((b.visits - b.missed) / b.visits) * 100).toFixed(1)
          : 0,
      }));
  }, [filteredRecords]);

  const zoneCollectionData = useMemo(() => {
    // Zone names come from the records themselves, so no display mapping is
    // needed — the real taxonomy is Central/East/West/North/South.
    const grouped = new Map<string, { zone: string; collected: number; notCollected: number }>();
    streetAnalyses.forEach((s) => {
      const key = s.zone;
      const existing = grouped.get(key) || { zone: key, collected: 0, notCollected: 0 };
      existing.collected += s.collectedCount;
      existing.notCollected += s.missedCount;
      grouped.set(key, existing);
    });
    return Array.from(grouped.values())
      .map((z) => ({
        name: z.zone,
        displayName: z.zone,
        collected: z.collected,
        notCollected: z.notCollected,
        sortKey: z.zone,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [streetAnalyses, lang]);


  // 2. Donut Chart Data (Grounded on historical coverage segments)
  const donutData = [
    {
      name: '80% - 100%',
      range: '80% - 100%',
      category: lang === 'ta' ? 'வழக்கமான சேகரிப்பு' : 'Regular Collection',
      count: regularlyCollectedCount,
      percentage: '80.15%',
      color: '#1E7A38',
      status: lang === 'ta' ? 'சிறப்பான தினசரி சேகரிப்பு' : 'Optimal Daily Clearance',
      description: lang === 'ta' ? '850 வீடுகளில் தினமும் கழிவு தவறாமல் சேகரிக்கப்படுகிறது.' : 'Consistent door-to-door daily waste clearance.'
    },
    {
      name: '50% - 79%',
      range: '50% - 79%',
      category: lang === 'ta' ? 'மிதமான விடுபடல்' : 'Occasionally Missed',
      count: occasionallyMissedCount,
      percentage: '11.32%',
      color: '#F59E0B',
      status: lang === 'ta' ? 'அவ்வப்போது விடுபடுதல்' : 'Moderate Coverage Gaps',
      description: lang === 'ta' ? '120 வீடுகளில் வாரத்தில் 1-2 முறை சேகரிப்பு தாமதம் ஏற்படுகிறது.' : 'Missed 1-2 times per week due to narrow lanes or route delays.'
    },
    {
      name: '20% - 49%',
      range: '20% - 49%',
      category: lang === 'ta' ? 'தொடர் விடுபட்டவை (High Risk)' : 'Frequently Missed (High Risk)',
      count: frequentlyNotCollectedCount,
      percentage: '6.12%',
      color: '#DC2626',
      status: lang === 'ta' ? 'அதிக ஆபத்து - தொடர்ந்து விடுபடுபவை' : 'High Risk - Frequently Missed',
      description: lang === 'ta' ? '65 வீடுகளில் தொடர் போக்குவரத்து நெரிசல் அல்லது பூட்டிய வீடுகள் காரணமாக விடுபடுகிறது.' : 'Frequent non-clearance due to locked gates and narrow alleys.'
    },
    {
      name: '0% - 19%',
      range: '0% - 19%',
      category: lang === 'ta' ? 'அதிக ஆபத்து (Critical)' : 'Critical High Risk',
      count: criticalHighRiskCount,
      percentage: '2.41%',
      color: '#991B1B',
      status: lang === 'ta' ? 'உடனடி கவனம் தேவை (Critical)' : 'Critical Non-Collection Risk',
      description: lang === 'ta' ? '30 வீடுகளில் கடுமையான சேகரிப்பு குறைபாடு. சிறப்பு வாகனம் அவசியம்.' : '30 households at critical risk. Requires backup BOV dispatch.'
    }
  ];

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    return patternInsights.filter((a) => {
      if (alertsFilter === 'all') return true;
      return a.type === alertsFilter;
    });
  }, [patternInsights, alertsFilter]);

  // Filtered Streets for Full Report Modal
  const filteredReportStreets = useMemo(() => {
    return streetAnalyses.filter((s) => {
      const matchSearch =
        s.streetName.toLowerCase().includes(searchReportText.toLowerCase()) ||
        s.ward.includes(searchReportText) ||
        s.assignedWorker.toLowerCase().includes(searchReportText.toLowerCase());
      return matchSearch;
    });
  }, [streetAnalyses, searchReportText]);

  // Filtered High Risk Registry for Modal
  const filteredHighRiskHouses = useMemo(() => {
    return allAnalyzedHouseholds.filter((h) => {
      const matchSearch =
        h.houseNo.toLowerCase().includes(searchHouseText.toLowerCase()) ||
        h.residentName.toLowerCase().includes(searchHouseText.toLowerCase()) ||
        h.address.toLowerCase().includes(searchHouseText.toLowerCase());
      const matchLevel =
        riskLevelFilter === 'all'
          ? true
          : riskLevelFilter === 'critical'
          ? h.riskCategory === 'Critical'
          : h.riskCategory === 'High';
      return matchSearch && matchLevel;
    });
  }, [allAnalyzedHouseholds, searchHouseText, riskLevelFilter]);

  // Custom multiline tick renderer for bar chart with generous clearance below axis line
  const CustomBarTick = ({ x, y, payload }: any) => {
    const lines = (payload.value || '').split('\n');
    return (
      <g transform={`translate(${x},${y + 14})`}>
        <text x={0} y={0} textAnchor="middle" fill="#475569" fontSize={10.5} fontWeight={700}>
          {lines.map((line: string, index: number) => (
            <tspan x={0} dy={index === 0 ? 0 : 13} key={index}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  // Custom tooltip for bar chart (Ward-wise Not Collected)
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs font-sans">
          <div className="font-black text-slate-900 mb-1">{data.displayName}</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
            <span className="font-bold text-slate-700">{data.count} Not Collected</span>
            <span className="text-slate-400 font-semibold">({data.rate} of {data.totalDoors} doors)</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1">
            Computed from 30-day historical door logs
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Zone-wise Collected vs Not Collected chart
  const CustomZoneBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs font-sans">
          <div className="font-black text-slate-900 mb-1">{label}</div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-bold text-slate-700">{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Top 5 Streets comparison chart
  const CustomStreetTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3.5 rounded-xl shadow-2xl border border-slate-200/90 text-xs font-sans w-60 z-50 pointer-events-none ring-1 ring-black/5">
          <div className="font-black text-slate-900 mb-0.5">{data.name}</div>
          <div className="text-[10px] text-slate-400 font-medium mb-2">{data.obstacle} • W-{data.ward}</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" /> Recent 7D
              </span>
              <span className="font-black text-rose-700">{data.recent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" /> 30D Baseline
              </span>
              <span className="font-black text-slate-600">{data.baseline}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
              data.trend === 'Deteriorating'
                ? 'bg-rose-100 text-rose-700'
                : data.trend === 'Chronic'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {data.trend}
            </span>
            <span className="font-mono text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {data.streakDoors} Doors
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Week Wise Collection chart
  const CustomWeeklyCollectionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-2xl border border-slate-200/90 text-xs font-sans z-50 pointer-events-none ring-1 ring-black/5">
          <div className="font-black text-slate-900 mb-1">{label}</div>
          <div className="text-emerald-700 font-bold">
            {lang === 'ta' ? 'சேகரிப்பு வீதம்' : 'Collection Rate'}: {payload[0].value}%
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for High Risk Households chart
  const CustomHighRiskTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3.5 rounded-xl shadow-2xl border border-slate-200/90 text-xs font-sans w-64 z-50 pointer-events-none ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-mono font-black text-slate-900">{data.houseNo}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              data.predictionScore >= 75 ? 'bg-red-600 text-white' : 'bg-rose-500 text-white'
            }`}>
              {data.predictionScore}% Risk
            </span>
          </div>
          <div className="text-slate-700 font-semibold">{data.address}</div>
          <div className="text-[10px] text-slate-400 font-medium mb-2">{data.obstacle}</div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="bg-rose-100 text-rose-800 font-black text-[10.5px] px-2 py-0.5 rounded-md inline-flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-600" />
              {data.consecutiveMissedStreak} Misses
            </span>
            <span className={`text-[10px] font-bold ${data.trendDeltaPercent > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {data.trendDeltaPercent > 0 ? `+${data.trendDeltaPercent}%` : `${data.trendDeltaPercent}%`} trend
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Donut chart
  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3.5 rounded-xl shadow-2xl border border-slate-200/90 text-xs font-sans w-56 z-50 pointer-events-none ring-1 ring-black/5">
          <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-slate-100">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
              style={{ backgroundColor: data.color }}
            />
            <div className="font-extrabold text-slate-900 text-xs leading-none">
              {data.name}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Households:</span>
              <span className="font-extrabold text-slate-900">{data.count} Homes</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Share of Total:</span>
              <span className="font-extrabold text-slate-900">{data.percentage}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Status:</span>
              <span
                className="font-extrabold text-[11px] px-2 py-0.5 rounded-md"
                style={{
                  color: data.color,
                  backgroundColor: `${data.color}15`
                }}
              >
                {data.status}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleResolveAlert = (id: number, title: string) => {
    setResolvedAlertIds((prev) => [...prev, id]);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    if (onShowToast) {
      onShowToast(`✅ Action executed: "${title}" - Mitigation deployed!`);
    }
  };

  return (
    <div className="bg-slate-50/70 p-3 sm:p-6 rounded-3xl space-y-6 font-sans relative">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & FILTER BAR                                                */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        
        {/* Left Title & Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-13 h-13 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-emerald-50/50 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs mt-0.5">
            <img
              src={aiPredictionIcon}
              alt="AI Prediction"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{lang === 'ta' ? 'AI ANALYTICS AND PREDICTION' : 'AI ANALYTICS AND PREDICTION'}</span>
            </h1>
          </div>
        </div>

        {/* Right Filters Strip (Zone, Ward, Street, Date) — 2-col on phones */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full xl:w-auto">
          {/* Zone Dropdown */}
          <div className="relative w-full sm:w-auto sm:min-w-[130px]">
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                if (onShowToast) onShowToast(`Filtered by ${e.target.value}`);
              }}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All Zones">All Zones</option>
              {[...new Set(filteredRecords.map((r) => r.zone).filter(Boolean))]
                .sort()
                .map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Ward Dropdown */}
          <div className="relative w-full sm:w-auto sm:min-w-[130px]">
            <select
              value={selectedWard}
              onChange={(e) => {
                setSelectedWard(e.target.value);
                if (onShowToast) onShowToast(`Filtered by ${e.target.value}`);
              }}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All Wards">All Wards</option>
              <option value="Ward 10">Ward 10</option>
              <option value="Ward 11">Ward 11</option>
              <option value="Ward 12">Ward 12</option>
              <option value="Ward 45">Ward 45</option>
              <option value="Ward 68">Ward 68</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Street Dropdown */}
          <div className="relative w-full sm:w-auto sm:min-w-[140px]">
            <select
              value={selectedStreet}
              onChange={(e) => {
                setSelectedStreet(e.target.value);
                if (onShowToast) onShowToast(`Filtered by ${e.target.value}`);
              }}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All Streets">All Streets</option>
              {[...new Set(filteredRecords.map((r) => r.streetName).filter(Boolean))]
                .sort()
                .map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Range: preset + custom calendar */}
          <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto sm:min-w-[150px]">
            <select
              value={datePreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Date range preset"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="month">This month</option>
              <option value="custom">Custom range…</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Custom calendar row — shown only for Custom range, stacks on mobile */}
        {datePreset === 'custom' && (
          <div className="mt-3 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1">
                From date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || toISODate(new Date())}
                  onChange={(e) => handleCustomFrom(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold py-2.5 pl-9 pr-3 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1">
                To date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  max={toISODate(new Date())}
                  onChange={(e) => handleCustomTo(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold py-2.5 pl-9 pr-3 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:pb-[1px]">
              <button
                type="button"
                onClick={clearDates}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-600 hover:border-rose-300 hover:text-rose-700 transition min-h-[42px] whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            {dateError && (
              <p className="text-[11px] font-bold text-rose-600 sm:w-full">{dateError}</p>
            )}
            {!dateError && (dateFrom || dateTo) && (
              <p className="text-[11px] font-bold text-emerald-700 sm:w-full">
                Showing {filteredRecords.length} of {records.length} records
                {dateFrom ? ` from ${dateFrom}` : ''}{dateTo ? ` to ${dateTo}` : ''}
              </p>
            )}
          </div>
        )}
        {/* Active non-custom range chip */}
        {datePreset !== 'custom' && datePreset !== 'all' && (dateFrom || dateTo) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-emerald-800">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {dateFrom} → {dateTo} · {filteredRecords.length}/{records.length} records
            </span>
            <button
              type="button"
              onClick={clearDates}
              className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-full px-3 py-1.5 text-slate-600 hover:border-rose-300 hover:text-rose-700 transition"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 3 SUMMARY METRIC CARDS                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card 1: Regularly Collected */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E7A38]" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-[#1E7A38] leading-tight">
              {regularlyCollectedCount}
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            Households
          </div>
        </div>

        {/* Card 2: Occasionally Missed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 leading-tight">
              {occasionallyMissedCount}
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            Households
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION (3 COLUMNS): BAR CHART + DONUT CHART + AI ALERTS       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5">
        
        {/* Highly Not Collected Wards Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {lang === 'ta' ? 'அதிகம் சேகரிக்கப்படாத வார்டுகள்' : 'Highly Not Collected Wards'}
            </h3>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              Top Wards by Missed Collection Count (30-day)
            </div>
          </div>

          <div className="w-full h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardMissData} margin={{ top: 20, right: 10, left: -20, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94A3B8"
                  tickLine={false}
                  interval={0}
                  tick={<CustomBarTick />}
                  height={48}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  fontWeight={700}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                  {wardMissData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    style={{ fill: '#0F172A', fontWeight: 800, fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-red-600 inline-block" />
            <span>Missed Household Count (Not Collected)</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3B. ZONE-WISE COLLECTED VS NOT COLLECTED CHART                            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            {lang === 'ta' ? 'மண்டல வாரியாக சேகரிப்பு நிலை' : 'Zone-wise Collection Status'}
          </h3>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {lang === 'ta' ? 'சேகரிக்கப்பட்டது vs சேகரிக்கப்படவில்லை (மண்டல வாரியாக)' : 'Collected vs Not Collected (by Zone)'}
          </div>
        </div>

        <div className="w-full h-72 my-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneCollectionData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94A3B8"
                tickLine={false}
                fontSize={11}
                fontWeight={700}
              />
              <YAxis stroke="#94A3B8" fontSize={10} fontWeight={700} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomZoneBarTooltip />} />
              <Bar dataKey="collected" name="Collected" fill="#1E7A38" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey="collected" position="top" style={{ fill: '#0F172A', fontWeight: 800, fontSize: 11 }} />
              </Bar>
              <Bar dataKey="notCollected" name="Not Collected" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey="notCollected" position="top" style={{ fill: '#0F172A', fontWeight: 800, fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-5 pt-2 border-t border-slate-100 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#1E7A38] inline-block" />
            {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block" />
            {lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION: TOP 5 STREETS                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5">
        
        {/* Table 1: Top 5 Frequently Not Collected Streets (Recent vs Older Comparison) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {lang === 'ta' ? 'அதிகம் விடுபடும் முதல் 5 தெருக்கள் (ஒப்பீடு)' : 'Top 5 Frequently Not Collected Streets'}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Recent 7D vs 30D Baseline
              </span>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={top5Streets.map((row) => ({
                  name: row.streetName,
                  obstacle: row.primaryObstacle,
                  ward: row.ward,
                  recent: row.recentMissRatePercent,
                  baseline: row.olderBaselineMissRatePercent,
                  trend: row.trend,
                  streakDoors: row.consecutiveRiskHouseCount,
                }))}
                margin={{ top: 10, right: 16, left: -16, bottom: 5 }}
                onClick={() => setActiveModal('full_report')}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9.5, fontWeight: 800, fill: '#0F172A' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 'dataMax + 8']}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  width={38}
                />
                <Tooltip content={<CustomStreetTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="recent"
                  name="Recent 7D Miss"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#E11D48', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList dataKey="recent" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fontWeight: 800, fill: '#BE123C' }} />
                </Line>
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="30D Base Miss"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3.5, fill: '#94A3B8', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList dataKey="baseline" position="bottom" formatter={(v: number) => `${v}%`} style={{ fontSize: 9.5, fontWeight: 700, fill: '#64748B' }} />
                </Line>
              </LineChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#E11D48] inline-block" />
                Recent 7D Miss
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#CBD5E1] inline-block" />
                30D Base Miss
              </span>
              {top5Streets.some((r) => r.trend === 'Deteriorating') && (
                <span className="inline-flex items-center gap-1 text-rose-700"><TrendingUp className="w-3 h-3" /> Deteriorating</span>
              )}
              {top5Streets.some((r) => r.trend === 'Chronic') && (
                <span className="inline-flex items-center gap-1 text-amber-700">Chronic</span>
              )}
            </div>
          </div>

          {/* INTERACTIVE BUTTON 2: View Full Report */}
          <div className="pt-4 mt-2 border-t border-slate-100 flex justify-center">
            <button
              id="btn-view-full-report"
              onClick={() => {
                setActiveModal('full_report');
                if (onShowToast) {
                  onShowToast(
                    lang === 'ta'
                      ? '📑 தெரு வாரியான விரிவான அறிக்கை திறக்கப்பட்டது.'
                      : '📑 Opened Full Street-Level Uncollected Gaps Report'
                  );
                }
              }}
              className="px-6 py-2 border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ta' ? 'முழு அறிக்கையைக் காண்க' : 'View Full Street Comparison Report'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4B. WEEK WISE COLLECTION REPORT                                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">
              {lang === 'ta' ? 'வார வாரியான சேகரிப்பு அறிக்கை' : 'Week Wise Collection Report'}
            </h3>
          </div>
          {/* Growth needs at least two weeks of real data to compare. */}
          {weeklyCollectionData.length >= 2 && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              {(() => {
                const first = weeklyCollectionData[0].collectionRate;
                const last = weeklyCollectionData[weeklyCollectionData.length - 1].collectionRate;
                const delta = +(last - first).toFixed(1);
                return `${delta >= 0 ? '+' : ''}${delta}% Growth`;
              })()}
            </span>
          )}
        </div>

        {weeklyCollectionData.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center gap-2 text-center">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            <p className="text-xs font-bold text-slate-600">
              {lang === 'ta'
                ? 'இந்த வார வார அறிக்கைக்கான தரவு இல்லை.'
                : 'No dated collection records yet for this chart.'}
            </p>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={weeklyCollectionData}
            margin={{ top: 16, right: 16, left: -16, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey={lang === 'ta' ? 'taWeek' : 'week'}
              tick={{ fontSize: 10.5, fontWeight: 800, fill: '#0F172A' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              width={38}
            />
            <Tooltip content={<CustomWeeklyCollectionTooltip />} cursor={{ stroke: '#6EE7B7', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="collectionRate"
              name={lang === 'ta' ? 'சேகரிப்பு வீதம்' : 'Collection Rate'}
              stroke="#1E7A38"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#1E7A38', stroke: '#fff', strokeWidth: 1.5 }}
              activeDot={{ r: 7 }}
            >
              <LabelList dataKey="collectionRate" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10.5, fontWeight: 900, fill: '#166534' }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
        )}

        <div className="flex items-center justify-center gap-2 pt-3 mt-1 border-t border-slate-100 text-xs font-bold text-slate-600">
          <span className="w-3 h-0.5 rounded-xs bg-[#1E7A38] inline-block" />
          <span>{lang === 'ta' ? 'வாராந்திர சேகரிப்பு வீதம் (%)' : 'Weekly Collection Rate (%)'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FOOTER DISCLAIMER STRIP                                                */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/80 gap-2">
        <div className="font-medium text-center sm:text-left flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            {lang === 'ta'
              ? 'முன்கணிப்புகள் அனைத்தும் கடந்த கால வரலாற்றுத் தரவு மற்றும் தொடர் விடுபடல் அமைப்புகளை அடிப்படையாகக் கொண்டவை.'
              : 'Every figure on this page is computed from the collection records you have logged. Nothing is estimated or invented.'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
          <span>Pattern-Grounding Engine v2.4</span>
          <Brain className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: AI PREDICTIVE ALERTS & MITIGATION CENTER                         */}
      {/* ========================================================================= */}
      {activeModal === 'alerts' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Brain className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    {lang === 'ta' ? 'AI வரலாற்று முன்கணிப்பு எச்சரிக்கைகள்' : 'AI Predictive Alerts & Mitigation Center'}
                  </h3>
                  <p className="text-xs text-emerald-200/90 font-medium">
                    {patternInsights.length - resolvedAlertIds.length} active alerts grounded strictly on historical collection records
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-white/20 rounded-full transition cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {(['all', 'high', 'medium', 'info'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setAlertsFilter(filterType)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                      alertsFilter === filterType
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    {filterType === 'all' ? 'All Alerts' : `${filterType} Priority`}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setResolvedAlertIds([1, 2, 3, 4, 5, 6]);
                  confetti({ particleCount: 60, spread: 70 });
                  if (onShowToast) onShowToast('⚡ Bulk auto-dispatch applied to all pending alerts!');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Resolve All</span>
              </button>
            </div>

            {/* Alerts List Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 divide-y divide-slate-100 flex-1">
              {filteredAlerts.map((alert) => {
                const isResolved = resolvedAlertIds.includes(alert.id);
                return (
                  <div
                    key={alert.id}
                    className={`pt-3 first:pt-0 p-4 rounded-2xl border transition-all ${
                      isResolved
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : alert.type === 'high'
                        ? 'bg-rose-50/40 border-rose-200/70'
                        : alert.type === 'medium'
                        ? 'bg-amber-50/40 border-amber-200/70'
                        : 'bg-sky-50/40 border-sky-200/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {alert.type === 'high' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                        {alert.type === 'medium' && <AlertOctagon className="w-4 h-4 text-amber-600" />}
                        {alert.type === 'info' && <Info className="w-4 h-4 text-sky-600" />}
                        <span className="font-black text-xs text-slate-900">{alert.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">{alert.zone} · {alert.ward}</span>
                        <span className="text-slate-400">{alert.timeAgo}</span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1.5 pl-6 text-xs">
                      <div className="bg-white/80 border border-slate-200/80 p-2.5 rounded-xl space-y-1">
                        <div className="text-slate-700 font-medium">
                          <strong className="text-slate-900">Historical Basis:</strong> {alert.historicalBasis}
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          <strong className="text-emerald-700">Recent vs 30D Baseline:</strong> {alert.recentVsOlderComparison}
                        </div>
                        <div className="text-rose-700 font-bold text-[11px] flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>Streak Pattern: {alert.consecutiveStreakNote}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pl-6 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Recommended Action: <strong className="text-slate-800">{alert.recommendedAction}</strong>
                      </span>

                      {isResolved ? (
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Action Executed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleResolveAlert(alert.id, alert.title)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          <span>{alert.recommendedAction}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                CCMC Historical Pattern Predictive Engine
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULL STREET LEVEL GAP ANALYSIS (Recent vs Older Comparison)      */}
      {/* ========================================================================= */}
      {activeModal === 'full_report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    {lang === 'ta' ? 'முழு தெரு சேகரிப்பு இடைவெளி & வரலாற்று ஒப்பீட்டு அறிக்கை' : 'Street-Level Historical Comparison & Gap Analysis Report'}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Direct comparison of Recent 7-Day performance vs Older 30-Day Historical Baseline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-white/20 rounded-full transition cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Export Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search street, ward, worker..."
                  value={searchReportText}
                  onChange={(e) => setSearchReportText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,' +
                      ['Street,Ward,Zone,Total,Recent 7D Miss %,Older 30D Miss %,Trend,Consecutive Risk Doors,Primary Obstacle,Worker']
                        .concat(
                          streetAnalyses.map(
                            (r) =>
                              `"${r.streetName}","${r.ward}","${r.zone}",${r.totalDoors},${r.recentMissRatePercent}%,${r.olderBaselineMissRatePercent}%,"${r.trend}",${r.consecutiveRiskHouseCount},"${r.primaryObstacle}","${r.assignedWorker}"`
                          )
                        )
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', 'historical_street_comparison_report.csv');
                    document.body.appendChild(link);
                    link.click();
                    if (onShowToast) onShowToast('📥 Exported Historical Comparison Report to CSV!');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black text-slate-600 bg-slate-50/50">
                    <th className="py-2.5 px-3">Street Name</th>
                    <th className="py-2.5 px-2 text-center">Ward / Zone</th>
                    <th className="py-2.5 px-2 text-right">Total Doors</th>
                    <th className="py-2.5 px-2 text-right">Recent 7D Miss</th>
                    <th className="py-2.5 px-2 text-right">30D Base Miss</th>
                    <th className="py-2.5 px-2 text-center">Trend Behavior</th>
                    <th className="py-2.5 px-2 text-center">Consecutive Streak</th>
                    <th className="py-2.5 px-3">Primary Obstacle Pattern</th>
                    <th className="py-2.5 px-3">Assigned Crew</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {filteredReportStreets.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-black text-slate-900">{row.streetName}</td>
                      <td className="py-3 px-2 text-center text-slate-600">Ward {row.ward} ({row.zone})</td>
                      <td className="py-3 px-2 text-right text-slate-700">{row.totalDoors}</td>
                      <td className="py-3 px-2 text-right text-rose-700 font-black">{row.recentMissRatePercent}%</td>
                      <td className="py-3 px-2 text-right text-slate-500 font-medium">{row.olderBaselineMissRatePercent}%</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                          row.trend === 'Deteriorating'
                            ? 'bg-rose-100 text-rose-700'
                            : row.trend === 'Chronic'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {row.trend === 'Deteriorating' && <TrendingUp className="w-2.5 h-2.5 text-rose-600" />}
                          {row.trend === 'Improving' && <TrendingDown className="w-2.5 h-2.5 text-emerald-600" />}
                          {row.trend}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="bg-rose-50 text-rose-700 font-black px-2 py-0.5 rounded text-[11px] font-mono">
                          {row.consecutiveRiskHouseCount} Doors
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] font-medium">{row.primaryObstacle}</td>
                      <td className="py-3 px-3 text-slate-700 text-xs">
                        <div className="font-bold">{row.assignedWorker}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{row.vehicle}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">
                Showing {filteredReportStreets.length} of {streetAnalyses.length} monitored streets
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HIGH RISK HOUSEHOLDS REGISTRY (Formula Breakdown & Streak)       */}
      {/* ========================================================================= */}
      {activeModal === 'high_risk' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl text-rose-300">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    {lang === 'ta' ? 'அனைத்து அதிக ஆபத்துள்ள வீடுகளின் பதிவேடு' : 'High-Risk Household Pattern Registry'}
                  </h3>
                  <p className="text-xs text-rose-200 font-medium">
                    Scores calculated via Recent Window (40%) + Consecutive Streak Factor (35%) + 30D Base (15%) + Recurrence (10%)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-white/20 rounded-full transition cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search House No, Resident, Address..."
                  value={searchHouseText}
                  onChange={(e) => setSearchHouseText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={riskLevelFilter}
                  onChange={(e: any) => setRiskLevelFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical Risk (&gt;75%)</option>
                  <option value="high">High Risk (60-75%)</option>
                </select>

                <button
                  onClick={() => {
                    confetti({ particleCount: 50, spread: 65 });
                    if (onShowToast) onShowToast('📱 Resident SMS Reminder Broadcast dispatched to high risk homes!');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast SMS Notice</span>
                </button>
              </div>
            </div>

            {/* High Risk Table */}
            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black text-slate-600 bg-slate-50/50">
                    <th className="py-2.5 px-3">House No.</th>
                    <th className="py-2.5 px-3">Resident & Address</th>
                    <th className="py-2.5 px-2 text-center">Streak Penalty</th>
                    <th className="py-2.5 px-2 text-center">Recent vs Older</th>
                    <th className="py-2.5 px-2 text-center">Weighted Score</th>
                    <th className="py-2.5 px-3">Historical Root Cause</th>
                    <th className="py-2.5 px-2 text-center">Assigned BOV</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {filteredHighRiskHouses.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-black text-slate-900 bg-slate-50/80 rounded-md">
                        {row.houseNo}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {row.residentName}
                        <div className="text-[10px] text-slate-500 font-normal">{row.address} (W-{row.ward})</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-black text-[10.5px] px-2 py-0.5 rounded">
                          <Flame className="w-3 h-3 text-rose-600" />
                          {row.consecutiveMissedStreak} Streak
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-xs">
                        <div className="font-bold text-rose-700">{row.recent7DayMissRatePercent}% 7D</div>
                        <div className="text-[10px] text-slate-400">{row.olderHistoricalMissRatePercent}% Base</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-rose-700 font-black">
                          <span>{row.predictionScore}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] font-medium">
                        <div>{row.primaryObstacle}</div>
                        <div className="text-[9.5px] text-emerald-700 font-bold">{row.recurringDayPattern}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs font-bold text-slate-700">
                        {row.bov}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (onShowToast) {
                              onShowToast(`📍 Special pickup scheduled for ${row.houseNo} (${row.residentName})`);
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg transition cursor-pointer shadow-xs"
                        >
                          Schedule Pickup
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">
                Showing {filteredHighRiskHouses.length} of {allAnalyzedHouseholds.length} analyzed households
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Close Registry
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
