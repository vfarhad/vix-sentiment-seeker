
// This file is now just a re-export to maintain backward compatibility
// Import all functionality from the new modular structure
import { 
  fetchSP500Data, 
  getVIXFuturesHistData, 
  calculateVIXTermStructure, 
  getLatestVIXTermStructure, 
  calculateContangoMetrics,
  VIXTermStructurePoint
} from './sp500/index';

// Re-export everything to maintain backward compatibility
export { 
  fetchSP500Data, 
  getVIXFuturesHistData, 
  calculateVIXTermStructure, 
  getLatestVIXTermStructure, 
  calculateContangoMetrics,
  VIXTermStructurePoint
};
