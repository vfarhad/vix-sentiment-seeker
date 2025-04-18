
// This file is now just a re-export to maintain backward compatibility
// Import all functionality from the new modular structure
import { 
  getVIXFuturesHistData, 
  calculateVIXTermStructure, 
  getLatestVIXTermStructure, 
  calculateContangoMetrics,
  fetchSP500Data,
  getSP500Data,
  fetchTiingoSP500Data
} from './sp500/index';

// Import types with proper syntax for isolatedModules
import type { VIXTermStructurePoint } from './sp500/types';
import type { SP500DataPoint } from './sp500/sp500DataService';

// Re-export everything to maintain backward compatibility
export { 
  getVIXFuturesHistData, 
  calculateVIXTermStructure, 
  getLatestVIXTermStructure, 
  calculateContangoMetrics,
  fetchSP500Data,
  getSP500Data,
  fetchTiingoSP500Data
};

// Re-export types with proper syntax
export type { VIXTermStructurePoint, SP500DataPoint };
