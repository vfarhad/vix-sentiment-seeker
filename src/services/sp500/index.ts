
// Main export file for SP500 services
import { fetchSP500Data, getSP500Data, fetchTiingoSP500Data } from './sp500DataService';
import { getVIXFuturesHistData } from './vixFuturesHistService';
import {
  calculateVIXTermStructure,
  getLatestVIXTermStructure,
  calculateContangoMetrics,
} from './vixTermStructureService';

// Export types with 'export type' syntax for isolatedModules compatibility
export type { VIXTermStructurePoint } from './types';
export type { SP500DataPoint } from './sp500DataService';

// Export functions
export {
  fetchSP500Data,
  getSP500Data,
  fetchTiingoSP500Data,
  getVIXFuturesHistData,
  calculateVIXTermStructure,
  getLatestVIXTermStructure,
  calculateContangoMetrics
};
