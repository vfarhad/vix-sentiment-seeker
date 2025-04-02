
export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
}

export interface MarketStatus {
  exchange: string;
  status: string;
  isOpen: boolean;
  holiday?: string;
  nextTradingDay?: string;
  session?: string;
}

export interface HistoricalData {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
  s: string;
}

export interface SearchResult {
  count: number;
  result: {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }[];
}

// Finnhub data structures (kept for reference)
export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface FinnhubMarketNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubSymbolLookup {
  count: number;
  result: {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }[];
}

// Financial Modeling Prep data structures
export interface FMPQuote {
  symbol: string;           // Symbol of the company
  name: string;             // Name of the company
  price: number;            // Current price
  changesPercentage: number; // Percentage change
  change: number;           // Price change
  dayLow: number;           // Day low
  dayHigh: number;          // Day high
  yearHigh: number;         // Year high
  yearLow: number;          // Year low
  marketCap: number;        // Market capitalization
  priceAvg50: number;       // Average price for 50 days
  priceAvg200: number;      // Average price for 200 days
  volume: number;           // Volume
  avgVolume: number;        // Average volume
  open: number;             // Open price
  previousClose: number;    // Previous close price
  eps: number;              // Earnings per share
  pe: number;               // Price-to-earnings ratio
  earningsAnnouncement: string; // Earnings announcement date
  sharesOutstanding: number; // Shares outstanding
  timestamp: number;        // Timestamp
}

export interface FMPHistoricalData {
  symbol: string;
  historical: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    adjClose: number;
    volume: number;
    unadjustedVolume: number;
    change: number;
    changePercent: number;
    vwap: number;
    label: string;
    changeOverTime: number;
  }[];
}
