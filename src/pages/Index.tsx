
import React from 'react';
import Header from '@/components/Header';
import VIXChart from '@/components/VIXChart';
import VIXFuturesChart from '@/components/VIXFuturesChart';
import SentimentIndicator from '@/components/SentimentIndicator';
import StatisticCard from '@/components/StatisticCard';
import { vixHistoricalData, marketSentiment, vixStatistics, marketHeadlines, vixFuturesData } from '@/lib/mockData';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main chart area */}
          <div className="lg:col-span-2 space-y-6">
            <VIXChart data={vixHistoricalData} />
            
            {/* VIX Futures Chart (new) */}
            <VIXFuturesChart data={vixFuturesData} />
            
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {vixStatistics.map((stat, index) => (
                <StatisticCard
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  change={stat.change}
                  sentiment={stat.sentiment}
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
              <h2 className="text-lg font-semibold mb-3">Market Headlines</h2>
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
      
      <footer className="bg-card py-3 px-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>VIX Sentiment Seeker - Data is simulated for demonstration purposes</p>
      </footer>
    </div>
  );
};

export default Index;
