
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine
} from 'recharts';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface VIXFuturesChartProps {
  data: {
    month: string;
    value: number;
    daysToExpiration?: number;
    isContango?: boolean;
    isImpliedForward?: boolean;
    isConstantMaturity?: boolean;
    forwardStartDate?: string;
    forwardEndDate?: string;
    maturityDays?: number;
  }[];
  volumeData?: any[];
}

const VIXFuturesChart = ({ data, volumeData }: VIXFuturesChartProps) => {
  const [view, setView] = useState<'futures' | 'volume' | 'explain'>('futures');
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VIX Term Structure</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No VIX futures data available</p>
        </CardContent>
      </Card>
    );
  }

  // Separate regular futures from implied forwards and constant maturities
  const futuresData = data.filter(d => !d.isImpliedForward && !d.isConstantMaturity);
  const impliedForwards = data.filter(d => d.isImpliedForward);
  const constantMaturities = data.filter(d => d.isConstantMaturity);
  
  // Get spot VIX value (first item in futures data is typically current/spot)
  const spotVIX = futuresData.length > 0 ? futuresData[0].value : null;
  
  // Determine if the overall curve is in contango or backwardation
  // (comparing first and last regular futures contracts)
  const isContango = futuresData.length >= 2 && 
    futuresData[futuresData.length - 1].value > futuresData[0].value;

  // Prepare data for display
  const chartData = futuresData.map(item => ({
    name: item.daysToExpiration ? `${item.month} (${item.daysToExpiration}d)` : item.month,
    value: item.value,
    isSpot: item.month.toLowerCase().includes('current') || item.month.toLowerCase().includes('spot'),
    daysToExpiration: item.daysToExpiration || 0
  }));

  // Format volume data (if available)
  const volumeChartData = volumeData ? volumeData.map(item => ({
    date: new Date(item.DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: item['VOLATILITY INDEX VOLUME'] || 0,
    openInterest: item['VOLATILITY INDEX OI'] || 0
  })) : [];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            VIX Term Structure
            {isContango !== undefined && (
              <span 
                className={`ml-2 px-2 py-1 text-xs rounded-full inline-flex items-center
                  ${isContango 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
              >
                {isContango ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {isContango ? 'Contango' : 'Backwardation'}
              </span>
            )}
            {spotVIX && (
              <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                Spot VIX: {spotVIX.toFixed(2)}
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="futures">Futures Curve</TabsTrigger>
            {volumeData && volumeData.length > 0 && (
              <TabsTrigger value="volume">Volume/OI</TabsTrigger>
            )}
            <TabsTrigger value="explain">
              <Info className="h-4 w-4 mr-1" />
              Explanation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="futures" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`${value}`, 'VIX']} />
                  <Legend />
                  <Line
                    name="VIX Futures"
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  
                  {/* Add implied forwards if available */}
                  {impliedForwards.length > 0 && (
                    <Line
                      name="Implied Forward VIX"
                      type="monotone"
                      data={impliedForwards.map(item => ({
                        name: item.month,
                        value: item.value,
                        daysToExpiration: item.daysToExpiration || 0
                      }))}
                      dataKey="value"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 5 }}
                    />
                  )}
                  
                  {/* Add constant maturity values if available */}
                  {constantMaturities.length > 0 && (
                    <ReferenceLine 
                      y={constantMaturities[0].value} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3"
                      label={{ 
                        value: `${constantMaturities[0].month}: ${constantMaturities[0].value.toFixed(2)}`,
                        position: 'insideBottomRight'
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Term structure data table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Month</th>
                    <th className="text-right py-2 px-3">Value</th>
                    <th className="text-right py-2 px-3">Days to Expiry</th>
                    <th className="text-center py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className={`border-b ${item.isImpliedForward ? 'bg-secondary/10' : item.isConstantMaturity ? 'bg-primary/10' : ''}`}>
                      <td className="py-2 px-3">{item.month}</td>
                      <td className="text-right py-2 px-3">{item.value.toFixed(2)}</td>
                      <td className="text-right py-2 px-3">{item.daysToExpiration !== undefined ? item.daysToExpiration : '-'}</td>
                      <td className="text-center py-2 px-3">
                        {item.isContango !== undefined && (
                          <span 
                            className={`px-2 py-1 text-xs rounded-full inline-flex items-center
                              ${item.isContango 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                          >
                            {item.isContango ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {item.isContango ? 'Contango' : 'Backwardation'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {item.isImpliedForward ? 'Implied Forward' : item.isConstantMaturity ? 'Constant Maturity' : 'Futures'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          {volumeData && volumeData.length > 0 && (
            <TabsContent value="volume">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={volumeChartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      yAxisId="left"
                      orientation="left"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      yAxisId="right"
                      orientation="right"
                    />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" name="Volume" dataKey="volume" fill="#8884d8" />
                    <Bar yAxisId="right" name="Open Interest" dataKey="openInterest" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="explain">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h4>Understanding VIX Term Structure</h4>
              <p>
                The VIX Term Structure chart shows the relationship between VIX futures prices and their respective
                expiration dates. This curve provides insights into market expectations of future volatility.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="bg-muted p-3 rounded-md">
                  <h5 className="flex items-center text-sm font-medium">
                    <TrendingUp className="w-4 h-4 mr-1 text-positive" />
                    Contango
                  </h5>
                  <p className="text-xs mt-1">
                    When longer-dated futures trade at higher prices than shorter-dated ones. 
                    This suggests markets expect volatility to increase from current levels 
                    or revert to a higher long-term average.
                  </p>
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <h5 className="flex items-center text-sm font-medium">
                    <TrendingDown className="w-4 h-4 mr-1 text-negative" />
                    Backwardation
                  </h5>
                  <p className="text-xs mt-1">
                    When longer-dated futures trade at lower prices than shorter-dated ones.
                    This typically occurs during market stress periods and suggests markets
                    expect current high volatility to decrease over time.
                  </p>
                </div>
              </div>
              
              <h5>Special Calculations</h5>
              <ul className="text-xs space-y-2">
                <li>
                  <strong>Implied Forward VIX:</strong> The market's expectation for VIX levels between two 
                  future expiration dates, calculated using the formula: 
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    Forward_VIX = sqrt(((F2² × T2) - (F1² × T1)) / (T2 - T1))
                  </code>
                </li>
                <li>
                  <strong>Constant Maturity VIX:</strong> Represents a VIX futures value with a fixed time 
                  to expiration (e.g., 30 days), calculated by weighting the prices of the two nearest 
                  futures contracts.
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default VIXFuturesChart;
