
import { MarketIndex } from '@/types/marketData';

// Generate fallback data for a single index
export const generateFallbackData = (indexName: string): MarketIndex => {
  const isVIX = indexName === "VIX" || indexName === "^VIX" || indexName.includes("VIX");
  const baseValue = 
    indexName === "DOW" || indexName === "^DJI" || indexName.includes("DOW") ? 35000 + Math.random() * 3000 :
    indexName === "S&P 500" || indexName === "^GSPC" || indexName.includes("SPX") ? 4800 + Math.random() * 400 :
    indexName === "NASDAQ" || indexName === "^IXIC" || indexName.includes("NASDAQ") ? 15000 + Math.random() * 1500 :
    indexName === "RUSSELL" || indexName === "^RUT" || indexName.includes("RUSSELL") ? 1900 + Math.random() * 200 :
    indexName === "AAPL" ? 160 + Math.random() * 40 :
    isVIX ? 15 + Math.random() * 15 :
    100 + Math.random() * 50; // Default for unknown indices
  
  const isPositive = isVIX ? Math.random() < 0.4 : Math.random() > 0.4; // VIX typically moves opposite to markets
  
  const changeValue = parseFloat((Math.random() * (isVIX ? 3 : 80)).toFixed(2));
  const changePercent = parseFloat((Math.random() * (isVIX ? 8 : 1.8)).toFixed(2));
  
  // Standardize the display name regardless of the input symbol
  const displayName = 
    (indexName === "^DJI" || indexName.includes("DOW")) ? "DOW" :
    (indexName === "^GSPC" || indexName.includes("SPX")) ? "S&P 500" :
    (indexName === "^IXIC" || indexName.includes("NASDAQ")) ? "NASDAQ" :
    (indexName === "^RUT" || indexName.includes("RUSSELL")) ? "RUSSELL" :
    (indexName === "^VIX" || indexName.includes("VIX")) ? "VIX" :
    indexName;
  
  return {
    name: displayName,
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
