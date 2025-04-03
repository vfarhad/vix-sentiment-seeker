import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { scrapeVIXFutures, VIXFuturesDataPoint } from './vixScraperService';
import { scrapeSP500Historical, SP500HistoricalDataPoint } from './scrapers/sp500Scraper';

// Type definitions for term structure data
export interface VIXTermStructurePoint {
  month: string;
  value: number;
  daysToExpiration?: number;
  isContango?: boolean;
  isImpliedForward?: boolean;
  isConstantMaturity?: boolean;
  forwardStartDate?: string;
  forwardEndDate?: string;
  maturityDays?: number;
}

// Fetch SP500 data from API
export const fetchSP500Data = async (): Promise<SP500HistoricalDataPoint[]> => {
  try {
    console.log('Fetching S&P 500 historical data');
    return await scrapeSP500Historical();
  } catch (error) {
    console.error('Error fetching S&P 500 data:', error);
    toast.error('Failed to load S&P 500 data');
    return [];
  }
};

// Get VIX futures historical volume and open interest data
export const getVIXFuturesHistData = async () => {
  try {
    // This would fetch real VIX futures volume and open interest data
    // For now, we'll return mock data
    const today = new Date();
    const mockData = [];
    
    // Generate 10 days of mock data
    for (let i = 10; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      mockData.push({
        DATE: date.toISOString().split('T')[0],
        'VOLATILITY INDEX VOLUME': Math.floor(100000 + Math.random() * 900000),
        'VOLATILITY INDEX OI': Math.floor(50000 + Math.random() * 500000)
      });
    }
    
    return mockData;
  } catch (error) {
    console.error('Error fetching VIX futures historical data:', error);
    return [];
  }
};

// Calculate VIX term structure and store in Supabase
export const calculateVIXTermStructure = async (): Promise<VIXTermStructurePoint[]> => {
  try {
    const futuresData = await scrapeVIXFutures();
    if (!futuresData || futuresData.length < 2) {
      console.error('Not enough VIX futures data to calculate term structure');
      return [];
    }

    const today = new Date();
    const calculationDate = today.toISOString().split('T')[0];
    const resultData: VIXTermStructurePoint[] = [];

    // Process base term structure data (spot and futures)
    const processedData = processTermStructureData(futuresData, calculationDate);
    resultData.push(...processedData);

    // Calculate implied forward values
    const impliedForwards = calculateImpliedForwardVIX(processedData);
    resultData.push(...impliedForwards);

    // Calculate constant maturity values
    const constantMaturity = calculateConstantMaturityVIX(processedData);
    if (constantMaturity) {
      resultData.push(constantMaturity);
    }

    // Store the calculated data in Supabase
    await storeTermStructureData(resultData, calculationDate);

    return resultData;
  } catch (error) {
    console.error('Error calculating VIX term structure:', error);
    toast.error('Failed to calculate VIX term structure');
    return [];
  }
};

