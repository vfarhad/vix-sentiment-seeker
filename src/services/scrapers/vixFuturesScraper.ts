
import { toast } from "sonner";
import { fetchWithProxy, VIX_URL } from "./baseScraperUtils";

export interface VIXFuturesDataPoint {
  month: string;
  value: number;
}

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
