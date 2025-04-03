
import { scrapeSP500Historical } from '../scrapers/sp500Scraper';
import { toast } from 'sonner';
import { SP500HistoricalDataPoint } from './types';

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
