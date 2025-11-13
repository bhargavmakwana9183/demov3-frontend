import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats, fetchProfitLossChart, generateToken } from '@/store/slices/dashboardSlice';
import { StatCard } from '@/components/Dashboard/StatCard';
import { ProfitLossChart } from '@/components/Dashboard/ProfitLossChart';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { stats, chartData, loading, tokenGenerating } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchProfitLossChart('month'));
  }, [dispatch]);

  const handleGenerateToken = async () => {
    try {
      await dispatch(generateToken()).unwrap();
      toast.success('Trading token generated successfully!');
    } catch (error) {
      toast.error('Failed to generate token');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const profitLossTrend = stats && stats.monthlyProfitLoss >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Button onClick={handleGenerateToken} disabled={tokenGenerating}>
          {tokenGenerating ? 'Generating...' : 'Generate Token'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Monthly Profit/Loss"
          value={`₹${stats?.monthlyProfitLoss?.toFixed(2) || '0.00'}`}
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

      <ProfitLossChart data={chartData} />
    </div>
  );
};

export default Dashboard;
