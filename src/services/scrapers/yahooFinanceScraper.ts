
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

// Alternative URLs in case the main one fails
const ALTERNATE_URLS = [
  'https://finance.yahoo.com/quote/SPY/history/', // SPY ETF follows S&P 500
  'https://finance.yahoo.com/quote/^GSPC/history/',
  'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d'
];

export const scrapeYahooSP500Historical = async (): Promise<YahooFinanceDataPoint[]> => {
  console.log('Scraping S&P 500 historical data from Yahoo Finance');
  
  // Try the main URL first
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
    
    console.warn('Failed to extract S&P 500 data from main Yahoo Finance URL, trying alternatives');
  } catch (mainError) {
    console.error('Error accessing main Yahoo Finance URL:', mainError);
  }
  
  // Try alternative URLs if the main one fails
  for (const url of ALTERNATE_URLS) {
    try {
      console.log(`Trying alternative URL: ${url}`);
      const response = await fetchWithProxy(url);
      const content = await response.text();
      
      // Different parsing based on URL type
      let data: YahooFinanceDataPoint[] = [];
      
      if (url.includes('query1.finance.yahoo.com')) {
        // This is an API call, parse JSON
        try {
          const jsonData = JSON.parse(content);
          data = extractYahooSP500DataFromAPI(jsonData);
        } catch (jsonError) {
          console.error('Error parsing Yahoo Finance API JSON:', jsonError);
          continue;
        }
      } else {
        // This is HTML, use regular parser
        data = extractYahooSP500DataFromHTML(content);
      }
      
      if (data && data.length > 0) {
        console.log(`Successfully scraped ${data.length} S&P 500 historical data points from alternative URL`);
        return data;
      }
    } catch (altError) {
      console.error(`Error with alternative URL ${url}:`, altError);
    }
  }
  
  console.warn('Failed to extract S&P 500 data from all Yahoo Finance sources, falling back to other sources');
  return [];
};

// Extract data from Yahoo Finance API JSON response
const extractYahooSP500DataFromAPI = (jsonData: any): YahooFinanceDataPoint[] => {
  try {
    if (!jsonData || !jsonData.chart || !jsonData.chart.result || jsonData.chart.result.length === 0) {
      return [];
    }
    
    const result = jsonData.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0] || {};
    const adjclose = result.indicators.adjclose?.[0]?.adjclose || [];
    
    const data: YahooFinanceDataPoint[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      
      const dataPoint: YahooFinanceDataPoint = {
        date,
        open: quotes.open?.[i] || 0,
        high: quotes.high?.[i] || 0,
        low: quotes.low?.[i] || 0,
        close: quotes.close?.[i] || 0,
        adjClose: adjclose[i] || quotes.close?.[i] || 0,
        volume: quotes.volume?.[i] || 0
      };
      
      data.push(dataPoint);
    }
    
    return data;
  } catch (error) {
    console.error('Error extracting data from Yahoo Finance API JSON:', error);
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
