import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { placeManualNiftyOrder } from '@/store/slices/stockSlice';
import { toast } from 'sonner';
import { Stock } from '@/store/slices/stockSlice';

interface PlaceOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: Stock | null;
}

export const PlaceOrderModal = ({
  open,
  onOpenChange,
  stock,
}: PlaceOrderModalProps) => {
  const dispatch = useAppDispatch();
  const orderPlacing = useAppSelector((state) => state.stock.orderPlacing);
  const production = useAppSelector((state) => state.scalping.production);
  const [lots, setLots] = useState('1');
  const [buyPrice, setBuyPrice] = useState('');

  useEffect(() => {
    if (stock && open) {
      setLots('1');
      setBuyPrice(String(Number(stock.ltp || stock.buyPrice || 0).toFixed(2)));
    }
  }, [stock, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stock?.instrument_key && !stock?.id) {
      toast.error('Missing instrument key');
      return;
    }

    const lotsNum = parseInt(lots, 10);
    const priceNum = parseFloat(buyPrice);
    if (!lotsNum || lotsNum < 1) {
      toast.error('Lots must be at least 1');
      return;
    }
    if (!priceNum || priceNum <= 0) {
      toast.error('Enter a valid buy price');
      return;
    }

    try {
      const result = await dispatch(
        placeManualNiftyOrder({
          hedgingOptionId: stock.id,
          instrumentKey: stock.instrument_key,
          lots: lotsNum,
          buyPrice: priceNum,
        }),
      ).unwrap();

      const fill = result?.data?.fillPrice ?? priceNum;
      const target = result?.data?.targetPrice;
      toast.success(
        result?.data?.liveMode
          ? `Upstox BUY confirmed @ ₹${Number(fill).toFixed(2)} — engine managing`
          : `Paper BUY @ ₹${Number(fill).toFixed(2)} — engine managing`,
        {
          description: target
            ? `Target ≈ ₹${Number(target).toFixed(2)} · Plan B / add-lot active`
            : 'Target / Plan B / add-lot follow Nifty engine',
        },
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(
        typeof err === 'string'
          ? err
          : (err as { message?: string })?.message ||
              'Failed to place manual order',
      );
    }
  };

  if (!stock) return null;

  const ltp = Number(stock.ltp) || 0;
  const lotSize = Number(stock.lot_size) || 25;
  const lotsNum = Math.max(1, parseInt(lots, 10) || 1);
  const priceNum = parseFloat(buyPrice) || ltp;
  const approxNotional = priceNum * lotSize * lotsNum;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Manual test entry</DialogTitle>
          <DialogDescription>
            {stock.trading_symbol} · LTP ₹{ltp.toFixed(2)} · lot {lotSize}
            <br />
            Opens a Nifty scalp trade the engine will manage (target, add-lot,
            Plan B).{' '}
            {production ? (
              <span className="text-destructive font-medium">
                Production ON — real Upstox MARKET BUY
              </span>
            ) : (
              <span>Paper mode — no Upstox order</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lots">Lots</Label>
            <Input
              id="lots"
              type="number"
              min={1}
              max={20}
              value={lots}
              onChange={(e) => setLots(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Qty sent to Upstox = lots × {lotSize} = {lotsNum * lotSize}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyPrice">
              {production ? 'Reference buy price (fill uses Upstox avg)' : 'Buy price'}
            </Label>
            <Input
              id="buyPrice"
              type="number"
              step="0.05"
              min="0.05"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Approx notional ₹{approxNotional.toFixed(0)}
              {production
                ? ' · live fill price comes from Upstox confirmation'
                : ''}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={orderPlacing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={orderPlacing}>
              {orderPlacing
                ? production
                  ? 'Confirming on Upstox…'
                  : 'Opening…'
                : production
                  ? 'Place Upstox BUY'
                  : 'Open paper trade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
