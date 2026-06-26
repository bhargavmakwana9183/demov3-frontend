import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchTradeHistory,
  setDateRange,
  setHistoryStrategyFilter,
} from '@/store/slices/tradeHistorySlice';
import { StrategyFilter } from '@/components/Trades/StrategyFilter';
import { ExitReasonBadge } from '@/components/Trades/ExitReasonBadge';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StrategyFilterValue } from '@/lib/tradeFormat';
import { cn } from '@/lib/utils';

const TradeHistory = () => {
  const dispatch = useAppDispatch();
  const { trades, loading, strategyFilter } = useAppSelector(
    (state) => state.tradeHistory,
  );
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate(),
    );
    const fromDateStr = lastMonth.toISOString().split('T')[0];
    const toDateStr = today.toISOString().split('T')[0];

    setFromDate(fromDateStr);
    setToDate(toDateStr);

    dispatch(
      fetchTradeHistory({
        fromDate: fromDateStr,
        toDate: toDateStr,
        strategyFilter: 'SCALLPING',
      }),
    );
    dispatch(setDateRange({ from: fromDateStr, to: toDateStr }));
  }, [dispatch]);

  const handleFilter = () => {
    dispatch(
      fetchTradeHistory({ fromDate, toDate, strategyFilter }),
    );
    dispatch(setDateRange({ from: fromDate, to: toDate }));
  };

  const handleStrategyChange = (value: StrategyFilterValue) => {
    dispatch(setHistoryStrategyFilter(value));
    dispatch(fetchTradeHistory({ fromDate, toDate, strategyFilter: value }));
  };

  const totalNetPl = trades.reduce((sum, t) => sum + (t.netPl ?? t.profitLoss), 0);

  if (loading && trades.length === 0) {
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {trades.length} trades · Net P/L{' '}
            <span
              className={cn(
                'font-medium',
                totalNetPl >= 0 ? 'text-success' : 'text-danger',
              )}
            >
              {totalNetPl >= 0 ? '+' : ''}₹{totalNetPl.toFixed(2)}
            </span>
          </p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[160px]">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <StrategyFilter
              value={strategyFilter}
              onChange={handleStrategyChange}
            />
            <Button onClick={handleFilter}>Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Buy</TableHead>
              <TableHead>Sell</TableHead>
              <TableHead>Gross P/L</TableHead>
              <TableHead>Net P/L</TableHead>
              <TableHead>Charges</TableHead>
              <TableHead>Exit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => {
              const netPl = trade.netPl ?? trade.profitLoss;
              return (
                <TableRow key={trade.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(trade.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {trade.strategy_name ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {trade.instrument_type ?? '—'}
                  </TableCell>
                  <TableCell>₹{trade.buyPrice?.toFixed(2)}</TableCell>
                  <TableCell>₹{trade.sellPrice?.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        trade.profitLoss >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      {trade.profitLoss >= 0 ? '+' : ''}₹
                      {trade.profitLoss.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'font-semibold',
                        netPl >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      {netPl >= 0 ? '+' : ''}₹{netPl.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    ₹{(trade.charges ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <ExitReasonBadge reason={trade.exit_reason} />
                  </TableCell>
                  <TableCell className="capitalize">{trade.status}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {trades.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No trades found for the selected filters
          </p>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
