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
import {
  formatMoney,
  formatPct,
  formatRatio,
  toNum,
  toProfitFactor,
} from '@/lib/format';

interface BacktestSummaryProps {
  result: BacktestResult;
}

export const BacktestSummary = ({ result }: BacktestSummaryProps) => {
  const totalNetPl = toNum(result.totalNetPl);
  const totalGrossPl = toNum(result.totalGrossPl);
  const profitFactor = toProfitFactor(result.profitFactor);
  const netTrend = totalNetPl >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Instrument: <code className="text-xs">{result.instrumentKey}</code> · Run{' '}
        {(result.runId || '').slice(0, 8)}
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Trades"
          value={toNum(result.totalTrades)}
          icon={Activity}
          subtitle={`${toNum(result.wins)}W / ${toNum(result.losses)}L`}
        />
        <StatCard
          title="Win Rate"
          value={formatPct(result.winRate)}
          icon={Percent}
        />
        <StatCard
          title="Profit Factor"
          value={formatRatio(profitFactor)}
          icon={BarChart3}
          trend={Number.isFinite(profitFactor) && profitFactor >= 1 ? 'up' : 'down'}
        />
        <StatCard
          title="Net P/L"
          value={formatMoney(totalNetPl)}
          icon={Wallet}
          trend={netTrend}
          subtitle={`Gross ${formatMoney(totalGrossPl)}`}
        />
        <StatCard
          title="Max Drawdown"
          value={formatMoney(result.maxDrawdown)}
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          title="Period"
          value={`${result.startDate || '—'}`}
          icon={TrendingUp}
          subtitle={`→ ${result.endDate || '—'}`}
        />
      </div>
    </div>
  );
};
