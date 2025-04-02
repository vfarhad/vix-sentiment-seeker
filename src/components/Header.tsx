
import React from 'react';
import { ChartCandlestick } from 'lucide-react';
import { marketSentiment } from '@/lib/mockData';

const Header = () => {
  return (
    <header className="bg-card py-4 px-6 flex justify-between items-center border-b border-border">
      <div className="flex items-center gap-2">
        <ChartCandlestick className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">VIX Sentiment Seeker</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">VIX: </div>
        <div className="text-lg font-semibold">{marketSentiment.vixValue}</div>
        <div className={`text-sm ${marketSentiment.vixChange >= 0 ? 'text-positive' : 'text-negative'}`}>
          {marketSentiment.vixChange >= 0 ? '+' : ''}{marketSentiment.vixChange} ({marketSentiment.vixChangePercent}%)
        </div>
      </div>
    </header>
  );
};

export default Header;
