
import React from 'react';

const CryptoWidget = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <iframe 
        src="https://www.widgets.investing.com/top-cryptocurrencies?theme=darkTheme" 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        allowTransparency={true} 
        style={{ marginWidth: 0, marginHeight: 0 }}
      ></iframe>
      <div 
        className="poweredBy text-xs text-muted-foreground p-1" 
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
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
    </div>
  );
};

export default CryptoWidget;
