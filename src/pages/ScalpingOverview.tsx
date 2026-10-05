import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchScalpingStatus,
  fetchScalpingPerformance,
  toggleLiveTrading,
  setNiftyNotify,
} from '@/store/slices/scalpingSlice';
import { EngineStatusCard } from '@/components/Scalping/EngineStatusCard';
import { TradingControls } from '@/components/Scalping/TradingControls';
import { IssuesPanel } from '@/components/Scalping/IssuesPanel';
import { ScalpingSubNav } from '@/components/Scalping/ScalpingSubNav';
import { ScalpingKpiCards } from '@/components/Dashboard/ScalpingKpiCards';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';
import { stockAPI } from '@/lib/api';

const REFRESH_MS = 30_000;

const ScalpingOverview = () => {
  const dispatch = useAppDispatch();
  const {
    status,
    performance,
    mode,
    isLive,
    production,
    statusLoading,
    togglingLive,
    statusError,
    loading: perfLoading,
    lastNotify,
  } = useAppSelector((state) => state.scalping);

  const refresh = useCallback(() => {
    dispatch(fetchScalpingStatus());
    dispatch(fetchScalpingPerformance(7));
  }, [dispatch]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    socket.on('nifty_scalp_notify', (payload: { type?: string; event?: string; message?: string }) => {
      const event = payload?.type || payload?.event || 'NOTIFY';
      const message = payload?.message || 'Nifty scalp event';
      dispatch(setNiftyNotify({ event, message }));
      toast.message(event, { description: message });
      dispatch(fetchScalpingStatus());
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const handleToggleProduction = async (next: boolean) => {
    try {
      const result = await dispatch(toggleLiveTrading(next)).unwrap();
      toast.success(
        result.production
          ? 'Production ON — live Upstox orders enabled'
          : 'Production OFF — paper mode',
      );
      dispatch(fetchScalpingStatus());
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to toggle production');
    }
  };

  const handleSync = async (kind: 'chain' | 'hedging') => {
    try {
      if (kind === 'chain') await stockAPI.syncNiftyChain();
      else await stockAPI.syncNiftyHedging();
      toast.success(kind === 'chain' ? 'Nifty option chain synced' : 'Hedging options synced');
      refresh();
    } catch {
      toast.error('Sync failed — check Upstox token');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nifty 50 Scalper</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Options scalping · EMA 9/21 + RSI · auto-refreshes every 30s
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">KPI Dashboard</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSync('chain')}>
            Sync Chain
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSync('hedging')}>
            Sync Hedging
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={statusLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <ScalpingSubNav />

      {lastNotify && (
        <Card className="bg-card border-border">
          <CardContent className="py-3 text-sm flex flex-wrap gap-2 justify-between">
            <span>
              <strong>{lastNotify.event}</strong> — {lastNotify.message}
            </span>
            <span className="text-muted-foreground text-xs">
              {new Date(lastNotify.at).toLocaleTimeString()}
            </span>
          </CardContent>
        </Card>
      )}

      {statusLoading && !status ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : statusError ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-4">
          Could not load Nifty engine status — {statusError}. Ensure{' '}
          <code className="text-xs">/instrument/nifty-scalp/status</code> is
          running.
        </p>
      ) : status ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <EngineStatusCard status={status} />
            <TradingControls
              mode={mode}
              isLive={isLive}
              production={production || status.production}
              liveTradingEnabled={status.liveTradingEnabled}
              togglingLive={togglingLive}
              onToggleProduction={handleToggleProduction}
            />
          </div>

          {status.openPosition && status.trade && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Live Position Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Symbol</p>
                  <p className="font-medium">{status.trade.trading_symbol}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gross P/L</p>
                  <p className="font-medium">₹{Number(status.trade.pl ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Charges</p>
                  <p className="font-medium">₹{Number(status.trade.charges ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net P/L</p>
                  <p className="font-medium">
                    ₹{Number(status.trade.net_pl ?? status.trade.pl ?? 0).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <IssuesPanel issues={status.issues || []} />
        </>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Last 7 Days KPIs</h2>
        {perfLoading && !performance ? (
          <Skeleton className="h-28" />
        ) : performance ? (
          <ScalpingKpiCards performance={performance} />
        ) : null}
      </section>
    </div>
  );
};

export default ScalpingOverview;
