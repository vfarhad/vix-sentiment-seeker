
import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import { fetchStockMarketLeaders } from '@/services/marketLeadersService';
import { StockLeader } from '@/services/scrapers/barchartScraper';

const MarketBanner: React.FC<{ isLoading?: boolean }> = ({ 
  isLoading = false 
}) => {
  const [leaders, setLeaders] = useState<StockLeader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMarketLeaders = async () => {
      setLoading(true);
      const data = await fetchStockMarketLeaders();
      setLeaders(data);
      setLoading(false);
    };

    getMarketLeaders();
    
    // Refresh market leaders data every 5 minutes
    const intervalId = setInterval(getMarketLeaders, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading || isLoading) {
    return (
      <div className="w-full bg-secondary py-2 px-4 overflow-x-auto">
        <div className="flex space-x-6 justify-between min-w-max lg:min-w-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center px-4 py-1">
              <div className="h-4 w-16 bg-muted animate-pulse rounded mb-1"></div>
              <div className="h-5 w-20 bg-muted animate-pulse rounded mb-1"></div>
              <div className="h-3 w-14 bg-muted animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-secondary py-2">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="py-1">
          {leaders.map((leader, i) => {
            const isPositive = !leader.change.startsWith('-');
            
            return (
              <CarouselItem key={i} className="basis-auto pl-4 md:pl-6">
                <div className="flex flex-col items-center px-2 py-1 min-w-[140px]">
                  <span className="text-sm font-medium">{leader.symbol}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-32">{leader.name}</span>
                  <span className="text-md font-bold">{leader.price}</span>
                  <div className="flex items-center space-x-1">
                    {isPositive ? 
                      <ArrowUp className="h-3 w-3 text-positive" /> : 
                      <ArrowDown className="h-3 w-3 text-negative" />
                    }
                    <span className={`text-xs ${isPositive ? 'text-positive' : 'text-negative'}`}>
                      {leader.change} ({leader.changePercent})
                    </span>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default MarketBanner;
