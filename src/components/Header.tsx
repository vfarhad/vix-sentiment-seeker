
import React from 'react';
import { ChartCandlestick } from 'lucide-react';
import { marketSentiment } from '@/lib/mockData';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketIndices } from '@/services/marketDataService';

const Header = () => {
  // Fetch market data to get real-time VIX
  const { data: marketIndices, isLoading } = useQuery({
    queryKey: ['marketIndices'],
    queryFn: fetchMarketIndices,
    refetchInterval: 60000, // Refetch every minute
  });

  // Find VIX in the market indices data
  const vixData = marketIndices?.find(index => index.name === 'VIX');
  
  // Display real VIX data if available, otherwise use mock data
  const vixValue = vixData?.value || marketSentiment.vixValue;
  const vixChange = vixData?.change || marketSentiment.vixChange.toString();
  const vixChangePercent = vixData?.changePercent || `${marketSentiment.vixChangePercent}%`;
  const isPositive = !vixChange.startsWith('-');

  return (
    <header className="bg-card py-4 px-6 flex justify-between items-center border-b border-border">
      <div className="flex items-center gap-2">
        <ChartCandlestick className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">VIX Sentiment Seeker</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">VIX: </div>
        <div className="text-lg font-semibold">{vixValue}</div>
        <div className={`text-sm ${isPositive ? 'text-positive' : 'text-negative'}`}>
          {vixChange} ({vixChangePercent})
        </div>
      </div>
    </header>
  );
};

export default Header;
