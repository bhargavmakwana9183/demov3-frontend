import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchScalpingAuditLog,
  setAuditFilters,
  AuditLogFilters,
} from '@/store/slices/scalpingSlice';
import { ScalpingSubNav } from '@/components/Scalping/ScalpingSubNav';
import { AuditSkipSummary } from '@/components/Scalping/AuditSkipSummary';
import { AuditLogTable } from '@/components/Scalping/AuditLogTable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';

const DAY_OPTIONS = [1, 7, 14, 30];
const LIMIT_OPTIONS = [50, 100, 200, 500];
const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'SKIP', label: 'SKIP' },
  { value: 'ENTER', label: 'ENTER' },
  { value: 'EXIT', label: 'EXIT' },
  { value: 'PARTIAL', label: 'PARTIAL' },
  { value: 'RECONCILE', label: 'RECONCILE' },
  { value: 'HOLD', label: 'HOLD' },
];

const ScalpingAuditLog = () => {
  const dispatch = useAppDispatch();
  const {
    auditLogs,
    auditSkipBreakdown,
    auditFilters,
    auditLoading,
    auditError,
  } = useAppSelector((state) => state.scalping);

  const [localDays, setLocalDays] = useState(String(auditFilters.days));
  const [localAction, setLocalAction] = useState(
    auditFilters.action || 'all',
  );
  const [localLimit, setLocalLimit] = useState(String(auditFilters.limit));

  const loadLogs = (overrides?: Partial<AuditLogFilters>) => {
    const filters: AuditLogFilters = {
      days: overrides?.days ?? Number(localDays),
      action:
        overrides?.action !== undefined
          ? overrides.action
          : localAction === 'all'
            ? ''
            : localAction,
      limit: overrides?.limit ?? Number(localLimit),
    };
    dispatch(setAuditFilters(filters));
    dispatch(fetchScalpingAuditLog(filters));
  };

  useEffect(() => {
    dispatch(
      fetchScalpingAuditLog({
        days: auditFilters.days,
        action: auditFilters.action,
        limit: auditFilters.limit,
      }),
    );
  }, [dispatch]);

  const handleApply = () => loadLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scalping</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Decision audit — every SKIP, ENTER, EXIT, and RECONCILE event
        </p>
      </div>

      <ScalpingSubNav />

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[140px]">
              <Label>Period</Label>
              <Select value={localDays} onValueChange={setLocalDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Last {d} day{d > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-[160px]">
              <Label>Action</Label>
              <Select value={localAction} onValueChange={setLocalAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-[120px]">
              <Label>Limit</Label>
              <Select value={localLimit} onValueChange={setLocalLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleApply} disabled={auditLoading}>
              Apply Filter
            </Button>
            <Button
              variant="outline"
              onClick={handleApply}
              disabled={auditLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${auditLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {auditLoading && auditLogs.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-96" />
        </div>
      ) : auditError ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-4">
          Could not load audit log — {auditError}
        </p>
      ) : (
        <>
          <AuditSkipSummary breakdown={auditSkipBreakdown} />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Showing {auditLogs.length} entries (max {auditFilters.limit})
            </p>
            <AuditLogTable logs={auditLogs} />
          </div>
        </>
      )}
    </div>
  );
};

export default ScalpingAuditLog;
