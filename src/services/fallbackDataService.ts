
import { MarketIndex } from '@/types/marketData';

// Generate fallback data for a single index
export const generateFallbackData = (indexName: string): MarketIndex => {
  const isVIX = indexName === "VIX";
  const baseValue = 
    indexName === "DOW" ? 35000 + Math.random() * 3000 :
    indexName === "S&P 500" ? 4800 + Math.random() * 400 :
    indexName === "NASDAQ" ? 15000 + Math.random() * 1500 :
    indexName === "RUSSELL" ? 1900 + Math.random() * 200 :
    indexName === "AAPL" ? 160 + Math.random() * 40 :
    15 + Math.random() * 15; // VIX
  
  const isPositive = isVIX ? Math.random() < 0.4 : Math.random() > 0.4; // VIX typically moves opposite to markets
  const changeValue = parseFloat((Math.random() * (isVIX ? 3 : 80)).toFixed(2));
  const changePercent = parseFloat((Math.random() * (isVIX ? 8 : 1.8)).toFixed(2));
  
  return {
    name: indexName,
    value: isVIX ? baseValue.toFixed(2) : Math.floor(baseValue).toLocaleString(),
    change: (isPositive ? '+' : '-') + changeValue.toFixed(2),
    changePercent: (isPositive ? '+' : '-') + changePercent.toFixed(2) + '%'
  };
};

// Generate all fallback data with correlated market movements
export const generateAllFallbackData = (): MarketIndex[] => {
  const indices = ["DOW", "S&P 500", "NASDAQ", "RUSSELL", "VIX", "AAPL"];
  const marketTrend = Math.random() > 0.5; // True = up market, False = down market
  
  return indices.map(name => {
    const isVIX = name === "VIX";
    // For VIX, invert the market trend (market up = VIX down typically)
    const isPositive = isVIX ? !marketTrend : marketTrend;
    
    const baseValue = 
      name === "DOW" ? 35000 + Math.random() * 3000 :
      name === "S&P 500" ? 4800 + Math.random() * 400 :
      name === "NASDAQ" ? 15000 + Math.random() * 1500 :
      name === "RUSSELL" ? 1900 + Math.random() * 200 :
      name === "AAPL" ? 160 + Math.random() * 40 :
      15 + Math.random() * 15; // VIX
    
    const changeValue = parseFloat((Math.random() * (isVIX ? 3 : 80)).toFixed(2));
    const changePercent = parseFloat((Math.random() * (isVIX ? 8 : 1.8)).toFixed(2));
    
    return {
      name,
      value: isVIX ? baseValue.toFixed(2) : Math.floor(baseValue).toLocaleString(),
      change: (isPositive ? '+' : '-') + changeValue.toFixed(2),
      changePercent: (isPositive ? '+' : '-') + changePercent.toFixed(2) + '%'
    };
  });
};
