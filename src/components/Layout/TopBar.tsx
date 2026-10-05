import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import {
  fetchScalpingStatus,
  toggleLiveTrading,
} from '@/store/slices/scalpingSlice';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { MobileNavDrawer } from './Sidebar';

export const TopBar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { production, isLive, togglingLive } = useAppSelector(
    (state) => state.scalping,
  );
  const prodOn = Boolean(production || isLive);

  useEffect(() => {
    dispatch(fetchScalpingStatus());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleProduction = async (checked: boolean) => {
    try {
      const result = await dispatch(toggleLiveTrading(checked)).unwrap();
      toast.success(result.production ? 'Production ON' : 'Production OFF');
    } catch {
      toast.error('Failed to toggle production');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 flex items-center justify-between gap-2 px-3 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <MobileNavDrawer />
        <div className="min-w-0">
          <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">
            Nifty 50 Scalper
          </h2>
        </div>
        <Badge
          variant={prodOn ? 'destructive' : 'secondary'}
          className="shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2.5"
        >
          <span className="sm:hidden">{prodOn ? 'LIVE' : 'PAPER'}</span>
          <span className="hidden sm:inline">
            {prodOn ? 'PRODUCTION ON' : 'PAPER MODE'}
          </span>
        </Badge>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Label
            htmlFor="topbar-prod"
            className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline"
          >
            Prod
          </Label>
          <Switch
            id="topbar-prod"
            checked={prodOn}
            onCheckedChange={handleProduction}
            disabled={togglingLive}
            aria-label="Toggle production"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 px-1 sm:px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                {user?.name || user?.email || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-danger">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
