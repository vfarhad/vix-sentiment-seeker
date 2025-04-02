import { toast } from "sonner";
import { MARKETSTACK_API_URL, MARKETSTACK_API_KEY } from '@/config/apiConfig';

// This file is now using MarketStack configuration instead of Polygon
// It should eventually be refactored or removed if no longer needed
// For now, let's keep the file structure but make it compatible with the build

export const fetchPolygonQuote = async (symbol: string) => {
  console.warn('Polygon API service is deprecated, use MarketStack instead');
  throw new Error('Polygon API service is deprecated');
};

export const fetchPolygonHistoricalData = async (symbol: string, from: number, to: number) => {
  console.warn('Polygon API service is deprecated, use MarketStack instead');
  throw new Error('Polygon API service is deprecated');
};

export const fetchPolygonMarketStatus = async () => {
  console.warn('Polygon API service is deprecated, use MarketStack instead');
  throw new Error('Polygon API service is deprecated');
};

export const fetchPolygonAvailableIndices = async () => {
  console.warn('Polygon API service is deprecated, use MarketStack instead');
  return [];
};
