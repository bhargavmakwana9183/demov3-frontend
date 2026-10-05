import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { scalpingAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

type ChainResult = {
  inserted?: number;
  skipped?: number;
  deletedExpired?: number;
};

type HedgingResult = {
  expiry?: string | null;
  inserted?: number;
  skipped?: number;
  deleted?: number;
};

interface NiftyDataSyncCardProps {
  onSyncComplete?: () => void;
}

export const NiftyDataSyncCard = ({ onSyncComplete }: NiftyDataSyncCardProps) => {
  const [syncing, setSyncing] = useState<'full' | 'chain' | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const runFullMorningSync = async () => {
    setSyncing('full');
    setLastResult(null);
    try {
      const response = await scalpingAPI.syncNiftyMorning();
      const data = response.data.data as {
        chain?: ChainResult;
        hedging?: HedgingResult;
      };
      const chain = data.chain;
      const hedging = data.hedging;
      const summary = [
        'Strategy records ensured',
        chain
          ? `Chain: +${chain.inserted ?? 0} new, ${chain.skipped ?? 0} skipped`
          : null,
        hedging
          ? `Hedging (${hedging.expiry ?? 'expiry'}): +${hedging.inserted ?? 0} new, ${hedging.skipped ?? 0} skipped`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');
      setLastResult(summary);
      toast.success('Morning sync complete', { description: summary });
      onSyncComplete?.();
    } catch {
      toast.error('Morning sync failed — check Upstox token and backend logs');
    } finally {
      setSyncing(null);
    }
  };

  const runChainOnly = async () => {
    setSyncing('chain');
    setLastResult(null);
    try {
      const response = await scalpingAPI.syncNiftyChainOnly();
      const chain = response.data.data as ChainResult;
      const summary = `Chain: +${chain.inserted ?? 0} new, ${chain.skipped ?? 0} skipped, ${chain.deletedExpired ?? 0} expired removed`;
      setLastResult(summary);
      toast.success('Option chain synced', { description: summary });
      onSyncComplete?.();
    } catch {
      toast.error('Chain sync failed — check Upstox token');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          Manual data sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Same steps as the backend morning cron (8:30 AM IST, Mon–Fri): ensure
          strategy records → sync Nifty option chain → sync hedging options for
          current expiry.
        </p>
        <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
          <li>ensureNiftyStrategyRecords</li>
          <li>syncNiftyOptionChain</li>
          <li>syncNiftyHedgingOptions</li>
        </ol>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={runFullMorningSync}
            disabled={syncing !== null}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', syncing === 'full' && 'animate-spin')}
            />
            Run morning sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={runChainOnly}
            disabled={syncing !== null}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', syncing === 'chain' && 'animate-spin')}
            />
            Chain only
          </Button>
        </div>
        {lastResult && (
          <p className="text-xs text-muted-foreground border border-border rounded-md p-2">
            Last run: {lastResult}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
