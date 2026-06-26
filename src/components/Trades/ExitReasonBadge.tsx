import { Badge } from '@/components/ui/badge';
import { formatExitReason, exitReasonVariant } from '@/lib/tradeFormat';

interface ExitReasonBadgeProps {
  reason?: string | null;
}

export const ExitReasonBadge = ({ reason }: ExitReasonBadgeProps) => {
  if (!reason) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <Badge variant={exitReasonVariant(reason)} className="font-normal">
      {formatExitReason(reason)}
    </Badge>
  );
};
