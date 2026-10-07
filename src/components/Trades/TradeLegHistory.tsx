import { useEffect, useState } from 'react';
import { tradeHistoryAPI } from '@/lib/api';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TradeLeg {
  id: string;
  tradeUuid: string;
  tradeRef: string;
  legType: string;
  side: string;
  lots: number;
  lotSize: number;
  quantity: number;
  price: number;
  avgBuyAfter: number;
  qtyAfter: number;
  targetAfter: number;
  grossPl: number | null;
  netPl: number | null;
  charges: number | null;
  brokerOrderId: string | null;
  reason: string | null;
  mode: string | null;
  occurredAt: string;
}

const LEG_LABELS: Record<string, string> = {
  ENTRY: 'Entry',
  MANUAL_ENTRY: 'Manual entry',
  ADD_LOT: 'Add lot',
  PARTIAL_SELL: 'Plan B partial sell',
  FULL_EXIT: 'Full exit',
};

const legBadgeVariant = (legType: string) => {
  if (legType === 'ADD_LOT') return 'secondary' as const;
  if (legType === 'PARTIAL_SELL') return 'outline' as const;
  if (legType === 'FULL_EXIT') return 'destructive' as const;
  return 'default' as const;
};

interface TradeLegHistoryProps {
  tradeId: string;
  tradeUuid?: string | null;
  legCount?: number;
  className?: string;
  compact?: boolean;
}

export const TradeLegHistory = ({
  tradeId,
  tradeUuid,
  legCount = 0,
  className,
  compact = false,
}: TradeLegHistoryProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legs, setLegs] = useState<TradeLeg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const lookupKey = tradeUuid || tradeId;

  useEffect(() => {
    if (!open || loaded || !lookupKey) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await tradeHistoryAPI.getLegHistory(lookupKey);
        const data = res.data?.data ?? res.data ?? [];
        if (!cancelled) {
          setLegs(Array.isArray(data) ? data : []);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setError('Failed to load leg history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, loaded, lookupKey]);

  // Only show control when this trade has recorded legs
  if (!legCount || legCount < 1) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-2 text-xs text-muted-foreground hover:text-foreground',
            compact && 'h-7',
          )}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 mr-1" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 mr-1" />
          )}
          Lot history
          {legCount > 0 && (
            <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0">
              {legCount}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        )}
        {error && <p className="text-xs text-danger py-1">{error}</p>}
        {!loading && !error && legs.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">No leg events yet</p>
        )}
        {!loading && legs.length > 0 && (
          <div className="rounded-md border border-border overflow-hidden">
            <div className="divide-y divide-border text-xs">
              {legs.map((leg) => (
                <div
                  key={leg.id}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-muted/20"
                >
                  <div>
                    <Badge
                      variant={legBadgeVariant(leg.legType)}
                      className="text-[10px]"
                    >
                      {LEG_LABELS[leg.legType] || leg.legType}
                    </Badge>
                    <p className="text-muted-foreground mt-1">
                      {new Date(leg.occurredAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {leg.side} · {leg.lots} lot
                      {leg.lots !== 1 ? 's' : ''}
                    </p>
                    <p className="font-medium">₹{Number(leg.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">After</p>
                    <p className="font-medium">
                      qty {leg.qtyAfter} · avg ₹
                      {Number(leg.avgBuyAfter).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    {leg.netPl != null ? (
                      <>
                        <p className="text-muted-foreground">Net P/L</p>
                        <p
                          className={cn(
                            'font-medium',
                            Number(leg.netPl) >= 0
                              ? 'text-success'
                              : 'text-danger',
                          )}
                        >
                          {Number(leg.netPl) >= 0 ? '+' : ''}₹
                          {Number(leg.netPl).toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-medium">
                          ₹{Number(leg.targetAfter).toFixed(2)}
                        </p>
                      </>
                    )}
                    {leg.mode && (
                      <p className="text-muted-foreground mt-0.5 capitalize">
                        {leg.mode}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
