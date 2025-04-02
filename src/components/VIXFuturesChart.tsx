
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { ArrowDown, ArrowUp } from 'lucide-react';

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

  // Calculate contango data (difference between adjacent months)
  const contangoData = data.map((item, index) => {
    if (index === 0) {
      return {
        month: item.month,
        value: item.value,
        contango: 0,
        difference: 0
      };
    }
    
    const previousValue = data[index - 1].value;
    const contango = ((item.value / previousValue) - 1) * 100; // percentage change
    const difference = item.value - previousValue;
    
    return {
      month: item.month,
      value: item.value,
      contango: parseFloat(contango.toFixed(2)),
      difference: parseFloat(difference.toFixed(2))
    };
  });

  // Contango tooltip
  const ContangoTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === "contango") {
              return (
                <p key={index} className="text-sm text-green-500">
                  <span className="font-medium">Contango: </span> 
                  {entry.value > 0 ? "+" : ""}{entry.value}%
                </p>
              );
            } else if (entry.dataKey === "difference") {
              const color = entry.value >= 0 ? "text-green-500" : "text-red-500";
              return (
                <p key={index} className={`text-sm ${color}`}>
                  <span className="font-medium">Difference: </span> 
                  {entry.value > 0 ? "+" : ""}{entry.value}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

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
      
      {/* Contango and Difference Chart */}
      <h3 className="text-md font-medium mt-6 mb-2">Month-to-Month Changes</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={contangoData.slice(1)} // Skip the first month as it has no previous month to compare
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis 
              dataKey="month" 
              stroke="#64748B" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              stroke="#10B981" // Green color for contango
              tick={{ fontSize: 12 }}
              label={{ value: '%', position: 'insideLeft', angle: -90, dy: 10, fill: '#10B981', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#EF4444" // Red color for difference
              tick={{ fontSize: 12 }}
              label={{ value: 'Points', position: 'insideRight', angle: -90, dy: -20, fill: '#EF4444', fontSize: 12 }}
            />
            <Tooltip content={<ContangoTooltip />} />
            <Legend />
            <Bar 
              yAxisId="right"
              dataKey="difference" 
              fill={({ difference }) => difference >= 0 ? "#10B981" : "#EF4444"}
              name="Difference (Points)"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="contango"
              stroke="#10B981"
              strokeWidth={2}
              name="Contango (%)"
              dot={{ r: 4, strokeWidth: 2, fill: '#0F172A' }}
            />
            <ReferenceLine 
              yAxisId="left"
              y={0} 
              stroke="#94A3B8" 
              strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
        <div className="flex items-center">
          <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
          <span>Contango: Higher future prices (uncertainty increasing)</span>
        </div>
        <div className="flex items-center">
          <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
          <span>Backwardation: Lower future prices</span>
        </div>
      </div>
    </div>
  );
};

export default VIXFuturesChart;
