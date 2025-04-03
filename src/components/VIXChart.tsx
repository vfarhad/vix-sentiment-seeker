
import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VIXChartProps {
  data: Array<{ date: string; value: number }>;
  className?: string;
}

const VIXChart = ({ data, className }: VIXChartProps) => {
  const [chartData, setChartData] = useState<Array<{ date: string; value: number; color: string }>>([]);

  useEffect(() => {
    // Process incoming data when it changes
    if (data && data.length > 0) {
      const validData = data.filter(item => 
        item.date && !isNaN(item.value) && item.value !== null && item.value !== undefined
      );
      
      // Sort data by date to ensure correct chronological display
      validData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Add color information to data points
      const processedData = validData.map(item => ({
        ...item,
        color: getFillColor(item.value)
      }));
      
      setChartData(processedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  // Define VIX fear levels
  const lowFearThreshold = 20;
  const highFearThreshold = 30;

  // Check if data is valid
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>VIX Historical Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center bg-card rounded-lg">
          <p className="text-muted-foreground mb-4">No VIX data available</p>
          <Button onClick={() => toast.info('Refreshing data...')}>
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Filter out any invalid data points
  const validData = chartData.filter(item => 
    item.date && !isNaN(item.value) && item.value !== null && item.value !== undefined
  );
  
  if (validData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>VIX Historical Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center bg-card rounded-lg">
          <p className="text-muted-foreground">Invalid VIX data format</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate average for reference line
  const averageVIX = validData.reduce((acc, item) => acc + item.value, 0) / validData.length;
  
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString;
    }
  };
  
  // Find min and max values to set chart domain
  const minValue = Math.floor(Math.min(...validData.map(item => item.value)) * 0.9);
  const maxValue = Math.ceil(Math.max(...validData.map(item => item.value)) * 1.1);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const vixValue = payload[0].value;
      let fearLevel = "Neutral";
      let fearColor = "text-neutral";
      
      if (vixValue < lowFearThreshold) {
        fearLevel = "Low Fear";
        fearColor = "text-positive";
      } else if (vixValue > highFearThreshold) {
        fearLevel = "High Fear";
        fearColor = "text-negative";
      }
      
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm text-primary">
            <span className="font-medium">VIX: </span> 
            {vixValue.toFixed(2)}
          </p>
          <p className={`text-sm font-medium ${fearColor}`}>
            {fearLevel}
          </p>
        </div>
      );
    }
    return null;
  };

  // Function to determine color based on VIX value
  function getFillColor(value: number) {
    if (value < lowFearThreshold) return "#10B981"; // green for low fear
    if (value > highFearThreshold) return "#EF4444"; // red for high fear
    return "#6B7280"; // neutral color
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>VIX Historical Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-2">
          Showing close values for the last {validData.length} days
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={validData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate} 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[minValue, maxValue]} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={averageVIX} 
                stroke="#94A3B8" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `Avg: ${averageVIX.toFixed(2)}`, 
                  position: 'right',
                  fill: '#94A3B8',
                  fontSize: 12
                }} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorUv)"
              />
              <Line
                type="monotone"
                dataKey="value"
                strokeWidth={2}
                stroke="#3B82F6"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy || !payload) return null;
                  const value = payload.value;
                  const color = getFillColor(value);
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={4} 
                      stroke={color}
                      strokeWidth={2}
                      fill="#0F172A"
                    />
                  );
                }}
                activeDot={{ r: 6, strokeWidth: 2, fill: '#0F172A' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Past 30 Days</span>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1 bg-positive"></div>
              <span>Low Fear (&lt;20)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1 bg-neutral"></div>
              <span>Neutral</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1 bg-negative"></div>
              <span>High Fear (&gt;30)</span>
            </div>
          </div>
          <span>Current</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default VIXChart;
