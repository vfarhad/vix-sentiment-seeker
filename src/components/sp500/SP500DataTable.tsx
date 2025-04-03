
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { SP500DataPoint } from '@/services/sp500/sp500DataService';

interface SP500DataTableProps {
  data: SP500DataPoint[];
}

const SP500DataTable: React.FC<SP500DataTableProps> = ({ data }) => {
  return (
    <div className="max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Open</TableHead>
            <TableHead>High</TableHead>
            <TableHead>Low</TableHead>
            <TableHead>Close</TableHead>
            <TableHead>Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 30).map((point, index) => {
            const prevClose = index < data.length - 1 ? data[index + 1].CLOSE : point.CLOSE;
            const change = point.CLOSE - prevClose;
            const changePercent = ((change / prevClose) * 100).toFixed(2);
            const isPositive = change >= 0;
            
            return (
              <TableRow key={point.DATE}>
                <TableCell>{new Date(point.DATE).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric' 
                })}</TableCell>
                <TableCell>${point.OPEN !== undefined && point.OPEN !== null ? point.OPEN.toFixed(2) : '-'}</TableCell>
                <TableCell>${point.HIGH !== undefined && point.HIGH !== null ? point.HIGH.toFixed(2) : '-'}</TableCell>
                <TableCell>${point.LOW !== undefined && point.LOW !== null ? point.LOW.toFixed(2) : '-'}</TableCell>
                <TableCell>${point.CLOSE.toFixed(2)}</TableCell>
                <TableCell className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  {isPositive ? '+' : ''}{changePercent}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default SP500DataTable;
