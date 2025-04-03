
import { fetchWithProxy } from "./baseScraperUtils";
import { toast } from "sonner";

export interface YahooFinanceDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

// URL for Yahoo Finance S&P 500 historical data
const YAHOO_SP500_URL = 'https://finance.yahoo.com/quote/%5EGSPC/history/';

export const scrapeYahooSP500Historical = async (): Promise<YahooFinanceDataPoint[]> => {
  console.log('Scraping S&P 500 historical data from Yahoo Finance');
  try {
    // Fetch the page HTML
    const response = await fetchWithProxy(YAHOO_SP500_URL);
    const html = await response.text();
    
    // Extract the historical data
    const data = extractYahooSP500DataFromHTML(html);
    
    if (data && data.length > 0) {
      console.log(`Successfully scraped ${data.length} S&P 500 historical data points from Yahoo Finance`);
      return data;
    }
    
    console.warn('Failed to extract S&P 500 data from Yahoo Finance, falling back to other sources');
    return [];
  } catch (error) {
    console.error('Error scraping S&P 500 data from Yahoo Finance:', error);
    toast.error('Failed to load S&P 500 historical data from Yahoo Finance');
    return [];
  }
};

// Extract S&P 500 data from Yahoo Finance HTML
const extractYahooSP500DataFromHTML = (html: string): YahooFinanceDataPoint[] => {
  try {
    // Look for table with historical data
    const tableRegex = /<table[^>]*data-test="historical-prices"[^>]*>[\s\S]*?<\/table>/i;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      console.warn('Could not find S&P 500 historical data table in Yahoo Finance HTML');
      return [];
    }
    
    const tableHtml = tableMatch[0];
    const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    
    if (!rows || rows.length <= 1) { // Skip header row
      console.warn('Could not find rows in Yahoo Finance S&P 500 historical data table');
      return [];
    }
    
    const data: YahooFinanceDataPoint[] = [];
    
    // Skip the header row (i=0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip dividend rows (they have fewer columns)
      if (row.match(/>Dividend</i)) {
        continue;
      }
      
      // Extract all cell data
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      
      if (cells && cells.length >= 7) {
        // Extract text content from cells
        const extractCellValue = (cellHtml: string): string => {
          // Remove HTML tags and trim
          return cellHtml.replace(/<[^>]*>/g, '').trim();
        };
        
        const dateStr = extractCellValue(cells[0]);
        const openStr = extractCellValue(cells[1]);
        const highStr = extractCellValue(cells[2]);
        const lowStr = extractCellValue(cells[3]);
        const closeStr = extractCellValue(cells[4]);
        const adjCloseStr = extractCellValue(cells[5]);
        const volumeStr = extractCellValue(cells[6]);
        
        // Parse numeric values (handle comma thousands separators)
        const parseNumeric = (str: string): number => {
          const cleanStr = str.replace(/,/g, '');
          return parseFloat(cleanStr);
        };
        
        // Format date to YYYY-MM-DD
        const formatDate = (dateStr: string): string => {
          try {
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
          } catch (e) {
            console.error('Error parsing date:', dateStr, e);
            return '';
          }
        };
        
        const date = formatDate(dateStr);
        const open = parseNumeric(openStr);
        const high = parseNumeric(highStr);
        const low = parseNumeric(lowStr);
        const close = parseNumeric(closeStr);
        const adjClose = parseNumeric(adjCloseStr);
        const volume = parseNumeric(volumeStr);
        
        // Add valid data points
        if (date && !isNaN(close)) {
          data.push({
            date,
            open,
            high,
            low,
            close,
            adjClose,
            volume
          });
        }
      }
    }
    
    // Sort by date (oldest to newest)
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return data;
  } catch (error) {
    console.error('Error extracting S&P 500 data from Yahoo Finance HTML:', error);
    return [];
  }
};
