import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTradeHistory, setDateRange } from '@/store/slices/tradeHistorySlice';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TradeHistory = () => {
  const dispatch = useAppDispatch();
  const { trades, loading, dateRange } = useAppSelector((state) => state.tradeHistory);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    // Default to last 1 month
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const fromDateStr = lastMonth.toISOString().split('T')[0];
    const toDateStr = today.toISOString().split('T')[0];
    
    setFromDate(fromDateStr);
    setToDate(toDateStr);
    
    dispatch(fetchTradeHistory({ fromDate: fromDateStr, toDate: toDateStr }));
    dispatch(setDateRange({ from: fromDateStr, to: toDateStr }));
  }, [dispatch]);

  const handleFilter = () => {
    dispatch(fetchTradeHistory({ fromDate, toDate }));
    dispatch(setDateRange({ from: fromDate, to: toDate }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Trade History</h1>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button onClick={handleFilter}>Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Buy Price</TableHead>
              <TableHead>Sell Price</TableHead>
              <TableHead>Profit/Loss</TableHead>
              <TableHead>StopLoss</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Quantity</TableHead>
              {/* <TableHead>Duration</TableHead> */}
           
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>₹{trade.buyPrice?.toFixed(2)}</TableCell>
                <TableCell>₹{trade.sellPrice?.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={trade.profitLoss >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                    {trade.profitLoss >= 0 ? '+' : ''}₹{trade.profitLoss.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>₹{trade.stopplose?.toFixed(2)}</TableCell>
                <TableCell>₹{trade.target?.toFixed(2)}</TableCell>
                <TableCell>{trade?.quantity}</TableCell>
                {/* <TableCell>{trade.duration}</TableCell> */}
                <TableCell className="capitalize">{trade.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {trades.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No trades found for the selected date range</p>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
