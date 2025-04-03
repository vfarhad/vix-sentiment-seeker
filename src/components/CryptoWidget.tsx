
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const CryptoWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle iframe error events
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  useEffect(() => {
    // Set a timeout to handle cases where the iframe might not trigger load/error events
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  return (
    <Card className="w-full h-full overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium text-foreground flex items-center">
          <span className="mr-2">
            <svg 
              className="w-4 h-4 text-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M9 8H13L11 12.5V15H13M12 3L21 7.5V16.5L12 21L3 16.5V7.5L12 3Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Cryptocurrency Market
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[calc(100%-2rem)]">
        <div className="flex-grow h-full relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10 p-4">
              <AlertCircle className="h-10 w-10 text-warning mb-2" />
              <p className="text-sm text-center text-muted-foreground">
                Unable to load cryptocurrency data. Please try again later.
              </p>
            </div>
          )}
          
          <iframe 
            src="https://www.widgets.investing.com/top-cryptocurrencies?theme=darkTheme" 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowTransparency={true} 
            style={{ margin: 0 }}
            className="bg-transparent"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          ></iframe>
        </div>
        <div 
          className="text-xs text-muted-foreground p-1 border-t border-border bg-card/80"
        >
          Powered by <a 
            href="https://www.investing.com?utm_source=WMT&utm_medium=referral&utm_campaign=TOP_CRYPTOCURRENCIES&utm_content=Footer%20Link" 
            target="_blank" 
            rel="nofollow"
            className="text-primary hover:underline"
          >
            Investing.com
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoWidget;
