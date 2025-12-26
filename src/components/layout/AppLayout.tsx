import { NavLink, Outlet } from 'react-router-dom';
import { 
  Compass, 
  Calendar, 
  Clock, 
  Users, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Activities', href: '/activities', icon: Compass },
  { name: 'Schedule', href: '/schedule', icon: Clock },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Reservations', href: '/reservations', icon: Users },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside className={cn(
        "flex-shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "h-16 flex items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "justify-between px-6"
          )}>
            {!collapsed && (
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                Tour Manager
              </h1>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 py-6 space-y-1",
            collapsed ? "px-2" : "px-4"
          )}>
            {navigation.map((item) => (
              collapsed ? (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => cn(
                        "flex items-center justify-center h-10 w-full rounded-md transition-colors",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              )
            ))}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 border-t border-sidebar-border">
              <p className="text-xs text-muted-foreground">
                Tour Operator Management
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
