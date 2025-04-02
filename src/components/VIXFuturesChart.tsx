
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface VIXFuturesChartProps {
  data: Array<{ month: string; value: number }>;
  className?: string;
}

const VIXFuturesChart = ({ data, className }: VIXFuturesChartProps) => {
  // Format for tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            <span className="font-medium">VIX: </span> 
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Calculate average for reference line
  const averageVIX = data.reduce((acc, item) => acc + item.value, 0) / data.length;
  
  // Find min and max values to set chart domain
  const minValue = Math.floor(Math.min(...data.map(item => item.value)) * 0.9);
  const maxValue = Math.ceil(Math.max(...data.map(item => item.value)) * 1.1);

  return (
    <div className={`chart-container ${className}`}>
      <h2 className="text-lg font-semibold mb-4">VIX Futures Curve</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis 
              dataKey="month" 
              stroke="#64748B" 
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
            <Bar 
              dataKey="value" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>Current Month</span>
        <span>6 Months Forward</span>
      </div>
    </div>
  );
};

export default VIXFuturesChart;
