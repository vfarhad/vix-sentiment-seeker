
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface MarketIndexProps {
  name: string;
  value: string;
  change: string;
  changePercent: string;
}

const MarketBanner: React.FC<{ indices: MarketIndexProps[] }> = ({ indices }) => {
  return (
    <div className="w-full bg-secondary py-2 px-4 overflow-x-auto">
      <div className="flex space-x-6 justify-between min-w-max lg:min-w-0">
        {indices.map((index, i) => {
          const isPositive = !index.change.startsWith('-');
          
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
