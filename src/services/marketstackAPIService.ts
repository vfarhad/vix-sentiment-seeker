
import { toast } from "sonner";
import { MARKETSTACK_API_URL, MARKETSTACK_API_KEY } from '@/config/apiConfig';
import { MarketStatus } from '@/types/marketData';

// Types for MarketStack API responses
export interface MarketStackQuote {
  symbol: string;
  exchange: string;
  name?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adj_high?: number;
  adj_low?: number;
  adj_close?: number;
  adj_open?: number;
  adj_volume?: number;
  split_factor?: number;
  dividend?: number;
  last: number;
  previous_close?: number;
  change?: number;
  percent_change?: number;
  date: string;
}

export interface MarketStackHistoricalData {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: MarketStackQuote[];
}

// Fetch quote data from MarketStack API
export const fetchMarketStackQuote = async (symbol: string): Promise<MarketStackQuote> => {
  try {
    const response = await fetch(
      `${MARKETSTACK_API_URL}/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${symbol}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`MarketStack quote for ${symbol}:`, data);
    
    // MarketStack returns an array of data for the latest quotes
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0];
    }
    
    throw new Error('No quote data returned');
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
};

// Fetch historical data from MarketStack API
export const fetchMarketStackHistoricalData = async (
  symbol: string,
  fromDate: string, // Format: YYYY-MM-DD
  toDate: string    // Format: YYYY-MM-DD
): Promise<MarketStackHistoricalData> => {
  try {
    const response = await fetch(
      `${MARKETSTACK_API_URL}/eod?access_key=${MARKETSTACK_API_KEY}&symbols=${symbol}&date_from=${fromDate}&date_to=${toDate}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`MarketStack historical data for ${symbol}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

// Fetch available market indices from MarketStack API
export const fetchMarketStackAvailableIndices = async () => {
  try {
    const response = await fetch(
      `${MARKETSTACK_API_URL}/tickers?access_key=${MARKETSTACK_API_KEY}&limit=1000`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Available MarketStack indices:", data);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching available indices:', error);
    toast.error('Could not fetch available indices');
    return [];
  }
};

// Fetch market status (MarketStack doesn't have a direct market status endpoint, so we'll use a fallback)
export const fetchMarketStackMarketStatus = async (): Promise<MarketStatus> => {
  try {
    // Since MarketStack doesn't have a direct market status endpoint, we'll determine 
    // if the market is likely open based on current time (US Eastern Time)
    const now = new Date();
    const hours = now.getUTCHours() - 4; // Approximate EDT
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    
    // Weekend check
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Market hours check (9:30 AM - 4:00 PM Eastern Time)
    const isMarketHours = hours >= 9 && hours < 16;
    
    // Combine checks
    const isOpen = !isWeekend && isMarketHours;
    
    return {
      exchange: "US",
      status: isOpen ? 'Open' : 'Closed',
      isOpen: isOpen,
      session: isOpen ? 'regular' : 'closed',
    };
  } catch (error) {
    console.error('Error determining market status:', error);
    toast.error('Could not determine market status');
    
    // Return fallback data
    return {
      exchange: "US",
      status: 'Unknown',
      isOpen: false,
    };
  }
};
