
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
  Legend 
} from 'recharts';

interface VIXFuturesData {
  month: string;
  value: number;
}

interface VIXFuturesChartProps {
  data: VIXFuturesData[];
}

const VIXFuturesChart: React.FC<VIXFuturesChartProps> = ({ data }) => {
  // Calculate the average of all futures values
  const averageFuture = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  
  // Process data to include month-to-month differences and contango
  const processedData = data.map((item, index) => {
    // Calculate month-to-month difference
    const difference = index > 0 ? item.value - data[index - 1].value : 0;
    
    // Calculate contango (whether future value is higher than current)
    const contango = index > 0 && item.value > data[0].value;
    
    return {
      ...item,
      difference,
      contango
    };
  });

  // Skip the current month for difference chart (it has no previous month to compare)
  const differenceData = processedData.slice(1);
  
  // Custom tooltip for the futures chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            <span className="font-medium">VIX: </span> 
            {payload[0].value.toFixed(2)}
          </p>
          {payload[0].payload.difference !== undefined && (
            <p className={`text-sm ${payload[0].payload.difference >= 0 ? 'text-negative' : 'text-positive'}`}>
              <span className="font-medium">Change: </span>
              {payload[0].payload.difference > 0 ? '+' : ''}
              {payload[0].payload.difference.toFixed(2)}
            </p>
          )}
          {payload[0].payload.contango !== undefined && payload[0].payload.month !== 'Current' && (
            <p className={`text-sm ${payload[0].payload.contango ? 'text-negative' : 'text-positive'}`}>
              <span className="font-medium">
                {payload[0].payload.contango ? 'Contango' : 'Backwardation'}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for the difference chart
  const DifferenceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{label}</p>
          <p className={`text-sm ${payload[0].value >= 0 ? 'text-negative' : 'text-positive'}`}>
            <span className="font-medium">Diff: </span>
            {payload[0].value > 0 ? '+' : ''}
            {payload[0].value.toFixed(2)}
          </p>
          <p className={`text-sm ${payload[0].payload.contango ? 'text-negative' : 'text-positive'}`}>
            <span className="font-medium">
              {payload[0].payload.contango ? 'Contango' : 'Backwardation'}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Get color based on the difference value
  const getDifferenceColor = (difference: number) => {
    return difference >= 0 ? "#EF4444" : "#10B981";
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-4">VIX Futures Curve</h2>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={averageFuture} 
                stroke="#94A3B8" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `Avg: ${averageFuture.toFixed(2)}`, 
                  position: 'right',
                  fill: '#94A3B8',
                  fontSize: 12
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-4">Month-to-Month Changes</h2>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={differenceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip content={<DifferenceTooltip />} />
              <ReferenceLine y={0} stroke="#94A3B8" />
              <Bar 
                dataKey="difference" 
                radius={[4, 4, 0, 0]}
                fill={(entry) => {
                  return entry.difference >= 0 ? "#EF4444" : "#10B981";
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-6 text-xs text-muted-foreground mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1 bg-positive"></div>
            <span>Backwardation (VIX decreasing)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1 bg-negative"></div>
            <span>Contango (VIX increasing)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIXFuturesChart;
