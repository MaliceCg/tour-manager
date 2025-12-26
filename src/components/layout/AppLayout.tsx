import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Calendar, 
  Clock, 
  Users, 
  ChevronLeft,
  ChevronRight,
  UserCircle,
  LogOut,
  Settings,
  Building2,
  UsersRound
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: Building2 },
  { name: 'Activités', href: '/activities', icon: Compass },
  { name: 'Créneaux', href: '/schedule', icon: Clock },
  { name: 'Calendrier', href: '/calendar', icon: Calendar },
  { name: 'Réservations', href: '/reservations', icon: Users },
];

const adminNavigation = [
  { name: 'Équipe', href: '/team', icon: UsersRound },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, organization, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const allNavigation = isAdmin 
    ? [...navigation, ...adminNavigation] 
    : navigation;

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

          {/* Organization badge */}
          {!collapsed && organization && (
            <div className="px-4 py-3 border-b border-sidebar-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{organization.name}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className={cn(
            "flex-1 py-6 space-y-1",
            collapsed ? "px-2" : "px-4"
          )}>
            {allNavigation.map((item) => (
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

          {/* User section */}
          <div className={cn(
            "border-t border-sidebar-border",
            collapsed ? "p-2" : "p-4"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start",
                    collapsed ? "px-0 justify-center" : "px-2"
                  )}
                >
                  <UserCircle className="h-5 w-5" />
                  {!collapsed && (
                    <span className="ml-2 truncate text-sm">
                      {profile?.full_name || profile?.email || 'Utilisateur'}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile?.full_name || 'Utilisateur'}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {profile?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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