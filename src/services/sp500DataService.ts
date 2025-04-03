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

// New function to fetch VIX futures historical data
export const getVIXFuturesHistData = async (): Promise<{date: string, volume: number, openInterest: number}[]> => {
  try {
    // Get the most recent data points, limited to the last 30 days
    const { data, error } = await supabase
      .from('VIX_FUTURES_HIST_DATA')
      .select('*')
      .order('DATE', { ascending: false })
      .limit(30);
    
    if (error) {
      console.error('Error fetching VIX futures historical data:', error);
      toast.error('Failed to load VIX futures historical data');
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No VIX futures historical data found in database');
      return [];
    }
    
    // Map database fields to our expected format
    return data.map(item => ({
      date: item.DATE,
      volume: item['VOLATILITY INDEX VOLUME'] || 0,
      openInterest: item['VOLATILITY INDEX OI'] || 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error in getVIXFuturesHistData:', error);
    toast.error('Failed to load VIX futures historical data');
    return [];
  }
};

// Function to calculate VIX term structure from historical data
export const calculateVIXTermStructure = async (): Promise<{month: string, value: number}[]> => {
  try {
    const histData = await getVIXFuturesHistData();
    
    if (!histData || histData.length === 0) {
      console.log('No VIX futures historical data available to calculate term structure');
      return [];
    }
    
    // Group data by month
    const monthlyData: Record<string, number[]> = {};
    
    histData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      
      // Use open interest as the value for term structure
      if (item.openInterest) {
        monthlyData[monthKey].push(item.openInterest);
      }
    });
    
    // Calculate average for each month
    const termStructure = Object.entries(monthlyData).map(([month, values]) => {
      const avg = values.length > 0 
        ? values.reduce((sum, val) => sum + val, 0) / values.length 
        : 0;
      
      return {
        month,
        value: parseFloat(avg.toFixed(2))
      };
    });
    
    // Sort months chronologically
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    termStructure.sort((a, b) => {
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
    
    // Make sure we have the current month as the first item
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    if (!termStructure.some(item => item.month === 'Current')) {
      // If we have the current month in our data, copy it as "Current"
      const currentMonthData = termStructure.find(item => item.month === currentMonth);
      
      if (currentMonthData) {
        termStructure.unshift({
          month: 'Current',
          value: currentMonthData.value
        });
      }
    }
    
    return termStructure;
  } catch (error) {
    console.error('Error calculating VIX term structure:', error);
    return [];
  }
};
