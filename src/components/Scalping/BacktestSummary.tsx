import { StatCard } from '@/components/Dashboard/StatCard';
import { BacktestResult } from '@/store/slices/scalpingSlice';
import {
  BarChart3,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
  Activity,
} from 'lucide-react';

interface BacktestSummaryProps {
  result: BacktestResult;
}

const formatRatio = (value: number) =>
  value === Infinity ? '∞' : value.toFixed(2);

export const BacktestSummary = ({ result }: BacktestSummaryProps) => {
  const netTrend = result.totalNetPl >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Instrument: <code className="text-xs">{result.instrumentKey}</code> · Run{' '}
        {result.runId.slice(0, 8)}
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Trades"
          value={result.totalTrades}
          icon={Activity}
          subtitle={`${result.wins}W / ${result.losses}L`}
        />
        <StatCard
          title="Win Rate"
          value={`${result.winRate.toFixed(1)}%`}
          icon={Percent}
        />
        <StatCard
          title="Profit Factor"
          value={formatRatio(result.profitFactor)}
          icon={BarChart3}
          trend={result.profitFactor >= 1 ? 'up' : 'down'}
        />
        <StatCard
          title="Net P/L"
          value={`₹${result.totalNetPl.toFixed(2)}`}
          icon={Wallet}
          trend={netTrend}
          subtitle={`Gross ₹${result.totalGrossPl.toFixed(2)}`}
        />
        <StatCard
          title="Max Drawdown"
          value={`₹${result.maxDrawdown.toFixed(2)}`}
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          title="Period"
          value={`${result.startDate}`}
          icon={TrendingUp}
          subtitle={`→ ${result.endDate}`}
        />
      </div>
    </div>
  );
};
