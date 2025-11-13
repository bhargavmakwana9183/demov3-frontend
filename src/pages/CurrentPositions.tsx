import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCurrentPositions, updatePositionFromSocket } from '@/store/slices/positionSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { io } from "socket.io-client";

const CurrentPositions = () => {
  const dispatch = useAppDispatch();``
  const { positions, loading } = useAppSelector((state) => state.position);
  const SOCKET_URL = "http://172.17.44.85.:5004";

  useEffect(() => {
    dispatch(fetchCurrentPositions());

    // Auto-refresh every 15 seconds
    // const interval = setInterval(() => {
    //   dispatch(fetchCurrentPositions());
    // }, 15000);

    // return () => clearInterval(interval);
     const socket = io(SOCKET_URL, {
       path: "/api/socket",  
      transports: ["websocket"],
    });

    // 🔹 Step 3: Listen for position updates
    socket.on("stock_data", (data) => {
      console.log("Received position update:", data);
      dispatch(updatePositionFromSocket(data));
    });

    // 🔹 Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Current Positions</h1>
        <p className="text-sm text-muted-foreground">Auto-refreshing every 15 seconds</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {positions.map((position) => (
          <Card key={position.id} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">{position.symbol}</CardTitle>
              <Badge variant={position.status === 'in_trade' ? 'default' : 'secondary'}>
                {position.status === 'in_trade' ? 'In Trade' : 'Closed'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Buy Price</p>
                  <p className="font-medium">₹{position.buyPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{position.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sell Price</p>
                  <p className="font-medium text-xs">{position.sellPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p className="font-medium text-xs">{position.target?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">StopLoss</p>
                  <p className="font-medium text-xs">{position.stopploss?.toFixed(2)}</p>
                </div>
                 <div>
                  <p className="text-muted-foreground">Current LTP</p>
                  <p className="font-medium">₹{position.currentLTP?.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Profit/Loss</p>
                  <div className={`flex items-center gap-1 font-bold ${
                    position.profitLoss >= 0 ? 'text-success' : 'text-danger'
                  }`}>
                    {position.profitLoss >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>₹{Math.abs(position.profitLoss).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No active positions found</p>
        </div>
      )}
    </div>
  );
};

export default CurrentPositions;
