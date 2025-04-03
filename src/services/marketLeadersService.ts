
import { scrapeStockMarketLeaders, StockLeader } from './scrapers/barchartScraper';
import { toast } from 'sonner';

export const fetchStockMarketLeaders = async (): Promise<StockLeader[]> => {
  try {
    return await scrapeStockMarketLeaders();
  } catch (error) {
    console.error('Error fetching stock market leaders:', error);
    toast.error('Failed to load stock market leaders');
    return [];
  }
};
