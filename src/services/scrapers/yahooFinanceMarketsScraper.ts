
import { fetchWithProxy } from "./baseScraperUtils";
import { toast } from "sonner";

export interface YahooMarketIndex {
  symbol: string;
  name: string;
  value: number | string;
  change: number | string;
  changePercent: number | string;
  lastUpdated: Date;
}

// URL for Yahoo Finance markets page
const YAHOO_MARKETS_URL = 'https://finance.yahoo.com/markets/';
const YAHOO_QUOTE_URL = 'https://finance.yahoo.com/quote/';

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
    
    console.warn('Failed to extract market indices from Yahoo Finance markets page HTML');
    
    // Try an alternative approach: fetch individual index pages
    console.log('Trying to fetch individual index pages instead');
    return await scrapeIndividualIndices();
  } catch (error) {
    console.error('Error scraping market indices from Yahoo Finance markets page:', error);
    
    // Try an alternative approach as fallback
    try {
      console.log('Trying individual indices as fallback...');
      return await scrapeIndividualIndices();
    } catch (fallbackError) {
      console.error('Fallback indices scraping also failed:', fallbackError);
      toast.error('Failed to load market indices from Yahoo Finance');
      return [];
    }
  }
};

// Backup strategy: scrape each major index individually
const scrapeIndividualIndices = async (): Promise<YahooMarketIndex[]> => {
  const indices = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'DOW' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^RUT', name: 'RUSSELL' },
    { symbol: '^VIX', name: 'VIX' }
  ];
  
  const results: YahooMarketIndex[] = [];
  
  for (const index of indices) {
    try {
      // Add a small delay between requests to prevent rate limiting
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const url = `${YAHOO_QUOTE_URL}${index.symbol}`;
      const response = await fetchWithProxy(url);
      const html = await response.text();
      
      const indexData = extractSingleIndexData(html, index.symbol, index.name);
      if (indexData) {
        results.push(indexData);
      }
    } catch (error) {
      console.error(`Error scraping ${index.name}:`, error);
    }
  }
  
  return results;
};

// Extract a single index from its quote page
const extractSingleIndexData = (html: string, symbol: string, name: string): YahooMarketIndex | null => {
  try {
    // Extract current price
    const priceRegex = /<fin-streamer[^>]*data-symbol="([^"]*)"[^>]*data-field="regularMarketPrice"[^>]*value="([^"]*)"[^>]*>/i;
    const priceMatch = html.match(priceRegex);
    const value = priceMatch ? parseFloat(priceMatch[2]) : NaN;
    
    // Extract change
    const changeRegex = /<fin-streamer[^>]*data-symbol="([^"]*)"[^>]*data-field="regularMarketChange"[^>]*value="([^"]*)"[^>]*>/i;
    const changeMatch = html.match(changeRegex);
    const change = changeMatch ? parseFloat(changeMatch[2]) : NaN;
    
    // Extract percent change
    const percentRegex = /<fin-streamer[^>]*data-symbol="([^"]*)"[^>]*data-field="regularMarketChangePercent"[^>]*value="([^"]*)"[^>]*>/i;
    const percentMatch = html.match(percentRegex);
    const changePercent = percentMatch ? parseFloat(percentMatch[2]) : NaN;
    
    if (!isNaN(value)) {
      return {
        symbol,
        name,
        value,
        change: !isNaN(change) ? change : 0,
        changePercent: !isNaN(changePercent) ? changePercent : 0,
        lastUpdated: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting data for ${name}:`, error);
    return null;
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
      // Alternative approach: look for quotes in the market summary
      const marketSummaryRegex = /<div[^>]*id="market-summary-wrapper"[^>]*>[\s\S]*?<\/div>/gi;
      const marketSummary = html.match(marketSummaryRegex);
      
      if (!marketSummary || marketSummary.length === 0) {
        console.warn('Could not find market indices in Yahoo Finance markets page HTML');
        return [];
      }
      
      // Look for quote rows
      const rowRegex = /<tr[^>]*data-reactid[^>]*>[\s\S]*?<\/tr>/gi;
      const rows = marketSummary[0].match(rowRegex);
      
      if (!rows || rows.length === 0) {
        return [];
      }
      
      // Process each row
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
    
    // If we didn't find our target indices, check for similar ones
    if (filteredIndices.length === 0) {
      // Try to find indices by name substring match
      const indexNameMap: Record<string, string> = {
        'S&P 500': 'S&P 500',
        'S&P': 'S&P 500',
        'Dow 30': 'DOW',
        'Dow': 'DOW',
        'Nasdaq': 'NASDAQ',
        'Russell': 'RUSSELL',
        'VIX': 'VIX'
      };
      
      indices.forEach(index => {
        for (const [substring, standardName] of Object.entries(indexNameMap)) {
          if (index.name.includes(substring) && !filteredIndices.some(i => i.name === standardName)) {
            filteredIndices.push({
              ...index,
              name: standardName
            });
            break;
          }
        }
      });
    }
    
    // Standardize names for filtered indices
    return filteredIndices.map(index => ({
      ...index,
      name: indexMap[index.symbol] || index.name
    }));
  } catch (error) {
    console.error('Error extracting market indices data from Yahoo Finance HTML:', error);
    return [];
  }
};
