import { StatCard } from '@/components/Dashboard/StatCard';
import { ScalpingPerformance } from '@/store/slices/scalpingSlice';
import {
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Percent,
  Wallet,
} from 'lucide-react';

interface ScalpingKpiCardsProps {
  performance: ScalpingPerformance;
}

const formatCurrency = (value: number) =>
  `₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatRatio = (value: number) =>
  value === Infinity ? '∞' : value.toFixed(2);

export const ScalpingKpiCards = ({ performance }: ScalpingKpiCardsProps) => {
  const netTrend = performance.totalNetPl >= 0 ? 'up' : 'down';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Win Rate"
        value={`${performance.winRate.toFixed(1)}%`}
        icon={Percent}
        subtitle={`${performance.wins}W / ${performance.losses}L of ${performance.totalTrades}`}
      />
      <StatCard
        title="Profit Factor"
        value={formatRatio(performance.profitFactor)}
        icon={BarChart3}
        trend={performance.profitFactor >= 1 ? 'up' : 'down'}
        subtitle="Gross wins ÷ gross losses"
      />
      <StatCard
        title="Expectancy"
        value={formatCurrency(performance.expectancy)}
        icon={Target}
        trend={performance.expectancy >= 0 ? 'up' : 'down'}
        subtitle="Per-trade expected P/L"
      />
      <StatCard
        title="Net P/L"
        value={`${performance.totalNetPl >= 0 ? '+' : '-'}${formatCurrency(performance.totalNetPl)}`}
        icon={Wallet}
        trend={netTrend}
        subtitle={`Gross: ${formatCurrency(performance.totalGrossPl)}`}
      />
      <StatCard
        title="Avg Win / Loss"
        value={`${formatCurrency(performance.avgWin)}`}
        icon={TrendingUp}
        trend="up"
        subtitle={`Loss: ${formatCurrency(performance.avgLoss)}`}
      />
      <StatCard
        title="Max Drawdown"
        value={formatCurrency(performance.maxDrawdown)}
        icon={TrendingDown}
        trend="down"
        subtitle={
          performance.bestDay
            ? `Best: ${performance.bestDay.date}`
            : 'No closed trades yet'
        }
      />
    </div>
  );
};
