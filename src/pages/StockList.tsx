import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStocks, setPage, Stock } from '@/store/slices/stockSlice';
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
import { PlaceOrderModal } from '@/components/Stocks/PlaceOrderModal';
import { fetchScalpingStatus } from '@/store/slices/scalpingSlice';

const StockList = () => {
  const dispatch = useAppDispatch();
  const { stocks, total, page, loading } = useAppSelector((state) => state.stock);
  const production = useAppSelector((state) => state.scalping.production);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<Stock | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    dispatch(fetchStocks({ page, limit }));
    dispatch(fetchScalpingStatus());
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

  const openBuy = (stock: Stock) => {
    setSelected(stock);
    setOrderOpen(true);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Nifty 50 Options
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a contract → manual BUY for testing. Engine then runs target /
            add-lot / Plan B.
            {production ? (
              <span className="text-destructive font-medium"> Production ON.</span>
            ) : (
              <span> Paper mode.</span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', syncing && 'animate-spin')} />
          Run morning sync
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto -mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strike</TableHead>
              <TableHead className="hidden sm:table-cell">Expiry</TableHead>
              <TableHead>LTP</TableHead>
              <TableHead className="hidden md:table-cell">Lot</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-medium whitespace-nowrap text-xs sm:text-sm">
                  {stock.trading_symbol}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      stock.instrument_type === 'CE' ? 'default' : 'secondary'
                    }
                  >
                    {stock.instrument_type}
                  </Badge>
                </TableCell>
                <TableCell>{stock.strike_price ?? '—'}</TableCell>
                <TableCell className="text-sm hidden sm:table-cell">
                  {stock.expiry
                    ? new Date(stock.expiry).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  ₹{Number(stock.ltp || 0).toFixed(2)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {stock.lot_size}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openBuy(stock)}
                  >
                    Buy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {stocks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-10"
                >
                  No Nifty options found. Click &quot;Run morning sync&quot;
                  after connecting Upstox.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : (page - 1) * limit + 1} to{' '}
          {Math.min(page * limit, total)} of {total} contracts
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PlaceOrderModal
        open={orderOpen}
        onOpenChange={(open) => {
          setOrderOpen(open);
          if (!open) {
            dispatch(fetchScalpingStatus());
          }
        }}
        stock={selected}
      />
    </div>
  );
};

export default StockList;
