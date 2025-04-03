
import { fetchWithProxy } from "./baseScraperUtils";
import { toast } from "sonner";

export interface YahooMarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

// URL for Yahoo Finance markets page
const YAHOO_MARKETS_URL = 'https://finance.yahoo.com/markets/';

export const scrapeYahooFinanceMarkets = async (): Promise<YahooMarketIndex[]> => {
  console.log('Scraping market indices from Yahoo Finance markets page');
  try {
    // Fetch the page HTML
    const response = await fetchWithProxy(YAHOO_MARKETS_URL);
    const html = await response.text();
    
    // Extract the market indices data
    const data = extractYahooMarketsDataFromHTML(html);
    
    if (data && data.length > 0) {
      console.log(`Successfully scraped ${data.length} market indices from Yahoo Finance markets page`);
      return data;
    }
    
    console.warn('Failed to extract market indices from Yahoo Finance markets page');
    return [];
  } catch (error) {
    console.error('Error scraping market indices from Yahoo Finance markets page:', error);
    toast.error('Failed to load market indices from Yahoo Finance');
    return [];
  }
};

// Extract market indices from Yahoo Finance HTML
const extractYahooMarketsDataFromHTML = (html: string): YahooMarketIndex[] => {
  try {
    const indices: YahooMarketIndex[] = [];
    
    // Look for market indices
    // Main indices are in the first quoteContainer
    const quoteContainerRegex = /<div[^>]*id="quoteContainer"[^>]*>[\s\S]*?<\/div>/gi;
    const quoteContainers = html.match(quoteContainerRegex);
    
    if (!quoteContainers || quoteContainers.length === 0) {
      console.warn('Could not find market indices in Yahoo Finance markets page HTML');
      return [];
    }
    
    // Process each possible index table (there are multiple quote containers)
    quoteContainers.forEach(container => {
      // Find table rows within the container
      const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
      const rows = container.match(rowRegex);
      
      if (!rows || rows.length === 0) {
        return;
      }
      
      // Process each row to extract market index data
      rows.forEach(row => {
        // Skip header rows
        if (row.includes('<th') || row.includes('thead')) {
          return;
        }
        
        try {
          // Extract symbol
          const symbolRegex = /<a[^>]*data-symbol="([^"]*)"[^>]*>/i;
          const symbolMatch = row.match(symbolRegex);
          const symbol = symbolMatch ? symbolMatch[1] : '';
          
          // Extract name
          const nameRegex = /<td[^>]*class="[^"]*Va\(m\)[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i;
          const nameMatch = row.match(nameRegex);
          let name = nameMatch ? nameMatch[1].trim() : '';
          
          // Clean up name
          name = name.replace(/<[^>]*>/g, '').trim();
          
          // Extract value (price)
          const valueRegex = /<fin-streamer[^>]*value="([^"]*)"[^>]*data-field="regularMarketPrice"[^>]*>/i;
          const valueMatch = row.match(valueRegex);
          const value = valueMatch ? parseFloat(valueMatch[1]) : NaN;
          
          // Extract change
          const changeRegex = /<fin-streamer[^>]*value="([^"]*)"[^>]*data-field="regularMarketChange"[^>]*>/i;
          const changeMatch = row.match(changeRegex);
          const change = changeMatch ? parseFloat(changeMatch[1]) : NaN;
          
          // Extract change percent
          const changePercentRegex = /<fin-streamer[^>]*value="([^"]*)"[^>]*data-field="regularMarketChangePercent"[^>]*>/i;
          const changePercentMatch = row.match(changePercentRegex);
          const changePercent = changePercentMatch ? parseFloat(changePercentMatch[1]) : NaN;
          
          // Only add valid entries
          if (symbol && name && !isNaN(value)) {
            indices.push({
              symbol,
              name,
              value,
              change: !isNaN(change) ? change : 0,
              changePercent: !isNaN(changePercent) ? changePercent : 0,
              lastUpdated: new Date()
            });
          }
        } catch (rowError) {
          console.warn('Error processing market index row:', rowError);
        }
      });
    });
    
    // Filter for common indices we care about
    // Map Yahoo names/symbols to our standardized names
    const indexMap: Record<string, string> = {
      '^GSPC': 'S&P 500',
      '^DJI': 'DOW',
      '^IXIC': 'NASDAQ',
      '^RUT': 'RUSSELL',
      '^VIX': 'VIX'
    };
    
    // Filter indices to only include ones we care about
    const filteredIndices = indices.filter(index => Object.keys(indexMap).includes(index.symbol));
    
    // Standardize names
    return filteredIndices.map(index => ({
      ...index,
      name: indexMap[index.symbol] || index.name
    }));
  } catch (error) {
    console.error('Error extracting market indices data from Yahoo Finance HTML:', error);
    return [];
  }
};
