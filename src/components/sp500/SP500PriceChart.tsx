
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts';

interface SP500PriceChartProps {
  chartData: {
    date: string;
    close: number;
    dateObj: Date;
  }[];
}

const SP500PriceChart: React.FC<SP500PriceChartProps> = ({ chartData }) => {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            interval={Math.ceil(chartData.length / 15)}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'S&P 500']} 
          />
          <Legend />
          <Line
            name="S&P 500"
            type="monotone"
            dataKey="close"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SP500PriceChart;
