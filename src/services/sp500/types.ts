
// Type definitions for SP500 and VIX term structure data

export interface SP500HistoricalDataPoint {
  date: string;
  value: number;
}

export interface VIXTermStructurePoint {
  month: string;
  value: number;
  daysToExpiration?: number;
  isContango?: boolean;
  isImpliedForward?: boolean;
  isConstantMaturity?: boolean;
  forwardStartDate?: string;
  forwardEndDate?: string;
  maturityDays?: number;
}

export interface ContangoMetricsResult {
  contangoPercentages: { month: number; value: number }[];
  contangoDifferences: { month: number; value: number }[];
  termStructure: { month: number; value: number }[];
  monthRangeMetrics: { label: string; value: number }[];
}
