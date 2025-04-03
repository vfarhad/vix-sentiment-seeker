
import { MarketIndex } from '@/types/marketData';
import { fetchWithProxy } from './baseScraperUtils';
import { toast } from 'sonner';

// Base URL for investing.com markets page
const INVESTING_MARKETS_URL = 'https://www.investing.com/indices/';

/**
 * Scrapes market indices data from investing.com
 * Returns array of market indices with name, value, change, and percent change
 */
export const scrapeInvestingMarkets = async (): Promise<MarketIndex[]> => {
  try {
    console.log('Scraping market indices from investing.com');
    
    // Fetch the markets page HTML
    const response = await fetchWithProxy(INVESTING_MARKETS_URL);
    const html = await response.text();
    
    // Extract market data from HTML
    const markets = extractMarketData(html);
    
    if (markets && markets.length > 0) {
      console.log(`Successfully scraped ${markets.length} market indices from investing.com`);
      return markets;
    }
    
    // If main market page scraping fails, try scraping individual indices
    console.log('Main page scraping failed, trying individual indices');
    return await scrapeIndividualIndices();
  } catch (error) {
    console.error('Error scraping investing.com markets:', error);
    return [];
  }
};

/**
 * Extract market data from investing.com HTML
 */
const extractMarketData = (html: string): MarketIndex[] => {
  try {
    // Target the main indices table
    const tableRegex = /<table[^>]*id="cross_rate_markets_indices_1"[^>]*>[\s\S]*?<\/table>/i;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      console.warn('Could not find indices table in investing.com HTML');
      return [];
    }
    
    const tableHtml = tableMatch[0];
    const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    
    if (!rows || rows.length <= 1) {
      console.warn('Could not find rows in investing.com indices table');
      return [];
    }
    
    const indices: MarketIndex[] = [];
    
    // Map of index names we're interested in
    const indexMap: Record<string, string> = {
      'S&P 500': 'S&P 500',
      'Dow Jones': 'DOW',
      'Nasdaq': 'NASDAQ',
      'Russell 2000': 'RUSSELL',
      'CBOE Volatility Index': 'VIX',
      'S&P 500 VIX': 'VIX',
      'VIX': 'VIX'
    };
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Extract name
      const nameMatch = row.match(/<td[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i);
      
      if (!nameMatch) continue;
      
      const fullName = nameMatch[1].trim();
      
      // Only process indices we're interested in
      let shortName = null;
      for (const [key, value] of Object.entries(indexMap)) {
        if (fullName.includes(key)) {
          shortName = value;
          break;
        }
      }
      
      if (!shortName) continue;
      
      // Extract current value
      const valueMatch = row.match(/<td[^>]*class="[^"]*pid-[^"]*-last[^"]*"[^>]*>\s*([0-9,.]+)\s*<\/td>/i);
      if (!valueMatch) continue;
      
      // Extract change
      const changeMatch = row.match(/<td[^>]*class="[^"]*pid-[^"]*-change[^"]*"[^>]*>\s*([+-]?[0-9,.]+)\s*<\/td>/i);
      if (!changeMatch) continue;
      
      // Extract percent change
      const percentMatch = row.match(/<td[^>]*class="[^"]*pid-[^"]*-pcp[^"]*"[^>]*>\s*([+-]?[0-9,.]+)%\s*<\/td>/i);
      if (!percentMatch) continue;
      
      const value = valueMatch[1].replace(/,/g, '');
      const change = changeMatch[1].replace(/,/g, '');
      const percentChange = percentMatch[1].replace(/,/g, '');
      
      indices.push({
        name: shortName,
        value: shortName === 'VIX' ? parseFloat(value).toFixed(2) : parseFloat(value).toLocaleString(),
        change: change,
        changePercent: `${percentChange}%`
      });
    }
    
    return indices;
  } catch (error) {
    console.error('Error extracting market data from investing.com HTML:', error);
    return [];
  }
};

/**
 * Fallback method to scrape individual index pages when main market page fails
 */
const scrapeIndividualIndices = async (): Promise<MarketIndex[]> => {
  const indices: MarketIndex[] = [];
  const indexUrls = [
    { url: 'https://www.investing.com/indices/us-spx-500', name: 'S&P 500' },
    { url: 'https://www.investing.com/indices/us-30', name: 'DOW' },
    { url: 'https://www.investing.com/indices/nasdaq-composite', name: 'NASDAQ' },
    { url: 'https://www.investing.com/indices/smallcap-2000', name: 'RUSSELL' },
    { url: 'https://www.investing.com/indices/volatility-s-p-500', name: 'VIX' }
  ];
  
  for (const index of indexUrls) {
    try {
      const response = await fetchWithProxy(index.url);
      const html = await response.text();
      
      // Extract the last price, change, and percent change
      const lastPriceMatch = html.match(/<span[^>]*class="[^"]*instrument-price-last[^"]*"[^>]*>([0-9,.]+)<\/span>/i);
      const changeMatch = html.match(/<span[^>]*class="[^"]*instrument-price-change[^"]*"[^>]*>([+-]?[0-9,.]+)<\/span>/i);
      const percentMatch = html.match(/<span[^>]*class="[^"]*instrument-price-change-percent[^"]*"[^>]*>\([+-]?([0-9,.]+)%\)<\/span>/i);
      
      if (lastPriceMatch && changeMatch && percentMatch) {
        const value = lastPriceMatch[1].replace(/,/g, '');
        const change = changeMatch[1].replace(/,/g, '');
        const percentChange = percentMatch[1].replace(/,/g, '');
        
        indices.push({
          name: index.name,
          value: index.name === 'VIX' ? parseFloat(value).toFixed(2) : parseFloat(value).toLocaleString(),
          change: change,
          changePercent: `${percentChange}%`
        });
      }
    } catch (error) {
      console.error(`Error scraping ${index.name} from investing.com:`, error);
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return indices;
};
