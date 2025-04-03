
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

interface SP500ChartProps {
  data: Array<{ date: string; value: number }>;
  className?: string;
}

const SP500Chart = ({ data, className }: SP500ChartProps) => {
  // Check if data is valid
  if (!data || data.length === 0) {
    return (
      <div className={`chart-container ${className}`}>
        <h2 className="text-lg font-semibold mb-4">S&P 500 Historical Chart</h2>
        <div className="h-[300px] flex items-center justify-center bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No S&P 500 data available</p>
        </div>
      </div>
    );
  }
  
  console.log('Rendering S&P 500 chart with data:', data.slice(0, 5), '... (total:', data.length, 'points)');
  
  // Filter out any invalid data points
  const validData = data.filter(item => 
    item.date && !isNaN(item.value) && item.value !== null && item.value !== undefined
  );
  
  if (validData.length === 0) {
    return (
      <div className={`chart-container ${className}`}>
        <h2 className="text-lg font-semibold mb-4">S&P 500 Historical Chart</h2>
        <div className="h-[300px] flex items-center justify-center bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">Invalid S&P 500 data format</p>
        </div>
      </div>
    );
  }
  
  // Sort data by date to ensure correct chronological display
  validData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate average for reference line
  const averageSP = validData.reduce((acc, item) => acc + item.value, 0) / validData.length;
  
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(2, 2)}`;
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString;
    }
  };
  
  // Find min and max values to set chart domain with some padding
  const minValue = Math.floor(Math.min(...validData.map(item => item.value)) * 0.95);
  const maxValue = Math.ceil(Math.max(...validData.map(item => item.value)) * 1.05);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const spValue = payload[0].value;
      
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm text-primary">
            <span className="font-medium">S&P 500: </span> 
            {spValue.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate 50-day moving average
  const calculateMA = (data: any[], days: number) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < days - 1) {
        result.push(null);
        continue;
      }
      
      let sum = 0;
      for (let j = 0; j < days; j++) {
        sum += data[i - j].value;
      }
      result.push(parseFloat((sum / days).toFixed(2)));
    }
    return result;
  };
  
  // Add moving average to data
  const maData = calculateMA(validData, 50);
  const dataWithMA = validData.map((item, i) => ({
    ...item,
    ma50: maData[i]
  }));

  return (
    <div className={`chart-container ${className}`}>
      <h2 className="text-lg font-semibold mb-4">S&P 500 Historical Chart</h2>
      <div className="text-sm text-muted-foreground mb-2">
        Showing close values for the last {validData.length} days
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dataWithMA}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorSP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
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
              y={averageSP} 
              stroke="#94A3B8" 
              strokeDasharray="3 3" 
              label={{ 
                value: `Avg: ${averageSP.toFixed(2)}`, 
                position: 'right',
                fill: '#94A3B8',
                fontSize: 12
              }} 
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorSP)"
            />
            <Line
              type="monotone"
              dataKey="ma50"
              stroke="#0EA5E9"
              strokeWidth={2}
              dot={false}
              name="50-day MA"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{formatDate(validData[0]?.date)}</span>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1 bg-positive"></div>
            <span>S&P 500</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1 bg-blue-500"></div>
            <span>50-day MA</span>
          </div>
        </div>
        <span>{formatDate(validData[validData.length - 1]?.date)}</span>
      </div>
    </div>
  );
};

export default SP500Chart;
