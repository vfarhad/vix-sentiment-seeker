
import { VIXTermStructurePoint, ContangoMetricsResult } from './types';

// Helper function to calculate contango percentages, differences, and term structure
export const calculateContangoMetrics = (vixTermStructure: VIXTermStructurePoint[]): ContangoMetricsResult => {
  // Filter futures only (not implied or constant maturity)
  const futures = vixTermStructure
    .filter(item => !item.isImpliedForward && !item.isConstantMaturity)
    .sort((a, b) => {
      // Sort by days to expiration
      const daysA = a.daysToExpiration || 0;
      const daysB = b.daysToExpiration || 0;
      return daysA - daysB;
    });

  if (futures.length < 2) {
    return {
      contangoPercentages: [],
      contangoDifferences: [],
      termStructure: [],
      monthRangeMetrics: []
    };
  }

  // Get the spot/current VIX
  const spotVIX = futures[0].value;
  
  // Calculate contango percentages (still useful to show)
  const contangoPercentages = futures.map((future, index) => {
    if (index === 0) return { month: 1, value: 0 }; // Spot month is 0% change
    
    // Calculate percentage change from spot
    const percentChange = ((future.value - spotVIX) / spotVIX) * 100;
    
    // Month number (1-based index)
    const monthNumber = index + 1;
    
    return {
      month: monthNumber,
      value: percentChange
    };
  });
  
  // Calculate absolute differences (also still useful)
  const contangoDifferences = futures.map((future, index) => {
    if (index === 0) return { month: 1, value: 0 }; // Spot month has 0 difference
    
    // Calculate absolute difference from spot
    const difference = future.value - spotVIX;
    
    // Month number (1-based index)
    const monthNumber = index + 1;
    
    return {
      month: monthNumber,
      value: difference
    };
  });
  
  // Calculate term structure as per the formula: (VIX Futures Price / Spot VIX Index) × 100
  const termStructure = futures.map((future, index) => {
    const monthNumber = index + 1;
    
    if (index === 0) {
      // For spot VIX, the term structure is always 100%
      return { month: monthNumber, value: 100 };
    }
    
    // Calculate the term structure using the formula from the image
    const termStructureValue = (future.value / spotVIX) * 100;
    
    return {
      month: monthNumber,
      value: termStructureValue
    };
  });
  
  // Calculate month range metrics (e.g., Month 7 to 4 contango)
  const monthRangeMetrics = [];
  
  // Try to calculate Month 7 to 4 contango if we have enough months
  if (futures.length >= 7) {
    const month7 = futures[6].value;
    const month4 = futures[3].value;
    const month7to4 = ((month7 - month4) / month4) * 100;
    
    monthRangeMetrics.push({
      label: 'Month 7 to 4 contango',
      value: month7to4
    });
  }
  
  // Add a term structure steepness metric (if we have enough months)
  if (futures.length >= 3) {
    const month3 = futures[2].value;
    const steepness = ((month3 / spotVIX) - 1) * 100;
    
    monthRangeMetrics.push({
      label: 'Term Structure Steepness (3M)',
      value: steepness
    });
  }
  
  return {
    contangoPercentages,
    contangoDifferences,
    termStructure,
    monthRangeMetrics
  };
};
