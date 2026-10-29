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
          <span className="font-medium text-right">
            {status.expiry || '—'}
            {status.isExpiryDay
              ? ` · next week (skip ${status.nearestExpiry})`
              : ''}
          </span>
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
            <div className="font-medium truncate flex items-center gap-2">
              <span>
                {trade.trading_symbol || 'Active trade'}{' '}
                {trade.instrument_type ? `(${trade.instrument_type})` : ''}
              </span>
              {trade.plan_b_started && (
                <Badge className="text-xs bg-amber-500 text-black hover:bg-amber-500">
                  Plan B
                </Badge>
              )}
            </div>
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
            1 lot
            {status.config.breakeven_arm_rs != null
              ? ` · breakeven lock at +₹${status.config.breakeven_arm_rs} (1m close${
                  status.config.breakeven_fast_drop_points != null
                    ? `, or −${status.config.breakeven_fast_drop_points} pts fast`
                    : ''
                })`
              : ''}
            {' · '}Trail arms at +₹
            {status.config.trail_arm_rs ?? status.config.target_profit_rs}
            {status.config.trail_points != null
              ? ` (peak − ${status.config.trail_points} pts${
                  status.config.trail_floor_rs != null
                    ? `, keeps ≥ +₹${status.config.trail_floor_rs}`
                    : ''
                })`
              : ''}
            {status.config.profit_cap_rs != null
              ? ` · cap ₹${status.config.profit_cap_rs}`
              : ''}
            {status.config.stop_points != null
              ? ` · stop −${status.config.stop_points} pts`
              : ''}
            {' · '}Overnight{' '}
            {status.config.enable_overnight_carry ? 'ON' : 'OFF'}
          </p>
          {status.config.daily_max_loss_rs != null && (
            <p className="text-muted-foreground">
              Day: stop at −₹{status.config.daily_max_loss_rs}, lock at +₹
              {status.config.daily_profit_lock_rs}, max{' '}
              {status.config.daily_max_trades} trades
              {status.config.scratch_rs != null
                ? ` · scratch ±₹${status.config.scratch_rs} is not a loss`
                : ''}
            </p>
          )}
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
