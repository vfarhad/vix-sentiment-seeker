
// Export all scrapers for easy imports
export { scrapeCurrentVIX } from './currentVIXScraper';
export { scrapeHistoricalVIX } from './historicalVIXScraper';
export { scrapeVIXFutures } from './vixFuturesScraper';
export { scrapeYahooSP500Historical } from './yahooFinanceScraper';

// Re-export types
export type { VIXHistoricalDataPoint } from './historicalVIXScraper';
export type { VIXFuturesDataPoint } from './vixFuturesScraper';
export type { YahooFinanceDataPoint } from './yahooFinanceScraper';
