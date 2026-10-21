import { cn } from '@/lib/utils';

export type HedgeLeg = {
  hedgeSymbol?: string | null;
  hedgeBuy?: number | null;
  hedgeLtp?: number | null;
  hedgeLots?: number | null;
  hedgeGross?: number | null;
  hedgeCharges?: number | null;
  hedgeNet?: number | null;
};

const money = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `₹${Number(value).toFixed(2)}`;
};

export const HedgeLegSummary = ({
  hedge,
  compact = false,
}: {
  hedge: HedgeLeg;
  compact?: boolean;
}) => {
  if (!hedge.hedgeSymbol) return null;
  const net = Number(hedge.hedgeNet ?? 0);

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-muted/30 text-sm',
        compact ? 'p-2' : 'p-3',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          Hedge · {hedge.hedgeSymbol}
          {hedge.hedgeLots != null ? ` · ${hedge.hedgeLots} lot` : ''}
        </p>
        <span
          className={cn(
            'font-semibold tabular-nums',
            net >= 0 ? 'text-success' : 'text-danger',
          )}
        >
          {net >= 0 ? '+' : ''}
          {money(net)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Buy</p>
          <p className="font-medium">{money(hedge.hedgeBuy)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">LTP / sell</p>
          <p className="font-medium">{money(hedge.hedgeLtp)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Gross</p>
          <p className="font-medium">{money(hedge.hedgeGross)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Charges</p>
          <p className="font-medium">{money(hedge.hedgeCharges)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Hedge P/L and charges are already inside the combined net. The ₹200
        target waits for that combined number.
      </p>
    </div>
  );
};
