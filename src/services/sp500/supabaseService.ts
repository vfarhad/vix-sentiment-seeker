
import { supabase } from '@/lib/supabase';
import { VIXTermStructurePoint } from './types';

// Store term structure data in Supabase
export const storeTermStructureData = async (termData: VIXTermStructurePoint[], calculationDate: string) => {
  try {
    // Prepare data for insertion
    const dataToInsert = termData.map(item => ({
      calculation_date: calculationDate,
      month: item.month,
      value: item.value,
      days_to_expiration: item.daysToExpiration,
      is_contango: item.isContango,
      is_implied_forward: item.isImpliedForward || false,
      is_constant_maturity: item.isConstantMaturity || false,
      forward_start_date: item.forwardStartDate ? calculationDate : null,
      forward_end_date: item.forwardEndDate ? calculationDate : null,
      maturity_days: item.maturityDays
    }));
    
    // Insert data into Supabase
    const { error } = await supabase
      .from('vix_term_structure')
      .upsert(dataToInsert, { 
        onConflict: 'calculation_date,month,is_implied_forward,is_constant_maturity'
      });
    
    if (error) {
      console.error('Error storing term structure data:', error);
      throw error;
    }
    
    console.log('Successfully stored VIX term structure data');
  } catch (error) {
    console.error('Error storing term structure data:', error);
    throw error;
  }
};

// Get latest VIX term structure from Supabase
export const getLatestVIXTermStructure = async (): Promise<VIXTermStructurePoint[]> => {
  try {
    // First, get the latest calculation date
    const { data: dateData, error: dateError } = await supabase
      .from('vix_term_structure')
      .select('calculation_date')
      .order('calculation_date', { ascending: false })
      .limit(1);
    
    if (dateError) {
      console.error('Error fetching latest term structure date:', dateError);
      return [];
    }
    
    if (!dateData || dateData.length === 0) {
      console.log('No term structure data found');
      return [];
    }
    
    const latestDate = dateData[0].calculation_date;
    
    // Then, get all data for that date
    const { data, error } = await supabase
      .from('vix_term_structure')
      .select('*')
      .eq('calculation_date', latestDate)
      .order('days_to_expiration', { ascending: true });
    
    if (error) {
      console.error('Error fetching VIX term structure:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No term structure data found for latest date');
      return [];
    }
    
    // Transform data to match the interface
    return data.map(item => ({
      month: item.month,
      value: item.value,
      daysToExpiration: item.days_to_expiration,
      isContango: item.is_contango,
      isImpliedForward: item.is_implied_forward,
      isConstantMaturity: item.is_constant_maturity,
      forwardStartDate: item.forward_start_date,
      forwardEndDate: item.forward_end_date,
      maturityDays: item.maturity_days
    }));
  } catch (error) {
    console.error('Error getting latest VIX term structure:', error);
    return [];
  }
};
