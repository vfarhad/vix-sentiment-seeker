
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SP500HistoricalDataPoint } from './types';

// Fetch SP500 data from the Supabase database
export const fetchSP500Data = async (): Promise<SP500HistoricalDataPoint[]> => {
  try {
    console.log('Fetching S&P 500 historical data from Supabase');
    
    const { data, error } = await supabase
      .from('SP500_HIST_DATA')
      .select('DATE, CLOSE')
      .order('DATE', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      toast.error('No S&P 500 data found in database');
      return [];
    }
    
    // Transform the data to match our SP500HistoricalDataPoint type
    const transformedData: SP500HistoricalDataPoint[] = data.map(item => ({
      date: item.DATE, 
      value: item.CLOSE
    }));
    
    console.log(`Successfully fetched ${transformedData.length} S&P 500 data points`);
    return transformedData;
  } catch (error) {
    console.error('Error fetching S&P 500 data from Supabase:', error);
    toast.error('Failed to load S&P 500 data');
    return [];
  }
};
