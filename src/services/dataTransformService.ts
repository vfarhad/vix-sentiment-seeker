
import { MarketIndex, FinnhubQuote, FMPQuote } from '@/types/marketData';

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

// Transform Financial Modeling Prep quote data into MarketIndex format
export const transformFMPData = (
  indexName: string,
  quoteData: FMPQuote
): MarketIndex | null => {
  if (!quoteData || typeof quoteData.price === 'undefined') {
    return null;
  }

  return {
    name: indexName,
    value: indexName === "VIX" ? quoteData.price.toFixed(2) : quoteData.price.toLocaleString(),
    change: quoteData.change.toFixed(2),
    changePercent: `${quoteData.changesPercentage.toFixed(2)}%`
  };
};
