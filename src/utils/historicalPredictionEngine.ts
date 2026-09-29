import { SWMSHouseholdRecord } from '../types';

export interface HouseholdHistoricalAnalysis {
  houseNo: string;
  residentName: string;
  phone: string;
  address: string;
  streetName: string;
  ward: string;
  zone: string;
  bov: string;
  assignedWorker: string;
  totalHistoricalVisits: number;
  historicalCoveredCount: number;
  historicalMissedCount: number;
  historicalMissRatePercent: number;
  recent7DayVisits: number;
  recent7DayMissedCount: number;
  recent7DayMissRatePercent: number;
  olderHistoricalMissRatePercent: number;
  consecutiveMissedStreak: number;
  lastMissedDaysAgo: number;
  lastMissedDateText: string;
  recurringDayPattern: string | null;
  primaryObstacle: string;
  trend: 'Deteriorating' | 'Chronic' | 'Recovering' | 'Stable';
  trendDeltaPercent: number;
  predictionScore: number; // 0 - 100%
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  formulaBreakdown: {
    recentWeightContribution: number;
    consecutiveStreakContribution: number;
    baselineWeightContribution: number;
    recurrenceContribution: number;
  };
}

export interface StreetHistoricalAnalysis {
  streetName: string;
  ward: string;
  zone: string;
  totalDoors: number;
  collectedCount: number;
  missedCount: number;
  coveragePercent: number;
  recentMissRatePercent: number;
  olderBaselineMissRatePercent: number;
  trend: 'Deteriorating' | 'Chronic' | 'Improving' | 'Stable';
  consecutiveRiskHouseCount: number;
  primaryObstacle: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  assignedWorker: string;
  vehicle: string;
}

export interface PredictiveHistoricalEngineResult {
  totalHouseholds: number;
  regularlyCollectedCount: number;
  regularlyCollectedRate: string;
  occasionallyMissedCount: number;
  occasionallyMissedRate: string;
  frequentlyNotCollectedCount: number;
  frequentlyNotCollectedRate: string;
  criticalHighRiskCount: number;
  criticalHighRiskRate: string;
  highRiskHouseholds: HouseholdHistoricalAnalysis[];
  allAnalyzedHouseholds: HouseholdHistoricalAnalysis[];
  streetAnalyses: StreetHistoricalAnalysis[];
  top5Streets: StreetHistoricalAnalysis[];
  patternInsights: {
    id: number;
    type: 'high' | 'medium' | 'info';
    title: string;
    historicalBasis: string;
    recentVsOlderComparison: string;
    consecutiveStreakNote: string;
    ward: string;
    zone: string;
    timeAgo: string;
    recommendedAction: string;
    actionKey: string;
  }[];
}

const MS_PER_DAY = 86_400_000;

const pct = (part: number, total: number) =>
  total > 0 ? +((part / total) * 100).toFixed(1) : 0;

const daysAgo = (value?: string | Date): number | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / MS_PER_DAY));
};

const blankRate = () => '0.00%';

/**
 * Derive historical collection patterns from REAL collection records.
 *
 * This engine previously ignored its `records` argument entirely and returned a
 * hardcoded registry of 10 invented households and 10 invented streets, while
 * the UI claimed "No synthetic data is invented." Every figure below is now
 * computed from the records actually passed in, and the result is empty (not
 * fabricated) when there is no data.
 */
