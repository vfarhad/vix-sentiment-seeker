
import { toast } from "sonner";
import { FMP_API_URL, FMP_API_KEY } from '@/config/apiConfig';
import { MarketStatus, FMPQuote, FMPHistoricalData } from '@/types/marketData';

// Fetch quote data from Financial Modeling Prep API
export const fetchFMPQuote = async (symbol: string): Promise<FMPQuote> => {
  try {
    const response = await fetch(
      `${FMP_API_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`FMP quote for ${symbol}:`, data);
    
    // FMP returns an array for quotes
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    throw new Error('No quote data returned');
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
};

// Fetch historical data from Financial Modeling Prep API
export const fetchFMPHistoricalData = async (
  symbol: string,
  fromDate: string, // Format: YYYY-MM-DD
  toDate: string    // Format: YYYY-MM-DD
): Promise<FMPHistoricalData> => {
  try {
    const response = await fetch(
      `${FMP_API_URL}/historical-price-full/${symbol}?from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`FMP historical data for ${symbol}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

// Fetch market status from Financial Modeling Prep API
export const fetchFMPMarketStatus = async (): Promise<MarketStatus> => {
  try {
    // FMP API for market hours
    const response = await fetch(
      `${FMP_API_URL}/is-the-market-open?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("FMP market status data:", data);
    
    return {
      exchange: "US",
      status: data.isTheStockMarketOpen ? 'Open' : 'Closed',
      isOpen: data.isTheStockMarketOpen,
      session: data.isTheStockMarketOpen ? 'regular' : 'closed',
      nextTradingDay: data.nextMarketOpeningDate
    };
  } catch (error) {
    console.error('Error fetching market status:', error);
    toast.error('Could not fetch market status');
    
    // Return fallback data
    return {
      exchange: "US",
      status: new Date().getHours() >= 9 && new Date().getHours() < 16 ? 'Open' : 'Closed',
      isOpen: new Date().getHours() >= 9 && new Date().getHours() < 16,
    };
  }
};
