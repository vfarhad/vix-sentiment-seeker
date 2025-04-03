
import { toast } from 'sonner';
import { scrapeVIXFutures } from '../vixScraperService';
import { processTermStructureData, calculateImpliedForwardVIX, calculateConstantMaturityVIX } from './termStructureCalculations';
import { storeTermStructureData, getLatestVIXTermStructure as fetchLatestVIXTermStructure } from './supabaseService';
import { calculateContangoMetrics } from './contangoMetricsService';

// Export types and functions
export type { VIXTermStructurePoint } from './types';
export { calculateContangoMetrics };

// Calculate VIX term structure and store in Supabase
export const calculateVIXTermStructure = async () => {
  try {
    const futuresData = await scrapeVIXFutures();
    if (!futuresData || futuresData.length < 2) {
      console.error('Not enough VIX futures data to calculate term structure');
      return [];
    }

    const today = new Date();
    const calculationDate = today.toISOString().split('T')[0];
    const resultData = [];

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

// Get latest VIX term structure from Supabase
// Rename imported function to avoid conflict
export const getLatestVIXTermStructure = async () => {
  try {
    return await fetchLatestVIXTermStructure();
  } catch (error) {
    console.error('Error getting latest VIX term structure:', error);
    return [];
  }
};
