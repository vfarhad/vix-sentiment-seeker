
import { MarketIndex, FinnhubQuote } from '@/types/marketData';

// Transform Finnhub quote data into MarketIndex format
export const transformFinnhubData = (
  indexName: string, 
  quoteData: FinnhubQuote
): MarketIndex | null => {
  if (!quoteData || typeof quoteData.c === 'undefined') {
    return null;
  }

  return {
    name: indexName,
    value: indexName === "VIX" ? quoteData.c.toFixed(2) : quoteData.c.toLocaleString(),
    change: quoteData.d.toFixed(2),
    changePercent: `${quoteData.dp.toFixed(2)}%`
  };
};
