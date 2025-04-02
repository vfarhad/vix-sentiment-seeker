import { toast } from "sonner";

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
}

export interface MarketStatus {
  exchange: string;
  status: string;
  isOpen: boolean;
  holiday?: string;
  nextTradingDay?: string;
  session?: string;
}

// Polygon.io API configuration
const POLYGON_API_URL = "https://api.polygon.io";
const POLYGON_API_KEY = "skkpS4Wv9cV9ILmzfQEI9TSYCsI6bnc5";

// Fetch market indices data from Polygon.io
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    // Define indices to fetch with their symbols
    const indices = [
      { symbol: "SPY", name: "S&P 500" },   // S&P 500 ETF
      { symbol: "DIA", name: "DOW" },       // Dow Jones ETF
      { symbol: "QQQ", name: "NASDAQ" },    // NASDAQ ETF  
      { symbol: "IWM", name: "RUSSELL" },   // Russell 2000 ETF
      { symbol: "UVXY", name: "VIX" }       // VIX ETF
    ];

    // For debugging/development, set to true if API is not working
    const useAllFallbackData = false; // We'll try to use real data
    
    if (useAllFallbackData) {
      console.log("Using fallback data for all indices due to API limitations");
      toast.info('Using simulated market data');
      return generateAllFallbackData();
    }
    
    // Fetch data for each index
    const results: MarketIndex[] = [];
    let usedSomeFallback = false;
    
    for (const index of indices) {
      try {
        // Add delay between requests to avoid hitting rate limits
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Use Polygon.io API to get previous day close and current quote
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];
        
        // Get previous day's close
        const previousClose = await fetch(
          `${POLYGON_API_URL}/v1/open-close/${index.symbol}/${dateString}?adjusted=true&apiKey=${POLYGON_API_KEY}`
        );
        
        // Get current quote
        const currentQuote = await fetch(
          `${POLYGON_API_URL}/v2/last/trade/${index.symbol}?apiKey=${POLYGON_API_KEY}`
        );
        
        if (!previousClose.ok || !currentQuote.ok) {
          throw new Error(`API error: ${!previousClose.ok ? previousClose.status : currentQuote.status}`);
        }
        
        const previousData = await previousClose.json();
        const quoteData = await currentQuote.json();
        
        console.log(`Polygon data for ${index.name}:`, { previousData, quoteData });
        
        // Check if we have valid data from Polygon
        if (quoteData.results && previousData.close) {
          const value = quoteData.results.p; // Current price
          const prevClose = previousData.close;
          const change = value - prevClose;
          const changePercent = (change / prevClose) * 100;
          
          results.push({
            name: index.name,
            value: index.name === "VIX" ? value.toFixed(2) : value.toLocaleString(),
            change: change.toFixed(2),
            changePercent: `${changePercent.toFixed(2)}%`
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
    
    // Display toast based on data source
    if (usedSomeFallback) {
      toast.warning('Some market data is simulated');
    } else {
      toast.success('Live market data loaded');
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching market data from Polygon:', error);
    toast.info('Using simulated market data');
    
    // Generate complete simulated data as fallback
    return generateAllFallbackData();
  }
};

// Function to fetch historical data for a specific index
export const fetchHistoricalData = async (symbol: string, from = Math.floor(Date.now() / 1000 - 30 * 24 * 60 * 60), to = Math.floor(Date.now() / 1000)) => {
  try {
    const fromDate = new Date(from * 1000).toISOString().split('T')[0];
    const toDate = new Date(to * 1000).toISOString().split('T')[0];
    
    const response = await fetch(
      `${POLYGON_API_URL}/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=120&apiKey=${POLYGON_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Polygon data to match expected format
    if (data.results && Array.isArray(data.results)) {
      return {
        c: data.results.map(bar => bar.c),
        h: data.results.map(bar => bar.h),
        l: data.results.map(bar => bar.l),
        o: data.results.map(bar => bar.o),
        t: data.results.map(bar => bar.t / 1000), // Convert milliseconds to seconds
        v: data.results.map(bar => bar.v),
        s: "ok"
      };
    }
    
    throw new Error("Invalid historical data format");
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

// Function to search for symbols on Polygon.io
export const searchIndices = async (query: string, exchange = "US") => {
  try {
    const response = await fetch(
      `${POLYGON_API_URL}/v3/reference/tickers?search=${query}&active=true&sort=ticker&order=asc&limit=10&apiKey=${POLYGON_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Polygon data to match expected format
    if (data.results && Array.isArray(data.results)) {
      return {
        count: data.count,
        result: data.results.map(item => ({
          description: item.name,
          displaySymbol: item.ticker,
          symbol: item.ticker,
          type: item.type
        }))
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    throw error;
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

// Fetch market status from Polygon.io
export const fetchMarketStatus = async (exchange = "US"): Promise<MarketStatus> => {
  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Check if today is a market holiday
    const holidayResponse = await fetch(
      `${POLYGON_API_URL}/v1/marketstatus/upcoming?apiKey=${POLYGON_API_KEY}`
    );
    
    if (!holidayResponse.ok) {
      throw new Error(`API error: ${holidayResponse.status}`);
    }
    
    const holidayData = await holidayResponse.json();
    console.log("Market holiday data:", holidayData);
    
    // Check current market status
    const marketStatusResponse = await fetch(
      `${POLYGON_API_URL}/v1/marketstatus/now?apiKey=${POLYGON_API_KEY}`
    );
    
    if (!marketStatusResponse.ok) {
      throw new Error(`API error: ${marketStatusResponse.status}`);
    }
    
    const marketStatusData = await marketStatusResponse.json();
    console.log("Market status data:", marketStatusData);
    
    // Find today's holiday if any
    const todayHoliday = holidayData.find((holiday: any) => 
      holiday.date === today && holiday.exchange === exchange
    );
    
    // Get the market status for the exchange
    const exchangeStatus = marketStatusData.exchanges[exchange] || "closed";
    const isOpen = exchangeStatus === "open";
    
    return {
      exchange: exchange,
      status: isOpen ? 'Open' : 'Closed',
      isOpen: isOpen,
      holiday: todayHoliday?.name,
      session: exchangeStatus,
      nextTradingDay: todayHoliday?.open
    };
  } catch (error) {
    console.error('Error fetching market status:', error);
    toast.error('Could not fetch market status');
    
    // Return fallback data
    return {
      exchange: exchange,
      status: new Date().getHours() >= 9 && new Date().getHours() < 16 ? 'Open' : 'Closed',
      isOpen: new Date().getHours() >= 9 && new Date().getHours() < 16,
    };
  }
};
