import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  runScalpingBacktest,
  runScalpingOptimize,
  SignalType,
  TUNABLE_PARAMS,
  TunableParam,
} from '@/store/slices/scalpingSlice';
import { ScalpingSubNav } from '@/components/Scalping/ScalpingSubNav';
import { BacktestSummary } from '@/components/Scalping/BacktestSummary';
import { BacktestTradesTable } from '@/components/Scalping/BacktestTradesTable';
import { OptimizeResults } from '@/components/Scalping/OptimizeResults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const defaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const ScalpingBacktest = () => {
  const dispatch = useAppDispatch();
  const {
    backtestResult,
    backtestLoading,
    backtestError,
    optimizationReport,
    optimizeLoading,
    optimizeError,
  } = useAppSelector((state) => state.scalping);

  const defaults = defaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [signalType, setSignalType] = useState<SignalType>('CE');
  const [optimizeDays, setOptimizeDays] = useState('60');
  const [selectedParams, setSelectedParams] = useState<TunableParam[]>([
    'min_rr_ratio',
    'atr_stop_multiplier',
    'rsi_ce_max',
  ]);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const handleRunBacktest = async () => {
    if (!startDate || !endDate) {
      toast.error('Start and end dates are required');
      return;
    }
    try {
      await dispatch(
        runScalpingBacktest({
          startDate,
          endDate,
          signalType,
          instrumentType: signalType,
        }),
      ).unwrap();
      toast.success('Backtest completed');
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleRunOptimize = async (applyBest: boolean) => {
    try {
      const report = await dispatch(
        runScalpingOptimize({
          days: Number(optimizeDays),
          signalType,
          instrumentType: signalType,
          applyBest,
          params: selectedParams.join(','),
        }),
      ).unwrap();
      toast.success(
        applyBest
          ? 'Best parameters applied to strategy_config'
          : 'Optimization complete — review suggestions',
      );
      if (applyBest && report.suggestedOverrides) {
        setApplyDialogOpen(false);
      }
    } catch (err) {
      toast.error(String(err));
    }
  };

  const toggleParam = (param: TunableParam, checked: boolean) => {
    setSelectedParams((prev) =>
      checked ? [...prev, param] : prev.filter((p) => p !== param),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scalping</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historical backtest and parameter optimization on stored candles
        </p>
      </div>

      <ScalpingSubNav />

      {/* Backtest */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5" />
            Backtest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="bt-start">Start Date</Label>
              <Input
                id="bt-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-end">End Date</Label>
              <Input
                id="bt-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 min-w-[120px]">
              <Label>Signal</Label>
              <Select
                value={signalType}
                onValueChange={(v) => setSignalType(v as SignalType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRunBacktest} disabled={backtestLoading}>
              {backtestLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Backtest
            </Button>
          </div>

          {backtestError && (
            <p className="text-sm text-destructive">{backtestError}</p>
          )}

          {backtestLoading && !backtestResult ? (
            <Skeleton className="h-40" />
          ) : backtestResult ? (
            <div className="space-y-4 pt-2 border-t border-border">
              <BacktestSummary result={backtestResult} />
              <BacktestTradesTable trades={backtestResult.trades} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Optimize */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Parameter Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[120px]">
              <Label htmlFor="opt-days">Lookback Days</Label>
              <Input
                id="opt-days"
                type="number"
                min={7}
                max={365}
                value={optimizeDays}
                onChange={(e) => setOptimizeDays(e.target.value)}
              />
            </div>
            <div className="space-y-2 min-w-[120px]">
              <Label>Signal</Label>
              <Select
                value={signalType}
                onValueChange={(v) => setSignalType(v as SignalType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Parameters to tune</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TUNABLE_PARAMS.map((param) => (
                <label
                  key={param}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={selectedParams.includes(param)}
                    onCheckedChange={(c) =>
                      toggleParam(param, c === true)
                    }
                  />
                  <span className="font-mono">{param}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleRunOptimize(false)}
              disabled={optimizeLoading || selectedParams.length === 0}
            >
              {optimizeLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Run Optimize (dry run)
            </Button>
            <Button
              variant="destructive"
              onClick={() => setApplyDialogOpen(true)}
              disabled={optimizeLoading || selectedParams.length === 0}
            >
              Apply Best to Config
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Optimization can take 1–3 minutes — each parameter value runs a full
            backtest. Run dry run first, then apply.
          </p>

          {optimizeError && (
            <p className="text-sm text-destructive">{optimizeError}</p>
          )}

          {optimizeLoading && !optimizationReport ? (
            <Skeleton className="h-48" />
          ) : optimizationReport ? (
            <div className="pt-2 border-t border-border">
              <OptimizeResults report={optimizationReport} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply optimized parameters?</AlertDialogTitle>
            <AlertDialogDescription>
              This writes the best-performing values from the last optimization
              sweep to <code>strategy_config</code> in the database. Paper trade
              after applying to validate before going live.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRunOptimize(true)}>
              Apply Best
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScalpingBacktest;
