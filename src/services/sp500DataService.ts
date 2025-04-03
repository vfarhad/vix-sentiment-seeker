
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { scrapeSP500Historical, SP500HistoricalDataPoint } from './scrapers/sp500Scraper';

// Store SP500 historical data in Supabase
export const storeSP500HistoricalData = async (data: SP500HistoricalDataPoint[]): Promise<boolean> => {
  if (!data || data.length === 0) {
    console.warn('No SP500 data to store');
    return false;
  }
  
  try {
    // Check if we have the table first
    const { error: tableError } = await supabase
      .from('SP500_HIST_DATA')
      .select('*', { count: 'exact', head: true });
    
    if (tableError) {
      console.log('SP500_HIST_DATA table may not exist:', tableError);
      
      // If table doesn't exist, try to create it
      const { error: createError } = await supabase.rpc('create_sp500_hist_table');
      
      if (createError) {
        console.error('Failed to create SP500_HIST_DATA table:', createError);
        return false;
      }
    }
    
    // Prepare data for insertion with timestamp
    const insertData = data.map(item => ({
      date: item.date,
      value: item.value,
      inserted_at: new Date().toISOString()
    }));
    
    // Insert data with conflict handling
    const { error } = await supabase
      .from('SP500_HIST_DATA')
      .upsert(insertData, { onConflict: 'date' });
    
    if (error) {
      console.error('Error storing SP500 historical data:', error);
      return false;
    }
    
    console.log(`Successfully stored ${data.length} SP500 historical data points`);
    return true;
  } catch (error) {
    console.error('Error storing SP500 historical data:', error);
    return false;
  }
};

// Get SP500 historical data from Supabase
export const getSP500HistData = async (): Promise<SP500HistoricalDataPoint[]> => {
  try {
    // Get data from the past 360 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 360);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('SP500_HIST_DATA')
      .select('*')
      .gte('date', startDateStr)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching SP500 historical data:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No SP500 historical data found in database');
      return [];
    }
    
    // Map database fields to our expected format
    return data.map(item => ({
      date: item.date,
      value: parseFloat(item.value)
    }));
  } catch (error) {
    console.error('Error in getSP500HistData:', error);
    return [];
  }
};

// Fetch SP500 data from all sources
export const fetchSP500Data = async (): Promise<SP500HistoricalDataPoint[]> => {
  try {
    // First try to get data from database
    const dbData = await getSP500HistData();
    if (dbData && dbData.length > 0) {
      console.log(`Loaded ${dbData.length} SP500 data points from database`);
      return dbData;
    }
    
    // If database is empty, try scraping
    console.log('No SP500 data in database, scraping fresh data');
    const scrapedData = await scrapeSP500Historical();
    
    if (scrapedData && scrapedData.length > 0) {
      // Store the scraped data for future use
      await storeSP500HistoricalData(scrapedData);
      return scrapedData;
    }
    
    console.warn('Could not get SP500 data from any source');
    return [];
  } catch (error) {
    console.error('Error fetching SP500 data:', error);
    toast.error('Failed to load S&P 500 historical data');
    return [];
  }
};
