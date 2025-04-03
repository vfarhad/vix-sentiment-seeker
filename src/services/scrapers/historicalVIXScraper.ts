
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
      console.error(`Failed to fetch vixcentral.com: ${response.status}`);
      throw new Error(`Failed to fetch vixcentral.com: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Attempt multiple strategies to find historical data
    // Strategy 1: Look for JSON data in script tags
    const scriptDataPatterns = [
      /var\s+historicalVixData\s*=\s*(\[.*?\]);/s,
      /var\s+chartData\s*=\s*(\[.*?\]);/s,
      /var\s+vixHistoricalData\s*=\s*(\[.*?\]);/s,
      /historicalData\s*:\s*(\[.*?\])/s
    ];
    
    for (const pattern of scriptDataPatterns) {
      const dataMatch = html.match(pattern);
      if (dataMatch && dataMatch[1]) {
        try {
          const rawData = JSON.parse(dataMatch[1].replace(/'/g, '"'));
          console.log('Found historical data in script tag, sample:', rawData.slice(0, 2));
          
          return rawData.map((item: any) => ({
            date: item.date || new Date(item.x || item.time || item.timestamp).toISOString().split('T')[0],
            value: typeof item.value === 'number' ? item.value : parseFloat(item.y || item.close || item.vix)
          }));
        } catch (parseError) {
          console.error('Error parsing script data:', parseError);
          // Continue to next strategy
        }
      }
    }
    
    // Strategy 2: Look for table data
    console.log('Looking for historical VIX data in tables');
    const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
    
    if (tableMatches && tableMatches.length > 0) {
      for (const tableHtml of tableMatches) {
        // Skip tables that are clearly not historical data
        if (tableHtml.includes('futures') || tableHtml.includes('Futures')) {
          continue;
        }
        
        const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
        
        if (rowMatches && rowMatches.length > 5) { // Need enough rows to be historical data
          const historicalData: VIXHistoricalDataPoint[] = [];
          
          // Check header to see if this looks like historical data
          const headerRow = rowMatches[0];
          if (!headerRow.includes('Date') && !headerRow.includes('Time') && !headerRow.includes('VIX')) {
            continue;
          }
          
          // Process each row to extract date and value
          for (let i = 1; i < rowMatches.length; i++) {
            const cellMatches = rowMatches[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            
            if (cellMatches && cellMatches.length >= 2) {
              const dateCell = cellMatches[0].replace(/<[^>]+>/g, '').trim();
              let valueCell = '';
              
              // Find the cell that contains VIX value
              for (let j = 1; j < cellMatches.length; j++) {
                const cellText = cellMatches[j].replace(/<[^>]+>/g, '').trim();
                if (/^\d+\.\d+$/.test(cellText)) {
                  valueCell = cellText;
                  break;
                }
              }
              
              if (dateCell && valueCell) {
                try {
                  const date = new Date(dateCell).toISOString().split('T')[0];
                  const value = parseFloat(valueCell);
                  
                  if (!isNaN(value)) {
                    historicalData.push({ date, value });
                  }
                } catch (e) {
                  // Skip invalid entries
                }
              }
            }
          }
          
          if (historicalData.length > 10) { // Need enough entries to be valid
            console.log('Found historical VIX data in table, sample:', historicalData.slice(0, 2));
            return historicalData;
          }
        }
      }
    }
    
    console.log('Could not find historical VIX data, generating mock data');
    return generateRealisticMockData();
  } catch (error) {
    console.error('Error scraping historical VIX data:', error);
    toast.error('Failed to fetch VIX data from source, using sample data');
    return generateRealisticMockData();
  }
};

// Generate realistic VIX mock data with proper volatility patterns
const generateRealisticMockData = (): VIXHistoricalDataPoint[] => {
  const mockData: VIXHistoricalDataPoint[] = [];
  const today = new Date();
  
  // Start with a base VIX value (typical range 15-20)
  let baseValue = 18;
  let currentValue = baseValue;
  
  // Generate 30 days of data with realistic patterns
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Apply different patterns for different date ranges to simulate market regimes
    let volatilityMultiplier = 1.0;
    
    // Create a regime shift around day 15
    if (i < 15 && i > 10) {
      // Increasing volatility period
      volatilityMultiplier = 1.5;
    } else if (i <= 10 && i > 5) {
      // High volatility period
      volatilityMultiplier = 2.0;
    } else if (i <= 5) {
      // Decreasing volatility period
      volatilityMultiplier = 1.2;
    }
    
    // Calculate daily change with mean reversion
    const meanReversionFactor = (baseValue - currentValue) * 0.1;
    const randomChange = (Math.random() * 2 - 1) * volatilityMultiplier;
    const dailyChange = randomChange + meanReversionFactor;
    
    // Create occasional spikes (about 10% chance)
    const spikeChance = Math.random();
    if (spikeChance > 0.9) {
      currentValue += (Math.random() * 4 + 2) * Math.sign(dailyChange);
    } else {
      currentValue += dailyChange;
    }
    
    // Ensure VIX stays in a realistic range (10-40)
    currentValue = Math.max(10, Math.min(40, currentValue));
    
    mockData.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(currentValue.toFixed(2))
    });
  }
  
  console.log('Generated realistic mock VIX data:', mockData.slice(0, 3));
  return mockData;
};
