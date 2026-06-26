import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScalpingSystemStatus } from '@/store/slices/scalpingSlice';
import { Activity, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENGINE_STATE_LABELS: Record<string, string> = {
  MARKET_CLOSED: 'Market Closed',
  SCANNING: 'Scanning for Entry',
  IN_TRADE_OR_WAITING: 'In Trade / Waiting Fill',
};

const stateColor = (state: string) => {
  if (state === 'SCANNING') return 'text-primary';
  if (state === 'IN_TRADE_OR_WAITING') return 'text-success';
  return 'text-muted-foreground';
};

interface EngineStatusCardProps {
  status: ScalpingSystemStatus;
}

export const EngineStatusCard = ({ status }: EngineStatusCardProps) => (
  <Card className="bg-card border-border">
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Engine Status
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">State</span>
        <span className={cn('font-semibold', stateColor(status.engineState))}>
          {ENGINE_STATE_LABELS[status.engineState] ?? status.engineState}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Market</span>
        <Badge variant={status.marketOpen ? 'default' : 'secondary'}>
          {status.marketOpen ? 'Open' : 'Closed'}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Strategy</span>
        <Badge variant={status.isActive ? 'default' : 'destructive'}>
          {status.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Open Position</span>
        <span className="font-medium">{status.openPosition ? 'Yes' : 'No'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">SBIN LTP</span>
        <span className="font-medium">
          {status.underlyingLtp > 0
            ? `₹${status.underlyingLtp.toFixed(2)}`
            : '—'}
        </span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Circle
          className={cn(
            'h-3 w-3 fill-current',
            status.readyForTrading ? 'text-success' : 'text-muted-foreground',
          )}
        />
        <span className="text-sm">
          {status.readyForTrading
            ? 'Ready for trading'
            : 'Not ready — see issues below'}
        </span>
      </div>
      {status.todayStats && (
        <div className="rounded-lg border border-border p-3 text-sm space-y-1">
          <p className="font-medium">Today</p>
          <p className="text-muted-foreground">
            Trades: {status.todayStats.tradesCount} · P/L: ₹
            {status.todayStats.dailyPl.toFixed(2)}
            {status.todayStats.isHalted && ' · Halted'}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);
