
import React from 'react';
import { TrendingUp, TrendingDown, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentIndicatorProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength?: 'strong' | 'moderate' | 'weak';
  className?: string;
}

const SentimentIndicator = ({
  sentiment,
  strength = 'moderate',
  className,
}: SentimentIndicatorProps) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center p-4 rounded-lg border", 
        {
          "bg-positive/10 border-positive/30": sentiment === 'bullish',
          "bg-negative/10 border-negative/30": sentiment === 'bearish',
          "bg-neutral/10 border-neutral/30": sentiment === 'neutral'
        },
        className
      )}
    >
      <div className="text-sm text-muted-foreground mb-2">Market Sentiment</div>
      <div className="flex items-center gap-2 mb-1">
        {sentiment === 'bullish' ? (
          <TrendingUp className="w-6 h-6 text-positive" />
        ) : sentiment === 'bearish' ? (
          <TrendingDown className="w-6 h-6 text-negative" />
        ) : (
          <div className="w-6 h-6 flex items-center justify-center text-neutral">—</div>
        )}
        <span 
          className={cn(
            "text-xl font-bold capitalize",
            {
              "text-positive": sentiment === 'bullish',
              "text-negative": sentiment === 'bearish',
              "text-neutral": sentiment === 'neutral'
            }
          )}
        >
          {sentiment}
        </span>
      </div>
      
      <div className="flex gap-1 items-center mt-1">
        <div 
          className={cn(
            "text-sm font-medium capitalize",
            {
              "text-positive/80": sentiment === 'bullish',
              "text-negative/80": sentiment === 'bearish',
              "text-neutral/80": sentiment === 'neutral'
            }
          )}
        >
          {strength}
        </div>
        
        {sentiment !== 'neutral' && strength === 'strong' && (
          <>
            {sentiment === 'bullish' ? (
              <ArrowUp className="w-4 h-4 text-positive" />
            ) : (
              <ArrowDown className="w-4 h-4 text-negative" />
            )}
            {sentiment === 'bullish' ? (
              <ArrowUp className="w-4 h-4 text-positive" />
            ) : (
              <ArrowDown className="w-4 h-4 text-negative" />
            )}
          </>
        )}
        
        {sentiment !== 'neutral' && strength === 'moderate' && (
          sentiment === 'bullish' ? (
            <ArrowUp className="w-4 h-4 text-positive" />
          ) : (
            <ArrowDown className="w-4 h-4 text-negative" />
          )
        )}
      </div>
    </div>
  );
};

export default SentimentIndicator;
