
import { SP500HistoricalDataPoint } from './types';

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
