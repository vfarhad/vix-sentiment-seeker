
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SP500DataPoint } from '@/services/sp500/sp500DataService';
import SP500PriceChart from './sp500/SP500PriceChart';
import SP500MovingAveragesChart from './sp500/SP500MovingAveragesChart';
import SP500DataTable from './sp500/SP500DataTable';
import TrendIndicator from './sp500/TrendIndicator';

interface SP500ChartProps {
  data: SP500DataPoint[];
}

const SP500Chart: React.FC<SP500ChartProps> = ({ data }) => {
  // Format data for the chart
  const chartData = useMemo(() => {
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
    if (chartData.length < 10) return chartData.map(point => ({ ...point, sma10: null, sma20: null }));
    
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
    if (chartData.length < 2) return { isUp: false, percent: '0' };
    
    const firstPrice = chartData[0].close;
    const lastPrice = chartData[chartData.length - 1].close;
    const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    return {
      isUp: percentChange > 0,
      percent: Math.abs(percentChange).toFixed(2)
    };
  }, [chartData]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>S&P 500 Historical Data</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No S&P 500 data available</p>
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
            <SP500PriceChart chartData={chartData} />
          </TabsContent>
          
          <TabsContent value="moving-averages">
            <SP500MovingAveragesChart chartDataWithSMA={chartDataWithSMA} />
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
