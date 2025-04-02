
// Export all scrapers from a single file for backward compatibility
export { scrapeCurrentVIX } from './scrapers/currentVIXScraper';
export { scrapeHistoricalVIX } from './scrapers/historicalVIXScraper';
export { scrapeVIXFutures } from './scrapers/vixFuturesScraper';

// Re-export types
export type { VIXHistoricalDataPoint } from './scrapers/historicalVIXScraper';
export type { VIXFuturesDataPoint } from './scrapers/vixFuturesScraper';
