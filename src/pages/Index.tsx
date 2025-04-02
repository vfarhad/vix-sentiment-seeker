
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MarketBanner from '@/components/MarketBanner';
import VIXChart from '@/components/VIXChart';
import VIXFuturesChart from '@/components/VIXFuturesChart';
import SentimentIndicator from '@/components/SentimentIndicator';
import StatisticCard from '@/components/StatisticCard';
import MarketStatusBox from '@/components/MarketStatusBox';
import { vixHistoricalData, marketSentiment, vixStatistics, marketHeadlines } from '@/lib/mockData';
import { fetchMarketIndices, setupMarketDataPolling, MarketIndex } from '@/services/marketDataService';
import { scrapeHistoricalVIX, scrapeVIXFutures, VIXHistoricalDataPoint, VIXFuturesDataPoint } from '@/services/vixScraperService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const Index = () => {
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historicalVIXData, setHistoricalVIXData] = useState<VIXHistoricalDataPoint[]>([]);
  const [vixFuturesValues, setVIXFuturesValues] = useState<VIXFuturesDataPoint[]>([]);
  const [showVIXChart, setShowVIXChart] = useState(false);
  const [showVIXFutures, setShowVIXFutures] = useState(false);

  // Use react-query to fetch market data
  const { data, isError } = useQuery({
    queryKey: ['marketIndices'],
    queryFn: fetchMarketIndices,
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (data) {
      setMarketIndices(data);
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    // Fallback if react-query fails
    if (isError) {
      const cleanup = setupMarketDataPolling((newData) => {
        setMarketIndices(newData);
        setIsLoading(false);
      });
      
      return cleanup;
    }
  }, [isError]);

  // Fetch VIX historical data
  useEffect(() => {
    const fetchHistoricalVIX = async () => {
      try {
        const data = await scrapeHistoricalVIX();
        if (data && data.length > 0) {
          setHistoricalVIXData(data);
          setShowVIXChart(true);
          toast.success('VIX historical data loaded');
        } else {
          console.warn('No historical VIX data found');
          toast.error('Failed to load VIX historical data');
          setShowVIXChart(false);
        }
      } catch (error) {
        console.error('Error fetching historical VIX data:', error);
        toast.error('Failed to load VIX historical data');
        setShowVIXChart(false);
      }
    };

    fetchHistoricalVIX();
  }, []);

  // Fetch VIX futures data
  useEffect(() => {
    const fetchVIXFutures = async () => {
      try {
        const data = await scrapeVIXFutures();
        if (data && data.length > 0) {
          setVIXFuturesValues(data);
          setShowVIXFutures(true);
          toast.success('VIX futures data loaded');
        } else {
          console.warn('No VIX futures data found');
          toast.error('Failed to load VIX futures data');
          setShowVIXFutures(false);
        }
      } catch (error) {
        console.error('Error fetching VIX futures data:', error);
        toast.error('Failed to load VIX futures data');
        setShowVIXFutures(false);
      }
    };

    fetchVIXFutures();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <MarketBanner indices={marketIndices} isLoading={isLoading} />
      
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main chart area */}
          <div className="lg:col-span-2 space-y-6">
            {showVIXChart ? (
              <VIXChart data={historicalVIXData} />
            ) : (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Unable to load VIX historical data</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* VIX Futures Chart */}
            {showVIXFutures ? (
              <VIXFuturesChart data={vixFuturesValues} />
            ) : (
              <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Unable to load VIX futures data</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {vixStatistics.map((stat, index) => (
                <StatisticCard
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  change={stat.change}
                  sentiment={stat.sentiment as 'bullish' | 'bearish' | 'neutral' | undefined}
                  isAverage={stat.isAverage}
                  date={stat.date}
                />
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <SentimentIndicator 
              sentiment={marketSentiment.current as 'bullish' | 'bearish' | 'neutral'} 
              strength={marketSentiment.strength as 'strong' | 'moderate' | 'weak'} 
            />
            
            {/* Market headlines */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold mb-4">Market Headlines</h2>
              <div className="space-y-4">
                {marketHeadlines.map((headline, index) => (
                  <div key={index} className="border-b border-border pb-3 last:border-none last:pb-0">
                    <h3 className="font-medium mb-1">{headline.title}</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{headline.source}</span>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`px-1.5 py-0.5 text-xs rounded-full 
                            ${headline.sentiment === 'bullish' ? 'bg-positive/20 text-positive' : 
                              headline.sentiment === 'bearish' ? 'bg-negative/20 text-negative' : 
                              'bg-neutral/20 text-neutral'}`}
                        >
                          {headline.sentiment}
                        </span>
                        <span className="text-muted-foreground">{headline.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <MarketStatusBox />
      
      <footer className="bg-card py-3 px-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>VIX Sentiment Seeker - Real-time market data updated every minute</p>
      </footer>
    </div>
  );
};

export default Index;
