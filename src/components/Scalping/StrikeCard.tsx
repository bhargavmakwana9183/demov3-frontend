import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResolvedStrike } from '@/store/slices/scalpingSlice';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StrikeCardProps {
  type: 'CE' | 'PE';
  strike: ResolvedStrike | null | undefined;
  resolution?: { ok: boolean; reason?: string };
  candleCount?: number;
}

export const StrikeCard = ({
  type,
  strike,
  resolution,
  candleCount,
}: StrikeCardProps) => {
  const Icon = type === 'CE' ? TrendingUp : TrendingDown;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {type} Strike
        </CardTitle>
        <Badge variant={resolution?.ok ? 'default' : 'destructive'}>
          {resolution?.ok ? 'Resolved' : resolution?.reason ?? 'N/A'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {strike ? (
          <>
            <p className="font-medium">{strike.trading_symbol}</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Strike</span>
              <span className="text-foreground font-medium">
                ₹{strike.strike_price}
              </span>
              <span>LTP</span>
              <span className="text-foreground font-medium">
                ₹{Number(strike.ltp).toFixed(2)}
              </span>
              <span>Expiry</span>
              <span className="text-foreground">
                {new Date(strike.expiry).toLocaleDateString()}
              </span>
              <span>Candles</span>
              <span className="text-foreground">{candleCount ?? '—'}</span>
              {strike.spread_pct != null && (
                <>
                  <span>Spread</span>
                  <span className="text-foreground">
                    {(strike.spread_pct * 100).toFixed(2)}%
                  </span>
                </>
              )}
              {strike.open_interest != null && (
                <>
                  <span>OI</span>
                  <span className="text-foreground">
                    {strike.open_interest.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground py-4 text-center">
            No strike resolved
          </p>
        )}
      </CardContent>
    </Card>
  );
};
