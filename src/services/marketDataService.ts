
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
    // Finnhub API configuration
    const API_KEY = "cvmr0r1r01ql90pvnmt0cvmr0r1r01ql90pvnmtg";
    
    // Define indices to fetch (Finnhub uses different symbols)
    const indices = [
      { symbol: "^DJI", finnhubSymbol: "DJIA", name: "DOW" },
      { symbol: "^GSPC", finnhubSymbol: "SPX", name: "S&P 500" },
      { symbol: "^IXIC", finnhubSymbol: "NDX", name: "NASDAQ" },
      { symbol: "^RUT", finnhubSymbol: "RUT", name: "RUSSELL" },
      { symbol: "^VIX", finnhubSymbol: "VIX", name: "VIX" }
    ];

    // For debugging/development, set to true if API is not working
    const useAllFallbackData = true; // Switching to true since the API is not returning valid data for most symbols
    
    if (useAllFallbackData) {
      console.log("Using fallback data for all indices due to API limitations");
      toast.info('Using simulated market data');
      return generateAllFallbackData();
    }
    
    // Fetch data for each index with a small delay between requests to avoid API limits
    const results: MarketIndex[] = [];
    let usedSomeFallback = false;
    
    for (const index of indices) {
      try {
        // Add delay between requests to avoid hitting rate limits
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${index.finnhubSymbol}&token=${API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we have valid data with the Finnhub format
        if (data && data.c && data.d !== null && data.dp !== null) {
          // Finnhub data - c: current price, d: change, dp: percent change
          results.push({
            name: index.name,
            value: data.c.toLocaleString(),
            change: data.d.toFixed(2),
            changePercent: `${data.dp.toFixed(2)}%`
          });
        } else {
          console.warn(`No valid data returned for ${index.name}, using fallback`);
          results.push(generateFallbackData(index.name));
          usedSomeFallback = true;
        }
      } catch (err) {
        console.warn(`Error fetching ${index.name}, using fallback data`, err);
        results.push(generateFallbackData(index.name));
        usedSomeFallback = true;
      }
    }
    
    // If we got no valid results, throw an error to trigger the fallback
    if (results.length === 0) {
      throw new Error("No valid market data received");
    }
    
    // Display toast if using some fallback data but not all
    if (usedSomeFallback) {
      toast.warning('Some market data is simulated');
    } else {
      toast.success('Live market data loaded');
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching market data:', error);
    toast.info('Using simulated market data');
    
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
