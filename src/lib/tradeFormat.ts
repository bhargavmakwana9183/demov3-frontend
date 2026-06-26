export const formatExitReason = (reason?: string | null) =>
  reason ? reason.replace(/_/g, ' ') : '—';

export const exitReasonVariant = (
  reason?: string | null,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!reason) return 'outline';
  if (reason.includes('TARGET')) return 'default';
  if (reason.includes('STOP') || reason.includes('MAX_LOSS')) return 'destructive';
  if (reason.includes('EOD') || reason.includes('TIME')) return 'secondary';
  return 'outline';
};

export const STRATEGY_FILTER_OPTIONS = [
  { value: 'all', label: 'All strategies' },
  { value: 'SCALLPING', label: 'SCALLPING' },
  { value: 'SCALLPING_TRAILLING', label: 'SCALLPING Trailing' },
] as const;

export type StrategyFilterValue =
  (typeof STRATEGY_FILTER_OPTIONS)[number]['value'];

export const strategyQueryParam = (filter: StrategyFilterValue) =>
  filter === 'all' ? undefined : filter;
