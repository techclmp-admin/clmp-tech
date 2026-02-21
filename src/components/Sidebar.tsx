import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, FolderOpen, Users, DollarSign, AlertTriangle, Settings, HelpCircle, PlusCircle, Calendar, FileText, BarChart3, Languages, LogOut, CreditCard, MessageCircle, Shield, ShieldCheck, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

import { supabase } from '@/integrations/supabase/client';
import clmpLogo from "@/assets/clmp-logo.png";
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import NotificationBell from './NotificationBell';
interface SidebarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  onNavigate?: () => void;
}
const Sidebar = ({
  language,
  onLanguageChange,
  onNavigate
}: SidebarProps) => {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const { isAdmin, isSystemAdmin, isOperationAdmin } = useUserRole();
  const { isMenuEnabled, isMenuUpcoming, isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();

  // Fetch real alerts count
  const [alertsCount, setAlertsCount] = React.useState<number>(0);

  // Fetch unread chat messages count
  const [unreadChatCount, setUnreadChatCount] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Get unread activity feed count
        const { count: activityCount } = await supabase
          .from('activity_feed')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);

        setAlertsCount(activityCount || 0);
      } catch (error) {
        console.error('Error fetching alerts count:', error);
      }
    };

    fetchAlerts();
  }, []);

  // Fetch and subscribe to unread chat messages
  React.useEffect(() => {
    if (!user) return;

    const fetchUnreadMessages = async () => {
      try {
        // Get all rooms the user is participating in
        const { data: participations } = await supabase
          .from('chat_participants')
          .select('chat_room_id, last_read_at')
          .eq('user_id', user.id);

        if (!participations || participations.length === 0) {
          setUnreadChatCount(0);
          return;
        }

        // Count unread messages across all rooms
        let totalUnread = 0;
        for (const participation of participations) {
          const query = supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', participation.chat_room_id)
            .neq('user_id', user.id); // Don't count own messages

          // Only count messages after last_read_at if it exists
          if (participation.last_read_at) {
            query.gt('created_at', participation.last_read_at);
          }

          const { count } = await query;
          totalUnread += count || 0;
        }

        setUnreadChatCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread chat count:', error);
      }
    };

    fetchUnreadMessages();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('sidebar-chat-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          fetchUnreadMessages();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_participants' },
        () => {
          fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  const translations = {
    en: {
      dashboard: 'Dashboard',
      projects: 'Projects',
      newProject: 'New Project',
      team: 'Team',
      budget: 'Budget & Finance',
      alerts: 'AI Risk Alerts',
      calendar: 'Calendar',
      reports: 'Reports',
      integrations: 'Integrations',
      templates: 'Templates',
      chat: 'Chat Room',
      security: 'Security',
      compliance: 'Compliance',
      cctv: 'CCTV AI System',
      billing: 'Billing & Subscription',
      settings: 'Settings',
      help: 'Help & Support'
    },
    fr: {
      dashboard: 'Tableau de bord',
      projects: 'Projets',
      newProject: 'Nouveau Projet',
      team: 'Équipe',
      budget: 'Budget et Finance',
      alerts: 'Alertes de Risque IA',
      calendar: 'Calendrier',
      reports: 'Rapports',
      integrations: 'Intégrations',
      templates: 'Modèles',
      chat: 'Salle de Discussion',
      security: 'Sécurité',
      compliance: 'Conformité',
      cctv: 'Système CCTV IA',
      billing: 'Facturation et Abonnement',
      settings: 'Paramètres',
      help: 'Aide et Support'
    }
  };
  const t = translations[language as keyof typeof translations] || translations.en;
  // Navigation grouped by logical user flow
  const navigation = [
    // === CORE (Daily use) ===
    {
      name: t.dashboard,
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      menuKey: 'dashboard'
    },
    {
      name: t.projects,
      href: '/projects',
      icon: FolderOpen,
      badge: null,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      menuKey: 'projects'
    },
    {
      name: t.team,
      href: '/team',
      icon: Users,
      badge: null,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      menuKey: 'team'
    },
    {
      name: t.calendar,
      href: '/calendar',
      icon: Calendar,
      badge: null,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      menuKey: 'calendar'
    },
    // === COMMUNICATION ===
    {
      name: t.chat,
      href: '/chat',
      icon: MessageCircle,
      badge: unreadChatCount > 0 ? unreadChatCount.toString() : null,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      menuKey: 'chat'
    },
    {
      name: t.alerts,
      href: '/alerts',
      icon: AlertTriangle,
      badge: alertsCount > 0 ? alertsCount.toString() : null,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      menuKey: 'alerts'
    },
    // === FINANCE ===
    {
      name: t.budget,
      href: '/budget',
      icon: DollarSign,
      badge: null,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      menuKey: 'budget'
    },
    {
      name: t.reports,
      href: '/reports',
      icon: BarChart3,
      badge: null,
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      menuKey: 'reports'
    },
    // === OPERATIONS ===
    {
      name: t.templates,
      href: '/templates',
      icon: FileText,
      badge: null,
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      menuKey: 'templates'
    },
    {
      name: t.compliance,
      href: '/compliance',
      icon: Shield,
      badge: null,
      color: 'bg-gradient-to-br from-slate-500 to-slate-600',
      menuKey: 'compliance'
    },
    {
      name: t.cctv,
      href: '/cctv',
      icon: Video,
      badge: null,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      menuKey: 'cctv'
    }
  ].filter(item => isMenuEnabled(item.menuKey) || isMenuUpcoming(item.menuKey));

  // Admin-only navigation
  const adminNavigation = isAdmin ? [
    {
      name: 'Admin',
      href: '/admin',
      icon: ShieldCheck,
      badge: null,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      menuKey: 'admin'
    }
  ].filter(item => isMenuEnabled(item.menuKey) || isMenuUpcoming(item.menuKey)) : [];

  const allNavigation = [...navigation, ...adminNavigation];
  const bottomNavigation = [
  {
    name: t.billing,
    href: '/billing',
    icon: CreditCard
  }, {
    name: t.settings,
    href: '/settings',
    icon: Settings
  }, {
    name: t.help,
    href: '/help',
    icon: HelpCircle
  }];
  const handleSignOut = async () => {
    await signOut();
  };
  return <div className="flex h-full w-64 flex-col shrink-0 glass border-r border-glass-border">
      {/* Logo & Notification Bell */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-glass-border">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center space-x-3">
          <div className="icon-3d p-2">
            <img src={clmpLogo} alt="CLMP Tech inc - Advanced Management" className="h-8 w-auto" />
          </div>
        </Link>
        <NotificationBell />
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-medium">
              {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </p>
              {/* Admin Role Badge */}
              {isSystemAdmin && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                  System
                </Badge>
              )}
              {isOperationAdmin && !isSystemAdmin && (
                <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-3">
          {allNavigation.map(item => {
          const isActive = location.pathname === item.href;

          // Check if menu should show "Soon" badge
          // Logic: Show "Soon" ONLY when menu is disabled (enabled=false) AND marked as upcoming
          const menuEnabled = isMenuEnabled(item.menuKey);
          const menuUpcoming = isMenuUpcoming(item.menuKey);
          let isUpcoming = !menuEnabled && menuUpcoming;
          let isDisabled = isUpcoming;

          // Features not yet ready — always show "Soon" badge regardless of DB flags
          const forceUpcomingMenus = ['alerts', 'cctv'];
          if (forceUpcomingMenus.includes(item.menuKey)) {
            isUpcoming = true;
            isDisabled = true;
          }

          // Special handling for Integrations menu
          if (item.menuKey === 'integrations') {
            const featureEnabled = isFeatureEnabled('integrations');
            const featureUpcoming = isFeatureUpcoming('integrations');
            if (!featureEnabled && featureUpcoming) {
              isUpcoming = true;
              isDisabled = true;
            }
          }

          // Special handling for Chat menu
          if (item.menuKey === 'chat') {
            const featureEnabled = isFeatureEnabled('chat');
            const featureUpcoming = isFeatureUpcoming('chat');
            if (!featureEnabled && featureUpcoming) {
              isUpcoming = true;
              isDisabled = true;
            }
          }

          return <div key={item.name}>
              {isDisabled ? (
                <div className={cn("group flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ease-out-expo opacity-60 cursor-not-allowed", "hover:bg-accent/5 hover:backdrop-blur-sm")}>
                  <div className={cn("icon-3d flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300", item.color)}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-2 py-0 h-5">
                    Soon
                  </Badge>
                </div>
              ) : (
                <Link to={item.href} onClick={onNavigate} className="block">
                  <div className={cn("group flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ease-out-expo", isActive ? "card-3d bg-primary/10 backdrop-blur-sm" : "hover:bg-accent/5 hover:backdrop-blur-sm")}>
                    <div className={cn("icon-3d flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300", item.color, isActive ? "shadow-3d-hover scale-105" : "group-hover:scale-105")}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                        {item.name}
                      </p>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={(item as any).isDemo ? "secondary" : "destructive"}
                        className={`ml-auto ${(item as any).isDemo ? 'bg-emerald-500 text-white' : 'shadow-3d'}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              )}
            </div>;
        })}
        </nav>

        {/* Bottom Navigation */}
        <nav className="p-4 border-t border-glass-border space-y-3">
          {bottomNavigation.map(item => {
            const isActive = location.pathname === item.href;
            return <Link key={item.name} to={item.href} onClick={onNavigate} className="block">
              <div className={cn("group flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ease-out-expo", isActive ? "card-3d bg-primary/10 backdrop-blur-sm" : "hover:bg-accent/5 hover:backdrop-blur-sm")}>
                <div className={cn("icon-3d flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 transition-all duration-300", isActive ? "shadow-3d-hover scale-105" : "group-hover:scale-105")}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className={cn("text-sm font-medium transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                  {item.name}
                </span>
              </div>
            </Link>;
          })}

          {/* Sign Out Button */}
          <div className="pt-3 border-t border-glass-border">
            <div onClick={handleSignOut} className="group flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ease-out-expo hover:bg-accent/5 hover:backdrop-blur-sm cursor-pointer">
              <div className="icon-3d flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 transition-all duration-300 group-hover:scale-105">
                <LogOut className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium transition-colors text-foreground group-hover:text-red-600">
                Sign Out
              </span>
            </div>
          </div>
        </nav>
      </ScrollArea>
    </div>;
};
export default Sidebar;