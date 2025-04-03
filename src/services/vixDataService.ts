
import { supabase } from '@/lib/supabase';
import { VIXHistoricalDataPoint, VIXFuturesDataPoint } from './vixScraperService';
import { toast } from 'sonner';

// Check if Supabase tables exist
export const checkSupabaseTables = async (): Promise<boolean> => {
  try {
    // Try to select from both tables to verify they exist
    const { error: historicalError } = await supabase
      .from('vix_historical_data')
      .select('date', { count: 'exact', head: true });
      
    const { error: futuresError } = await supabase
      .from('vix_futures_data')
      .select('month', { count: 'exact', head: true });
      
    // If either query produced a PostgreSQL error about the relation not existing,
    // the tables don't exist
    const historicalTableMissing = historicalError?.code === '42P01'; // PostgreSQL code for undefined_table
    const futuresTableMissing = futuresError?.code === '42P01';
    
    if (historicalTableMissing || futuresTableMissing) {
      const missingTables = [];
      if (historicalTableMissing) missingTables.push('vix_historical_data');
      if (futuresTableMissing) missingTables.push('vix_futures_data');
      
      console.error(`Required Supabase tables missing: ${missingTables.join(', ')}`);
      toast.error(`Please create the tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase tables:', error);
    return false;
  }
};

// Store VIX historical data in Supabase
export const storeHistoricalVIXData = async (data: VIXHistoricalDataPoint[]) => {
  try {
    const { data: result, error } = await supabase
      .from('vix_historical_data')
      .upsert(
        data.map(point => ({
          date: point.date,
          value: point.value,
          inserted_at: new Date().toISOString()
        })),
        { onConflict: 'date' }
      );
      
    if (error) {
      // Check if this is a 'relation does not exist' error
      if (error.code === '42P01') {
        toast.error('Table vix_historical_data does not exist in Supabase');
        throw new Error('Table does not exist. Please create the required tables.');
      }
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('Error storing VIX historical data:', error);
    throw error;
  }
};

// Get VIX historical data from Supabase
export const getHistoricalVIXData = async (): Promise<VIXHistoricalDataPoint[]> => {
  try {
    const { data, error } = await supabase
      .from('vix_historical_data')
      .select('*')
      .order('date', { ascending: true });
      
    if (error) {
      // Check if this is a 'relation does not exist' error
      if (error.code === '42P01') {
        toast.error('Table vix_historical_data does not exist in Supabase');
        return [];
      }
      throw error;
    }
    
    return data?.map(item => ({
      date: item.date,
      value: item.value
    })) || [];
  } catch (error) {
    console.error('Error fetching VIX historical data:', error);
    throw error;
  }
};

// Store VIX futures data in Supabase
export const storeVIXFuturesData = async (data: VIXFuturesDataPoint[]) => {
  try {
    const timestamp = new Date().toISOString();
    
    const { data: result, error } = await supabase
      .from('vix_futures_data')
      .upsert(
        data.map(point => ({
          month: point.month,
          value: point.value,
          timestamp: timestamp
        })),
        { onConflict: 'month,timestamp' }
      );
      
    if (error) {
      // Check if this is a 'relation does not exist' error
      if (error.code === '42P01') {
        toast.error('Table vix_futures_data does not exist in Supabase');
        throw new Error('Table does not exist. Please create the required tables.');
      }
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('Error storing VIX futures data:', error);
    throw error;
  }
};

// Get latest VIX futures data from Supabase
export const getLatestVIXFuturesData = async (): Promise<VIXFuturesDataPoint[]> => {
  try {
    // First, get the latest timestamp
    const { data: timestampData, error: timestampError } = await supabase
      .from('vix_futures_data')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (timestampError) {
      // Check if this is a 'relation does not exist' error
      if (timestampError.code === '42P01') {
        toast.error('Table vix_futures_data does not exist in Supabase');
        return [];
      }
      throw timestampError;
    }
    
    if (!timestampData || timestampData.length === 0) {
      return [];
    }
    
    const latestTimestamp = timestampData[0].timestamp;
    
    // Then, get all data for that timestamp
    const { data, error } = await supabase
      .from('vix_futures_data')
      .select('*')
      .eq('timestamp', latestTimestamp)
      .order('month', { ascending: true });
      
    if (error) throw error;
    
    return data?.map(item => ({
      month: item.month,
      value: item.value
    })) || [];
  } catch (error) {
    console.error('Error fetching VIX futures data:', error);
    throw error;
  }
};
