import { useLocation, useNavigate } from 'react-router-dom';
import { Home, SendHorizontal, ArrowDownToLine, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/send', icon: SendHorizontal, label: 'Send' },
  { path: '/withdraw', icon: ArrowDownToLine, label: 'Withdraw' },
  { path: '/deposit', icon: Plus, label: 'Add Funds' },
  { path: '/transactions', icon: Clock, label: 'History' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'animate-pulse-glow rounded-full')} />
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
