
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts';

interface SP500MovingAveragesChartProps {
  chartDataWithSMA: {
    date: string;
    close: number;
    sma10: number | null;
    sma20: number | null;
    dateObj: Date;
  }[];
}

const SP500MovingAveragesChart: React.FC<SP500MovingAveragesChartProps> = ({ chartDataWithSMA }) => {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartDataWithSMA}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            interval={Math.ceil(chartDataWithSMA.length / 15)}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number | null) => {
              if (value === null) return ['-', ''];
              return [`$${value.toFixed(2)}`, 'S&P 500'];
            }} 
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
          <Line
            name="10-Day SMA"
            type="monotone"
            dataKey="sma10"
            stroke="#82ca9d"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            name="20-Day SMA"
            type="monotone"
            dataKey="sma20"
            stroke="#ff7300"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SP500MovingAveragesChart;
