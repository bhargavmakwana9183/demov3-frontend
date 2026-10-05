import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  History,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type AppNavItem = {
  title: string;
  shortTitle: string;
  path: string;
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    title: 'Dashboard',
    shortTitle: 'Home',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Nifty Scalper',
    shortTitle: 'Scalper',
    path: '/scalping',
    icon: Zap,
  },
  {
    title: 'Nifty Options',
    shortTitle: 'Options',
    path: '/stocks',
    icon: TrendingUp,
  },
  {
    title: 'Positions',
    shortTitle: 'Positions',
    path: '/positions',
    icon: Briefcase,
  },
  {
    title: 'Trade History',
    shortTitle: 'History',
    path: '/history',
    icon: History,
  },
];
