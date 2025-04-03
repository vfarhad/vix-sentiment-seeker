
import { fetchWithProxy } from './baseScraperUtils';
import { toast } from 'sonner';

export interface StockLeader {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
}

export const BARCHART_LEADERS_URL = 'https://www.barchart.com/stocks/market-leaders';

export const scrapeStockMarketLeaders = async (): Promise<StockLeader[]> => {
  try {
    console.log('Fetching stock market leaders from Barchart');
    const response = await fetchWithProxy(BARCHART_LEADERS_URL);
    const html = await response.text();
    
    // Create a DOM parser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get the leaders table
    const tableRows = doc.querySelectorAll('.bc-table-scrollable-inner tbody tr');
    if (!tableRows || tableRows.length === 0) {
      console.error('No table rows found in Barchart data');
      return [];
    }
    
    const leaders: StockLeader[] = [];
    
    // Process each row (limit to 10 leaders for the scrolling banner)
    const maxLeaders = Math.min(10, tableRows.length);
    for (let i = 0; i < maxLeaders; i++) {
      const row = tableRows[i];
      const cells = row.querySelectorAll('td');
      
      if (cells.length >= 6) {
        const symbol = cells[0].textContent?.trim() || '';
        const name = cells[1].textContent?.trim() || '';
        const price = cells[2].textContent?.trim() || '';
        const change = cells[3].textContent?.trim() || '';
        const changePercent = cells[4].textContent?.trim() || '';
        const volume = cells[5].textContent?.trim() || '';
        
        leaders.push({
          symbol,
          name, 
          price,
          change,
          changePercent,
          volume
        });
      }
    }
    
    console.log(`Found ${leaders.length} stock market leaders`);
    return leaders;
  } catch (error) {
    console.error('Error scraping Barchart market leaders:', error);
    toast.error('Failed to load stock market leaders');
    return [];
  }
};
