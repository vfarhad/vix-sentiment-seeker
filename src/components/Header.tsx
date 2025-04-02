
import React, { useState, useEffect } from 'react';
import { ChartCandlestick } from 'lucide-react';
import { marketSentiment } from '@/lib/mockData';
import { scrapeCurrentVIX } from '@/services/vixScraperService';

const Header = () => {
  const [vixData, setVixData] = useState({
    vixValue: marketSentiment.vixValue,
    vixChange: marketSentiment.vixChange,
    vixChangePercent: marketSentiment.vixChangePercent
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVIXData = async () => {
      try {
        const data = await scrapeCurrentVIX();
        if (data) {
          setVixData({
            vixValue: parseFloat(data.value),
            vixChange: parseFloat(data.change),
            vixChangePercent: parseFloat(data.changePercent)
          });
        }
      } catch (error) {
        console.error('Error fetching VIX data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVIXData();
    
    // Refresh VIX data every 2 minutes
    const intervalId = setInterval(fetchVIXData, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="bg-card py-4 px-6 flex justify-between items-center border-b border-border">
      <div className="flex items-center gap-2">
        <ChartCandlestick className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">VIX Sentiment Seeker</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">VIX: </div>
        {isLoading ? (
          <div className="text-lg font-semibold animate-pulse">{vixData.vixValue}</div>
        ) : (
          <>
            <div className="text-lg font-semibold">{vixData.vixValue}</div>
            <div className={`text-sm ${vixData.vixChange >= 0 ? 'text-positive' : 'text-negative'}`}>
              {vixData.vixChange >= 0 ? '+' : ''}{vixData.vixChange} ({vixData.vixChangePercent}%)
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
