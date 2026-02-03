import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MapPin, Users, DollarSign, Settings, ArrowLeft, BarChart3, Calendar, Cloud, Kanban, Target, Building2, UserCircle, MessageSquare, FileText, TrendingDown, TrendingUp, CalendarClock, ShieldCheck, AlertTriangle, Wallet, Receipt } from "lucide-react";
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from "@/components/mobile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import InviteTeamMember from "@/components/InviteTeamMember";
import ProjectFileManager from "@/components/ProjectFileManager";
import KanbanBoard from "@/components/KanbanBoard";
import GanttChart from "@/components/GanttChart";
import WeatherWidget from "@/components/WeatherWidget";
import { AIRiskManager } from "@/components/AIRiskManager";
import { TasksTable } from "@/components/TasksTable";
import { ProjectChat } from "@/components/ProjectChat";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { usePresence } from "@/hooks/usePresence";
import { LeaveProjectButton } from "@/components/LeaveProjectButton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BlockedMembersList } from "@/components/BlockedMembersList";
import { RejoinProjectRequest } from "@/components/RejoinProjectRequest";
import { RejoinRequestsManager } from "@/components/RejoinRequestsManager";
import { ProjectCalendarTab } from "@/components/ProjectCalendarTab";
import { ProjectComplianceTab } from "@/components/ProjectComplianceTab";
import { ProjectRiskTab } from "@/components/ProjectRiskTab";
import { ProjectFinanceTab } from "@/components/ProjectFinanceTab";
import { formatProjectStatus } from "@/lib/utils";

// Map UI tab values -> Global Feature keys (used by Admin Feature Management)
// This is required so toggles like "Project Finance Tab" actually control the Finance tab.
const TAB_FEATURE_KEY_MAP: Record<string, string> = {
  overview: 'project_overview_tab',
  finance: 'project_finance_tab',
  calendar: 'project_calendar_tab',
  risk: 'project_risk_tab',
  compliance: 'project_compliance_tab',
  tasks: 'project_tasks_tab',
  team: 'project_team_tab',
  files: 'project_documents_tab',
};

