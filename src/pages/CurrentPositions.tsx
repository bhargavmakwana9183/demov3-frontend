import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCurrentPositions,
  updatePositionFromSocket,
  setPositionStrategyFilter,
  setIncludeClosedPositions,
} from '@/store/slices/positionSlice';
import { StrategyFilter } from '@/components/Trades/StrategyFilter';
import { ExitReasonBadge } from '@/components/Trades/ExitReasonBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';
import { StrategyFilterValue } from '@/lib/tradeFormat';
import { cn } from '@/lib/utils';

const CurrentPositions = () => {
  const dispatch = useAppDispatch();
  const { positions, loading, strategyFilter, includeClosed } = useAppSelector(
    (state) => state.position,
  );

  const loadPositions = useCallback(() => {
    dispatch(
      fetchCurrentPositions({
        strategyFilter,
        includeClosed,
      }),
    );
  }, [dispatch, strategyFilter, includeClosed]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    socket.on('stock_data', (data) => {
      dispatch(updatePositionFromSocket(data));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const handleStrategyChange = (value: StrategyFilterValue) => {
    dispatch(setPositionStrategyFilter(value));
  };

  const handleIncludeClosedChange = (checked: boolean) => {
    dispatch(setIncludeClosedPositions(checked));
  };

  if (loading && positions.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  const scalpingCount = positions.filter(
    (p) => p.strategy_name === 'SCALLPING',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Current Positions</h1>
          <p className="text-sm text-muted-foreground">
            Live updates via WebSocket · {positions.length} position
            {positions.length !== 1 ? 's' : ''} today
            {strategyFilter === 'SCALLPING' && scalpingCount > 0
              ? ` (${scalpingCount} SCALLPING)`
              : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPositions} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6 flex flex-wrap gap-6 items-end">
          <StrategyFilter value={strategyFilter} onChange={handleStrategyChange} />
          <div className="flex items-center gap-3 pb-1">
            <Switch
              id="include-closed"
              checked={includeClosed}
              onCheckedChange={handleIncludeClosedChange}
            />
            <Label htmlFor="include-closed" className="cursor-pointer">
              Include closed today
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {positions.map((position) => {
          const isScalping = position.strategy_name === 'SCALLPING';
          const displayPl = position.netPl ?? position.profitLoss;

          return (
            <Card
              key={position.id}
              className={cn(
                'bg-card border-border',
                isScalping && 'ring-1 ring-primary/30',
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2 gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {position.symbol}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {position.strategy_name}
                    </Badge>
                    {position.instrument_type && (
                      <Badge variant="secondary" className="text-xs">
                        {position.instrument_type}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant={position.status === 'in_trade' ? 'default' : 'secondary'}
                >
                  {position.status === 'in_trade' ? 'In Trade' : 'Closed'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Trade Time</p>
                    <p className="font-medium text-xs">
                      {new Date(position.trade_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Qty</p>
                    <p className="font-medium">{position.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Buy</p>
                    <p className="font-medium">₹{position.buyPrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">LTP</p>
                    <p className="font-medium">₹{position.currentLTP?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-medium">₹{position.target?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stop</p>
                    <p className="font-medium">₹{position.stopploss?.toFixed(2)}</p>
                  </div>
                  {position.highest_ltp != null && position.highest_ltp > 0 && (
                    <>
                      <div>
                        <p className="text-muted-foreground">High LTP</p>
                        <p className="font-medium">
                          ₹{position.highest_ltp.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Charges</p>
                        <p className="font-medium">₹{(position.charges ?? 0).toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>

                {position.exit_reason && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Exit:</span>
                    <ExitReasonBadge reason={position.exit_reason} />
                  </div>
                )}

                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Gross P/L</p>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        position.profitLoss >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      ₹{position.profitLoss?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Net P/L</p>
                    <div
                      className={cn(
                        'flex items-center gap-1 font-bold',
                        displayPl >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      {displayPl >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>₹{Math.abs(displayPl).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No positions found for the selected strategy
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrentPositions;
