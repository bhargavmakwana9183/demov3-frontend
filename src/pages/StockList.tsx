import { useCallback, useEffect, useState } from 'react';
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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { stockAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PlaceOrderModal } from '@/components/Stocks/PlaceOrderModal';
import { fetchScalpingStatus } from '@/store/slices/scalpingSlice';

const LIMIT = 20;
const AUTO_REFRESH_MS = 15_000;

const StockList = () => {
  const dispatch = useAppDispatch();
  const { stocks, total, page, loading } = useAppSelector((state) => state.stock);
  const production = useAppSelector((state) => state.scalping.production);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<Stock | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil((total || 0) / LIMIT));

  const loadPage = useCallback(
    (pageNum: number, silent = false) => {
      dispatch(fetchStocks({ page: pageNum, limit: LIMIT, silent })).finally(
        () => {
          setLastRefreshAt(new Date().toLocaleTimeString());
        },
      );
    },
    [dispatch],
  );

  useEffect(() => {
    dispatch(fetchScalpingStatus());
  }, [dispatch]);

  useEffect(() => {
    // Clamp page if total shrinks after refresh
    if (total > 0 && page > totalPages) {
      dispatch(setPage(totalPages));
    }
  }, [dispatch, page, total, totalPages]);

  useEffect(() => {
    loadPage(page, false);
  }, [page, loadPage]);

  // Auto-refresh current page every 15s (keeps LTP fresh)
  useEffect(() => {
    const id = window.setInterval(() => {
      loadPage(page, true);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [page, loadPage]);

  const handlePageChange = (newPage: number) => {
    const next = Math.min(Math.max(1, newPage), totalPages);
    if (next !== page) dispatch(setPage(next));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await stockAPI.syncNiftyMorning();
      toast.success('Nifty option chain & hedging synced');
      loadPage(page, false);
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

  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Nifty 50 Options
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sorted by LTP high → low · auto-refresh every 15s.
            {production ? (
              <span className="text-destructive font-medium"> Production ON.</span>
            ) : (
              <span> Paper mode.</span>
            )}
            {lastRefreshAt && (
              <span className="text-xs ml-1">Updated {lastRefreshAt}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(page, false)}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', syncing && 'animate-spin')} />
            Morning sync
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto -mx-0 relative">
        {loading && stocks.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="text-[10px] bg-background/80">
              Updating…
            </Badge>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">#</TableHead>
              <TableHead className="whitespace-nowrap">Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strike</TableHead>
              <TableHead className="hidden sm:table-cell">Expiry</TableHead>
              <TableHead className="whitespace-nowrap">LTP ↓</TableHead>
              <TableHead className="hidden md:table-cell">Lot</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock, idx) => (
              <TableRow key={stock.id}>
                <TableCell className="text-muted-foreground text-xs">
                  {from + idx}
                </TableCell>
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
                <TableCell className="whitespace-nowrap font-semibold tabular-nums">
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
                  colSpan={8}
                  className="text-center text-muted-foreground py-10"
                >
                  No Nifty options found. Click &quot;Morning sync&quot; after
                  connecting Upstox.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing {from}–{to} of {total} · Page {page} / {totalPages}
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handlePageChange(1)}
            disabled={page <= 1 || loading}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handlePageChange(totalPages)}
            disabled={page >= totalPages || loading}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
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
