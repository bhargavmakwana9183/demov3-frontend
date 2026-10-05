import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStocks, setPage } from '@/store/slices/stockSlice';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { stockAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

const StockList = () => {
  const dispatch = useAppDispatch();
  const { stocks, total, page, loading } = useAppSelector((state) => state.stock);
  const [syncing, setSyncing] = useState(false);

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    dispatch(fetchStocks({ page, limit }));
  }, [dispatch, page]);

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await stockAPI.syncNiftyMorning();
      toast.success('Nifty option chain & hedging synced');
      dispatch(fetchStocks({ page, limit }));
    } catch {
      toast.error('Sync failed — check Upstox token');
    } finally {
      setSyncing(false);
    }
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nifty 50 Options</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live hedging universe for the Nifty Options Scalper
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={cn('h-4 w-4 mr-2', syncing && 'animate-spin')} />
          Run morning sync
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strike</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>LTP</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-medium">{stock.trading_symbol}</TableCell>
                <TableCell>
                  <Badge variant={stock.instrument_type === 'CE' ? 'default' : 'secondary'}>
                    {stock.instrument_type}
                  </Badge>
                </TableCell>
                <TableCell>{(stock as { strike_price?: number }).strike_price ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  {(stock as { expiry?: string }).expiry
                    ? new Date((stock as { expiry?: string }).expiry!).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell>₹{Number(stock.ltp || 0).toFixed(2)}</TableCell>
                <TableCell>{stock.lot_size}</TableCell>
                <TableCell>
                  <Badge variant="outline">Subscribed</Badge>
                </TableCell>
              </TableRow>
            ))}
            {stocks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No Nifty options found. Click &quot;Sync Nifty Chain&quot; after connecting Upstox.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : (page - 1) * limit + 1} to{' '}
          {Math.min(page * limit, total)} of {total} contracts
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockList;
