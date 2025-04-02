
import { toast } from "sonner";
import { applyProxy, findWorkingProxy } from "./corsProxyService";

interface VIXCurrentData {
  value: string;
  change: string;
  changePercent: string;
}

export interface VIXHistoricalDataPoint {
  date: string;
  value: number;
}

export interface VIXFuturesDataPoint {
  month: string;
  value: number;
}

const VIX_URL = 'http://vixcentral.com';

// Helper function to fetch with CORS proxy
const fetchWithProxy = async (url: string): Promise<Response> => {
  try {
    // Try with current proxy first
    const proxiedUrl = applyProxy(url);
    console.log('Fetching with proxy:', proxiedUrl);
    
    const response = await fetch(proxiedUrl);
    if (response.ok) {
      return response;
    }
    
    // If current proxy fails, find a working one
    console.log('Current proxy failed, finding a working proxy...');
    const workingProxy = await findWorkingProxy(url);
    
    if (workingProxy) {
      console.log('Found working proxy:', workingProxy);
      const newProxiedUrl = `${workingProxy}${url}`;
      return await fetch(newProxiedUrl);
    }
    
    throw new Error('No working CORS proxy found');
  } catch (error) {
    console.error('Error fetching with proxy:', error);
    throw error;
  }
};

// Scrape current VIX data from vixcentral.com
export const scrapeCurrentVIX = async (): Promise<VIXCurrentData | null> => {
  try {
    console.log('Scraping current VIX data from vixcentral.com');
    const response = await fetchWithProxy(VIX_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vixcentral.com: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract VIX current value using regex
    const vixValueMatch = html.match(/<span id="vix">([\d.]+)<\/span>/);
    const vixValue = vixValueMatch ? vixValueMatch[1] : null;
    
    // Extract VIX change using regex
    const vixChangeMatch = html.match(/<span class="(green|red)">([-+][\d.]+)<\/span>/);
    const vixChange = vixChangeMatch ? vixChangeMatch[2] : null;
    
    // Extract VIX change percent using regex
    const vixChangePercentMatch = html.match(/<span class="(green|red)">\(([-+][\d.]+)%\)<\/span>/);
    const vixChangePercent = vixChangePercentMatch ? vixChangePercentMatch[2] : null;
    
    if (vixValue && vixChange && vixChangePercent) {
      return {
        value: vixValue,
        change: vixChange,
        changePercent: vixChangePercent,
      };
    } else {
      console.warn('Failed to extract VIX data from HTML');
      return null;
    }
  } catch (error) {
    console.error('Error scraping VIX data:', error);
    return null;
  }
};

// Scrape historical VIX data from vixcentral.com
export const scrapeHistoricalVIX = async (): Promise<VIXHistoricalDataPoint[]> => {
  try {
    console.log('Scraping historical VIX data from vixcentral.com');
    const response = await fetchWithProxy(VIX_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vixcentral.com: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Look for the historical data in the page
    // This is highly dependent on the structure of vixcentral.com
    // The data might be in a script tag or table
    // For example, if it's in a script tag that defines a variable:
    const historyDataRegex = /var chartData = (\[.*?\]);/s;
    const historyMatch = html.match(historyDataRegex);
    
    if (historyMatch && historyMatch[1]) {
      try {
        // Try to parse the JSON data
        const rawData = JSON.parse(historyMatch[1]);
        
        // Transform the data to our format (this will need adjustment based on actual structure)
        // Assuming the data is an array of objects with date and value properties
        return rawData.map((item: any) => ({
          date: item.date || new Date(item.x).toISOString().split('T')[0],
          value: typeof item.value === 'number' ? item.value : parseFloat(item.y)
        }));
      } catch (parseError) {
        console.error('Error parsing historical VIX data:', parseError);
        return [];
      }
    }
    
    // If we can't find the data in expected format, fallback to a simple extraction
    // Look for a table with historical data
    const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
    if (tableMatches && tableMatches.length > 0) {
      const historicalData: VIXHistoricalDataPoint[] = [];
      
      // Process each table to find one with dates and VIX values
      for (const tableHtml of tableMatches) {
        const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
        if (rowMatches && rowMatches.length > 1) {
          for (const rowHtml of rowMatches.slice(1)) { // Skip header row
            const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            if (cellMatches && cellMatches.length >= 2) {
              // Extract date from first cell and value from second
              const dateMatch = cellMatches[0].match(/>([^<]+)</);
              const valueMatch = cellMatches[1].match(/>([^<]+)</);
              
              if (dateMatch && valueMatch) {
                const dateStr = dateMatch[1].trim();
                const valueStr = valueMatch[1].trim();
                
                try {
                  const date = new Date(dateStr).toISOString().split('T')[0];
                  const value = parseFloat(valueStr);
                  
                  if (!isNaN(value)) {
                    historicalData.push({ date, value });
                  }
                } catch (e) {
                  // Skip invalid entries
                }
              }
            }
          }
          
          // If we found some data, return it
          if (historicalData.length > 0) {
            return historicalData;
          }
        }
      }
    }
    
    console.warn('Failed to extract historical VIX data, returning empty array');
    // Return empty array if we couldn't extract the data
    return [];
  } catch (error) {
    console.error('Error scraping historical VIX data:', error);
    toast.error('Failed to load historical VIX data');
    return [];
  }
};

// Scrape VIX futures curve data from vixcentral.com
export const scrapeVIXFutures = async (): Promise<VIXFuturesDataPoint[]> => {
  try {
    console.log('Scraping VIX futures data from vixcentral.com');
    const response = await fetchWithProxy(VIX_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vixcentral.com: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Look for the futures data in the page
    // Example regex to find data in a table or script
    const futuresDataRegex = /<table[^>]*id="futures"[^>]*>([\s\S]*?)<\/table>/i;
    const futuresMatch = html.match(futuresDataRegex);
    
    if (futuresMatch && futuresMatch[1]) {
      const tableHtml = futuresMatch[1];
      const rows = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      if (rows && rows.length > 1) { // Skip header row
        const futuresData: VIXFuturesDataPoint[] = [];
        
        // First, find month names from header row
        const headerRow = rows[0];
        const monthCells = headerRow.match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
        const months: string[] = [];
        
        if (monthCells) {
          for (const cell of monthCells) {
            const monthMatch = cell.match(/>([^<]+)</);
            if (monthMatch) {
              months.push(monthMatch[1].trim());
            }
          }
        }
        
        // Then get values from the first data row (assuming it contains the futures values)
        if (months.length > 0 && rows.length > 1) {
          const dataRow = rows[1];
          const valueCells = dataRow.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
          
          if (valueCells) {
            for (let i = 0; i < Math.min(months.length, valueCells.length); i++) {
              const valueMatch = valueCells[i].match(/>([^<]+)</);
              if (valueMatch) {
                const valueStr = valueMatch[1].trim();
                const value = parseFloat(valueStr);
                
                if (!isNaN(value)) {
                  futuresData.push({
                    month: months[i],
                    value
                  });
                }
              }
            }
          }
        }
        
        if (futuresData.length > 0) {
          // Add current month as the first entry if it's not already there
          if (!futuresData.some(d => d.month === 'Current')) {
            const currentVIXMatch = html.match(/<span id="vix">([\d.]+)<\/span>/);
            if (currentVIXMatch) {
              const currentVIX = parseFloat(currentVIXMatch[1]);
              futuresData.unshift({
                month: 'Current',
                value: currentVIX
              });
            }
          }
          return futuresData;
        }
      }
    }
    
    // Alternative approach if we can't find the data in a table
    // Try to find data in a JS variable in a script tag
    const scriptDataRegex = /var futuresData = (\[.*?\]);/s;
    const scriptMatch = html.match(scriptDataRegex);
    
    if (scriptMatch && scriptMatch[1]) {
      try {
        const rawData = JSON.parse(scriptMatch[1]);
        
        return rawData.map((item: any) => ({
          month: item.month || item.name,
          value: typeof item.value === 'number' ? item.value : parseFloat(item.y)
        }));
      } catch (parseError) {
        console.error('Error parsing VIX futures data:', parseError);
      }
    }
    
    console.warn('Failed to extract VIX futures data, returning empty array');
    return [];
  } catch (error) {
    console.error('Error scraping VIX futures data:', error);
    toast.error('Failed to load VIX futures data');
    return [];
  }
};
