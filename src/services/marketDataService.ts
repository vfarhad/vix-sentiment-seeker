
import { toast } from "sonner";
import { MarketIndex, MarketStatus, HistoricalData, SearchResult } from '@/types/marketData';
import { generateFallbackData, generateAllFallbackData } from './fallbackDataService';
import { 
  fetchFinnhubQuote, 
  fetchFinnhubHistoricalData, 
  searchFinnhubSymbols, 
  fetchFinnhubMarketStatus 
} from './finnhubAPIService';
import { transformFinnhubData } from './dataTransformService';

// Export MarketIndex type for use in components
export type { MarketIndex } from '@/types/marketData';

// Fetch market indices data
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
        
        // Fetch data from Finnhub API
        const quoteData = await fetchFinnhubQuote(index.symbol);
        
        // Transform data to MarketIndex format
        const transformedData = transformFinnhubData(index.name, quoteData);
        
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
    console.error('Error fetching market data from Finnhub:', error);
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
  return await fetchFinnhubHistoricalData(symbol, from, to);
};

// Function to search for symbols
export const searchIndices = async (query: string, exchange = "US"): Promise<SearchResult> => {
  const result = await searchFinnhubSymbols(query);
  
  // Transform to expected SearchResult format
  return {
    count: result.count,
    result: result.result
  };
};

// Fetch market status
export const fetchMarketStatus = async (exchange = "US"): Promise<MarketStatus> => {
  return await fetchFinnhubMarketStatus(exchange);
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
