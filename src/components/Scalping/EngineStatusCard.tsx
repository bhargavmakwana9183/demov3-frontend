import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScalpingSystemStatus } from '@/store/slices/scalpingSlice';
import { Activity, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENGINE_STATE_LABELS: Record<string, string> = {
  INACTIVE: 'Inactive',
  MARKET_CLOSED: 'Market Closed',
  SCANNING: 'Scanning for Entry',
  IN_TRADE: 'In Trade',
  AVERAGING: 'Averaging',
  RECOVERY: 'Plan B Recovery',
  CARRY_FORWARD: 'Overnight Carry',
};

const stateColor = (state: string) => {
  if (state === 'SCANNING') return 'text-primary';
  if (state === 'IN_TRADE' || state === 'AVERAGING') return 'text-success';
  if (state === 'RECOVERY') return 'text-warning';
  if (state === 'CARRY_FORWARD') return 'text-muted-foreground';
  return 'text-muted-foreground';
};

interface EngineStatusCardProps {
  status: ScalpingSystemStatus;
}

export const EngineStatusCard = ({ status }: EngineStatusCardProps) => {
  const trade = status.trade;
  const grossPl = Number(trade?.pl ?? 0);
  const netPl = Number(trade?.net_pl ?? trade?.pl ?? 0);
  const charges = Number(trade?.charges ?? 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Nifty 50 Engine
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
          <span className="text-sm text-muted-foreground">Strategy</span>
          <Badge variant={status.isActive ? 'default' : 'destructive'}>
            {status.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Production</span>
          <Badge variant={status.production ? 'destructive' : 'secondary'}>
            {status.production ? 'ON (live orders)' : 'OFF (paper)'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className="font-medium">
            ₹{status.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Expiry</span>
          <span className="font-medium">{status.expiry || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Hedging options</span>
          <span className="font-medium">{status.hedgingCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Open Position</span>
          <span className="font-medium">{status.openPosition ? 'Yes' : 'No'}</span>
        </div>

        {trade && (
          <div className="rounded-lg border border-border p-3 text-sm space-y-2">
            <p className="font-medium truncate">
              {trade.trading_symbol || 'Active trade'}{' '}
              {trade.instrument_type ? `(${trade.instrument_type})` : ''}
            </p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Buy ₹{Number(trade.buy_price ?? 0).toFixed(2)}</span>
              <span>LTP ₹{Number(trade.ltp ?? 0).toFixed(2)}</span>
              <span>Target ₹{Number(trade.target_price ?? 0).toFixed(2)}</span>
              <span>
                Qty {(Number(trade.qty ?? 0) * Number(trade.lot_size ?? 1)).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border">
              <span>Gross P/L</span>
              <span className={grossPl >= 0 ? 'text-success' : 'text-danger'}>
                ₹{grossPl.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Charges</span>
              <span>₹{charges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Net P/L</span>
              <span className={netPl >= 0 ? 'text-success' : 'text-danger'}>
                ₹{netPl.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border p-3 text-sm space-y-1">
          <p className="font-medium">Config</p>
          <p className="text-muted-foreground">
            Target ₹{status.config.target_profit_rs} · Add lot −
            {status.config.add_lot_points} pts · Plan B{' '}
            {status.config.enable_plan_b ? 'ON' : 'OFF'} · Overnight{' '}
            {status.config.enable_overnight_carry ? 'ON' : 'OFF'}
          </p>
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
      </CardContent>
    </Card>
  );
};
