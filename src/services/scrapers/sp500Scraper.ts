
import { fetchWithProxy } from "./baseScraperUtils";
import { toast } from "sonner";

export interface SP500HistoricalDataPoint {
  date: string;
  value: number;
}

// URLs for S&P 500 historical data
const SP500_URL = 'https://www.investing.com/indices/us-spx-500-historical-data';
const SP500_YAHOO_URL = 'https://finance.yahoo.com/quote/%5EGSPC/history/';

export const scrapeSP500Historical = async (): Promise<SP500HistoricalDataPoint[]> => {
  console.log('Scraping S&P 500 historical data from investing.com');
  try {
    // Fetch the page HTML
    const response = await fetchWithProxy(SP500_URL);
    const html = await response.text();
    
    // Try to extract the historical data
    const data = extractSP500DataFromHTML(html);
    
    if (data && data.length > 0) {
      console.log(`Successfully scraped ${data.length} S&P 500 historical data points from investing.com`);
      return data;
    }
    
    // Try alternative method from Yahoo Finance if investing.com fails
    console.log('Failed to extract S&P 500 data from investing.com, trying Yahoo Finance');
    const yahooData = await scrapeSP500YahooHistorical();
    
    if (yahooData && yahooData.length > 0) {
      console.log(`Successfully scraped ${yahooData.length} S&P 500 historical data points from Yahoo Finance`);
      return yahooData;
    }
    
    console.warn('Failed to extract S&P 500 data from any source, generating mock data');
    return generateMockSP500Data();
  } catch (error) {
    console.error('Error scraping S&P 500 data from investing.com:', error);
    
    // Try Yahoo Finance as a fallback
    try {
      console.log('Trying Yahoo Finance as fallback for S&P 500 data');
      const yahooData = await scrapeSP500YahooHistorical();
      
      if (yahooData && yahooData.length > 0) {
        console.log(`Successfully scraped ${yahooData.length} S&P 500 historical data points from Yahoo Finance`);
        return yahooData;
      }
    } catch (yahooError) {
      console.error('Error scraping S&P 500 data from Yahoo Finance:', yahooError);
    }
    
    toast.error('Failed to load S&P 500 historical data');
    
    // Return mock data as fallback
    return generateMockSP500Data();
  }
};

// Scrape S&P 500 data from Yahoo Finance
const scrapeSP500YahooHistorical = async (): Promise<SP500HistoricalDataPoint[]> => {
  try {
    const response = await fetchWithProxy(SP500_YAHOO_URL);
    const html = await response.text();
    
    // Try to find the historical data table
    const tableRegex = /<table[^>]*data-test="historical-prices"[^>]*>[\s\S]*?<\/table>/i;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      console.warn('Could not find Yahoo Finance historical data table');
      return [];
    }
    
    const tableHtml = tableMatch[0];
    const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    
    if (!rows || rows.length <= 1) {
      console.warn('Could not find rows in Yahoo Finance historical data table');
      return [];
    }
    
    const data: SP500HistoricalDataPoint[] = [];
    
    // Skip the header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Extract date and closing price
      const dateMatch = row.match(/<td[^>]*data-reactid="[^"]*"[^>]*>([A-Za-z]{3} \d{1,2}, \d{4})<\/td>/i);
      const priceMatch = row.match(/<td[^>]*data-reactid="[^"]*"[^>]*>([0-9,\.]+)<\/td>/);
      
      if (dateMatch && priceMatch) {
        const rawDate = dateMatch[1];
        // Yahoo shows price as 4th column typically
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        
        if (!isNaN(price)) {
          const date = formatDate(rawDate);
          data.push({ date, value: price });
        }
      }
    }
    
    // Sort by date (oldest to newest)
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return data;
  } catch (error) {
    console.error('Error scraping S&P 500 data from Yahoo Finance:', error);
    return [];
  }
};

// Extract S&P 500 data from investing.com HTML
const extractSP500DataFromHTML = (html: string): SP500HistoricalDataPoint[] | null => {
  try {
    // Look for table with historical data
    const tableRegex = /<table[^>]*id="curr_table"[^>]*>[\s\S]*?<\/table>/i;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      console.warn('Could not find S&P 500 historical data table on investing.com');
      return null;
    }
    
    const tableHtml = tableMatch[0];
    const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    
    if (!rows || rows.length <= 1) { // Skip header row
      console.warn('Could not find rows in S&P 500 historical data table on investing.com');
      return null;
    }
    
    const data: SP500HistoricalDataPoint[] = [];
    
    // Skip the header row (i=0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Extract date and closing price
      const dateMatch = row.match(/<td[^>]*>\s*([A-Za-z]{3}\s+\d{2},\s+\d{4})\s*<\/td>/i);
      const priceMatch = row.match(/<td[^>]*>\s*([0-9,\.]+)\s*<\/td>/g);
      
      if (dateMatch && priceMatch && priceMatch.length >= 4) {
        const rawDate = dateMatch[1];
        // Price is the 4th column (index 3) in the table
        const priceValue = priceMatch[3].replace(/<[^>]*>/g, '').trim().replace(/,/g, '');
        const price = parseFloat(priceValue);
        
        if (!isNaN(price)) {
          const date = formatDate(rawDate);
          if (date) {
            data.push({ date, value: price });
          }
        }
      }
    }
    
    // Sort by date (oldest to newest)
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return data;
  } catch (error) {
    console.error('Error extracting S&P 500 data from investing.com HTML:', error);
    return null;
  }
};

// Generate mock S&P 500 data for the last 360 days
const generateMockSP500Data = (): SP500HistoricalDataPoint[] => {
  console.log('Generating mock S&P 500 data for the last 360 days');
  const data: SP500HistoricalDataPoint[] = [];
  const today = new Date();
  let currentValue = 4500; // Starting value around current S&P 500 level
  
  for (let i = 360; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic price movements (mostly up with some down days)
    const change = (Math.random() - 0.45) * 20; // Slight upward bias
    currentValue += change;
    
    // Ensure we don't go below a reasonable level
    if (currentValue < 3500) currentValue = 3500 + Math.random() * 50;
    
    data.push({
      date: formatDate(date.toISOString()),
      value: parseFloat(currentValue.toFixed(2))
    });
  }
  
  return data;
};

// Helper to format dates consistently (YYYY-MM-DD)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error('Error formatting date:', dateString, e);
    return '';
  }
};
