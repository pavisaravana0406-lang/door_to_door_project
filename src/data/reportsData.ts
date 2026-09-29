import { DailyReportSummary } from '../types';

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
