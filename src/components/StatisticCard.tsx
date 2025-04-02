
import React from 'react';
import { cn } from '@/lib/utils';

interface StatisticCardProps {
  label: string;
  value: string;
  change?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isAverage?: boolean;
  date?: string;
  className?: string;
}

const StatisticCard = ({
  label,
  value,
  change,
  sentiment,
  isAverage,
  date,
  className,
}: StatisticCardProps) => {
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        {sentiment && (
          <span 
            className={cn(
              "inline-block px-2 py-0.5 text-xs rounded-full", 
              {
                "bg-positive/20 text-positive": sentiment === 'bullish',
                "bg-negative/20 text-negative": sentiment === 'bearish',
                "bg-neutral/20 text-neutral": sentiment === 'neutral'
              }
            )}
          >
            {sentiment}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline">
        <span className="text-2xl font-semibold">{value}</span>
        {change && (
          <span 
            className={cn(
              "ml-2 text-sm", 
              {
                "text-positive": Number(change) > 0,
                "text-negative": Number(change) < 0,
                "text-neutral": Number(change) === 0
              }
            )}
          >
            {Number(change) > 0 ? '+' : ''}{change}
          </span>
        )}
      </div>
      {isAverage && <p className="mt-1 text-xs text-muted-foreground">30-day average</p>}
      {date && <p className="mt-1 text-xs text-muted-foreground">Recorded: {date}</p>}
    </div>
  );
};

export default StatisticCard;
