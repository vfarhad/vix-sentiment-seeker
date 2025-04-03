
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface SP500DataPoint {
  DATE: string;
  CLOSE: number;
  OPEN?: number;  // Make optional since they may be nullable
  HIGH?: number;  // Make optional since they may be nullable
  LOW?: number;   // Make optional since they may be nullable
}

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
      return [];
    }
    
    console.log(`Fetched ${data.length} S&P 500 data points`);
    return data;
  } catch (error) {
    console.error('Unexpected error fetching S&P 500 data:', error);
    toast.error('Error loading S&P 500 data');
    return [];
  }
};
