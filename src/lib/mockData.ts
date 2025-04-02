
// Mock data for VIX chart
export const vixHistoricalData = [
  { date: '2023-01-01', value: 22.05 },
  { date: '2023-01-02', value: 20.87 },
  { date: '2023-01-03', value: 21.32 },
  { date: '2023-01-04', value: 19.85 },
  { date: '2023-01-05', value: 18.49 },
  { date: '2023-01-06', value: 17.92 },
  { date: '2023-01-07', value: 19.21 },
  { date: '2023-01-08', value: 20.65 },
  { date: '2023-01-09', value: 22.77 },
  { date: '2023-01-10', value: 24.31 },
  { date: '2023-01-11', value: 23.85 },
  { date: '2023-01-12', value: 21.72 },
  { date: '2023-01-13', value: 19.40 },
  { date: '2023-01-14', value: 18.78 },
  { date: '2023-01-15', value: 18.26 },
  { date: '2023-01-16', value: 19.54 },
  { date: '2023-01-17', value: 20.12 },
  { date: '2023-01-18', value: 21.60 },
  { date: '2023-01-19', value: 20.56 },
  { date: '2023-01-20', value: 19.87 },
  { date: '2023-01-21', value: 20.14 },
  { date: '2023-01-22', value: 21.43 },
  { date: '2023-01-23', value: 23.76 },
  { date: '2023-01-24', value: 25.19 },
  { date: '2023-01-25', value: 26.32 },
  { date: '2023-01-26', value: 24.85 },
  { date: '2023-01-27', value: 22.63 },
  { date: '2023-01-28', value: 20.19 },
  { date: '2023-01-29', value: 18.76 },
  { date: '2023-01-30', value: 17.95 },
];

// Market sentiment data
export const marketSentiment = {
  current: 'bearish',
  previous: 'neutral',
  strength: 'moderate',
  vixValue: 24.85,
  vixChange: 1.09,
  vixChangePercent: 4.58,
};

// Major market indices data
export const marketIndices = [
  {
    name: 'DOW',
    value: '38,623.64',
    change: '-118.04',
    changePercent: '-0.31%'
  },
  {
    name: 'S&P 500',
    value: '5,274.38',
    change: '-14.61',
    changePercent: '-0.28%'
  },
  {
    name: 'NASDAQ',
    value: '16,384.47',
    change: '-58.16',
    changePercent: '-0.35%'
  },
  {
    name: 'RUSSELL',
    value: '2,058.72',
    change: '-5.11',
    changePercent: '-0.25%'
  },
  {
    name: 'VIX',
    value: '24.85',
    change: '+1.09',
    changePercent: '+4.58%'
  },
];

// VIX stats
export const vixStatistics = [
  { label: 'Current', value: '24.85', change: '+1.09', sentiment: 'bearish' },
  { label: '30-Day Avg', value: '21.36', isAverage: true },
  { label: '52-Week High', value: '36.64', date: 'Mar 15, 2023' },
  { label: '52-Week Low', value: '13.41', date: 'July 5, 2023' },
];

// Market headlines for sentiment context
export const marketHeadlines = [
  {
    title: 'Fed signals potential rate hike in upcoming meeting',
    source: 'Financial Times',
    sentiment: 'bearish',
    timestamp: '2h ago',
  },
  {
    title: 'Tech sector shows resilience despite broader market decline',
    source: 'Wall Street Journal',
    sentiment: 'neutral',
    timestamp: '4h ago',
  },
  {
    title: 'Oil prices drop amid supply concerns',
    source: 'Bloomberg',
    sentiment: 'bearish',
    timestamp: '6h ago',
  },
  {
    title: 'Consumer confidence index exceeds expectations',
    source: 'CNBC',
    sentiment: 'bullish',
    timestamp: '8h ago',
  },
];

// VIX Futures data (new)
export const vixFuturesData = [
  { month: 'Current', value: 24.85 },
  { month: 'Month 1', value: 25.63 },
  { month: 'Month 2', value: 26.12 },
  { month: 'Month 3', value: 25.87 },
  { month: 'Month 4', value: 25.42 },
  { month: 'Month 5', value: 24.96 },
  { month: 'Month 6', value: 24.58 },
];
