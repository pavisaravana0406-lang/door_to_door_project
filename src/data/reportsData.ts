import {
  DailyReportSummary,
  MonthlySummaryData,
} from '../types';

export const INITIAL_DAILY_REPORT_SUMMARY: DailyReportSummary = {
  date: new Date().toISOString().split('T')[0],
  totalTargetHouses: 0,
  totalCoveredHouses: 0,
  totalMissedHouses: 0,
  coveragePercentage: 0,
  segregationPercentage: 0,
  totalTonnageCollected: 0,
  totalActiveVehicles: 0,
  totalFieldWorkers: 0,
};

export const MOCK_MONTHLY_SUMMARIES: Record<string, MonthlySummaryData> = {
  '2026-05': {
    month: 'May',
    year: 2026,
    totalTonnage: 0,
    avgDailyCoveragePercent: 0,
    totalHousesAudited: 0,
    totalFleetTrips: 0,
    segregationCompliancePercent: 0,
    complaintsResolvedPercent: 0,
    zoneRankings: [],
    dailyTrends: [],
  },
};
