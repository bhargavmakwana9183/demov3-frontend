import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats, fetchProfitLossChart } from '@/store/slices/dashboardSlice';
import { fetchScalpingPerformance } from '@/store/slices/scalpingSlice';
import { StatCard } from '@/components/Dashboard/StatCard';
import { ProfitLossChart } from '@/components/Dashboard/ProfitLossChart';
import { ScalpingKpiCards } from '@/components/Dashboard/ScalpingKpiCards';
import { ScalpingDailyChart } from '@/components/Dashboard/ScalpingDailyChart';
import { ScalpingBreakdowns } from '@/components/Dashboard/ScalpingBreakdowns';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 60 days', value: 60 },
  { label: 'Last 90 days', value: 90 },
];

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { stats, chartData, loading, chartError, tokenGenerating } =
    useAppSelector((state) => state.dashboard);
  const { performance, days, loading: scalpingLoading, error: scalpingError } =
    useAppSelector((state) => state.scalping);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchProfitLossChart('month'));
    dispatch(fetchScalpingPerformance(30));
  }, [dispatch]);

  const handlePeriodChange = (value: string) => {
    dispatch(fetchScalpingPerformance(Number(value)));
  };

  const handleGenerateToken = () => {
    window.open(UPSTOX_OAUTH_URL, '_blank', 'noopener,noreferrer');
    toast.success('Upstox authorization opened in a new tab');
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

  const profitLossTrend = stats && stats.monthlyProfitLoss >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/scalping">Scalping Center</Link>
        </Button>
        <Button onClick={handleGenerateToken} disabled={tokenGenerating}>
          {tokenGenerating ? 'Opening...' : 'Connect Upstox'}
        </Button>
        </div>
      </div>

      {/* Account overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Account Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly Profit/Loss"
            value={`₹${stats?.monthlyProfitLoss?.toFixed(2) || '0.00'}`}
            icon={TrendingUp}
            trend={profitLossTrend}
            subtitle="Current month performance"
          />
          <StatCard
            title="Monthly Trailing Profit/Loss"
            value={`₹${stats?.tralling_pl?.toFixed(2) || '0.00'}`}
            icon={TrendingUp}
            trend={profitLossTrend}
            subtitle="Current month performance"
          />
          <StatCard
            title="Account Balance"
            value={`₹${stats?.accountBalance?.toFixed(2) || '0.00'}`}
            icon={DollarSign}
            subtitle="Available funds"
          />
          <StatCard
            title="Total Trades"
            value={stats?.totalTrades || 0}
            icon={Activity}
            subtitle="Current month"
          />
        </div>
      </section>

      {/* Scalping performance */}
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
            <SelectTrigger className="w-[180px]">
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
            Scalping KPIs unavailable — {scalpingError}. Ensure the backend exposes{' '}
            <code className="text-xs">/instrument/scalping-performance</code>.
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

      {/* Legacy monthly chart */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Monthly Trend</h2>
        {chartError ? (
          <p className="text-sm text-muted-foreground">{chartError}</p>
        ) : (
          <ProfitLossChart data={chartData} />
        )}
      </section>
    </div>
  );
};

export default Dashboard;
