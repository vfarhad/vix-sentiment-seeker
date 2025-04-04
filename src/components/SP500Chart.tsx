
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SP500DataPoint } from '@/services/sp500/sp500DataService';
import SP500PriceChart from './sp500/SP500PriceChart';
import SP500MovingAveragesChart from './sp500/SP500MovingAveragesChart';
import SP500DataTable from './sp500/SP500DataTable';
import TrendIndicator from './sp500/TrendIndicator';
import { AlertCircle } from 'lucide-react';

interface SP500ChartProps {
  data: SP500DataPoint[];
  dataSource?: string;
}

const SP500Chart: React.FC<SP500ChartProps> = ({ data, dataSource = "Database" }) => {
  console.log('SP500Chart received data:', data); // Debug log to check data
  
  // Format data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.warn('No data provided to SP500Chart');
      return [];
    }
    
    console.log('Formatting chart data from', data.length, 'data points');
    return data.map((point) => ({
      date: new Date(point.DATE).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      close: point.CLOSE,
      dateObj: new Date(point.DATE), // Keep date object for calculations
    }));
  }, [data]);

  // Calculate simple moving averages if we have enough data
  const chartDataWithSMA = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      console.warn('No chart data available for SMA calculation');
      return [];
    }
    
    if (chartData.length < 10) {
      console.log('Not enough data points for SMA calculation, need at least 10');
      return chartData.map(point => ({ ...point, sma10: null, sma20: null }));
    }
    
    console.log('Calculating SMAs for', chartData.length, 'data points');
    // Calculate 10-day SMA (simple moving average)
    return chartData.map((point, index) => {
      if (index < 10) {
        return { ...point, sma10: null, sma20: null };
      }

      // Calculate average of last 10 days
      const sum10 = chartData
        .slice(index - 10, index)
        .reduce((acc, curr) => acc + curr.close, 0);
      
      // Calculate average of last 20 days
      const sum20 = index >= 20 
        ? chartData
            .slice(index - 20, index)
            .reduce((acc, curr) => acc + curr.close, 0)
        : 0;
      
      return { 
        ...point, 
        sma10: sum10 / 10,
        sma20: index >= 20 ? sum20 / 20 : null 
      };
    });
  }, [chartData]);

  // Calculate overall trend (is market up or down)
  const trend = useMemo(() => {
    if (chartData.length < 2) {
      console.warn('Not enough data points to calculate trend');
      return { isUp: false, percent: '0' };
    }
    
    const firstPrice = chartData[0].close;
    const lastPrice = chartData[chartData.length - 1].close;
    const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    console.log(`Trend calculation: first price ${firstPrice}, last price ${lastPrice}, change ${percentChange.toFixed(2)}%`);
    
    return {
      isUp: percentChange > 0,
      percent: Math.abs(percentChange).toFixed(2)
    };
  }, [chartData]);

  if (!data) {
    console.error('No data provided to SP500Chart component');
    return (
      <Card>
        <CardHeader>
          <CardTitle>S&P 500 Historical Data</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">S&P 500 data is undefined</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    console.error('Empty data array provided to SP500Chart component');
    return (
      <Card>
        <CardHeader>
          <CardTitle>S&P 500 Historical Data</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No S&P 500 data available</p>
          <p className="text-sm text-muted-foreground mt-1">Check your Supabase connection and data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            S&P 500 Historical Data
            <TrendIndicator trend={trend} />
          </CardTitle>
          <span className="text-sm text-muted-foreground">Source: {dataSource}</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="moving-averages">Moving Averages</TabsTrigger>
            <TabsTrigger value="data-table">Data Table</TabsTrigger>
          </TabsList>
          
          <TabsContent value="price" className="space-y-4">
            {chartData.length > 0 ? (
              <SP500PriceChart chartData={chartData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No price data available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="moving-averages">
            {chartDataWithSMA.length > 0 ? (
              <SP500MovingAveragesChart chartDataWithSMA={chartDataWithSMA} />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No moving average data available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="data-table">
            <SP500DataTable data={data} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SP500Chart;
