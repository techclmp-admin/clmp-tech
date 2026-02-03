import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  DollarSign, 
  Calendar, 
  MessageCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/budget', label: 'Budget', icon: DollarSign, primary: true },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      {/* Blur background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      {/* Nav items container with safe area padding */}
      <div className="relative flex items-end justify-around h-20 px-2 pb-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const isPrimary = item.primary;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                isPrimary ? "relative -top-3" : "py-2",
                !isPrimary && "min-w-[56px]"
              )}
            >
              {/* Primary (center) button with elevated style */}
              {isPrimary ? (
                <div className={cn(
                  "flex flex-col items-center justify-center",
                  "w-14 h-14 rounded-2xl shadow-lg transition-all duration-200",
                  active 
                    ? "bg-primary text-primary-foreground scale-105 shadow-primary/30" 
                    : "bg-primary/90 text-primary-foreground hover:bg-primary"
                )}>
                  <item.icon className="h-6 w-6" />
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110"
                  )} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    active && "text-primary"
                  )}>
                    {item.label}
                  </span>
                </div>
              )}
              
              {/* Active indicator dot for primary button */}
              {isPrimary && (
                <span className={cn(
                  "mt-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
