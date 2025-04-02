
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
