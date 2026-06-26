import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AuditLogEntry } from '@/store/slices/scalpingSlice';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ACTION_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ENTER: 'default',
  EXIT: 'destructive',
  SKIP: 'secondary',
  PARTIAL: 'outline',
  RECONCILE: 'outline',
  HOLD: 'secondary',
};

const formatReason = (reason?: string | null) =>
  reason ? reason.replace(/_/g, ' ') : '—';

const formatIndicators = (log: AuditLogEntry) => {
  const parts: string[] = [];
  if (log.ema9 != null && log.ema21 != null) {
    parts.push(`EMA ${log.ema9.toFixed(2)} / ${log.ema21.toFixed(2)}`);
  }
  if (log.rsi != null) parts.push(`RSI ${log.rsi.toFixed(1)}`);
  if (log.atr != null) parts.push(`ATR ${log.atr.toFixed(2)}`);
  if (log.volume != null) parts.push(`Vol ${log.volume.toFixed(0)}`);
  return parts.length > 0 ? parts.join(' · ') : '—';
};

const AuditLogRow = ({ log }: { log: AuditLogEntry }) => {
  const [open, setOpen] = useState(false);
  const hasDetail =
    log.metadata ||
    log.config_snapshot ||
    log.instrument_key ||
    log.trade_id;

  return (
    <>
      <TableRow>
        <TableCell className="whitespace-nowrap text-sm">
          {new Date(log.timestamp).toLocaleString()}
        </TableCell>
        <TableCell>
          <Badge variant={ACTION_VARIANT[log.action] ?? 'outline'}>
            {log.action}
          </Badge>
        </TableCell>
        <TableCell className="text-sm max-w-[200px] truncate">
          {formatReason(log.reason)}
        </TableCell>
        <TableCell className="text-sm">{log.signal ?? '—'}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {log.engine_state ?? '—'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
          {formatIndicators(log)}
        </TableCell>
        <TableCell className="text-sm hidden md:table-cell">
          <Badge variant="outline">{log.mode ?? '—'}</Badge>
        </TableCell>
        <TableCell className="w-10">
          {hasDetail && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(!open)}
            >
              {open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
      </TableRow>
      {open && hasDetail && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={8} className="py-3">
            <div className="text-xs space-y-2 font-mono">
              {log.instrument_key && (
                <p>
                  <span className="text-muted-foreground">instrument: </span>
                  {log.instrument_key}
                </p>
              )}
              {log.trade_id && (
                <p>
                  <span className="text-muted-foreground">trade_id: </span>
                  {log.trade_id}
                </p>
              )}
              {log.config_snapshot && (
                <p>
                  <span className="text-muted-foreground">config: </span>
                  {JSON.stringify(log.config_snapshot)}
                </p>
              )}
              {log.metadata && (
                <p>
                  <span className="text-muted-foreground">metadata: </span>
                  {JSON.stringify(log.metadata)}
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

export const AuditLogTable = ({ logs }: AuditLogTableProps) => (
  <div className="bg-card border border-border rounded-lg overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Signal</TableHead>
          <TableHead>Engine</TableHead>
          <TableHead className="hidden lg:table-cell">Indicators</TableHead>
          <TableHead className="hidden md:table-cell">Mode</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <AuditLogRow key={log.id} log={log} />
        ))}
      </TableBody>
    </Table>
    {logs.length === 0 && (
      <p className="text-sm text-muted-foreground text-center py-12">
        No audit entries for the selected filters
      </p>
    )}
  </div>
);
