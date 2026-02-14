
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import {
  FolderOpen,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Receipt,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SubscriptionWidget from '@/components/SubscriptionWidget';
import { formatProjectStatus } from '@/lib/utils';
import { TrialStatusBanner } from '@/components/TrialStatusBanner';
import { PendingInvitations } from '@/components/PendingInvitations';
import {
  MobilePageWrapper,
  MobileCard,
} from '@/components/mobile';
import type { User } from '@supabase/supabase-js';

interface ContextType {
  language: string;
}

const Dashboard = () => {
  const { language } = useOutletContext<ContextType>();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [user, setUser] = useState<User | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const INITIAL_PROJECTS_COUNT = 3;
  
  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  const aiRiskFeatureEnabled = isFeatureEnabled('ai_risk_management');
  const aiRiskFeatureUpcoming = isFeatureUpcoming('ai_risk_management');

  const translations = {
    en: {
      welcome: 'Welcome back',
      overview: 'Project Overview',
      quickActions: 'Quick Actions',
      recentActivity: 'Recent Activity',
      createProject: 'Create New Project',
      viewAllProjects: 'View All Projects',
      manageTeam: 'Manage Team',
      budgetOverview: 'Budget Overview',
      activeProjects: 'Active Projects',
      teamMembers: 'Team Members',
      totalBudget: 'Total Budget',
      riskAlerts: 'Risk Alerts',
      tasksCompleted: 'Tasks Completed',
      upcomingDeadlines: 'Upcoming Deadlines',
      weatherAlerts: 'Weather Alerts',
      permitStatus: 'Permit Status'
    },
    fr: {
      welcome: 'Bon retour',
      overview: 'Aperçu du Projet',
      quickActions: 'Actions Rapides',
      recentActivity: 'Activité Récente',
      createProject: 'Créer Nouveau Projet',
      viewAllProjects: 'Voir Tous les Projets',
      manageTeam: 'Gérer Équipe',
      budgetOverview: 'Aperçu Budget',
      activeProjects: 'Projets Actifs',
      teamMembers: 'Membres Équipe',
      totalBudget: 'Budget Total',
      riskAlerts: 'Alertes Risque',
      tasksCompleted: 'Tâches Complétées',
      upcomingDeadlines: 'Échéances',
      weatherAlerts: 'Alertes Météo',
      permitStatus: 'Statut Permis'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  // Fetch dashboard data with realtime updates
  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ['dashboard-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const projectIds = memberships?.map(m => m.project_id) || [];
      if (projectIds.length === 0) return [];
      
      // Fetch only projects user is member of (exclude archived)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get user's project memberships first
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const projectIds = memberships?.map(m => m.project_id) || [];
      if (projectIds.length === 0) return [];
      
      // Fetch alerts only from user's projects
      const { data: activityData, error: activityError } = await supabase
        .from('activity_feed')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (activityError) throw activityError;
      
      return activityData || [];
    },
    enabled: !!user?.id,
  });

  const { data: tasks } = useQuery({
    queryKey: ['dashboard-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get user's project memberships first
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const projectIds = memberships?.map(m => m.project_id) || [];
      if (projectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*, projects(name)')
        .in('project_id', projectIds)
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch team members count (only from user's projects)
  const { data: teamStats } = useQuery({
    queryKey: ['dashboard-team-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // Get user's project memberships first
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const projectIds = memberships?.map(m => m.project_id) || [];
      if (projectIds.length === 0) return 0;
      
      // Get unique team members from user's projects
      const { data, error } = await supabase
        .from('project_members')
        .select('user_id')
        .in('project_id', projectIds);
      
      if (error) throw error;
      
      const uniqueUsers = new Set(data?.map(m => m.user_id) || []);
      return uniqueUsers.size;
    },
    enabled: !!user?.id,
  });

  // Fetch total budget (only from user's projects)
  const { data: budgetStats } = useQuery({
    queryKey: ['dashboard-budget-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // Get user's project memberships first
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const projectIds = memberships?.map(m => m.project_id) || [];
      if (projectIds.length === 0) return 0;
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, budget')
        .in('id', projectIds)
        .neq('status', 'archived');
      
      if (error) throw error;

      const activeProjectIds = data?.map((project) => project.id) || [];
      if (activeProjectIds.length === 0) return 0;

      const { data: allocations, error: allocationsError } = await supabase
        .from('project_budgets')
        .select('project_id, budgeted_amount')
        .in('project_id', activeProjectIds);

      if (allocationsError) throw allocationsError;

      const additionalByProject = (allocations || []).reduce((acc, item) => {
        acc[item.project_id] = (acc[item.project_id] || 0) + (Number(item.budgeted_amount) || 0);
        return acc;
      }, {} as Record<string, number>);
      
      const total = data?.reduce((sum, project) => {
        const baseBudget = Number(project.budget) || 0;
        const additionalBudget = additionalByProject[project.id] || 0;
        return sum + baseBudget + additionalBudget;
      }, 0) || 0;
      return total;
    },
    enabled: !!user?.id,
  });

  // Fetch total income from invoices (only from user's projects)
  const { data: incomeStats } = useQuery({
    queryKey: ['dashboard-income-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalInvoiced: 0, totalPaid: 0 };
      
      // Get user's project memberships first
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const projectIds = memberships?.map(m => m.project_id) || [];
      if (projectIds.length === 0) return { totalInvoiced: 0, totalPaid: 0 };
      
      const { data, error } = await supabase
        .from('project_invoices')
        .select('amount, status')
        .in('project_id', projectIds);
      
      if (error) throw error;
      
      const totalInvoiced = data?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      const totalPaid = data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      return { totalInvoiced, totalPaid };
    },
    enabled: !!user?.id,
  });

  // Setup realtime subscriptions
  useEffect(() => {
    // Subscribe to projects changes
    const projectsChannel = supabase
      .channel('dashboard-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-projects'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-budget-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_budgets'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-budget-stats'] });
        }
      )
      .subscribe();

    // Subscribe to alerts changes
    const alertsChannel = supabase
      .channel('dashboard-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_feed'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weather_alerts'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
        }
      )
      .subscribe();

    // Subscribe to tasks changes
    const tasksChannel = supabase
      .channel('dashboard-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
        }
      )
      .subscribe();

    // Subscribe to team members changes
    const teamChannel = supabase
      .channel('dashboard-team-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-team-stats'] });
        }
      )
      .subscribe();

    // Subscribe to invoices changes for income tracking
    const incomeChannel = supabase
      .channel('dashboard-income-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invoices'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-income-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(incomeChannel);
    };
  }, [queryClient]);

  const kpiCards = [
    {
      title: t.activeProjects,
      value: projects?.length || 0,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t.teamMembers,
      value: teamStats || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t.totalBudget,
      value: budgetStats ? `$${(budgetStats / 1000000).toFixed(1)}M` : '$0',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: t.riskAlerts,
      value: alerts?.length || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <MobilePageWrapper
      title={t.welcome}
      subtitle={new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
      actions={
        <div className="flex items-center gap-2">
          {/* Mobile: Icon button */}
          <Button size="icon" className="md:hidden h-9 w-9 rounded-full bg-primary" asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
          {/* Desktop: Full button */}
          <Button className="hidden md:inline-flex" asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              {t.createProject}
            </Link>
          </Button>
        </div>
      }
    >
      {/* Trial Status Banner */}
      <TrialStatusBanner />

      {/* Pending Invitations */}
      <PendingInvitations />

      {/* KPI Cards - Mobile uses MobileCard component */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-4">
        <MobileCard
          title={t.activeProjects}
          value={projects?.length || 0}
          icon={FolderOpen}
          iconClassName="bg-blue-500/10"
        />
        <MobileCard
          title={t.teamMembers}
          value={teamStats || 0}
          icon={Users}
          iconClassName="bg-green-500/10"
        />
        <MobileCard
          title={t.totalBudget}
          value={budgetStats ? `$${budgetStats.toLocaleString()}` : '$0'}
          icon={DollarSign}
          iconClassName="bg-yellow-500/10"
        />
        <MobileCard
          title="Total Income"
          value={incomeStats?.totalPaid ? `$${incomeStats.totalPaid.toLocaleString()}` : '$0'}
          subtitle={incomeStats?.totalInvoiced ? `$${incomeStats.totalInvoiced.toLocaleString()} invoiced` : undefined}
          icon={Receipt}
          iconClassName="bg-emerald-500/10"
        />
        <MobileCard
          title={t.riskAlerts}
          value={alerts?.length || 0}
          icon={AlertTriangle}
          iconClassName="bg-red-500/10"
        />
      </div>

      {/* Subscription Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
        <SubscriptionWidget language={language} />
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t.activeProjects}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">
                {t.viewAllProjects}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(showAllProjects ? projects : projects?.slice(0, INITIAL_PROJECTS_COUNT))?.map((project) => (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{project.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{project.description || 'No description'}</p>
                    <Progress value={0} className="mt-2 h-2" />
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {formatProjectStatus(project.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground mt-1">
                      0%
                    </span>
                  </div>
                </Link>
              ))}
              {projects && projects.length > INITIAL_PROJECTS_COUNT && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllProjects(!showAllProjects)}
                >
                  {showAllProjects ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      {language === 'fr' ? 'Afficher moins' : 'Show less'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      {language === 'fr' ? `Afficher ${projects.length - INITIAL_PROJECTS_COUNT} de plus` : `Show ${projects.length - INITIAL_PROJECTS_COUNT} more`}
                    </>
                  )}
                </Button>
              )}
              {(!projects || projects.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">{language === 'fr' ? 'Aucun projet actif' : 'No active projects'}</p>
                  <Button asChild className="mt-2" size="sm">
                    <Link to="/projects/new">{t.createProject}</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              {t.riskAlerts}
              {!aiRiskFeatureEnabled && aiRiskFeatureUpcoming && (
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/alerts">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!aiRiskFeatureEnabled && aiRiskFeatureUpcoming ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground text-sm">
                  {language === 'fr' 
                    ? 'Cette fonctionnalité est en cours de développement et sera bientôt disponible.'
                    : 'This feature is currently under development and will be available soon.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts?.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="p-1 rounded-full bg-yellow-100">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <Badge variant="secondary" className="mt-1">
                        {'activity_type' in alert ? alert.activity_type : 'weather'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!alerts || alerts.length === 0) && (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {language === 'fr' ? 'Aucune alerte active' : 'No active alerts'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t.quickActions}</CardTitle>
            <CardDescription>
              {language === 'fr' ? 'Actions fréquemment utilisées' : 'Frequently used actions'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                {t.createProject}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/team">
                <Users className="h-4 w-4 mr-2" />
                {t.manageTeam}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/budget">
                <DollarSign className="h-4 w-4 mr-2" />
                {t.budgetOverview}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.upcomingDeadlines}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks?.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-full bg-gray-100">
                      <Clock className="h-3 w-3 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(task as any).projects?.name || 'Unknown Project'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      task.status === 'completed' ? 'secondary' :
                      task.status === 'in_progress' ? 'default' : 'outline'
                    }>
                      {task.status}
                    </Badge>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!tasks || tasks.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    {language === 'fr' ? 'Aucune tâche prévue' : 'No upcoming tasks'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobilePageWrapper>
  );
};

export default Dashboard;
