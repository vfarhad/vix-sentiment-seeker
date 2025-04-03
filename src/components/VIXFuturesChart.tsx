
import React from 'react';
import { 
  LineChart,
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Legend,
  ComposedChart,
  Area,
  Scatter
} from 'recharts';

interface VIXFuturesData {
  month: string;
  value: number;
  impliedForwardVIX?: number;
  isConstantMaturity?: boolean;
  volume?: number;
  openInterest?: number;
}

interface VIXFuturesChartProps {
  data: VIXFuturesData[];
  volumeData?: {date: string, volume: number, openInterest: number}[];
}

const VIXFuturesChart: React.FC<VIXFuturesChartProps> = ({ data, volumeData }) => {
  // Calculate the average of all futures values
  const averageFuture = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  
  // Find the minimum and maximum values for Y-axis scaling
  const minValue = Math.min(...data.map(item => item.value));
  const maxValue = Math.max(...data.map(item => item.value));
  
  // Define Y-axis domain from (min - 1) to (max + 1)
  const yAxisDomain = [Math.floor(minValue - 1), Math.ceil(maxValue + 1)];
  
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
  
  // Separate the constant maturity item if it exists
  const regularData = processedData.filter(item => !item.isConstantMaturity);
  const constantMaturityData = processedData.filter(item => item.isConstantMaturity);

  // Skip the current month for difference chart (it has no previous month to compare)
  const differenceData = processedData.slice(1).filter(item => !item.isConstantMaturity);
  
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
          {payload[0].payload.impliedForwardVIX !== undefined && (
            <p className="text-sm text-purple-500">
              <span className="font-medium">Implied Forward VIX: </span>
              {payload[0].payload.impliedForwardVIX.toFixed(2)}
            </p>
          )}
          {payload[0].payload.contango !== undefined && payload[0].payload.month !== 'Current' && (
            <p className={`text-sm ${payload[0].payload.contango ? 'text-negative' : 'text-positive'}`}>
              <span className="font-medium">
                {payload[0].payload.contango ? 'Contango' : 'Backwardation'}
              </span>
            </p>
          )}
          {payload[0].payload.isConstantMaturity && (
            <p className="text-sm text-amber-500">
              <span className="font-medium">30-Day Constant Maturity</span>
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
          {payload[0].payload.impliedForwardVIX !== undefined && (
            <p className="text-sm text-purple-500">
              <span className="font-medium">Implied Forward VIX: </span>
              {payload[0].payload.impliedForwardVIX.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Volume data tooltip
  const VolumeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-card p-3 border border-border rounded shadow-md">
          <p className="text-sm font-medium">{label}</p>
          {payload[0] && (
            <p className="text-sm text-primary">
              <span className="font-medium">Volume: </span> 
              {payload[0].value.toLocaleString()}
            </p>
          )}
          {payload[1] && (
            <p className="text-sm text-secondary">
              <span className="font-medium">Open Interest: </span> 
              {payload[1].value.toLocaleString()}
            </p>
          )}
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
        <h2 className="text-lg font-semibold mb-4">VIX Futures Term Structure</h2>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis 
                stroke="#64748B" 
                domain={yAxisDomain}
              />
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
              <Line 
                type="monotone"
                dataKey="value" 
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6, strokeWidth: 1 }}
              />
              {/* Add implied forward VIX as a separate line if available */}
              {regularData.some(item => item.impliedForwardVIX !== undefined) && (
                <Line 
                  type="monotone"
                  dataKey="impliedForwardVIX" 
                  stroke="#A855F7"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, strokeWidth: 1, fill: "#A855F7" }}
                  name="Implied Forward VIX"
                />
              )}
              {/* Add 30-Day Constant Maturity point if available */}
              {constantMaturityData.length > 0 && (
                <Scatter 
                  data={constantMaturityData}
                  dataKey="value" 
                  fill="#F59E0B"
                  name="30-Day CM"
                  shape={(props) => {
                    const { cx, cy } = props;
                    return (
                      <svg>
                        <circle cx={cx} cy={cy} r={6} fill="#F59E0B" stroke="#000" strokeWidth={1} />
                        <circle cx={cx} cy={cy} r={3} fill="#FEF3C7" />
                      </svg>
                    );
                  }}
                />
              )}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-4">Month-to-Month Spreads</h2>
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
                fill="#3B82F6"
                // Using fill callback is causing TypeScript errors, so we'll use a style approach
                className="fill-current"
                // We'll apply color via a custom attribute
                name="difference-bar"
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

      {volumeData && volumeData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">VIX Futures Volume & Open Interest</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={volumeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis 
                  stroke="#64748B"
                  yAxisId="left"
                  label={{ value: 'Volume', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#64748B"
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Open Interest', angle: 90, position: 'insideRight', fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip content={<VolumeTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="volume" 
                  fill="#8884d8" 
                  name="Volume"
                  radius={[4, 4, 0, 0]}
                />
                <Area
                  yAxisId="right"
                  dataKey="openInterest"
                  type="monotone"
                  fill="#82ca9d"
                  stroke="#82ca9d"
                  name="Open Interest"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-card p-4 border border-border rounded-md">
        <h3 className="text-md font-semibold mb-2">About VIX Term Structure</h3>
        <div className="text-sm space-y-2 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Term Structure:</span> The curve created by plotting VIX futures prices against expiration dates.
          </p>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1 bg-negative"></div>
            <p>
              <span className="font-medium text-foreground">Contango:</span> When longer-dated futures are priced higher than shorter-dated futures. 
              Typically suggests the market expects volatility to rise from current levels.
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1 bg-positive"></div>
            <p>
              <span className="font-medium text-foreground">Backwardation:</span> When longer-dated futures are priced lower than shorter-dated futures. 
              Usually occurs during market stress and suggests the market expects current high volatility to decrease.
            </p>
          </div>
          {regularData.some(item => item.impliedForwardVIX) && (
            <p>
              <span className="font-medium text-foreground text-purple-500">Implied Forward VIX:</span> The market's expectation for VIX levels between two expiration dates, 
              calculated using the formula: <code>sqrt(((F2² × T2) - (F1² × T1)) ÷ (T2 - T1))</code>.
            </p>
          )}
          {constantMaturityData.length > 0 && (
            <p>
              <span className="font-medium text-foreground text-amber-500">30-Day CM:</span> Constant maturity VIX futures value, 
              calculated by weighted interpolation between the two contracts that bracket the 30-day target.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VIXFuturesChart;
