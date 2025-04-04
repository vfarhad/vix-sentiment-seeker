import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TIINGO_API_URL, TIINGO_API_KEY } from '@/config/apiConfig';

export interface SP500DataPoint {
  DATE: string;
  CLOSE: number;
  OPEN?: number;  // Make optional since they may be nullable
  HIGH?: number;  // Make optional since they may be nullable
  LOW?: number;   // Make optional since they may be nullable
}

export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Supabase connection...');
    
    // Simple ping to the Supabase instance
    const { data, error } = await supabase
      .from('SP500_HIST_DATA')
      .select('DATE')
      .limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      toast.error('Failed to connect to Supabase');
      return false;
    }
    
    console.log('Supabase connection successful!');
    console.log('SP500_HIST_DATA table exists with data:', data);
    toast.success('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    toast.error('Error connecting to Supabase');
    return false;
  }
};

export const testSP500DataTable = async (): Promise<{ success: boolean; data: SP500DataPoint[] }> => {
  try {
    console.log('Testing SP500_HIST_DATA table...');
    
    // Query the SP500_HIST_DATA table for a few records
    const { data, error } = await supabase
      .from('SP500_HIST_DATA')
      .select('CLOSE, DATE')  // Select CLOSE and DATE to match SP500DataPoint type
      .limit(1)
      .order('DATE', { ascending: false });
    
    if (error) {
      console.error('Error accessing SP500_HIST_DATA table:', error);
      toast.error('Failed to access SP500 data table');
      return { success: false, data: [] };
    }
    
    if (data && data.length > 0) {
      console.log('SP500_HIST_DATA table has records:', data);
      toast.success('Successfully retrieved SP500 data');
      return { success: true, data };
    } else {
      console.warn('SP500_HIST_DATA table exists but has no records');
      toast.warning('SP500 data table exists but is empty');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Unexpected error testing SP500_HIST_DATA table:', error);
    toast.error('Error accessing SP500 data table');
    return { success: false, data: [] };
  }
};

export const fetchTiingoSP500Data = async (ticker: string = 'SPY', startDate?: string, endDate?: string): Promise<SP500DataPoint[]> => {
  try {
    console.log('Fetching S&P 500 historical data from Tiingo API');
    
    // Set default dates if not provided
    const today = new Date();
    const end = endDate || today.toISOString().split('T')[0];
    
    // Default to 1 year of data if no start date provided
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const start = startDate || oneYearAgo.toISOString().split('T')[0];
    
    const url = `${TIINGO_API_URL}/tiingo/daily/${ticker}/prices?startDate=${start}&endDate=${end}&format=json&token=${TIINGO_API_KEY}`;
    
    console.log(`Fetching Tiingo data from ${start} to ${end} for ${ticker}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Tiingo API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`Fetched ${data.length} data points from Tiingo`);
    
    // Transform the data to match our SP500DataPoint format
    const transformedData: SP500DataPoint[] = data.map((item: any) => ({
      DATE: item.date.split('T')[0],  // Format ISO date to YYYY-MM-DD
      CLOSE: item.close,
      OPEN: item.open,
      HIGH: item.high,
      LOW: item.low
    }));
    
    // Sort by date descending (newest first)
    transformedData.sort((a, b) => new Date(b.DATE).getTime() - new Date(a.DATE).getTime());
    
    console.log('First data point:', transformedData[0]);
    console.log('Last data point:', transformedData[transformedData.length - 1]);
    
    toast.success(`Loaded ${transformedData.length} S&P 500 data points from Tiingo`);
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching data from Tiingo API:', error);
    toast.error('Failed to fetch S&P 500 data from Tiingo');
    
    // Fall back to Supabase data if Tiingo fails
    console.log('Falling back to Supabase data...');
    return fetchSP500Data();
  }
};

export const fetchSP500Data = async (): Promise<SP500DataPoint[]> => {
  try {
    console.log('Fetching S&P 500 historical data from Supabase');
    
    // Check if table exists first by doing a limited query
    const checkTable = await supabase
      .from('SP500_HIST_DATA')
      .select('DATE, CLOSE, OPEN, HIGH, LOW')  // Include all needed columns
      .limit(1);
    
    console.log('Initial table check result:', checkTable);
    
    if (checkTable.error) {
      // Log the specific error
      console.error('Error checking SP500_HIST_DATA table:', checkTable.error);
      
      if (checkTable.error.message.includes('does not exist')) {
        console.error('The SP500_HIST_DATA table does not exist in the database');
        toast.error('S&P 500 data table does not exist');
        return [];
      }
      
      toast.error('Error fetching S&P 500 data');
      return [];
    }
    
    // Fetch all rows from the table
    const { data, error } = await supabase
      .from('SP500_HIST_DATA')
      .select('*');
    
    if (error) {
      console.error('Error fetching S&P 500 data:', error);
      toast.error('Failed to load S&P 500 historical data');
      return [];
    }
    
    if (!data || data.length === 0) {
      console.warn('No S&P 500 historical data found in database');
      toast.warning('No S&P 500 data found in database');
      return [];
    }
    
    console.log(`Fetched ${data.length} S&P 500 data points`);
    console.log('First data point:', data[0]);
    console.log('Last data point:', data[data.length - 1]);
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching S&P 500 data:', error);
    toast.error('Error loading S&P 500 data');
    return [];
  }
};

export const getSP500Data = async (preferSource: 'tiingo' | 'supabase' = 'tiingo'): Promise<SP500DataPoint[]> => {
  if (preferSource === 'tiingo') {
    try {
      const tiingoData = await fetchTiingoSP500Data();
      if (tiingoData && tiingoData.length > 0) {
        return tiingoData;
      }
      // Fall back to Supabase if Tiingo returns empty data
      console.log('Tiingo returned empty data, falling back to Supabase');
      return await fetchSP500Data();
    } catch (error) {
      console.error('Error with Tiingo data, falling back to Supabase:', error);
      return await fetchSP500Data();
    }
  } else {
    // Just use Supabase directly if preferred
    return await fetchSP500Data();
  }
};
