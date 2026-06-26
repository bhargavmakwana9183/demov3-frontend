import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchScalpingStatus,
  fetchScalpingPerformance,
  toggleLiveTrading,
  updateTradingMode,
  TradingMode,
} from '@/store/slices/scalpingSlice';
import { EngineStatusCard } from '@/components/Scalping/EngineStatusCard';
import { TradingControls } from '@/components/Scalping/TradingControls';
import { StrikeCard } from '@/components/Scalping/StrikeCard';
import { IssuesPanel } from '@/components/Scalping/IssuesPanel';
import { ScalpingSubNav } from '@/components/Scalping/ScalpingSubNav';
import { ScalpingKpiCards } from '@/components/Dashboard/ScalpingKpiCards';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const REFRESH_MS = 30_000;

const ScalpingOverview = () => {
  const dispatch = useAppDispatch();
  const {
    status,
    performance,
    mode,
    isLive,
    statusLoading,
    togglingLive,
    updatingMode,
    statusError,
    loading: perfLoading,
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

  const handleToggleLive = async () => {
    try {
      const result = await dispatch(toggleLiveTrading()).unwrap();
      toast.success(
        result.isLive
          ? 'Live broker orders enabled'
          : 'Live broker orders disabled',
      );
      dispatch(fetchScalpingStatus());
    } catch {
      toast.error('Failed to toggle live trading');
    }
  };

  const handleModeChange = async (newMode: TradingMode) => {
    try {
      await dispatch(updateTradingMode(newMode)).unwrap();
      toast.success(`Mode set to ${newMode}`);
      dispatch(fetchScalpingStatus());
    } catch {
      toast.error('Failed to update trading mode');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scalping</h1>
          <p className="text-sm text-muted-foreground mt-1">
            SBIN options scalper · auto-refreshes every 30s
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">KPI Dashboard</Link>
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

      {statusLoading && !status ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : statusError ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-4">
          Could not load engine status — {statusError}. Ensure{' '}
          <code className="text-xs">/instrument/scalping-status</code> is running
          on the backend.
        </p>
      ) : status ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <EngineStatusCard status={status} />
            <TradingControls
              mode={mode}
              isLive={isLive}
              liveTradingEnabled={status.liveTradingEnabled}
              togglingLive={togglingLive}
              updatingMode={updatingMode}
              onToggleLive={handleToggleLive}
              onModeChange={handleModeChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StrikeCard
              type="CE"
              strike={status.activeStrikes.CE}
              resolution={status.strikeResolution.CE}
              candleCount={status.candleCounts.CE}
            />
            <StrikeCard
              type="PE"
              strike={status.activeStrikes.PE}
              resolution={status.strikeResolution.PE}
              candleCount={status.candleCounts.PE}
            />
          </div>

          <IssuesPanel issues={status.issues} />
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
