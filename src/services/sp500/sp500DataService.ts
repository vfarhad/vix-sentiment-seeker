
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SP500HistoricalDataPoint } from './types';

// Fetch SP500 data from the Supabase database
export const fetchSP500Data = async (): Promise<SP500HistoricalDataPoint[]> => {
  try {
    console.log('Fetching S&P 500 historical data from Supabase');
    
    // Calculate date 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const formattedDate = sixtyDaysAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    console.log(`Fetching data from ${formattedDate} onwards`);
    
    const { data, error } = await supabase
      .from('SP500_HIST_DATA')
      .select('DATE, CLOSE')
      .gte('DATE', formattedDate) // Get only data from last 60 days
      .order('DATE', { ascending: true });
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('No S&P 500 data found in database');
      toast.error('No S&P 500 data found in database');
      return [];
    }
    
    console.log('Raw data from Supabase:', data.slice(0, 3));
    console.log(`Total records retrieved: ${data.length}`);
    
    // Transform the data to match our SP500HistoricalDataPoint type
    // Filter out any null values to prevent rendering issues
    const transformedData: SP500HistoricalDataPoint[] = data
      .filter(item => item.DATE && item.CLOSE !== null)
      .map(item => ({
        date: item.DATE, 
        value: item.CLOSE || 0 // Use 0 as fallback if CLOSE is null (should not happen due to filter)
      }));
    
    console.log(`Successfully fetched ${transformedData.length} S&P 500 data points`);
    
    if (transformedData.length === 0) {
      toast.error('No valid S&P 500 data found in database');
      return [];
    }
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching S&P 500 data from Supabase:', error);
    toast.error('Failed to load S&P 500 data');
    return [];
  }
};
