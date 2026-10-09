import { useEffect, useCallback, useRef, useState } from 'react';
import { tradeHistoryAPI } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCurrentPositions,
  updatePositionFromSocket,
  setPositionStrategyFilter,
  setIncludeClosedPositions,
  setPositionsSocketConnected,
} from '@/store/slices/positionSlice';
import { StrategyFilter } from '@/components/Trades/StrategyFilter';
import { ExitReasonBadge } from '@/components/Trades/ExitReasonBadge';
import { TradeLegHistory } from '@/components/Trades/TradeLegHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, RefreshCw, Radio } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';
import { toast } from 'sonner';
import { StrategyFilterValue } from '@/lib/tradeFormat';
import { cn } from '@/lib/utils';

const formatMoney = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `₹${Number(value).toFixed(2)}`;
};

const CurrentPositions = () => {
  const dispatch = useAppDispatch();
  const {
    positions,
    loading,
    strategyFilter,
    includeClosed,
    socketConnected,
    lastSocketAt,
  } = useAppSelector((state) => state.position);
  const [flashIds, setFlashIds] = useState<Record<string, 'up' | 'down'>>({});
  const [eodBusyId, setEodBusyId] = useState<string | null>(null);
  const prevLtp = useRef<Record<string, number>>({});

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
    const socket: Socket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      dispatch(setPositionsSocketConnected(true));
    });
    socket.on('disconnect', () => {
      dispatch(setPositionsSocketConnected(false));
    });

    socket.on('stock_data', (payload: { data?: unknown }) => {
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const nextFlash: Record<string, 'up' | 'down'> = {};
      for (const row of rows as Array<{ id?: string; currentLTP?: number }>) {
        if (!row?.id || row.currentLTP == null) continue;
        const id = String(row.id);
        const ltp = Number(row.currentLTP);
        const prev = prevLtp.current[id];
        if (prev != null && ltp !== prev) {
          nextFlash[id] = ltp > prev ? 'up' : 'down';
        }
        prevLtp.current[id] = ltp;
      }
      if (Object.keys(nextFlash).length) {
        setFlashIds((f) => ({ ...f, ...nextFlash }));
        window.setTimeout(() => {
          setFlashIds((f) => {
            const copy = { ...f };
            for (const id of Object.keys(nextFlash)) delete copy[id];
            return copy;
          });
        }, 600);
      }
      dispatch(updatePositionFromSocket(payload));
    });

    // Also refresh REST periodically as a safety net
    const poll = window.setInterval(loadPositions, 30_000);

    return () => {
      window.clearInterval(poll);
      socket.disconnect();
      dispatch(setPositionsSocketConnected(false));
    };
  }, [dispatch, loadPositions]);

  const handleStrategyChange = (value: StrategyFilterValue) => {
    dispatch(setPositionStrategyFilter(value));
  };

  const handleIncludeClosedChange = (checked: boolean) => {
    dispatch(setIncludeClosedPositions(checked));
  };

  const handleEodChoice = async (
    tradeId: string,
    action: 'carry' | 'sell',
  ) => {
    setEodBusyId(tradeId);
    try {
      await tradeHistoryAPI.eodDecision(tradeId, action);
      toast(
        action === 'carry'
          ? 'Trade will be carried overnight'
          : 'Manual sell sent',
      );
      loadPositions();
    } catch {
      toast.error(
        action === 'carry'
          ? 'Could not mark carry forward'
          : 'Manual sell was not confirmed',
      );
    } finally {
      setEodBusyId(null);
    }
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
    (p) => p.strategy_name === 'NIFTY_OPTIONS_SCALP',
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Current Positions
          </h1>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border',
                socketConnected
                  ? 'border-emerald-500/40 text-emerald-600'
                  : 'border-border text-muted-foreground',
              )}
            >
              <Radio
                className={cn(
                  'h-3 w-3',
                  socketConnected && 'animate-pulse text-emerald-500',
                )}
              />
              {socketConnected ? 'Live' : 'Offline'}
            </span>
            <span>
              {positions.length} today
              {strategyFilter === 'NIFTY_OPTIONS_SCALP' && scalpingCount > 0
                ? ` · ${scalpingCount} Nifty`
                : ''}
            </span>
            {lastSocketAt && (
              <span className="text-xs">
                tick {new Date(lastSocketAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPositions}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-4 sm:pt-6 flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 sm:items-end">
          <StrategyFilter
            value={strategyFilter}
            onChange={handleStrategyChange}
          />
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

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((position) => {
          const isScalping = position.strategy_name === 'NIFTY_OPTIONS_SCALP';
          const displayPl = position.netPl ?? position.profitLoss;
          const flash = flashIds[String(position.id)];
          const isOpen = position.status === 'in_trade';

          return (
            <Card
              key={position.id}
              className={cn(
                'bg-card border-border transition-colors',
                isScalping && 'ring-1 ring-primary/30',
                flash === 'up' && 'ring-1 ring-emerald-500/50',
                flash === 'down' && 'ring-1 ring-rose-500/50',
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
                    {isOpen && socketConnected && (
                      <Badge className="text-xs bg-emerald-600 hover:bg-emerald-600">
                        LIVE
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant={isOpen ? 'default' : 'secondary'}
                >
                  {isOpen ? 'In Trade' : 'Closed'}
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
                    <p className="font-medium">
                      {position.lots != null
                        ? `${position.lots} lot(s) · ${position.quantity}`
                        : position.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Buy (avg)</p>
                    <p className="font-medium">
                      {formatMoney(position.buyPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {isOpen ? 'LTP (live)' : 'LTP'}
                    </p>
                    <p
                      className={cn(
                        'font-semibold tabular-nums',
                        flash === 'up' && 'text-emerald-600',
                        flash === 'down' && 'text-rose-600',
                      )}
                    >
                      {formatMoney(position.currentLTP)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sell</p>
                    <p className="font-medium">
                      {isOpen
                        ? '—'
                        : formatMoney(position.sellPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-medium">
                      {formatMoney(position.target)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stop</p>
                    <p className="font-medium">
                      {formatMoney(position.stopploss)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Charges</p>
                    <p className="font-medium">
                      {formatMoney(position.charges)}
                    </p>
                  </div>
                </div>

                {position.exit_reason && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Exit:</span>
                    <ExitReasonBadge reason={position.exit_reason} />
                  </div>
                )}

                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {isOpen ? 'Gross P/L (live)' : 'Gross P/L'}
                    </p>
                    <span
                      className={cn(
                        'text-sm font-medium tabular-nums',
                        position.profitLoss >= 0
                          ? 'text-success'
                          : 'text-danger',
                      )}
                    >
                      {position.profitLoss >= 0 ? '+' : ''}
                      {formatMoney(position.profitLoss)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {isOpen ? 'Net P/L (live)' : 'Net P/L'}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1 font-bold tabular-nums',
                        displayPl >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      {displayPl >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {displayPl >= 0 ? '+' : '-'}
                        {formatMoney(Math.abs(displayPl))}
                      </span>
                    </div>
                  </div>
                </div>

                {isOpen && position.eodDecision === 'REQUIRED' && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-xs">
                      After 3:10 this trade is ₹500 or more in loss. Carry it
                      overnight or sell it now.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={eodBusyId === String(position.id)}
                        onClick={() =>
                          handleEodChoice(String(position.id), 'carry')
                        }
                      >
                        Carry forward
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={eodBusyId === String(position.id)}
                        onClick={() =>
                          handleEodChoice(String(position.id), 'sell')
                        }
                      >
                        Manual sell
                      </Button>
                    </div>
                  </div>
                )}

                {isOpen && position.eodDecision === 'CARRY' && (
                  <p className="text-xs text-muted-foreground">
                    Marked to carry forward. Target, add-lot, and Plan B still
                    run.
                  </p>
                )}

                {(position.legCount ?? 0) > 0 && (
                  <div className="pt-1 border-t border-border">
                    <TradeLegHistory
                      tradeId={String(position.id)}
                      tradeUuid={position.tradeUuid}
                      legCount={position.legCount}
                      compact
                    />
                  </div>
                )}
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
