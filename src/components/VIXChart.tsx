
import React from 'react';
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

interface VIXChartProps {
  data: Array<{ date: string; value: number }>;
  className?: string;
}

const VIXChart = ({ data, className }: VIXChartProps) => {
  // Calculate average for reference line
  const averageVIX = data.reduce((acc, item) => acc + item.value, 0) / data.length;
  
  // Define VIX fear levels
  const lowFearThreshold = 20;
  const highFearThreshold = 30;
  
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Find min and max values to set chart domain
  const minValue = Math.floor(Math.min(...data.map(item => item.value)) * 0.9);
  const maxValue = Math.ceil(Math.max(...data.map(item => item.value)) * 1.1);
  
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
  const getFillColor = (value: number) => {
    if (value < lowFearThreshold) return "#10B981"; // green for low fear
    if (value > highFearThreshold) return "#EF4444"; // red for high fear
    return "#6B7280"; // neutral color
  };

  // Process data to include color
  const processedData = data.map(item => ({
    ...item,
    color: getFillColor(item.value)
  }));

  return (
    <div className={`chart-container ${className}`}>
      <h2 className="text-lg font-semibold mb-4">VIX Historical Chart</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={processedData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis 
              dataKey="date" 
              stroke="#64748B" 
              tickFormatter={formatDate} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[minValue, maxValue]} 
              stroke="#64748B"
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
              stroke={(props) => {
                const { value } = props.payload;
                return getFillColor(value);
              }}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, value } = props;
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={4} 
                    stroke={getFillColor(value)}
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
    </div>
  );
};

export default VIXChart;
