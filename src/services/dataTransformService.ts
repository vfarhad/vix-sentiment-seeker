
import { MarketIndex } from '@/types/marketData';

// Transform raw API data into MarketIndex format
export const transformIndexData = (
  indexName: string, 
  previousClose: any, 
  currentQuote: any
): MarketIndex | null => {
  if (!currentQuote.results || !previousClose.close) {
    return null;
  }

  const value = currentQuote.results.p; // Current price
  const prevClose = previousClose.close;
  const change = value - prevClose;
  const changePercent = (change / prevClose) * 100;
  
  return {
    name: indexName,
    value: indexName === "VIX" ? value.toFixed(2) : value.toLocaleString(),
    change: change.toFixed(2),
    changePercent: `${changePercent.toFixed(2)}%`
  };
};
