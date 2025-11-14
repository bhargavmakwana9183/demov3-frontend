import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStocks, makeAsActiveStocks, setPage } from '@/store/slices/stockSlice';
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
import { PlaceOrderModal } from '@/components/Stocks/PlaceOrderModal';
import { Stock } from '@/store/slices/stockSlice';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const StockList = () => {
  const dispatch = useAppDispatch();
  const { stocks, total, page, loading } = useAppSelector((state) => state.stock);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    dispatch(fetchStocks({ page, limit }));
  }, [dispatch, page]);

  const handlePlaceOrder = (stock: Stock) => {
    setSelectedStock(stock);
    setOrderModalOpen(true);
  };
  const handleMakeActive = (id: string) => {
    dispatch(makeAsActiveStocks({ id }));
    dispatch(fetchStocks({ page, limit }));
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Stock List</h1>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              {/* <TableHead>Buy Price</TableHead> */}
              <TableHead>Current LTP</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-medium">{stock.trading_symbol}</TableCell>
                <TableCell>{stock.instrument_type}</TableCell>
                <TableCell>{stock.name}</TableCell>
                {/* <TableCell>₹{stock.buyPrice}</TableCell> */}
                <TableCell>₹{stock.ltp}</TableCell>
                <TableCell>{stock.lot_size}</TableCell>
                <TableCell>

                  {
                    stock.is_active?<Button
                    size="sm"
                    disabled
                  >
                  Active
                  </Button>:<Button
                    size="sm"
                    onClick={() => handleMakeActive(stock.id)}
                  >
                  Make as Active
                  </Button>

                  }

                 
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handlePlaceOrder(stock)}
                  >
                    Place Order
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} stocks
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
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PlaceOrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        stock={selectedStock}
      />
    </div>
  );
};

export default StockList;
