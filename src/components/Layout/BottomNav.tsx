import { NavLink } from '@/components/NavLink';
import { APP_NAV_ITEMS } from './navItems';
import { cn } from '@/lib/utils';

export const BottomNav = () => (
  <nav
    className={cn(
      'md:hidden fixed bottom-0 inset-x-0 z-40',
      'border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80',
      'pb-[env(safe-area-inset-bottom)]',
    )}
  >
    <div className="grid grid-cols-5 h-16">
      {APP_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground px-1"
          activeClassName="!text-primary"
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="text-[10px] leading-tight font-medium truncate max-w-full">
            {item.shortTitle}
          </span>
        </NavLink>
      ))}
    </div>
  </nav>
);
