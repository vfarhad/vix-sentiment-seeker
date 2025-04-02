
import { toast } from "sonner";
import { fetchWithProxy, VIX_URL } from "./baseScraperUtils";

export interface VIXHistoricalDataPoint {
  date: string;
  value: number;
}

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