const ALL_TAB_OPTIONS = [
  { value: 'overview', label: 'Overview', icon: Building2 },
  { value: 'finance', label: 'Finance', icon: Wallet },
  { value: 'kanban', label: 'Kanban', icon: Kanban },
  { value: 'timeline', label: 'Timeline', icon: Calendar },
  { value: 'calendar', label: 'Calendar', icon: CalendarClock },
  { value: 'risk', label: 'Risk', icon: AlertTriangle },
  { value: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { value: 'tasks', label: 'Tasks', icon: Target },
  { value: 'team', label: 'Team', icon: Users },
  { value: 'chat', label: 'Chat', icon: MessageSquare },
  { value: 'files', label: 'Files', icon: FileText },
  { value: 'weather', label: 'Weather', icon: Cloud },
];

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  
  // Initialize tab from URL query param or default to "overview"
  const tabFromUrl = searchParams.get('tab')?.toLowerCase();
  const validTabs = ALL_TAB_OPTIONS.map(t => t.value);
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Update tab when URL changes
  useEffect(() => {
    const newTab = searchParams.get('tab')?.toLowerCase();
    if (newTab && validTabs.includes(newTab) && newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams]);

  const isTabEnabled = (tabValue: string) =>
    isFeatureEnabled(TAB_FEATURE_KEY_MAP[tabValue] || tabValue);

  const isTabUpcoming = (tabValue: string) =>
    isFeatureUpcoming(TAB_FEATURE_KEY_MAP[tabValue] || tabValue);

  // Sort tabs: enabled first, then upcoming ("Soon") at the end
  const tabOptions = ALL_TAB_OPTIONS
    .filter(tab => isTabEnabled(tab.value) || isTabUpcoming(tab.value))
    .sort((a, b) => {
      const aUpcoming = isTabUpcoming(a.value);
      const bUpcoming = isTabUpcoming(b.value);
      if (aUpcoming === bUpcoming) return 0;
      return aUpcoming ? 1 : -1;
    });

  // If the currently selected tab becomes disabled/hidden, move to first available tab
  useEffect(() => {
    if (!tabOptions.length) return;
    if (!tabOptions.some(t => t.value === activeTab)) {
      setActiveTab(tabOptions[0].value);
    }
  }, [activeTab, tabOptions]);
  
  // Real-time presence tracking for project members
  const { onlineCount, isOnline } = usePresence(`project-${id}-presence`);

  // Check if user is a member of this project
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['project-membership', id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking membership:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!id && !!user?.id,
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 0, // Don't cache this query
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Fetch owner profile separately
      if (data?.created_by) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, avatar_url, member_code')
          .eq('id', data.created_by)
          .single();
        
        return { ...data, owner: ownerProfile };
      }
      
      return data;
    },
    enabled: !!id,
  });

  const { data: tasks } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch project expenses to show budget spent
  const { data: projectExpenses } = useQuery({
    queryKey: ['project-expenses', id],
    queryFn: async () => {
      if (!id) return { totalSpent: 0, count: 0 };
      
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('project_id', id);

      if (error) throw error;
      
      const totalSpent = data?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
      return { totalSpent, count: data?.length || 0 };
    },
    enabled: !!id,
  });

  // Fetch project income from invoices
  const { data: projectIncome } = useQuery({
    queryKey: ['project-income', id],
    queryFn: async () => {
      if (!id) return { totalInvoiced: 0, totalPaid: 0, invoiceCount: 0 };
      
      const { data, error } = await supabase
        .from('project_invoices')
        .select('amount, status')
        .eq('project_id', id);

      if (error) throw error;
      
      const totalInvoiced = data?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      const totalPaid = data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      return { totalInvoiced, totalPaid, invoiceCount: data?.length || 0 };
    },
    enabled: !!id,
  });

  const { data: teamMembers, error: teamMembersError, isLoading: teamMembersLoading } = useQuery({
    // Include user id to avoid cross-user cache bleed (e.g., switching accounts can show stale member counts)
    queryKey: ['project-members', id, user?.id],
    queryFn: async () => {
      if (!id) return [];
      
      console.log('Fetching team members for project:', id);
      
      // Fetch project members first
      const { data: members, error } = await supabase
        .from('project_members')
        .select('id, role, joined_at, user_id, invited_by, permissions')
        .eq('project_id', id);

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }
      
      if (!members || members.length === 0) {
        return [];
      }
      
      // Fetch profiles separately
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url, member_code')
        .in('id', userIds);
      
      // Combine members with profiles
      const membersWithProfiles = members.map(member => ({
        ...member,
        profiles: profiles?.find(p => p.id === member.user_id) || null
      }));
      
      console.log('Team members data:', membersWithProfiles);
      return membersWithProfiles;
    },
    enabled: !!id && !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Log team members errors
  useEffect(() => {
    if (teamMembersError) {
      console.error('Team members query error:', teamMembersError);
    }
  }, [teamMembersError]);

  // Realtime subscription for project updates
  useEffect(() => {
    if (!id || !user) return;

    const projectChannel = supabase
      .channel('project-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', id] });
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
        }
      )
      .subscribe();

    const membersChannel = supabase
      .channel('members-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${id}`
        },
        async (payload) => {
          // Don't show notification for own actions
          if (payload.new.user_id === user.id) return;

          // Fetch member profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', payload.new.user_id)
            .single();

          const memberName = profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
            : 'A member';

          toast({
            title: '👋 New member joined',
            description: `${memberName} has joined the project`,
          });

          // Invalidate all variants of project-members queries (some include user id)
          queryClient.invalidateQueries({ queryKey: ['project-members', id], exact: false });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${id}`
        },
        async (payload) => {
          // If current user was removed, redirect immediately
          if (payload.old.user_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['project-membership', id, user.id] });
            queryClient.removeQueries({ queryKey: ['project-membership', id, user.id] });
            queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
            queryClient.removeQueries({ queryKey: ['projects'], exact: false });
            
            toast({
              title: 'Access removed',
              description: 'You are no longer a member of this project',
              variant: 'destructive',
            });

            queryClient.invalidateQueries({ queryKey: ['project-members', id], exact: false });
            
            navigate('/projects', { replace: true });
            return;
          }

          // Fetch member profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', payload.old.user_id)
            .single();

          const memberName = profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
            : 'A member';

          toast({
            title: '👋 Member left',
            description: `${memberName} has left the project`,
          });

          // Invalidate all variants of project-members queries (some include user id)
          queryClient.invalidateQueries({ queryKey: ['project-members', id], exact: false });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${id}`
        },
        () => {
          // Invalidate all variants of project-members queries (some include user id)
          queryClient.invalidateQueries({ queryKey: ['project-members', id], exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [id, queryClient, user, toast, navigate]);

  // Realtime subscription for invoices (income tracking)
  useEffect(() => {
    if (!id) return;

    const invoiceChannel = supabase
      .channel(`project-invoices-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invoices',
          filter: `project_id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-income', id] });
          queryClient.invalidateQueries({ queryKey: ['project-invoices', id] });
          queryClient.invalidateQueries({ queryKey: ['project-invoices-summary', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invoiceChannel);
    };
  }, [id, queryClient]);

  // Show loading while checking membership
  if (membershipLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  // Show rejoin request UI if user is not a member
  if (membership === null && user && id) {
    return (
      <RejoinProjectRequest
        projectId={id}
        projectName={project.name}
        userId={user.id}
      />
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on_hold': return 'outline';
      case 'planning': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate project progress based on completed tasks
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'done' || task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <MobilePageWrapper
      title={project.name}
      subtitle={project.description}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(project.status) as any} className="hidden md:inline-flex">
            {formatProjectStatus(project.status)}
          </Badge>
          <LeaveProjectButton 
            projectId={project.id}
            projectName={project.name}
            isOwner={project.created_by === user?.id}
            currentOwnerId={project.created_by}
            teamMembers={teamMembers || []}
          />
        </div>
      }
    >
      {/* Back Button - Mobile Compact */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="md:hidden">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" asChild className="hidden md:inline-flex">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Mobile-Native Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
        <MobileCard
          title="Progress"
          value={`${progress}%`}
          subtitle={`${tasks?.filter(t => t.status === 'done' || t.status === 'completed').length || 0}/${tasks?.length || 0} tasks`}
          icon={<div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-primary" />}
          variant="filled"
        />
        <MobileCard
          title="Budget"
          value={project.budget ? formatCurrency(project.budget) : 'N/A'}
          subtitle={project.budget ? 'Total allocated' : undefined}
          icon={<DollarSign className="h-4 w-4 md:h-6 md:w-6 text-primary" />}
        />
        <MobileCard
          title="Spent"
          value={formatCurrency(projectExpenses?.totalSpent || 0)}
          subtitle={project.budget && projectExpenses?.totalSpent 
            ? `${((projectExpenses.totalSpent / project.budget) * 100).toFixed(1)}% of budget`
            : `${projectExpenses?.count || 0} expenses`
          }
          icon={<TrendingDown className="h-4 w-4 md:h-6 md:w-6 text-primary" />}
        />
        <MobileCard
          title="Income"
          value={formatCurrency(projectIncome?.totalPaid || 0)}
          subtitle={projectIncome?.totalInvoiced 
            ? `${formatCurrency(projectIncome.totalInvoiced)} invoiced`
            : `${projectIncome?.invoiceCount || 0} invoices`
          }
          icon={<Receipt className="h-4 w-4 md:h-6 md:w-6 text-emerald-600" />}
        />
        <MobileCard
          title="Tasks"
          value={`${tasks?.length || 0}`}
          subtitle={`${tasks?.filter(t => t.status === 'in_progress').length || 0} in progress`}
          icon={<Target className="h-4 w-4 md:h-6 md:w-6 text-primary" />}
        />
        <MobileCard
          title="Duration"
          value={project.start_date && project.end_date 
            ? `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
            : 'N/A'
          }
          subtitle={project.end_date 
            ? `Due ${format(new Date(project.end_date), 'MMM dd')}`
            : undefined
          }
          icon={<CalendarDays className="h-4 w-4 md:h-6 md:w-6 text-primary" />}
        />
      </div>

      {/* Mobile Segmented Control for Tabs */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={tabOptions.map(t => ({ value: t.value, label: t.label, icon: t.icon }))}
          value={activeTab}
          onChange={setActiveTab}
          variant="card"
        />
      </div>

      {/* Project Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Desktop TabsList - hidden on mobile (we use MobileSegmentedControl instead) */}
        <TabsList className="hidden md:flex flex-wrap">
          {tabOptions.map((tab) => {
            const upcoming = isTabUpcoming(tab.value);
            const Icon = tab.icon;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={upcoming}
                className={`relative flex items-center gap-2 ${upcoming ? 'opacity-50' : 'font-semibold'}`}
              >
                {upcoming && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 h-4"
                  >
                    Soon
                  </Badge>
                )}
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(isTabEnabled('finance') || isTabUpcoming('finance')) && (
          <TabsContent value="finance" className="space-y-6">
            <ProjectFinanceTab 
              projectId={id!}
              projectName={project.name}
              projectBudget={project.budget}
            />
          </TabsContent>
        )}

        {isTabEnabled('overview') && (
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={getStatusColor(project.status) as any} className="mt-1">
                        {formatProjectStatus(project.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Priority</p>
                      <Badge variant={getPriorityColor(project.priority) as any} className="mt-1">
                        {project.priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium capitalize">{project.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phase</p>
                      <p className="font-medium capitalize">{project.current_phase || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {project.location && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location
                      </p>
                      <p className="font-medium">{project.location}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Timeline</p>
                    <p className="font-medium">
                      {project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'N/A'} 
                      {' → '}
                      {project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                    {onlineCount > 0 && (
                      <div className="flex items-center gap-1 ml-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground">{onlineCount} online</span>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {teamMembers?.length || 0} members working on this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Display All Team Members (including owner) */}
                    {teamMembers && teamMembers.length > 0 ? (
                      <>
                        {/* Sort to show owner first */}
                        {[...teamMembers]
                          .sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0))
                          .slice(0, 5)
                          .map((member) => {
                            const profile = member.profiles as any;
                            const displayName = profile?.first_name && profile?.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : profile?.email || 'Unknown User';
                            
                            const memberIsOnline = isOnline(member.user_id);
                            const isOwner = member.role === 'owner';
                            
                            return (
                              <div key={member.id} className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 ${isOwner ? 'border-b pb-3 mb-3' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                                    {memberIsOnline && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{displayName}</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={isOwner ? "default" : "secondary"} className="text-xs mt-1 capitalize">{member.role}</Badge>
                                      {memberIsOnline && (
                                        <span className="text-xs text-green-600 font-medium">Online</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {teamMembers.length > 5 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setActiveTab("team")}
                          >
                            View all members
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No team members yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recent Tasks
                  </CardTitle>
                  <CardDescription>
                    Latest tasks and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasks && tasks.length > 0 ? (
                    <div className="space-y-2">
                      {tasks.slice(0, 5).map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskDialogOpen(true);
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{task.status}</p>
                          </div>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                      {tasks.length > 5 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveTab("tasks")}
                        >
                          View all {tasks.length} tasks
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tasks yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Project Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Project Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed Tasks</span>
                      <span className="font-medium">
                        {tasks?.filter(t => t.status === 'done' || t.status === 'completed').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">In Progress</span>
                      <span className="font-medium">
                        {tasks?.filter(t => t.status === 'in_progress').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pending Review</span>
                      <span className="font-medium">
                        {tasks?.filter(t => t.status === 'review').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">To Do</span>
                      <span className="font-medium">
                        {tasks?.filter(t => t.status === 'todo').length || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-medium">
                        {teamMembers?.length || 0} member{(teamMembers?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {isFeatureEnabled('kanban') && (
          <TabsContent value="kanban" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Kanban Board</h3>
              <p className="text-muted-foreground mb-6">Drag and drop tasks between different status columns to update their progress.</p>
              {id && <KanbanBoard projectId={id} />}
            </div>
          </TabsContent>
        )}

        {isFeatureEnabled('timeline') && (
          <TabsContent value="timeline" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Project Timeline</h3>
              <p className="text-muted-foreground mb-6">Visual timeline showing task durations and dependencies across the project lifecycle.</p>
              {id && <GanttChart projectId={id} />}
            </div>
          </TabsContent>
        )}

        {(isTabEnabled('calendar') || isTabUpcoming('calendar')) && (
          <TabsContent value="calendar" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Project Calendar</h3>
              <p className="text-muted-foreground mb-6">
                Schedule and track inspections, meetings, deliveries, and milestones for this project.
              </p>
              {id && project && (
                <ProjectCalendarTab 
                  projectId={id} 
                  projectName={project.name} 
                />
              )}
            </div>
          </TabsContent>
        )}

        {(isTabEnabled('compliance') || isTabUpcoming('compliance')) && (
          <TabsContent value="compliance" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Project Compliance</h3>
              <p className="text-muted-foreground mb-6">
                Track permits, inspections, OBC compliance, and safety requirements for this project.
              </p>
              {id && project && (
                <ProjectComplianceTab 
                  projectId={id} 
                  projectName={project.name} 
                />
              )}
            </div>
          </TabsContent>
        )}

        {(isTabEnabled('risk') || isTabUpcoming('risk')) && (
          <TabsContent value="risk" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Project Risk Analysis</h3>
              <p className="text-muted-foreground mb-6">
                Comprehensive risk assessment across budget, schedule, safety, compliance, and weather factors.
              </p>
              {id && project && (
                <ProjectRiskTab 
                  projectId={id}
                  projectBudget={project.budget}
                  projectEndDate={project.end_date}
                />
              )}
            </div>
          </TabsContent>
        )}

        {isTabEnabled('tasks') && (
          <TabsContent value="tasks" className="space-y-6">
            {id && tasks && <TasksTable tasks={tasks} projectId={id} />}
          </TabsContent>
        )}

        {isTabEnabled('team') && (
          <TabsContent value="team" className="space-y-6">
            {id && (
              <>
                <InviteTeamMember 
                  projectId={id} 
                  projectName={project.name} 
                />
                {/* Show rejoin requests for admins/owners */}
                {membership?.role && ['owner', 'admin'].includes(membership.role) && (
                  <RejoinRequestsManager projectId={id} />
                )}
                <BlockedMembersList projectId={id} />
              </>
            )}
          </TabsContent>
        )}

        {isFeatureEnabled('chat') && (
          <TabsContent value="chat" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Project Chat</h3>
              <p className="text-muted-foreground mb-6">
                Discuss this project with your team members in real-time.
              </p>
              {id && (
                <ProjectChat 
                  projectId={id} 
                  projectName={project.name} 
                />
              )}
            </div>
          </TabsContent>
        )}

        {isTabEnabled('files') && (
          <TabsContent value="files" className="space-y-6">
            {id && (
              <ProjectFileManager 
                projectId={id} 
                projectName={project.name} 
              />
            )}
          </TabsContent>
        )}

        {isFeatureEnabled('weather') && (
          <TabsContent value="weather" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Weather Conditions</h3>
                <p className="text-muted-foreground mb-6">Current weather conditions and construction-specific recommendations for site planning.</p>
                {id && <WeatherWidget projectId={id} defaultLocation={project.location || "Toronto"} />}
              </div>
              
              {isFeatureEnabled('alerts') && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">AI Risk Management</h3>
                  <p className="text-muted-foreground mb-6">AI-powered weather risk analysis and safety recommendations for your construction project.</p>
                  {id && <AIRiskManager projectId={id} />}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onTaskUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
        }}
      />
    </MobilePageWrapper>
  );
};

export default ProjectDetails;