
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

interface VIXChartProps {
  data: Array<{ date: string; value: number }>;
  className?: string;
}

const VIXChart = ({ data, className }: VIXChartProps) => {
  // Calculate average for reference line
  const averageVIX = data.reduce((acc, item) => acc + item.value, 0) / data.length;
  
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
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm text-primary">
            <span className="font-medium">VIX: </span> 
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`chart-container ${className}`}>
      <h2 className="text-lg font-semibold mb-4">VIX Historical Chart</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#0F172A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>Past 30 Days</span>
        <span>Current</span>
      </div>
    </div>
  );
};

export default VIXChart;
