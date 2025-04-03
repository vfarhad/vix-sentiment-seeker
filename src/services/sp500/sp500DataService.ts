
import { scrapeSP500Historical } from '../scrapers/sp500Scraper';
import { scrapeYahooSP500Historical, YahooFinanceDataPoint } from '../scrapers/yahooFinanceScraper';
import { toast } from 'sonner';
import { SP500HistoricalDataPoint } from './types';

// Fetch SP500 data from API with multiple sources
export const fetchSP500Data = async (): Promise<SP500HistoricalDataPoint[]> => {
  try {
    console.log('Fetching S&P 500 historical data');
    
    // Try Yahoo Finance first
    const yahooData = await scrapeYahooSP500Historical();
    if (yahooData && yahooData.length > 0) {
      console.log('Using S&P 500 data from Yahoo Finance');
      // Convert Yahoo data format to our standard format
      return yahooData.map(point => ({
        date: point.date,
        value: point.close
      }));
    }
    
    // Fall back to investing.com scraper if Yahoo fails
    console.log('Yahoo Finance data unavailable, falling back to investing.com');
    return await scrapeSP500Historical();
  } catch (error) {
    console.error('Error fetching S&P 500 data:', error);
    toast.error('Failed to load S&P 500 data');
    return [];
  }
};