// Process raw futures data to add days to expiration and contango flags
const processTermStructureData = (futuresData: VIXFuturesDataPoint[], calculationDate: string): VIXTermStructurePoint[] => {
  // Map of month abbreviations to their numeric value
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  // Sort data by expiration date (if current month is first, keep it first)
  const sortedData = [...futuresData].sort((a, b) => {
    // Keep Current/Spot as the first item
    if (a.month.toLowerCase().includes('current') || a.month.toLowerCase().includes('spot')) return -1;
    if (b.month.toLowerCase().includes('current') || b.month.toLowerCase().includes('spot')) return 1;

    // For future months, sort by their expiration date
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Extract month from string (assuming format is like "Jan", "Feb", etc.)
    const monthA = a.month.substring(0, 3);
    const monthB = b.month.substring(0, 3);

    if (!(monthA in monthMap) || !(monthB in monthMap)) {
      // If we can't parse the month, keep the original order
      return 0;
    }

    // Calculate the expiration dates (15th of each month is typical for VIX futures)
    const dateA = new Date(currentYear, monthMap[monthA], 15);
    const dateB = new Date(currentYear, monthMap[monthB], 15);

    // If month is before current month, it's next year's contract
    if (dateA < new Date(calculationDate) && !a.month.toLowerCase().includes('current')) {
      dateA.setFullYear(nextYear);
    }
    
    if (dateB < new Date(calculationDate) && !b.month.toLowerCase().includes('current')) {
      dateB.setFullYear(nextYear);
    }

    return dateA.getTime() - dateB.getTime();
  });

  // Process the sorted data to add days to expiration and contango flags
  const resultData: VIXTermStructurePoint[] = [];
  
  // Calculate days to expiration for each futures contract
  for (let i = 0; i < sortedData.length; i++) {
    const item = sortedData[i];
    
    // Skip if not a valid value
    if (isNaN(item.value)) continue;
    
    // Current/Spot value has 0 days to expiration
    if (item.month.toLowerCase().includes('current') || item.month.toLowerCase().includes('spot')) {
      resultData.push({
        month: item.month,
        value: item.value,
        daysToExpiration: 0,
        isContango: undefined
      });
      continue;
    }
    
    // Extract month from string and calculate expiration date
    const monthStr = item.month.substring(0, 3);
    if (!(monthStr in monthMap)) continue;
    
    const currentYear = new Date().getFullYear();
    let expirationDate = new Date(currentYear, monthMap[monthStr], 15);
    
    // If month is before current month, it's next year's contract
    if (expirationDate < new Date(calculationDate)) {
      expirationDate.setFullYear(currentYear + 1);
    }
    
    // Calculate days to expiration
    const daysToExpiration = Math.round((expirationDate.getTime() - new Date(calculationDate).getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine contango/backwardation relative to the previous month
    let isContango: boolean | undefined = undefined;
    if (i > 0 && !isNaN(resultData[i-1].value)) {
      isContango = item.value > resultData[i-1].value;
    }
    
    resultData.push({
      month: item.month,
      value: item.value,
      daysToExpiration,
      isContango
    });
  }

  return resultData;
};

// Calculate implied forward VIX between expiration dates
const calculateImpliedForwardVIX = (termData: VIXTermStructurePoint[]): VIXTermStructurePoint[] => {
  const impliedForwards: VIXTermStructurePoint[] = [];
  
  // Need at least 2 futures contracts to calculate forwards
  if (termData.length < 3) return impliedForwards;
  
  // Start from index 1 to calculate forwards between adjacent futures
  for (let i = 1; i < termData.length - 1; i++) {
    const current = termData[i];
    const next = termData[i+1];
    
    // Skip if missing required data
    if (!current.daysToExpiration || !next.daysToExpiration || 
        current.daysToExpiration === 0 || next.daysToExpiration === 0) {
      continue;
    }
    
    // Convert days to years for the formula
    const T1 = current.daysToExpiration / 365;
    const T2 = next.daysToExpiration / 365;
    
    // Calculate implied forward variance
    const F1Squared = Math.pow(current.value, 2);
    const F2Squared = Math.pow(next.value, 2);
    const forwardVariance = ((F2Squared * T2) - (F1Squared * T1)) / (T2 - T1);
    
    // Calculate implied forward VIX (square root of forward variance)
    const forwardVIX = Math.sqrt(Math.max(0, forwardVariance)); // Ensure non-negative
    
    impliedForwards.push({
      month: `${current.month}-${next.month} Fwd`,
      value: parseFloat(forwardVIX.toFixed(2)),
      isImpliedForward: true,
      forwardStartDate: current.month,
      forwardEndDate: next.month,
      daysToExpiration: Math.round((current.daysToExpiration + next.daysToExpiration) / 2)
    });
  }
  
  return impliedForwards;
};

// Calculate constant maturity VIX (e.g., 30-day)
const calculateConstantMaturityVIX = (termData: VIXTermStructurePoint[], targetDays = 30): VIXTermStructurePoint | null => {
  // Filter out implied forwards and sort by days to expiration
  const futuresData = termData
    .filter(item => !item.isImpliedForward)
    .sort((a, b) => (a.daysToExpiration || 0) - (b.daysToExpiration || 0));
  
  // Need at least 2 futures contracts to interpolate
  if (futuresData.length < 2) return null;
  
  // Find the two futures contracts that bracket the target maturity
  let lowerIndex = -1;
  for (let i = 0; i < futuresData.length - 1; i++) {
    const current = futuresData[i];
    const next = futuresData[i+1];
    
    if ((current.daysToExpiration || 0) <= targetDays && (next.daysToExpiration || 0) > targetDays) {
      lowerIndex = i;
      break;
    }
  }
  
  // If we couldn't find bracketing contracts, return null
  if (lowerIndex === -1) return null;
  
  const lowerContract = futuresData[lowerIndex];
  const upperContract = futuresData[lowerIndex+1];
  
  const D1 = lowerContract.daysToExpiration || 0;
  const D2 = upperContract.daysToExpiration || 0;
  const Dt = targetDays;
  
  // Calculate weights for interpolation
  const W1 = (D2 - Dt) / (D2 - D1);
  const W2 = (Dt - D1) / (D2 - D1);
  
  // Calculate constant maturity VIX
  const constantMaturityVIX = (lowerContract.value * W1) + (upperContract.value * W2);
  
  return {
    month: `${targetDays}-Day VIX`,
    value: parseFloat(constantMaturityVIX.toFixed(2)),
    isConstantMaturity: true,
    maturityDays: targetDays,
    daysToExpiration: targetDays
  };
};

// Store term structure data in Supabase
const storeTermStructureData = async (termData: VIXTermStructurePoint[], calculationDate: string) => {
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
