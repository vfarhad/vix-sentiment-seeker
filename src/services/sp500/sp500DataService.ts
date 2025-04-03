import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
      .select('*')
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
    
    // Get data from the last 2 months
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const dateStr = twoMonthsAgo.toISOString().split('T')[0];
    
    console.log(`Fetching S&P 500 data since ${dateStr}`);
    
    const { data, error } = await supabase
      .from('SP500_HIST_DATA')
      .select('DATE, CLOSE, OPEN, HIGH, LOW')  // Include all needed columns
      .gte('DATE', dateStr)
      .order('DATE', { ascending: true });
    
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
