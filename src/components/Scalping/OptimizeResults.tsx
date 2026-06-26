import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  OptimizationReport,
  ParamOptimizationResult,
} from '@/store/slices/scalpingSlice';
import { CheckCircle2, XCircle } from 'lucide-react';

const ParamRow = ({ row }: { row: ParamOptimizationResult }) => (
  <TableRow>
    <TableCell className="font-mono text-sm">{row.param}</TableCell>
    <TableCell>{row.currentValue}</TableCell>
    <TableCell className="font-medium">{row.bestValue}</TableCell>
    <TableCell>{row.baselineProfitFactor.toFixed(2)}</TableCell>
    <TableCell>{row.bestProfitFactor.toFixed(2)}</TableCell>
    <TableCell>
      {row.improved ? (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Yes
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          No
        </Badge>
      )}
    </TableCell>
  </TableRow>
);

interface OptimizeResultsProps {
  report: OptimizationReport;
}

export const OptimizeResults = ({ report }: OptimizeResultsProps) => {
  const overrides = Object.entries(report.suggestedOverrides);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Baseline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-muted-foreground">
            <p>
              Win rate:{' '}
              <span className="text-foreground font-medium">
                {report.baseline.winRate.toFixed(1)}%
              </span>
            </p>
            <p>
              Profit factor:{' '}
              <span className="text-foreground font-medium">
                {report.baseline.profitFactor === Infinity
                  ? '∞'
                  : report.baseline.profitFactor.toFixed(2)}
              </span>
            </p>
            <p>
              Net P/L:{' '}
              <span className="text-foreground font-medium">
                ₹{report.baseline.totalNetPl.toFixed(2)}
              </span>
            </p>
            <p>
              Trades:{' '}
              <span className="text-foreground font-medium">
                {report.baseline.totalTrades}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suggested Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No parameters beat baseline in this sweep
              </p>
            ) : (
              <ul className="space-y-2">
                {overrides.map(([key, value]) => (
                  <li
                    key={key}
                    className="flex justify-between text-sm font-mono border border-border rounded px-3 py-2"
                  >
                    <span>{key}</span>
                    <span className="font-semibold">{value}</span>
                  </li>
                ))}
              </ul>
            )}
            {report.applied && (
              <Badge className="mt-3" variant="default">
                Applied to strategy_config
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parameter</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Best</TableHead>
              <TableHead>Baseline PF</TableHead>
              <TableHead>Best PF</TableHead>
              <TableHead>Improved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.paramResults.map((row) => (
              <ParamRow key={row.param} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
