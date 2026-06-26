import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScalpingSkipReason } from '@/store/slices/scalpingSlice';

interface BreakdownItem {
  label: string;
  count: number;
}

interface ScalpingBreakdownPanelProps {
  title: string;
  items: BreakdownItem[];
  emptyMessage?: string;
}

const BreakdownList = ({
  title,
  items,
  emptyMessage = 'No data',
}: ScalpingBreakdownPanelProps) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const sorted = [...items].sort((a, b) => b.count - a.count);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((item) => {
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <li key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate pr-2">{item.label}</span>
                    <span className="text-muted-foreground shrink-0">
                      {item.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

interface ScalpingBreakdownsProps {
  exitReasonBreakdown: Record<string, number>;
  skipReasonBreakdown: ScalpingSkipReason[];
}

export const ScalpingBreakdowns = ({
  exitReasonBreakdown,
  skipReasonBreakdown,
}: ScalpingBreakdownsProps) => {
  const exitItems = Object.entries(exitReasonBreakdown).map(([label, count]) => ({
    label,
    count,
  }));

  const skipItems = skipReasonBreakdown.map((row) => ({
    label: row.reason,
    count: row.count,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BreakdownList
        title="Exit Reasons"
        items={exitItems}
        emptyMessage="No closed trades in this period"
      />
      <BreakdownList
        title="Entry Skip Reasons"
        items={skipItems}
        emptyMessage="No skip events logged"
      />
    </div>
  );
};
