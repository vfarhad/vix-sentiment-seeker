
import { toast } from "sonner";

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
}

// Finnhub API configuration
const FINNHUB_API_KEY = "cvmr0r1r01ql90pvnmt0cvmr0r1r01ql90pvnmtg";
const FINNHUB_SECRET = "cvmr0r1r01ql90pvnmug";
const FINNHUB_API_URL = "https://finnhub.io/api/v1";

// Fetch market indices data
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    // Define indices to fetch (using proper Finnhub symbol format)
    const indices = [
      { symbol: "^DJI", finnhubSymbol: "^DJI", name: "DOW" },
      { symbol: "^GSPC", finnhubSymbol: "^GSPC", name: "S&P 500" },
      { symbol: "^IXIC", finnhubSymbol: "^IXIC", name: "NASDAQ" },
      { symbol: "^RUT", finnhubSymbol: "^RUT", name: "RUSSELL" },
      { symbol: "^VIX", finnhubSymbol: "^VIX", name: "VIX" }
    ];

    // For debugging/development, set to true if API is not working
    const useAllFallbackData = true; // Keeping this as true until we confirm API works
    
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
        
        // Using Finnhub's stock quote endpoint
        const response = await fetch(
          `${FINNHUB_API_URL}/quote?symbol=${index.finnhubSymbol}&token=${FINNHUB_API_KEY}`,
          {
            headers: {
              'X-Finnhub-Secret': FINNHUB_SECRET
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Finnhub data for ${index.name}:`, data);
        
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

// Function to fetch detailed historical data for a specific symbol (e.g., VIX)
export const fetchHistoricalData = async (symbol: string, resolution = 'D', from: number, to: number) => {
  try {
    const response = await fetch(
      `${FINNHUB_API_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
      {
        headers: {
          'X-Finnhub-Secret': FINNHUB_SECRET
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

// Function to search for symbols
export const searchSymbols = async (query: string) => {
  try {
    const response = await fetch(
      `${FINNHUB_API_URL}/search?q=${query}&token=${FINNHUB_API_KEY}`,
      {
        headers: {
          'X-Finnhub-Secret': FINNHUB_SECRET
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    throw error;
  }
};

// Webhook handler for Finnhub real-time updates
export const setupFinnhubWebhook = (callback: (data: any) => void) => {
  // This function would be used in a server environment to handle incoming webhooks
  // For a client-side only app, this is provided as a reference for server implementation
  
  // Example webhook server pseudo-code:
  // app.post('/api/finnhub-webhook', (req, res) => {
  //   // Always respond with 200 immediately to acknowledge receipt
  //   res.status(200).send('OK');
  //   
  //   // Verify the Finnhub secret header
  //   const finnhubSecret = req.headers['x-finnhub-secret'];
  //   if (finnhubSecret !== FINNHUB_SECRET) {
  //     console.error('Invalid Finnhub secret');
  //     return;
  //   }
  //   
  //   // Process the webhook data
  //   const data = req.body;
  //   callback(data);
  // });
  
  console.info("Finnhub webhook support is included in the code but requires server-side implementation");
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
