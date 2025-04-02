
import { toast } from "sonner";
import { FINNHUB_API_URL, FINNHUB_API_KEY } from '@/config/apiConfig';
import { FinnhubQuote, FinnhubSymbolLookup, HistoricalData, MarketStatus } from '@/types/marketData';

// Fetch quote data from Finnhub API
export const fetchFinnhubQuote = async (symbol: string): Promise<FinnhubQuote> => {
  try {
    const response = await fetch(
      `${FINNHUB_API_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Finnhub quote for ${symbol}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
};

// Fetch historical data from Finnhub API
export const fetchFinnhubHistoricalData = async (
  symbol: string, 
  fromDate: number, 
  toDate: number,
  resolution = 'D'
): Promise<HistoricalData> => {
  try {
    const response = await fetch(
      `${FINNHUB_API_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Finnhub historical data for ${symbol}:`, data);
    
    // Return data in the expected format
    return {
      c: data.c || [],
      h: data.h || [],
      l: data.l || [],
      o: data.o || [],
      t: data.t || [],
      v: data.v || [],
      s: data.s || "no_data"
    };
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

// Search for symbols on Finnhub API
export const searchFinnhubSymbols = async (query: string): Promise<FinnhubSymbolLookup> => {
  try {
    const response = await fetch(
      `${FINNHUB_API_URL}/search?q=${query}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Finnhub search results for ${query}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    throw error;
  }
};

// Fetch market status from Finnhub API
export const fetchFinnhubMarketStatus = async (exchange = "US"): Promise<MarketStatus> => {
  try {
    // Fetch market status
    const response = await fetch(
      `${FINNHUB_API_URL}/stock/market-status?exchange=${exchange}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const statusData = await response.json();
    console.log("Finnhub market status data:", statusData);
    
    // Get holiday data if needed
    let holiday;
    try {
      const holidayResponse = await fetch(
        `${FINNHUB_API_URL}/calendar/holiday?exchange=${exchange}&token=${FINNHUB_API_KEY}`
      );
      
      if (holidayResponse.ok) {
        const holidayData = await holidayResponse.json();
        // Find today's holiday if any
        const today = new Date().toISOString().split('T')[0];
        holiday = holidayData.holidays?.find((h: any) => h.date === today && h.exchange === exchange);
      }
    } catch (e) {
      console.warn("Error fetching holiday data:", e);
    }
    
    return {
      exchange: exchange,
      status: statusData.isOpen ? 'Open' : 'Closed',
      isOpen: statusData.isOpen,
      holiday: holiday?.name,
      session: statusData.isOpen ? 'regular' : 'closed',
      nextTradingDay: undefined // Finnhub doesn't provide this directly
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
