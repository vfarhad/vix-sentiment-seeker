
import { toast } from "sonner";
import { MarketIndex, MarketStatus, HistoricalData, SearchResult, FMPHistoricalData } from '@/types/marketData';
import { generateFallbackData, generateAllFallbackData } from './fallbackDataService';
import { fetchFMPQuote, fetchFMPHistoricalData, fetchFMPMarketStatus } from './fmpAPIService';
import { transformFMPData } from './dataTransformService';
import { scrapeYahooFinanceMarkets } from './scrapers/yahooFinanceMarketsScraper';

// Export MarketIndex type for use in components
export type { MarketIndex } from '@/types/marketData';

// Fetch market indices data
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    // Try Yahoo Finance markets page first
    console.log("Attempting to fetch market data from Yahoo Finance markets page");
    let yahooMarketsData = await scrapeYahooFinanceMarkets();
    
    // Filter out any invalid entries
    yahooMarketsData = yahooMarketsData.filter(index => 
      index && !isNaN(index.value) && index.name && index.symbol
    );
    
    if (yahooMarketsData && yahooMarketsData.length > 0) {
      console.log("Successfully loaded market data from Yahoo Finance markets page");
      toast.success('Live market data loaded from Yahoo Finance');
      
      // Transform Yahoo data to MarketIndex format
      return yahooMarketsData.map(index => ({
        name: index.name,
        value: index.name === "VIX" ? index.value.toFixed(2) : index.value.toLocaleString(),
        change: index.change.toFixed(2),
        changePercent: `${index.changePercent.toFixed(2)}%`
      }));
    }
    
    // Fall back to FMP API if Yahoo fails
    console.log("Yahoo Finance data unavailable, falling back to FMP API");
    
    // Define indices to fetch with their symbols
    const indices = [
      { symbol: "SPY", name: "S&P 500" },   // S&P 500 ETF
      { symbol: "DIA", name: "DOW" },       // Dow Jones ETF
      { symbol: "QQQ", name: "NASDAQ" },    // NASDAQ ETF  
      { symbol: "IWM", name: "RUSSELL" },   // Russell 2000 ETF
      { symbol: "^VIX", name: "VIX" }       // VIX index (FMP uses ^ for indices)
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
        
        // Fetch data from FMP API
        const quoteData = await fetchFMPQuote(index.symbol);
        
        // Transform data to MarketIndex format
        const transformedData = transformFMPData(index.name, quoteData);
        
        if (transformedData) {
          results.push(transformedData);
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
    console.error('Error fetching market data:', error);
    toast.info('Using simulated market data');
    
    // Generate complete simulated data as fallback
    return generateAllFallbackData();
  }
};

// Function to fetch historical data for a specific index
export const fetchHistoricalData = async (
  symbol: string, 
  from = Math.floor(Date.now() / 1000 - 30 * 24 * 60 * 60), 
  to = Math.floor(Date.now() / 1000)
): Promise<HistoricalData> => {
  try {
    // Convert Unix timestamps to YYYY-MM-DD format for FMP API
    const fromDate = new Date(from * 1000).toISOString().split('T')[0];
    const toDate = new Date(to * 1000).toISOString().split('T')[0];
    
    const fmpData = await fetchFMPHistoricalData(symbol, fromDate, toDate);
    
    // Transform FMP data to match the expected format
    return transformFMPHistoricalData(fmpData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    
    // Return a mock historical data set as fallback
    return {
      c: Array(30).fill(0).map(() => 100 + Math.random() * 50),
      h: Array(30).fill(0).map(() => 120 + Math.random() * 50),
      l: Array(30).fill(0).map(() => 80 + Math.random() * 40),
      o: Array(30).fill(0).map(() => 90 + Math.random() * 60),
      t: Array(30).fill(0).map((_, i) => Math.floor(Date.now() / 1000) - (29 - i) * 86400),
      v: Array(30).fill(0).map(() => 1000000 + Math.random() * 9000000),
      s: "ok"
    };
  }
};

// Helper function to transform FMP historical data to our HistoricalData format
const transformFMPHistoricalData = (fmpData: FMPHistoricalData): HistoricalData => {
  // FMP returns historical data in reverse chronological order (newest first)
  // We need to reverse it to match our expected format
  const historical = [...fmpData.historical].reverse();
  
  return {
    c: historical.map(item => item.close),
    h: historical.map(item => item.high),
    l: historical.map(item => item.low),
    o: historical.map(item => item.open),
    t: historical.map(item => new Date(item.date).getTime() / 1000), // Convert to Unix timestamp
    v: historical.map(item => item.volume),
    s: "ok"
  };
};

// Function to search for symbols
export const searchIndices = async (query: string): Promise<SearchResult> => {
  // For now, we'll return a mock search result
  // In a future update, we can implement a real search with FMP
  return {
    count: 0,
    result: []
  };
};

// Fetch market status
export const fetchMarketStatus = async (exchange = "US"): Promise<MarketStatus> => {
  try {
    return await fetchFMPMarketStatus();
  } catch (error) {
    console.error('Error fetching market status:', error);
    
    // Return default market status as fallback
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const hours = now.getHours();
    const isMarketHours = hours >= 9 && hours < 16;
    
    return {
      isOpen: !isWeekend && isMarketHours,
      status: !isWeekend && isMarketHours ? 'open' : 'closed',
      exchange: 'US',
      session: !isWeekend && isMarketHours ? 'regular' : 'closed',
      nextTradingDay: null,
      holiday: isWeekend ? (now.getDay() === 0 ? 'Sunday' : 'Saturday') : null
    };
  }
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
