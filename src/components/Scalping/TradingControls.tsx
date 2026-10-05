import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingControlsProps {
  mode: string;
  isLive: boolean;
  production: boolean;
  liveTradingEnabled: boolean;
  togglingLive: boolean;
  onToggleProduction: (production: boolean) => void;
}

export const TradingControls = ({
  mode,
  isLive,
  production,
  liveTradingEnabled,
  togglingLive,
  onToggleProduction,
}: TradingControlsProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingProduction, setPendingProduction] = useState(false);

  const handleSwitchIntent = (checked: boolean) => {
    setPendingProduction(checked);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onToggleProduction(pendingProduction);
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Production Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={cn(
              'flex items-center justify-between rounded-lg border p-4',
              production
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-border',
            )}
          >
            <div className="space-y-1 min-w-0 flex-1 pr-3">
              <div className="flex items-center gap-2">
                <Zap
                  className={cn(
                    'h-4 w-4 shrink-0',
                    production ? 'text-destructive' : 'text-muted-foreground',
                  )}
                />
                <Label htmlFor="production-toggle" className="font-medium">
                  Production {production ? 'ON' : 'OFF'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {production
                  ? 'Live Upstox orders are enabled for Nifty Options Scalp'
                  : 'Paper / dummy money mode — no real broker orders'}
              </p>
            </div>
            <Switch
              id="production-toggle"
              checked={production}
              onCheckedChange={handleSwitchIntent}
              disabled={togglingLive}
              className="shrink-0"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={production ? 'destructive' : 'secondary'}>
              Production: {production ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant="outline">Mode: {mode}</Badge>
            <Badge variant={isLive ? 'destructive' : 'secondary'}>
              is_live: {isLive ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={liveTradingEnabled ? 'destructive' : 'outline'}>
              {liveTradingEnabled ? 'LIVE TRADING ACTIVE' : 'Paper / safe'}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Turning Production ON sets strategy mode to <strong>live</strong> and
            enables broker orders. Turning OFF switches back to paper mode.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingProduction
                ? 'Turn Production ON?'
                : 'Turn Production OFF?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingProduction
                ? 'Real BUY/SELL orders will be placed on Upstox when Nifty signals fire. Ensure your token is valid and risk limits are set.'
                : 'The bot will return to paper/dummy money mode. Open live positions may still need manual square-off on Upstox.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {pendingProduction ? 'Turn Production ON' : 'Turn Production OFF'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