export function runHistoricalPatternPredictionEngine(
  records: SWMSHouseholdRecord[] = [],
  selectedZone: string = 'All Zones',
  selectedWard: string = 'All Wards',
  selectedStreet: string = 'All Streets'
): PredictiveHistoricalEngineResult {
  const matchesFilter = (r: SWMSHouseholdRecord) => {
    if (selectedZone !== 'All Zones' && r.zone !== selectedZone) return false;
    if (selectedWard !== 'All Wards' && r.ward !== selectedWard) return false;
    if (selectedStreet !== 'All Streets' && r.streetName !== selectedStreet) return false;
    return true;
  };

  const filtered = (records || []).filter(matchesFilter);

  // Group every record by household so we can count real visits per door.
  interface Group {
    houseNo: string;
    residentName: string;
    phone: string;
    address: string;
    streetName: string;
    ward: string;
    zone: string;
    bov: string;
    assignedWorker: string;
    visits: number;
    misses: number;
    recentVisits: number;
    recentMisses: number;
    olderVisits: number;
    olderMisses: number;
    streak: number;
    lastMissedDaysAgo: number | null;
    obstacle: string;
  }

  const groups = new Map<string, Group>();
  const cutoff = Date.now() - 7 * MS_PER_DAY;

  for (const r of filtered) {
    const key = `${r.houseId || r.id}|${r.streetName || ''}`;
    const missed = r.coverageStatus !== 'Covered';
    const ago = daysAgo(r.submittedAt);
    const isRecent = ago !== null && Date.now() - new Date(r.submittedAt as string).getTime() <= 7 * MS_PER_DAY;

    let g = groups.get(key);
    if (!g) {
      g = {
        houseNo: r.houseId || r.id,
        residentName: r.householderName || 'Unknown',
        phone: r.householderContact || '—',
        address: r.doorNo ? `${r.streetName || '—'} (Door ${r.doorNo})` : r.streetName || '—',
        streetName: r.streetName || 'Unassigned',
        ward: r.ward || '—',
        zone: r.zone || '—',
        bov: r.vehicleNo || r.vehicleType || '—',
        assignedWorker: r.driverWorkerName || '—',
        visits: 0, misses: 0, recentVisits: 0, recentMisses: 0, olderVisits: 0, olderMisses: 0,
        streak: 0, lastMissedDaysAgo: null, obstacle: r.notCoveredReason || '—',
      };
      groups.set(key, g);
    }

    g.visits += 1;
    if (missed) {
      g.misses += 1;
      if (ago !== null && (g.lastMissedDaysAgo === null || ago < g.lastMissedDaysAgo)) {
        g.lastMissedDaysAgo = ago;
      }
    }
    if (isRecent) {
      g.recentVisits += 1;
      if (missed) g.recentMisses += 1;
    } else {
      g.olderVisits += 1;
      if (missed) g.olderMisses += 1;
    }
    if (r.notCoveredReason) g.obstacle = r.notCoveredReason;
  }

  const list = [...groups.values()].map((g): HouseholdHistoricalAnalysis => {
    const recentMissRate = pct(g.recentMisses, g.recentVisits);
    const olderMissRate = pct(g.olderMisses, g.olderVisits);
    const baselineMissRate = pct(g.misses, g.visits);
    const totalCovered = g.visits - g.misses;

    // Score = recent miss rate (40%) + baseline miss rate (60%).
    // Only real observation counts are used — no invented streaks or patterns.
    const finalScore = Math.min(
      100,
      Math.max(0, Math.round(recentMissRate * 0.4 + baselineMissRate * 0.6))
    );

    const trendDelta = +(recentMissRate - olderMissRate).toFixed(1);
    let trend: HouseholdHistoricalAnalysis['trend'] = 'Stable';
    if (trendDelta > 8) trend = 'Deteriorating';
    else if (trendDelta < -8) trend = 'Recovering';
    else if (baselineMissRate > 30) trend = 'Chronic';

    let riskCategory: HouseholdHistoricalAnalysis['riskCategory'] = 'Low';
    if (finalScore >= 75) riskCategory = 'Critical';
    else if (finalScore >= 60) riskCategory = 'High';
    else if (finalScore >= 35) riskCategory = 'Medium';

    return {
      houseNo: g.houseNo,
      residentName: g.residentName,
      phone: g.phone,
      address: g.address,
      streetName: g.streetName,
      ward: g.ward,
      zone: g.zone,
      bov: g.bov,
      assignedWorker: g.assignedWorker,
      totalHistoricalVisits: g.visits,
      historicalCoveredCount: totalCovered,
      historicalMissedCount: g.misses,
      historicalMissRatePercent: baselineMissRate,
      recent7DayVisits: g.recentVisits,
      recent7DayMissedCount: g.recentMisses,
      recent7DayMissRatePercent: recentMissRate,
      olderHistoricalMissRatePercent: olderMissRate,
      consecutiveMissedStreak: g.streak,
      lastMissedDaysAgo: g.lastMissedDaysAgo ?? 0,
      lastMissedDateText: g.lastMissedDaysAgo === null ? 'No miss recorded' : `${g.lastMissedDaysAgo} Days Ago`,
      recurringDayPattern: null,
      primaryObstacle: g.obstacle,
      trend,
      trendDeltaPercent: trendDelta,
      predictionScore: finalScore,
      riskCategory,
      formulaBreakdown: {
        recentWeightContribution: +(recentMissRate * 0.4).toFixed(1),
        consecutiveStreakContribution: 0,
        baselineWeightContribution: +(baselineMissRate * 0.6).toFixed(1),
        recurrenceContribution: 0,
      },
    };
  });

  // Street level, aggregated from the same real records.
  const byStreet = new Map<string, StreetHistoricalAnalysis>();
  for (const h of list) {
    let s = byStreet.get(h.streetName);
    if (!s) {
      s = {
        streetName: h.streetName,
        ward: h.ward,
        zone: h.zone,
        totalDoors: 0,
        collectedCount: 0,
        missedCount: 0,
        coveragePercent: 0,
        recentMissRatePercent: 0,
        olderBaselineMissRatePercent: 0,
        trend: 'Stable',
        consecutiveRiskHouseCount: 0,
        primaryObstacle: '—',
        riskLevel: 'Low',
        assignedWorker: h.assignedWorker,
        vehicle: h.bov,
      };
      byStreet.set(h.streetName, s);
    }
    s.totalDoors += 1;
    s.collectedCount += h.historicalCoveredCount;
    s.missedCount += h.historicalMissedCount;
    if (h.riskCategory === 'High' || h.riskCategory === 'Critical') s.consecutiveRiskHouseCount += 1;
    if (h.primaryObstacle && h.primaryObstacle !== '—') s.primaryObstacle = h.primaryObstacle;
  }

  const streetAnalyses: StreetHistoricalAnalysis[] = [...byStreet.values()].map((s) => {
    const totalVisits = s.collectedCount + s.missedCount;
    const missRate = pct(s.missedCount, totalVisits);
    s.coveragePercent = pct(s.collectedCount, totalVisits);
    s.recentMissRatePercent = missRate;
    s.olderBaselineMissRatePercent = missRate;
    if (missRate > 30) s.trend = 'Chronic';
    s.riskLevel = missRate >= 32 || s.consecutiveRiskHouseCount >= 8
      ? 'High'
      : missRate >= 22 || s.consecutiveRiskHouseCount >= 4
        ? 'Medium'
        : 'Low';
    return s;
  });

  const top5Streets = [...streetAnalyses]
    .sort((a, b) => b.recentMissRatePercent - a.recentMissRatePercent)
    .slice(0, 5);

  const highRiskHouseholds = list
    .filter((h) => h.riskCategory === 'Critical' || h.riskCategory === 'High')
    .sort((a, b) => b.predictionScore - a.predictionScore);

  const totalHouseholds = list.length;
  const totalVisitsAll = list.reduce((n, h) => n + h.totalHistoricalVisits, 0);
  const totalMissesAll = list.reduce((n, h) => n + h.historicalMissedCount, 0);
  const regularlyCollectedCount = list.filter((h) => h.historicalMissRatePercent === 0).length;
  const occasionallyMissedCount = list.filter(
    (h) => h.historicalMissRatePercent > 0 && h.historicalMissRatePercent < 50
  ).length;
  const frequentlyNotCollectedCount = list.filter((h) => h.historicalMissRatePercent >= 50).length;
  const criticalHighRiskCount = highRiskHouseholds.length;

  const rate = (n: number) =>
    totalHouseholds > 0 ? `${((n / totalHouseholds) * 100).toFixed(2)}%` : blankRate();

  // Insights are only produced from observed data, and stay empty otherwise.
  const patternInsights: PredictiveHistoricalEngineResult['patternInsights'] = [];
  for (const s of top5Streets) {
    if (s.riskLevel === 'Low') continue;
    patternInsights.push({
      id: patternInsights.length + 1,
      type: s.riskLevel === 'High' ? 'high' : 'medium',
      title: `${s.streetName}: ${s.recentMissRatePercent}% miss rate across ${s.totalDoors} household(s)`,
      historicalBasis: `Derived from ${s.collectedCount} collected and ${s.missedCount} not-collected record(s).`,
      recentVsOlderComparison: `Overall miss rate ${s.recentMissRatePercent}% (${s.zone}, ${s.ward}).`,
      consecutiveStreakNote: `${s.consecutiveRiskHouseCount} household(s) classified High or Critical risk.`,
      ward: s.ward,
      zone: s.zone,
      timeAgo: 'From live records',
      recommendedAction: 'Review this street on the next collection run.',
      actionKey: `review_${s.streetName}`.replace(/\s+/g, '_').toLowerCase(),
    });
  }

  return {
    totalHouseholds,
    regularlyCollectedCount,
    regularlyCollectedRate: rate(regularlyCollectedCount),
    occasionallyMissedCount,
    occasionallyMissedRate: rate(occasionallyMissedCount),
    frequentlyNotCollectedCount,
    frequentlyNotCollectedRate: rate(frequentlyNotCollectedCount),
    criticalHighRiskCount,
    criticalHighRiskRate: rate(criticalHighRiskCount),
    highRiskHouseholds,
    allAnalyzedHouseholds: list,
    streetAnalyses,
    top5Streets,
    patternInsights,
  };
}
