
// Main export file for SP500 services
import { fetchSP500Data } from './sp500DataService';
import { getVIXFuturesHistData } from './vixFuturesHistService';
import {
  calculateVIXTermStructure,
  getLatestVIXTermStructure,
  calculateContangoMetrics,
} from './vixTermStructureService';

// Export types with 'export type' syntax for isolatedModules compatibility
export type { VIXTermStructurePoint } from './types';

// Export functions
export {
  fetchSP500Data,
  getVIXFuturesHistData,
  calculateVIXTermStructure,
  getLatestVIXTermStructure,
  calculateContangoMetrics
};
