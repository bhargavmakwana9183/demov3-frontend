import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BacktestTrade } from '@/store/slices/scalpingSlice';
import { ExitReasonBadge } from '@/components/Trades/ExitReasonBadge';
import { cn } from '@/lib/utils';

interface BacktestTradesTableProps {
  trades: BacktestTrade[];
}

export const BacktestTradesTable = ({ trades }: BacktestTradesTableProps) => (
  <div className="bg-card border border-border rounded-lg overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Entry</TableHead>
          <TableHead>Exit</TableHead>
          <TableHead>Signal</TableHead>
          <TableHead>Buy</TableHead>
          <TableHead>Sell</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Gross P/L</TableHead>
          <TableHead>Net P/L</TableHead>
          <TableHead>Exit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell className="text-xs whitespace-nowrap">
              {new Date(trade.entryTime).toLocaleString()}
            </TableCell>
            <TableCell className="text-xs whitespace-nowrap">
              {new Date(trade.exitTime).toLocaleString()}
            </TableCell>
            <TableCell>{trade.signalType}</TableCell>
            <TableCell>₹{trade.buyPrice.toFixed(2)}</TableCell>
            <TableCell>₹{trade.sellPrice.toFixed(2)}</TableCell>
            <TableCell>{trade.qty}</TableCell>
            <TableCell
              className={cn(
                trade.grossPl >= 0 ? 'text-success' : 'text-danger',
              )}
            >
              ₹{trade.grossPl.toFixed(2)}
            </TableCell>
            <TableCell
              className={cn(
                'font-medium',
                trade.netPl >= 0 ? 'text-success' : 'text-danger',
              )}
            >
              ₹{trade.netPl.toFixed(2)}
            </TableCell>
            <TableCell>
              <ExitReasonBadge reason={trade.exitReason} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {trades.length === 0 && (
      <p className="text-sm text-muted-foreground text-center py-8">
        No simulated trades in this period
      </p>
    )}
  </div>
);
