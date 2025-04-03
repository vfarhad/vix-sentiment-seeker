
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
  Scatter,
  ScatterChart
} from 'recharts';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VIXTermStructurePoint } from '@/services/sp500DataService';

interface VIXFuturesData {
  month: string;
  value: number;
  volume?: number;
  openInterest?: number;
  isImpliedForward?: boolean;
  isConstantMaturity?: boolean;
  daysToExpiration?: number;
}

interface VIXFuturesChartProps {
  data: VIXFuturesData[];
  volumeData?: {date: string, volume: number, openInterest: number}[];
}

const VIXFuturesChart: React.FC<VIXFuturesChartProps> = ({ data, volumeData }) => {
  // Separate regular data points from special calculations
  const regularPoints = data.filter(item => !item.isImpliedForward && !item.isConstantMaturity);
  const impliedForwardPoints = data.filter(item => item.isImpliedForward);
  const constantMaturityPoints = data.filter(item => item.isConstantMaturity);
  
  // Calculate the average of all futures values (excluding special calculations)
  const averageFuture = regularPoints.reduce((sum, item) => sum + item.value, 0) / regularPoints.length;
  
  // Find the minimum and maximum values for Y-axis scaling
  const allValues = data.map(item => item.value);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Define Y-axis domain from (min - 1) to (max + 1)
  const yAxisDomain = [Math.floor(minValue - 1), Math.ceil(maxValue + 1)];
  
  // Process data to include month-to-month differences and contango
  const processedData = regularPoints.map((item, index) => {
    // Calculate month-to-month difference
    const difference = index > 0 ? item.value - regularPoints[index - 1].value : 0;
    
    // Calculate contango (whether future value is higher than current)
    const contango = index > 0 && item.value > regularPoints[0].value;
    
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
          {payload[0].payload.daysToExpiration !== undefined && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Days to Exp: </span>
              {payload[0].payload.daysToExpiration}
            </p>
          )}
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
          {payload[0].payload.isConstantMaturity && (
            <p className="text-sm text-amber-500">
              <span className="font-medium">Constant Maturity VIX</span>
            </p>
          )}
          {payload[0].payload.isImpliedForward && (
            <p className="text-sm text-purple-500">
              <span className="font-medium">Implied Forward VIX</span>
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
  
  // Determine if we are generally in contango or backwardation
  const marketRegime = regularPoints.length > 1 && regularPoints[regularPoints.length - 1].value > regularPoints[0].value 
    ? "Contango (Upward Sloping)" 
    : "Backwardation (Downward Sloping)";

  const marketRegimeColor = marketRegime.includes("Contango") ? "text-negative" : "text-positive";
  
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">VIX Futures Term Structure</h2>
          <div className={`text-sm px-3 py-1 rounded-full ${marketRegimeColor} bg-card border border-border`}>
            {marketRegime}
          </div>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis 
                dataKey="daysToExpiration" 
                type="number" 
                domain={[0, 'dataMax']} 
                stroke="#64748B"
                label={{ value: 'Days to Expiration', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                stroke="#64748B" 
                domain={yAxisDomain}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
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
                data={regularPoints}
                dataKey="value" 
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6, strokeWidth: 1 }}
                name="VIX Futures"
              />
              {impliedForwardPoints.length > 0 && (
                <Line 
                  type="monotone"
                  data={impliedForwardPoints}
                  dataKey="value" 
                  stroke="#A855F7"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, strokeWidth: 1, fill: "#A855F7" }}
                  activeDot={{ r: 6, strokeWidth: 1 }}
                  name="Implied Forward VIX"
                />
              )}
              {constantMaturityPoints.length > 0 && (
                <Scatter 
                  data={constantMaturityPoints}
                  fill="#F59E0B"
                  name="30-Day Constant Maturity VIX"
                  line={{ stroke: '#F59E0B', strokeWidth: 1.5 }}
                >
                </Scatter>
              )}
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

      <div className="bg-card border border-border rounded-lg p-4 mt-4">
        <h3 className="text-md font-semibold mb-3">VIX Term Structure Table</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>VIX Futures Term Structure with Calculations</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>VIX Value</TableHead>
                <TableHead>Days to Expiration</TableHead>
                <TableHead>Market Structure</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((point, index) => (
                <TableRow key={index}>
                  <TableCell>{point.month}</TableCell>
                  <TableCell>{point.value.toFixed(2)}</TableCell>
                  <TableCell>{point.daysToExpiration ?? 'N/A'}</TableCell>
                  <TableCell>
                    {index > 0 && regularPoints.includes(point) ? (
                      <span className={point.value > regularPoints[index-1].value ? 'text-negative' : 'text-positive'}>
                        {point.value > regularPoints[index-1].value ? 'Contango' : 'Backwardation'}
                      </span>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {point.isImpliedForward ? (
                      <span className="text-purple-500">Implied Forward</span>
                    ) : point.isConstantMaturity ? (
                      <span className="text-amber-500">Constant Maturity</span>
                    ) : (
                      <span className="text-blue-500">Standard</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-md font-semibold mb-2">About VIX Term Structure</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">VIX Futures Term Structure</span> plots the prices of VIX futures contracts against their expiration dates. 
            It provides insights into market expectations of future volatility.
          </p>
          <div className="flex space-x-4">
            <div>
              <p className="font-medium text-foreground">Contango</p>
              <p>Longer-dated futures priced higher than shorter-dated ones. Typically indicates market expects volatility to increase.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Backwardation</p>
              <p>Longer-dated futures priced lower than shorter-dated ones. Typically occurs during market stress.</p>
            </div>
          </div>
          <p>
            <span className="font-medium text-foreground">Implied Forward VIX</span> calculates the expected VIX level between two expiration dates using the formula:
            Forward_VIX = sqrt( ( (F2² × T2) - (F1² × T1) ) / (T2 - T1) )
          </p>
          <p>
            <span className="font-medium text-foreground">Constant Maturity VIX</span> represents a VIX futures value with a fixed time to expiration (e.g., 30 days),
            calculated by interpolating between the two nearest contracts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VIXFuturesChart;
