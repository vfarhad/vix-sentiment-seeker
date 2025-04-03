
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SP500DataPoint } from '@/services/sp500/sp500DataService';

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
    if (chartData.length < 10) return chartData;
    
    // Calculate 10-day SMA (simple moving average)
    return chartData.map((point, index) => {
      if (index < 10) {
        return { ...point, sma10: null };
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
    if (chartData.length < 2) return { isUp: false, percent: 0 };
    
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
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="moving-averages">Moving Averages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="price" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval={Math.ceil(chartData.length / 15)}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`$${value}`, 'S&P 500']} />
                  <Legend />
                  <Line
                    name="S&P 500"
                    type="monotone"
                    dataKey="close"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="moving-averages">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartDataWithSMA}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval={Math.ceil(chartData.length / 15)}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'S&P 500']} 
                  />
                  <Legend />
                  <Line
                    name="S&P 500"
                    type="monotone"
                    dataKey="close"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    name="10-Day SMA"
                    type="monotone"
                    dataKey="sma10"
                    stroke="#82ca9d"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    name="20-Day SMA"
                    type="monotone"
                    dataKey="sma20"
                    stroke="#ff7300"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SP500Chart;
