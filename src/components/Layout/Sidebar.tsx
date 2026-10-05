import { NavLink } from '@/components/NavLink';
import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { APP_NAV_ITEMS } from './navItems';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const NavList = ({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) => (
  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
    {APP_NAV_ITEMS.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        )}
        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </NavLink>
    ))}
  </nav>
);

/** Desktop sidebar — hidden on mobile */
export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col h-full shrink-0',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between gap-2 min-h-16">
        {!collapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground truncate">
            NiftyScalp
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>
      <NavList collapsed={collapsed} />
    </aside>
  );
};

/** Mobile hamburger drawer */
export const MobileNavDrawer = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] max-w-[85vw] p-0 bg-sidebar border-sidebar-border"
      >
        <SheetHeader className="p-4 border-b border-sidebar-border text-left">
          <SheetTitle className="text-sidebar-foreground">NiftyScalp</SheetTitle>
        </SheetHeader>
        <NavList onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};
