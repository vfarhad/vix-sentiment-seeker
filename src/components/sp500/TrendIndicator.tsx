
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendIndicatorProps {
  trend: {
    isUp: boolean;
    percent: string;
  };
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend }) => {
  return (
    <span 
      className={`ml-2 px-2 py-1 text-xs rounded-full inline-flex items-center
        ${trend.isUp 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
    >
      {trend.isUp ? 
        <TrendingUp className="w-3 h-3 mr-1" /> : 
        <TrendingDown className="w-3 h-3 mr-1" />
      }
      {trend.isUp ? '+' : '-'}{trend.percent}%
    </span>
  );
};

export default TrendIndicator;
