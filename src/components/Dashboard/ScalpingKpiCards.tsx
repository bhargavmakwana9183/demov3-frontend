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
import {
  formatMoney,
  formatMoneySigned,
  formatPct,
  formatRatio,
  toNum,
  toProfitFactor,
} from '@/lib/format';

interface ScalpingKpiCardsProps {
  performance: ScalpingPerformance;
}

export const ScalpingKpiCards = ({ performance }: ScalpingKpiCardsProps) => {
  const totalNetPl = toNum(performance.totalNetPl);
  const totalGrossPl = toNum(performance.totalGrossPl);
  const expectancy = toNum(performance.expectancy);
  const avgWin = toNum(performance.avgWin);
  const avgLoss = toNum(performance.avgLoss);
  const maxDrawdown = toNum(performance.maxDrawdown);
  const winRate = toNum(performance.winRate);
  const profitFactor = toProfitFactor(performance.profitFactor);
  const wins = toNum(performance.wins);
  const losses = toNum(performance.losses);
  const totalTrades = toNum(performance.totalTrades);
  const netTrend = totalNetPl >= 0 ? 'up' : 'down';

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Win Rate"
        value={formatPct(winRate)}
        icon={Percent}
        subtitle={`${wins}W / ${losses}L of ${totalTrades}`}
      />
      <StatCard
        title="Profit Factor"
        value={formatRatio(profitFactor)}
        icon={BarChart3}
        trend={Number.isFinite(profitFactor) && profitFactor >= 1 ? 'up' : 'down'}
        subtitle="Gross wins ÷ gross losses"
      />
      <StatCard
        title="Expectancy"
        value={formatMoney(expectancy)}
        icon={Target}
        trend={expectancy >= 0 ? 'up' : 'down'}
        subtitle="Per-trade expected P/L"
      />
      <StatCard
        title="Net P/L"
        value={formatMoneySigned(totalNetPl)}
        icon={Wallet}
        trend={netTrend}
        subtitle={`Gross: ${formatMoney(totalGrossPl)}`}
      />
      <StatCard
        title="Avg Win / Loss"
        value={formatMoney(avgWin)}
        icon={TrendingUp}
        trend="up"
        subtitle={`Loss: ${formatMoney(avgLoss)}`}
      />
      <StatCard
        title="Max Drawdown"
        value={formatMoney(maxDrawdown)}
        icon={TrendingDown}
        trend="down"
        subtitle={
          performance.bestDay?.date
            ? `Best: ${performance.bestDay.date}`
            : 'No closed trades yet'
        }
      />
    </div>
  );
};
