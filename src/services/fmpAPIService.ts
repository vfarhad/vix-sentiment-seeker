import { toast } from "sonner";
import { MARKETSTACK_API_URL, MARKETSTACK_API_KEY } from '@/config/apiConfig';

// This file is now using MarketStack configuration instead of FMP
// It should eventually be refactored or removed if no longer needed
// For now, let's keep the file structure but make it compatible with the build

export const fetchFMPQuote = async (symbol: string) => {
  console.warn('FMP API service is deprecated, use MarketStack instead');
  throw new Error('FMP API service is deprecated');
};

export const fetchFMPHistoricalData = async (symbol: string, from: number, to: number) => {
  console.warn('FMP API service is deprecated, use MarketStack instead');
  throw new Error('FMP API service is deprecated');
};

export const fetchFMPMarketStatus = async () => {
  console.warn('FMP API service is deprecated, use MarketStack instead');
  throw new Error('FMP API service is deprecated');
};

export const fetchFMPAvailableIndices = async () => {
  console.warn('FMP API service is deprecated, use MarketStack instead');
  return [];
};
