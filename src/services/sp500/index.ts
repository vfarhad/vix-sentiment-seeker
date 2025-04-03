
// Main export file for SP500 services
import { fetchSP500Data } from './sp500DataService';
import { getVIXFuturesHistData } from './vixFuturesHistService';
import {
  calculateVIXTermStructure,
  getLatestVIXTermStructure,
  calculateContangoMetrics,
  VIXTermStructurePoint
} from './vixTermStructureService';

export {
  fetchSP500Data,
  getVIXFuturesHistData,
  calculateVIXTermStructure,
  getLatestVIXTermStructure,
  calculateContangoMetrics,
  VIXTermStructurePoint
};
