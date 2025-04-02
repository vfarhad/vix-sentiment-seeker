
import { toast } from "sonner";

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
}

// Fetch market indices data
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    // Alpha Vantage API configuration
    const API_KEY = "demo"; // Replace with your API key in production
    const indices = [
      { symbol: "DJI", name: "DOW" },
      { symbol: "SPX", name: "S&P 500" },
      { symbol: "IXIC", name: "NASDAQ" },
      { symbol: "RUT", name: "RUSSELL" },
      { symbol: "VIX", name: "VIX" }
    ];

    // Fetch data for each index
    const promises = indices.map(async (index) => {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${index.symbol}&apikey=${API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we have valid data
        if (data["Global Quote"]) {
          const quote = data["Global Quote"];
          const value = parseFloat(quote["05. price"]).toLocaleString();
          const change = quote["09. change"];
          const changePercent = quote["10. change percent"];
          
          return {
            name: index.name,
            value: value,
            change: change,
            changePercent: changePercent
          };
        } else {
          console.warn(`No data returned for ${index.name}, using fallback`);
          throw new Error("Invalid data structure");
        }
      } catch (err) {
        console.warn(`Error fetching ${index.name}, using fallback data`, err);
        // Return fallback data for this specific index
        return generateFallbackData(index.name);
      }
    });
    
    // Wait for all requests to complete
    const results = await Promise.allSettled(promises);
    const marketIndices: MarketIndex[] = results
      .filter((result): result is PromiseFulfilledResult<MarketIndex> => 
        result.status === "fulfilled")
      .map(result => result.value);
    
    // If we got no valid results, throw an error to trigger the fallback
    if (marketIndices.length === 0) {
      throw new Error("No valid market data received");
    }
    
    return marketIndices;
  } catch (error) {
    console.error('Error fetching market data:', error);
    toast.error('Using simulated market data');
    
    // Generate complete simulated data as fallback
    return generateAllFallbackData();
  }
};

// Generate fallback data for a single index
const generateFallbackData = (indexName: string): MarketIndex => {
  const isVIX = indexName === "VIX";
  const baseValue = 
    indexName === "DOW" ? 35000 + Math.random() * 3000 :
    indexName === "S&P 500" ? 4800 + Math.random() * 400 :
    indexName === "NASDAQ" ? 15000 + Math.random() * 1500 :
    indexName === "RUSSELL" ? 1900 + Math.random() * 200 :
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
const generateAllFallbackData = (): MarketIndex[] => {
  const indices = ["DOW", "S&P 500", "NASDAQ", "RUSSELL", "VIX"];
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

// Function to refresh data at regular intervals
export const setupMarketDataPolling = (callback: (data: MarketIndex[]) => void, interval = 60000) => {
  const fetchData = async () => {
    try {
      const data = await fetchMarketIndices();
      callback(data);
    } catch (error) {
      console.error('Error in market data polling:', error);
    }
  };

  // Initial fetch
  fetchData();
  
  // Set up interval for subsequent fetches
  const intervalId = setInterval(fetchData, interval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};
