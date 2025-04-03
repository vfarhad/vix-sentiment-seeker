
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ContangoDataRow {
  label: string;
  values: {
    month: number;
    value: number;
  }[];
}

export interface ContangoMetric {
  label: string;
  value: number;
}

interface VIXContangoTableProps {
  contangoData: ContangoDataRow[];
  monthRangeMetrics?: ContangoMetric[];
}

const VIXContangoTable: React.FC<VIXContangoTableProps> = ({ 
  contangoData, 
  monthRangeMetrics 
}) => {
  // Get all unique months from the data for column headers
  const months = contangoData.length > 0 
    ? [...new Set(contangoData[0].values.map(item => item.month))].sort((a, b) => a - b)
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">VIX Term Structure Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="border-collapse border border-border">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] border border-border font-bold">Metric</TableHead>
                {months.map(month => (
                  <React.Fragment key={`header-${month}`}>
                    <TableHead className="w-[40px] border border-border text-center font-bold">{month}</TableHead>
                    <TableHead className="border border-border text-center font-bold">Value</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contangoData.map((row, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  <TableCell className="font-medium border border-border">{row.label}</TableCell>
                  {months.map(month => {
                    const monthData = row.values.find(v => v.month === month);
                    const value = monthData ? monthData.value : null;
                    const formattedValue = value !== null 
                      ? value < 0 
                        ? value.toFixed(2) + '%'
                        : value.toFixed(2)
                      : '-';
                    
                    return (
                      <React.Fragment key={`cell-${rowIndex}-${month}`}>
                        <TableCell className="text-center border border-border">{month}</TableCell>
                        <TableCell className={`text-right border border-border ${value < 0 ? 'text-red-600' : ''}`}>
                          {formattedValue}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {monthRangeMetrics && monthRangeMetrics.length > 0 && (
            <Table className="border-collapse border border-border mt-4">
              <TableBody>
                <TableRow>
                  {monthRangeMetrics.map((metric, index) => (
                    <React.Fragment key={`metric-${index}`}>
                      <TableCell className="font-medium border border-border">{metric.label}</TableCell>
                      <TableCell 
                        className={`text-right border border-border ${metric.value < 0 ? 'text-red-600' : ''}`}
                      >
                        {metric.value.toFixed(2) + '%'}
                      </TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VIXContangoTable;
