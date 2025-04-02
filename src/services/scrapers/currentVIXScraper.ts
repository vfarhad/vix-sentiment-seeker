
import { fetchWithProxy, VIX_URL } from "./baseScraperUtils";

export interface VIXCurrentData {
  value: string;
  change: string;
  changePercent: string;
}

// Scrape current VIX data from vixcentral.com
export const scrapeCurrentVIX = async (): Promise<VIXCurrentData | null> => {
  try {
    console.log('Scraping current VIX data from vixcentral.com');
    const response = await fetchWithProxy(VIX_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vixcentral.com: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Updated regex patterns to match the current structure of vixcentral.com
    // Extract VIX current value - look for multiple possible patterns
    const vixValuePatterns = [
      /<span id="vix">([\d.]+)<\/span>/,
      /<div[^>]*class="[^"]*vix-value[^"]*"[^>]*>([\d.]+)<\/div>/i,
      /<td[^>]*>([\d.]+)<\/td>.*?<td[^>]*>VIX<\/td>/i,
      /<div[^>]*id="vixContainer"[^>]*>.*?<div[^>]*>([\d.]+)<\/div>/i
    ];
    
    let vixValue = null;
    for (const pattern of vixValuePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        vixValue = match[1];
        break;
      }
    }
    
    // Extract VIX change - look for multiple possible patterns
    const vixChangePatterns = [
      /<span class="(green|red)">([-+][\d.]+)<\/span>/,
      /<div[^>]*class="[^"]*(green|red)[^"]*"[^>]*>([-+][\d.]+)<\/div>/i,
      /<td[^>]*>([-+][\d.]+)<\/td>.*?<td[^>]*>Change<\/td>/i
    ];
    
    let vixChange = null;
    for (const pattern of vixChangePatterns) {
      const match = html.match(pattern);
      if (match && match[2]) {
        vixChange = match[2];
        break;
      }
    }
    
    // Extract VIX change percent - look for multiple possible patterns
    const vixChangePercentPatterns = [
      /<span class="(green|red)">\(([-+][\d.]+)%\)<\/span>/,
      /<div[^>]*class="[^"]*(green|red)[^"]*"[^>]*>\(([-+][\d.]+)%\)<\/div>/i,
      /<div[^>]*class="[^"]*(green|red)[^"]*"[^>]*>([-+][\d.]+)%<\/div>/i,
      /<td[^>]*>([-+][\d.]+)%<\/td>.*?<td[^>]*>Change %<\/td>/i
    ];
    
    let vixChangePercent = null;
    for (const pattern of vixChangePercentPatterns) {
      const match = html.match(pattern);
      if (match && match[2]) {
        vixChangePercent = match[2];
        break;
      }
    }
    
    // Try alternate extraction method if regex approach fails
    if (!vixValue || !vixChange || !vixChangePercent) {
      console.log('Trying alternate extraction method for VIX data');
      
      // Look for a table that might contain VIX data
      const tableRows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      if (tableRows) {
        for (const row of tableRows) {
          if (row.includes('VIX') || row.includes('Spot VIX')) {
            const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            if (cells && cells.length >= 3) {
              // Extract text content from cells
              const cellContents = cells.map(cell => {
                const content = cell.replace(/<[^>]+>/g, '').trim();
                return content;
              });
              
              // Look for numeric values in the cells
              for (let i = 0; i < cellContents.length; i++) {
                const content = cellContents[i];
                if (!vixValue && /^\d+\.\d+$/.test(content)) {
                  vixValue = content;
                } else if (!vixChange && /^[-+]\d+\.\d+$/.test(content)) {
                  vixChange = content;
                } else if (!vixChangePercent && /^[-+]?\d+\.\d+%$/.test(content)) {
                  vixChangePercent = content.replace('%', '');
                }
              }
            }
          }
        }
      }
    }
    
    if (vixValue && vixChange && vixChangePercent) {
      console.log('Successfully extracted VIX data:', { vixValue, vixChange, vixChangePercent });
      return {
        value: vixValue,
        change: vixChange,
        changePercent: vixChangePercent.replace('%', '') // Remove % if present
      };
    } else {
      console.warn('Failed to extract VIX data from HTML. Found values:', { vixValue, vixChange, vixChangePercent });
      return null;
    }
  } catch (error) {
    console.error('Error scraping VIX data:', error);
    return null;
  }
};
