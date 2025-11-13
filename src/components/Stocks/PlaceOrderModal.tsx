import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { placeOrder } from '@/store/slices/stockSlice';
import { toast } from 'sonner';
import { Stock } from '@/store/slices/stockSlice';

interface PlaceOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: Stock | null;
}

export const PlaceOrderModal = ({ open, onOpenChange, stock }: PlaceOrderModalProps) => {
  const dispatch = useAppDispatch();
  const orderPlacing = useAppSelector((state) => state.stock.orderPlacing);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stock) return;

    try {
      await dispatch(
        placeOrder({
          stockId: stock.id,
          type: orderType,
          quantity: parseInt(quantity),
          price: parseFloat(price),
        })
      ).unwrap();

      toast.success('Order placed successfully!');
      onOpenChange(false);
      setQuantity('');
      setPrice('');
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  if (!stock) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Place Order - {stock.symbol}</DialogTitle>
          <DialogDescription>
            Current LTP: ₹{stock.currentLTP.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Order Type</Label>
            <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as 'buy' | 'sell')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="buy" />
                <Label htmlFor="buy" className="cursor-pointer">Buy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label htmlFor="sell" className="cursor-pointer">Sell</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
            />
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
              {orderPlacing ? 'Placing...' : 'Place Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
