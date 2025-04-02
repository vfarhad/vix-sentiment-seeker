
import React, { useEffect, useState } from 'react';
import { fetchMarketStatus, MarketStatus } from '@/services/marketDataService';
import { Circle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const MarketStatusBox = () => {
  const { data: marketStatus, isLoading, isError } = useQuery({
    queryKey: ['marketStatus'],
    queryFn: () => fetchMarketStatus(),
    refetchInterval: 60000 * 5, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="fixed bottom-16 right-4 bg-secondary rounded-lg shadow-lg p-3 flex items-center space-x-2 border border-border z-50">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Loading market status...</span>
      </div>
    );
  }

  if (isError || !marketStatus) {
    return (
      <div className="fixed bottom-16 right-4 bg-secondary rounded-lg shadow-lg p-3 flex items-center space-x-2 border border-border z-50">
        <Circle className="h-4 w-4 text-negative" />
        <span className="text-sm">Status unavailable</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 bg-secondary rounded-lg shadow-lg p-3 flex items-center space-x-2 border border-border z-50">
      <Circle 
        className={`h-4 w-4 ${marketStatus.isOpen ? 'text-positive animate-pulse' : 'text-negative'}`} 
        fill={marketStatus.isOpen ? 'rgba(34, 197, 94, 0.2)' : 'transparent'} 
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          Market {marketStatus.status}
        </span>
        <span className="text-xs text-muted-foreground">
          {marketStatus.exchange} Exchange
        </span>
        {marketStatus.holiday && (
          <span className="text-xs text-muted-foreground">
            Holiday: {marketStatus.holiday}
          </span>
        )}
      </div>
    </div>
  );
};

export default MarketStatusBox;
