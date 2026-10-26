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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from 'lucide-react';

const DAY_OPTIONS = [1, 7, 14, 30];
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'SKIP', label: 'SKIP' },
  { value: 'ENTER', label: 'ENTER' },
  { value: 'ENTRY_FILLED', label: 'ENTRY_FILLED' },
  { value: 'EXIT', label: 'EXIT' },
  { value: 'TARGET_HIT', label: 'TARGET_HIT' },
  { value: 'ADD_LOT', label: 'ADD_LOT' },
  { value: 'PLAN_B_START', label: 'PLAN_B_START' },
  { value: 'PLAN_B_REBUY', label: 'PLAN_B_REBUY' },
  { value: 'PLAN_B_SCALP', label: 'PLAN_B_SCALP' },
  { value: 'PLAN_B_MAX_LOSS', label: 'PLAN_B_MAX_LOSS' },
  { value: 'PARTIAL', label: 'PARTIAL' },
  { value: 'SIGNAL_EVAL', label: 'SIGNAL_EVAL' },
  { value: 'CARRY_FORWARD', label: 'CARRY_FORWARD' },
  { value: 'HOLD', label: 'HOLD' },
  { value: 'LIVE_ORDER_FAIL', label: 'LIVE_ORDER_FAIL' },
  { value: 'ENTRY_ATTEMPT', label: 'ENTRY_ATTEMPT (why it bought)' },
  { value: 'EXIT_DECISION', label: 'EXIT_DECISION (why it sold)' },
  { value: 'STOP_UPDATED', label: 'STOP_UPDATED (stop-loss moved)' },
  { value: 'ORDER_PLACING', label: 'ORDER_PLACING (sending to Upstox)' },
  { value: 'ORDER_PLACED', label: 'ORDER_PLACED (Upstox accepted)' },
  { value: 'ORDER_STATUS', label: 'ORDER_STATUS (status change)' },
  { value: 'ORDER_FILLED', label: 'ORDER_FILLED' },
  { value: 'ORDER_REJECTED', label: 'ORDER_REJECTED' },
  { value: 'ORDER_TIMEOUT', label: 'ORDER_TIMEOUT' },
  { value: 'ORDER_CANCEL', label: 'ORDER_CANCEL' },
  { value: 'ORDER_ADOPTED', label: 'ORDER_ADOPTED (late fill)' },
  { value: 'SAFETY_CHECK', label: 'SAFETY_CHECK' },
  { value: 'PRICE_CORRECTED', label: 'PRICE_CORRECTED' },
  { value: 'RECONCILE', label: 'RECONCILE (Upstox vs DB)' },
  { value: 'MODE_TOGGLE', label: 'MODE_TOGGLE (live/paper)' },
];

const ScalpingAuditLog = () => {
  const dispatch = useAppDispatch();
  const {
    auditLogs,
    auditSkipBreakdown,
    auditFilters,
    auditTotal,
    auditTotalPages,
    auditLoading,
    auditError,
  } = useAppSelector((state) => state.scalping);

  const [localDays, setLocalDays] = useState(String(auditFilters.days));
  const [localAction, setLocalAction] = useState(
    auditFilters.action || 'all',
  );
  const [localPageSize, setLocalPageSize] = useState(
    String(auditFilters.pageSize),
  );

  const loadLogs = (overrides?: Partial<AuditLogFilters>) => {
    const filters: AuditLogFilters = {
      days: overrides?.days ?? Number(localDays),
      action:
        overrides?.action !== undefined
          ? overrides.action
          : localAction === 'all'
            ? ''
            : localAction,
      pageIndex: overrides?.pageIndex ?? 1,
      pageSize: overrides?.pageSize ?? Number(localPageSize),
    };
    dispatch(setAuditFilters(filters));
    dispatch(fetchScalpingAuditLog(filters));
  };

  useEffect(() => {
    dispatch(fetchScalpingAuditLog(auditFilters));
    // Load the saved page once. Later pages go through loadLogs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handlePageChange = (nextPage: number) => {
    const page = Math.min(Math.max(1, nextPage), auditTotalPages);
    loadLogs({
      days: auditFilters.days,
      action: auditFilters.action,
      pageIndex: page,
      pageSize: auditFilters.pageSize,
    });
  };

  const from =
    auditTotal === 0 ? 0 : (auditFilters.pageIndex - 1) * auditFilters.pageSize + 1;
  const to = Math.min(auditFilters.pageIndex * auditFilters.pageSize, auditTotal);

  const handleApply = () => loadLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Nifty Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every step the system takes: why it bought or sold, each Upstox order step, safety checks and reconcile. Expand a row to read what it was thinking.
        </p>
      </div>

      <ScalpingSubNav />

      <Card className="bg-card border-border">
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Page size</Label>
              <Select value={localPageSize} onValueChange={setLocalPageSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleApply} disabled={auditLoading} className="w-full">
              Apply Filter
            </Button>
            <Button
              variant="outline"
              onClick={handleApply}
              disabled={auditLoading}
              className="w-full"
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
          <div className="space-y-3">
            <AuditLogTable logs={auditLogs} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing {from}–{to} of {auditTotal} · Page{' '}
                {auditFilters.pageIndex} / {auditTotalPages}
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => handlePageChange(1)}
                  disabled={auditFilters.pageIndex <= 1 || auditLoading}
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => handlePageChange(auditFilters.pageIndex - 1)}
                  disabled={auditFilters.pageIndex <= 1 || auditLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => handlePageChange(auditFilters.pageIndex + 1)}
                  disabled={
                    auditFilters.pageIndex >= auditTotalPages || auditLoading
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => handlePageChange(auditTotalPages)}
                  disabled={
                    auditFilters.pageIndex >= auditTotalPages || auditLoading
                  }
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ScalpingAuditLog;
