
import { MarketIndex, FinnhubQuote } from '@/types/marketData';
import { MarketStackQuote } from './marketstackAPIService';

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
    indexName === "AAPL" ? "AAPL" :
    indexName;

  const isVIX = displayName === "VIX";

  return {
    name: displayName,
    value: isVIX ? quoteData.c.toFixed(2) : quoteData.c.toLocaleString(),
    change: (quoteData.d >= 0 ? '+' : '') + quoteData.d.toFixed(2),
    changePercent: (quoteData.dp >= 0 ? '+' : '') + quoteData.dp.toFixed(2) + '%'
  };
};

// Transform MarketStack quote data into MarketIndex format
export const transformMarketStackData = (
  indexName: string,
  quoteData: MarketStackQuote
): MarketIndex | null => {
  if (!quoteData || typeof quoteData.last === 'undefined') {
    return null;
  }

  // Calculate change and percent change if not provided by the API
  const change = quoteData.change !== undefined 
    ? quoteData.change 
    : (quoteData.previous_close ? quoteData.last - quoteData.previous_close : 0);
  
  const percentChange = quoteData.percent_change !== undefined 
    ? quoteData.percent_change 
    : (quoteData.previous_close && quoteData.previous_close !== 0 
        ? (change / quoteData.previous_close) * 100 
        : 0);

  // Standardize the display name
  const displayName = 
    indexName === "^DJI" || indexName === "DJI" ? "DOW" :
    indexName === "^GSPC" || indexName === "SPX" ? "S&P 500" :
    indexName === "^IXIC" || indexName === "NDX" ? "NASDAQ" :
    indexName === "^RUT" || indexName === "RUT" ? "RUSSELL" :
    indexName === "^VIX" || indexName === "VIX" ? "VIX" :
    indexName === "AAPL" ? "AAPL" :
    indexName;

  const isVIX = displayName === "VIX";
  
  return {
    name: displayName,
    value: isVIX ? quoteData.last.toFixed(2) : quoteData.last.toLocaleString(),
    change: (change >= 0 ? '+' : '') + change.toFixed(2),
    changePercent: (percentChange >= 0 ? '+' : '') + percentChange.toFixed(2) + '%'
  };
};
