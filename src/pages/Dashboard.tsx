import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats } from '@/store/slices/dashboardSlice';
import {
  fetchScalpingPerformance,
  fetchScalpingStatus,
  toggleLiveTrading,
} from '@/store/slices/scalpingSlice';
import { StatCard } from '@/components/Dashboard/StatCard';
import { ScalpingKpiCards } from '@/components/Dashboard/ScalpingKpiCards';
import { ScalpingDailyChart } from '@/components/Dashboard/ScalpingDailyChart';
import { ScalpingBreakdowns } from '@/components/Dashboard/ScalpingBreakdowns';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Receipt,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { UPSTOX_OAUTH_URL } from '@/lib/config';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 60 days', value: 60 },
  { label: 'Last 90 days', value: 90 },
];

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { stats, loading, tokenGenerating } = useAppSelector(
    (state) => state.dashboard,
  );
  const {
    performance,
    days,
    loading: scalpingLoading,
    error: scalpingError,
    production,
    isLive,
    mode,
    status,
    togglingLive,
  } = useAppSelector((state) => state.scalping);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchScalpingPerformance(30));
    dispatch(fetchScalpingStatus());
  }, [dispatch]);

  const handlePeriodChange = (value: string) => {
    dispatch(fetchScalpingPerformance(Number(value)));
  };

  const handleGenerateToken = () => {
    window.open(UPSTOX_OAUTH_URL, '_blank', 'noopener,noreferrer');
    toast.success('Upstox authorization opened in a new tab');
  };

  const handleProductionToggle = async (checked: boolean) => {
    try {
      const result = await dispatch(toggleLiveTrading(checked)).unwrap();
      toast.success(
        result.production
          ? 'Production ON — live orders enabled'
          : 'Production OFF — paper mode',
      );
      dispatch(fetchScalpingStatus());
    } catch {
      toast.error('Failed to toggle production');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const netPl = stats?.monthlyNetPl ?? stats?.monthlyProfitLoss ?? 0;
  const profitLossTrend = netPl >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nifty 50 Options Scalper · profit, loss &amp; charges
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant={production || isLive ? 'destructive' : 'secondary'}>
            Prod {(production || isLive) ? 'ON' : 'OFF'}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to="/scalping">Scalper</Link>
          </Button>
          <Button size="sm" onClick={handleGenerateToken} disabled={tokenGenerating}>
            {tokenGenerating ? 'Opening...' : 'Connect Upstox'}
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-4 sm:pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium">Production mode</p>
            <p className="text-sm text-muted-foreground">
              {production
                ? 'Live Upstox orders enabled'
                : 'Paper / dummy money — safe mode'}{' '}
              · mode={mode}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Label htmlFor="dash-prod">Production</Label>
            <Switch
              id="dash-prod"
              checked={Boolean(production || isLive)}
              onCheckedChange={handleProductionToggle}
              disabled={togglingLive}
            />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          This Month — Nifty Scalper
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Gross P/L"
            value={`₹${(stats?.monthlyProfitLoss ?? 0).toFixed(2)}`}
            icon={TrendingUp}
            trend={profitLossTrend}
            subtitle="Before charges"
          />
          <StatCard
            title="Net P/L"
            value={`₹${netPl.toFixed(2)}`}
            icon={Wallet}
            trend={profitLossTrend}
            subtitle="After charges"
          />
          <StatCard
            title="Charges"
            value={`₹${(stats?.monthlyCharges ?? 0).toFixed(2)}`}
            icon={Receipt}
            subtitle="Brokerage + slippage"
          />
          <StatCard
            title="Strategy Balance"
            value={`₹${stats?.accountBalance?.toFixed(2) || '0.00'}`}
            icon={DollarSign}
            subtitle="Paper / strategy funds"
          />
          <StatCard
            title="Total Trades"
            value={stats?.totalTrades || 0}
            icon={Activity}
            subtitle="Current month"
          />
        </div>
        {status?.openPosition && status.trade && (
          <p className="text-sm text-muted-foreground">
            Open now: <strong>{status.trade.trading_symbol}</strong> · Net ₹
            {Number(status.trade.net_pl ?? status.trade.pl ?? 0).toFixed(2)} ·
            Charges ₹{Number(status.trade.charges ?? 0).toFixed(2)}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Scalping Performance
            </h2>
            {performance && (
              <p className="text-sm text-muted-foreground">
                {performance.strategyName} · {performance.startDate} →{' '}
                {performance.endDate}
              </p>
            )}
          </div>
          <Select value={String(days)} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {scalpingLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-72" />
          </div>
        ) : scalpingError ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-border p-4">
            Scalping KPIs unavailable — {scalpingError}
          </p>
        ) : performance ? (
          <div className="space-y-4">
            <ScalpingKpiCards performance={performance} />
            <ScalpingDailyChart dailyStats={performance.dailyStats} />
            <ScalpingBreakdowns
              exitReasonBreakdown={performance.exitReasonBreakdown}
              skipReasonBreakdown={performance.skipReasonBreakdown}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default Dashboard;
