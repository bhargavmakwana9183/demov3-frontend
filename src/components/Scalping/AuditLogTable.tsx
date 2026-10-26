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
  ENTRY_ATTEMPT: 'default',
  ENTRY_FILLED: 'default',
  EXIT_DECISION: 'destructive',
  TARGET_HIT: 'default',
  ORDER_PLACING: 'outline',
  ORDER_PLACED: 'outline',
  ORDER_STATUS: 'secondary',
  ORDER_FILLED: 'default',
  ORDER_REJECTED: 'destructive',
  ORDER_TIMEOUT: 'destructive',
  ORDER_CANCEL: 'secondary',
  ORDER_ADOPTED: 'default',
  SAFETY_CHECK: 'secondary',
  PRICE_CORRECTED: 'outline',
  MODE_TOGGLE: 'outline',
  STOP_UPDATED: 'default',
  LIVE_ORDER_FAIL: 'destructive',
};

const getThinking = (log: AuditLogEntry): string | null => {
  const t = (log.metadata as Record<string, unknown> | null | undefined)
    ?.thinking;
  return typeof t === 'string' && t.trim() ? t : null;
};

/** Metadata without the thinking text, which is shown as readable prose. */
const metadataWithoutThinking = (log: AuditLogEntry) => {
  if (!log.metadata) return null;
  const { thinking: _thinking, ...rest } = log.metadata as Record<
    string,
    unknown
  >;
  return Object.keys(rest).length > 0 ? rest : null;
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
        <TableCell className="text-sm max-w-[360px]">
          <div className="truncate">{formatReason(log.reason)}</div>
          {getThinking(log) && (
            <div
              className="text-xs text-muted-foreground line-clamp-2 mt-0.5"
              title={getThinking(log) ?? undefined}
            >
              {getThinking(log)}
            </div>
          )}
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
              {getThinking(log) && (
                <p className="font-sans text-sm rounded-md border border-border bg-card p-3 whitespace-pre-wrap">
                  <span className="text-muted-foreground font-medium">
                    What the system was thinking:{' '}
                  </span>
                  {getThinking(log)}
                </p>
              )}
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
              {metadataWithoutThinking(log) && (
                <p className="break-all">
                  <span className="text-muted-foreground">details: </span>
                  {JSON.stringify(metadataWithoutThinking(log))}
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
  <div className="bg-card border border-border rounded-lg overflow-x-auto">
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
