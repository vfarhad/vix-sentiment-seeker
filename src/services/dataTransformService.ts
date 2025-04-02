
import { MarketIndex, FinnhubQuote, FMPQuote } from '@/types/marketData';

// Transform Finnhub quote data into MarketIndex format
export const transformFinnhubData = (
  indexName: string, 
  quoteData: FinnhubQuote
): MarketIndex | null => {
  if (!quoteData || typeof quoteData.c === 'undefined') {
    return null;
  }

  // Standardize the display name
  const displayName = 
    indexName === "^DJI" ? "DOW" :
    indexName === "^GSPC" ? "S&P 500" :
    indexName === "^IXIC" ? "NASDAQ" :
    indexName === "^RUT" ? "RUSSELL" :
    indexName === "^VIX" ? "VIX" :
    indexName;

  const isVIX = displayName === "VIX";

  return {
    name: displayName,
    value: isVIX ? quoteData.c.toFixed(2) : quoteData.c.toLocaleString(),
    change: (quoteData.d >= 0 ? '+' : '') + quoteData.d.toFixed(2),
    changePercent: (quoteData.dp >= 0 ? '+' : '') + quoteData.dp.toFixed(2) + '%'
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

  // Standardize the display name
  const displayName = 
    indexName === "^DJI" ? "DOW" :
    indexName === "^GSPC" ? "S&P 500" :
    indexName === "^IXIC" ? "NASDAQ" :
    indexName === "^RUT" ? "RUSSELL" :
    indexName === "^VIX" ? "VIX" :
    indexName;

  const isVIX = displayName === "VIX";
  
  return {
    name: displayName,
    value: isVIX ? quoteData.price.toFixed(2) : quoteData.price.toLocaleString(),
    change: (quoteData.change >= 0 ? '+' : '') + quoteData.change.toFixed(2),
    changePercent: (quoteData.changesPercentage >= 0 ? '+' : '') + quoteData.changesPercentage.toFixed(2) + '%'
  };
};
