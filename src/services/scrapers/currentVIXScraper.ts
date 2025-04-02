
import { fetchWithProxy, VIX_URL } from "./baseScraperUtils";

interface VIXCurrentData {
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
