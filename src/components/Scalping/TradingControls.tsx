import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TradingMode } from '@/store/slices/scalpingSlice';
import { Shield, Zap } from 'lucide-react';

interface TradingControlsProps {
  mode: TradingMode;
  isLive: boolean;
  liveTradingEnabled: boolean;
  togglingLive: boolean;
  updatingMode: boolean;
  onToggleLive: () => void;
  onModeChange: (mode: TradingMode) => void;
}

const MODE_DESCRIPTIONS: Record<TradingMode, string> = {
  paper: 'DB-only trades, no broker orders',
  live: 'Real Upstox orders when live toggle is ON',
  backtest: 'WebSocket engine off — use backtest API',
};

export const TradingControls = ({
  mode,
  isLive,
  liveTradingEnabled,
  togglingLive,
  updatingMode,
  onToggleLive,
  onModeChange,
}: TradingControlsProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLive, setPendingLive] = useState(false);

  const handleSwitchIntent = (checked: boolean) => {
    if (mode !== 'live') return;
    setPendingLive(checked);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onToggleLive();
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Trading Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Strategy Mode</Label>
            <Select
              value={mode}
              onValueChange={(v) => onModeChange(v as TradingMode)}
              disabled={updatingMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paper">Paper</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="backtest">Backtest</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {MODE_DESCRIPTIONS[mode]}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <Label htmlFor="live-toggle" className="font-medium">
                  Broker Live Orders
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Requires mode = live and Upstox token
              </p>
            </div>
            <Switch
              id="live-toggle"
              checked={isLive}
              onCheckedChange={handleSwitchIntent}
              disabled={togglingLive || mode !== 'live'}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={mode === 'paper' ? 'secondary' : 'outline'}>
              Mode: {mode}
            </Badge>
            <Badge variant={isLive ? 'destructive' : 'secondary'}>
              is_live: {isLive ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={liveTradingEnabled ? 'destructive' : 'outline'}>
              {liveTradingEnabled ? 'LIVE TRADING ACTIVE' : 'Paper / safe'}
            </Badge>
          </div>

          {mode !== 'live' && (
            <p className="text-xs text-muted-foreground">
              Set mode to <strong>live</strong> before enabling broker orders.
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingLive
                ? 'Enable live broker orders?'
                : 'Disable live broker orders?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingLive
                ? 'Real BUY/SELL orders will be placed on Upstox when signals fire. Ensure your token is valid and risk limits are set.'
                : 'The bot will stop placing real orders on Upstox. Open positions may still need manual square-off.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {pendingLive ? 'Turn On' : 'Turn Off'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
