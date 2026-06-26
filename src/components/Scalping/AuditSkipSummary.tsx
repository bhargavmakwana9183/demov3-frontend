import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditSkipBreakdownRow } from '@/store/slices/scalpingSlice';

interface AuditSkipSummaryProps {
  breakdown: AuditSkipBreakdownRow[];
}

export const AuditSkipSummary = ({ breakdown }: AuditSkipSummaryProps) => {
  const sorted = [...breakdown].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Skip Reason Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No SKIP events in this period
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((row) => {
              const pct = total > 0 ? (row.count / total) * 100 : 0;
              return (
                <div
                  key={row.reason}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium leading-tight">
                      {row.reason.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {row.count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pct.toFixed(0)}% of skips
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
