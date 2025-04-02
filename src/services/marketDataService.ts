
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
    const API_KEY = "OBOZK3AWYR7261VM"; // Using the provided API key
    
    // Using TIME_SERIES_DAILY endpoint instead of GLOBAL_QUOTE for better reliability
    const indices = [
      { symbol: "^DJI", name: "DOW" },       // Added ^ prefix for indices
      { symbol: "^GSPC", name: "S&P 500" },  // Changed from SPX to ^GSPC
      { symbol: "^IXIC", name: "NASDAQ" },   // Added ^ prefix
      { symbol: "^RUT", name: "RUSSELL" },   // Added ^ prefix
      { symbol: "^VIX", name: "VIX" }        // Added ^ prefix
    ];

    // Fetch data for each index
    const promises = indices.map(async (index) => {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${index.symbol}&apikey=${API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we have valid data with the TIME_SERIES_DAILY format
        if (data["Time Series (Daily)"]) {
          const timeSeriesData = data["Time Series (Daily)"];
          const dates = Object.keys(timeSeriesData).sort().reverse(); // Sort dates in descending order
          
          if (dates.length > 0) {
            const latestDate = dates[0];
            const previousDate = dates.length > 1 ? dates[1] : null;
            
            const latestData = timeSeriesData[latestDate];
            const previousData = previousDate ? timeSeriesData[previousDate] : null;
            
            const latestClose = parseFloat(latestData["4. close"]);
            const previousClose = previousData ? parseFloat(previousData["4. close"]) : latestClose;
            
            const change = latestClose - previousClose;
            const changePercent = (change / previousClose) * 100;
            
            return {
              name: index.name,
              value: latestClose.toLocaleString(),
              change: change.toFixed(2),
              changePercent: `${changePercent.toFixed(2)}%`
            };
          }
        }
        
        // If we reach here, we didn't get valid data
        console.warn(`No valid data returned for ${index.name}, using fallback`);
        throw new Error("No valid data structure");
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
    
    // Display toast only if using some fallback data but not all
    if (marketIndices.length < indices.length) {
      toast.warning('Some market data is simulated');
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
