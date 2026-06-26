import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  STRATEGY_FILTER_OPTIONS,
  StrategyFilterValue,
} from '@/lib/tradeFormat';

interface StrategyFilterProps {
  value: StrategyFilterValue;
  onChange: (value: StrategyFilterValue) => void;
}

export const StrategyFilter = ({ value, onChange }: StrategyFilterProps) => (
  <div className="space-y-2 min-w-[180px]">
    <Label>Strategy</Label>
    <Select value={value} onValueChange={(v) => onChange(v as StrategyFilterValue)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STRATEGY_FILTER_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
