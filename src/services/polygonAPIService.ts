
import { toast } from "sonner";
import { POLYGON_API_URL, POLYGON_API_KEY } from '@/config/apiConfig';
import { MarketStatus, SearchResult, HistoricalData } from '@/types/marketData';

// Fetch market indices data from Polygon API
export const fetchPolygonIndexData = async (symbol: string, date: string) => {
  try {
    // Get previous day's close
    const previousClose = await fetch(
      `${POLYGON_API_URL}/v1/open-close/${symbol}/${date}?adjusted=true&apiKey=${POLYGON_API_KEY}`
    );
    
    // Get current quote
    const currentQuote = await fetch(
      `${POLYGON_API_URL}/v2/last/trade/${symbol}?apiKey=${POLYGON_API_KEY}`
    );
    
    if (!previousClose.ok || !currentQuote.ok) {
      throw new Error(`API error: ${!previousClose.ok ? previousClose.status : currentQuote.status}`);
    }
    
    const previousData = await previousClose.json();
    const quoteData = await currentQuote.json();
    
    console.log(`Polygon data for ${symbol}:`, { previousData, quoteData });
    
    return { previousData, quoteData };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    throw error;
  }
};

// Fetch historical data from Polygon API
export const fetchPolygonHistoricalData = async (symbol: string, fromDate: string, toDate: string): Promise<HistoricalData> => {
  try {
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

// Search for symbols on Polygon API
export const searchPolygonSymbols = async (query: string): Promise<SearchResult> => {
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
    
    throw new Error("Invalid search result format");
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    throw error;
  }
};

// Fetch market status from Polygon API
export const fetchPolygonMarketStatus = async (exchange = "US"): Promise<MarketStatus> => {
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
