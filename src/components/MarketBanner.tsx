
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface MarketIndexProps {
  name: string;
  value: string;
  change: string | number;
  changePercent: string;
}

const MarketBanner: React.FC<{ indices: MarketIndexProps[], isLoading?: boolean }> = ({ 
  indices, 
  isLoading = false 
}) => {
  if (isLoading) {
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
    <div className="w-full bg-secondary py-2 px-4 overflow-x-auto">
      <div className="flex space-x-6 justify-between min-w-max lg:min-w-0">
        {indices.map((index, i) => {
          // Handle both string and number types for change value
          const isPositive = typeof index.change === 'string' 
            ? !index.change.startsWith('-')
            : index.change >= 0;
          
          return (
            <div key={i} className="flex flex-col items-center px-4 py-1">
              <span className="text-sm font-medium text-muted-foreground">{index.name}</span>
              <span className="text-md font-bold">{index.value}</span>
              <div className="flex items-center space-x-1">
                {isPositive ? 
                  <ArrowUp className="h-3 w-3 text-positive" /> : 
                  <ArrowDown className="h-3 w-3 text-negative" />
                }
                <span className={`text-xs ${isPositive ? 'text-positive' : 'text-negative'}`}>
                  {index.change} ({index.changePercent})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketBanner;
