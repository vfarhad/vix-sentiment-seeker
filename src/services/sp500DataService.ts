
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

// Function to fetch VIX futures historical data
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

// Improved function to calculate VIX term structure from historical data
export const calculateVIXTermStructure = async (): Promise<{month: string, value: number}[]> => {
  try {
    const histData = await getVIXFuturesHistData();
    
    if (!histData || histData.length === 0) {
      console.log('No VIX futures historical data available to calculate term structure');
      return [];
    }
    
    // Group data by month
    const monthlyData: Record<string, {values: number[], dates: Date[]}> = {};
    
    histData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { values: [], dates: [] };
      }
      
      // Use open interest as the value for term structure
      if (item.openInterest) {
        monthlyData[monthKey].values.push(item.openInterest);
        monthlyData[monthKey].dates.push(date);
      }
    });
    
    // Calculate average value and days to expiration for each month
    const termStructure = Object.entries(monthlyData).map(([month, data]) => {
      // Average of all values for this month
      const avgValue = data.values.length > 0 
        ? data.values.reduce((sum, val) => sum + val, 0) / data.values.length 
        : 0;
      
      // Calculate average date for this month (for calculating implied forward values later)
      const avgDateTimestamp = data.dates.length > 0
        ? data.dates.reduce((sum, date) => sum + date.getTime(), 0) / data.dates.length
        : new Date().getTime();
      
      const avgDate = new Date(avgDateTimestamp);
      
      return {
        month,
        value: parseFloat(avgValue.toFixed(2)),
        date: avgDate,
        daysToExpiration: Math.round((avgDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    });
    
    // Sort months chronologically by days to expiration
    termStructure.sort((a, b) => a.daysToExpiration - b.daysToExpiration);
    
    // Make sure we have the current month as the first item
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    if (!termStructure.some(item => item.month === 'Current')) {
      // If we have the current month in our data, copy it as "Current"
      const currentMonthData = termStructure.find(item => item.month === currentMonth);
      
      if (currentMonthData) {
        // Use the closest month as "Current" spot price
        termStructure.unshift({
          month: 'Current',
          value: currentMonthData.value,
          date: new Date(),
          daysToExpiration: 0
        });
      }
    }
    
    // Calculate implied forward values between each pair of consecutive months
    for (let i = 0; i < termStructure.length - 1; i++) {
      const current = termStructure[i];
      const next = termStructure[i + 1];
      
      // Convert days to expiration to years for the calculation
      const T1 = current.daysToExpiration / 365;
      const T2 = next.daysToExpiration / 365;
      
      // Skip if time difference is too small
      if (T2 - T1 < 0.01) continue;
      
      // Calculate implied forward variance
      const F1 = current.value;
      const F2 = next.value;
      
      // Add implied forward VIX calculation
      // Using the formula: FV = ((F2^2 * T2) - (F1^2 * T1)) / (T2 - T1)
      const impliedForwardVariance = ((F2 * F2 * T2) - (F1 * F1 * T1)) / (T2 - T1);
      
      // Calculate implied forward VIX
      const impliedForwardVIX = Math.sqrt(Math.max(0, impliedForwardVariance));
      
      // Add to next month's data for display
      next.impliedForwardVIX = parseFloat(impliedForwardVIX.toFixed(2));
    }
    
    // Calculate 30-day constant maturity VIX futures value
    // Find the two contracts that bracket 30 days
    let nearContract = termStructure[0];
    let farContract = termStructure[termStructure.length - 1];
    const targetDays = 30;
    
    for (let i = 0; i < termStructure.length - 1; i++) {
      if (termStructure[i].daysToExpiration <= targetDays && 
          termStructure[i + 1].daysToExpiration > targetDays) {
        nearContract = termStructure[i];
        farContract = termStructure[i + 1];
        break;
      }
    }
    
    // Only calculate if we have contracts bracketing 30 days
    if (nearContract.daysToExpiration <= targetDays && 
        farContract.daysToExpiration > targetDays) {
      
      const D1 = nearContract.daysToExpiration;
      const D2 = farContract.daysToExpiration;
      const Dt = targetDays;
      
      // Calculate weights
      const W1 = (D2 - Dt) / (D2 - D1);
      const W2 = (Dt - D1) / (D2 - D1);
      
      // Calculate constant maturity VIX futures value
      const constantMaturityVIX = (nearContract.value * W1) + (farContract.value * W2);
      
      // Add this as a special point in the term structure
      termStructure.push({
        month: '30-Day CM',
        value: parseFloat(constantMaturityVIX.toFixed(2)),
        date: new Date(new Date().getTime() + targetDays * 24 * 60 * 60 * 1000),
        daysToExpiration: targetDays,
        isConstantMaturity: true
      });
    }
    
    // Return the final term structure with only month and value for display compatibility
    return termStructure.map(item => ({
      month: item.month,
      value: item.value,
      // Include implied forward VIX if available
      ...(item.impliedForwardVIX ? { impliedForwardVIX: item.impliedForwardVIX } : {}),
      ...(item.isConstantMaturity ? { isConstantMaturity: true } : {})
    }));
  } catch (error) {
    console.error('Error calculating VIX term structure:', error);
    return [];
  }
};
