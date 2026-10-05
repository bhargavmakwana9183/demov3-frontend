import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Overview', path: '/scalping' },
  { label: 'Audit Log', path: '/scalping/audit' },
  { label: 'Backtest', path: '/scalping/backtest' },
];

export const ScalpingSubNav = () => (
  <nav className="-mx-1 px-1 overflow-x-auto scrollbar-none">
    <div className="flex gap-1 border-b border-border min-w-max">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/scalping'}
          className={cn(
            'px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap',
            'border-b-2 border-transparent -mb-px hover:text-foreground transition-colors',
          )}
          activeClassName="!text-foreground border-primary"
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  </nav>
);
