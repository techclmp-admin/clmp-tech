import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from '@/components/mobile';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle,
  Bell,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  X,
  Search,
  Filter,
  Settings,
  Eye,
  Archive,
  DollarSign,
  Calendar,
  HardHat,
  FileCheck,
  TrendingUp,
  ChevronRight,
  Building2
} from 'lucide-react';

interface ProjectRiskSummary {
  id: string;
  name: string;
  overallRisk: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  budgetRisk: number;
  scheduleRisk: number;
  safetyRisk: number;
  complianceRisk: number;
  weatherRisk: number;
  activeAlerts: number;
}

const AlertsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const aiRiskFeatureEnabled = isFeatureEnabled('ai_risk_management');
  const aiRiskFeatureUpcoming = isFeatureUpcoming('ai_risk_management');

  // Fetch all projects with risk data (filtered by user's project membership)
  const { data: projectsRiskData = [] } = useQuery({
    queryKey: ['all-projects-risk'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      // Get projects the user has access to
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, budget, end_date, status')
        .in('id', userProjectIds)
        .in('status', ['active', 'planning', 'in_progress', 'on_hold'])
        .order('name');

      if (!projects) return [];

      // Fetch risk data for each project
      const projectRisks: ProjectRiskSummary[] = await Promise.all(
        projects.map(async (project) => {
          // Budget risk
          const { data: expenses } = await supabase
            .from('project_expenses')
            .select('amount')
            .eq('project_id', project.id);
          const totalSpent = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
          const budgetUsage = project.budget ? (totalSpent / project.budget) * 100 : 0;
          const budgetRisk = budgetUsage > 100 ? 100 : budgetUsage > 90 ? 80 : budgetUsage > 80 ? 50 : 20;

          // Schedule risk
          const { data: tasks } = await (supabase as any)
            .from('tasks')
            .select('id, status, due_date')
            .eq('project_id', project.id);
          const overdueTasks = tasks?.filter((t: any) => 
            t.due_date && new Date(t.due_date) < new Date() && 
            t.status !== 'done' && t.status !== 'completed'
          ).length || 0;
          const totalTasks = tasks?.length || 1;
          const scheduleRisk = Math.min((overdueTasks / totalTasks) * 100 * 3, 100);

          // Safety risk
          const { data: incidents } = await (supabase as any)
            .from('safety_incidents')
            .select('id, severity')
            .eq('project_id', project.id)
            .eq('status', 'open');
          const criticalIncidents = incidents?.filter((i: any) => 
            i.severity === 'critical' || i.severity === 'high'
          ).length || 0;
          const safetyRisk = criticalIncidents > 0 ? 100 : (incidents?.length || 0) > 0 ? 50 : 10;

          // Compliance risk
          const { data: permits } = await supabase
            .from('permits')
            .select('id, status, expiry_date')
            .eq('project_id', project.id);
          const expiredPermits = permits?.filter(p => 
            p.expiry_date && new Date(p.expiry_date) < new Date()
          ).length || 0;
          const complianceRisk = expiredPermits > 0 ? 100 : (permits?.filter(p => p.status === 'pending').length || 0) > 2 ? 50 : 10;

          // Weather risk
          const { data: weatherRisks } = await (supabase as any)
            .from('risk_assessments')
            .select('risk_score')
            .eq('project_id', project.id)
            .eq('risk_type', 'weather')
            .gte('valid_until', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);
          const weatherRisk = weatherRisks?.[0]?.risk_score || 10;

          // Active alerts count
          const { data: alerts } = await supabase
            .from('weather_alerts')
            .select('id')
            .eq('project_id', project.id)
            .eq('is_active', true);
          const activeAlerts = alerts?.length || 0;

          // Calculate overall risk
          const overallRisk = Math.round((budgetRisk + scheduleRisk + safetyRisk + complianceRisk + weatherRisk) / 5);
          const riskLevel = overallRisk >= 75 ? 'critical' : overallRisk >= 50 ? 'high' : overallRisk >= 25 ? 'medium' : 'low';

          return {
            id: project.id,
            name: project.name,
            overallRisk,
            riskLevel,
            budgetRisk,
            scheduleRisk,
            safetyRisk,
            complianceRisk,
            weatherRisk,
            activeAlerts,
          };
        })
      );

      return projectRisks;
    },
  });

  // Fetch all alerts from database (filtered by user's projects)
  const { data: activities = [] } = useQuery({
    queryKey: ['alerts-activity-feed'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('activity_feed')
        .select('id, activity_type, title, description, priority, is_read, created_at, project_id, entity_type, entity_id, metadata, user_id, projects(name)')
        .in('project_id', userProjectIds)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: weatherAlerts = [] } = useQuery({
    queryKey: ['alerts-weather'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('weather_alerts')
        .select('*, projects(name)')
        .in('project_id', userProjectIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Combine and transform alerts
  const alerts = [
    ...activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      type: activity.activity_type.includes('safety') ? 'safety' : 
            activity.activity_type.includes('budget') ? 'budget' :
            activity.activity_type.includes('weather') ? 'weather' : 'general',
      severity: activity.priority === 'urgent' ? 'critical' : 
               activity.priority === 'high' ? 'high' :
               activity.priority === 'medium' ? 'medium' : 'low',
      project: activity.projects?.name || 'Unknown Project',
      projectId: activity.project_id,
      timestamp: new Date(activity.created_at),
      status: 'active',
      actionRequired: activity.priority === 'high' || activity.priority === 'urgent'
    })),
    ...weatherAlerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      type: 'weather',
      severity: alert.severity,
      project: alert.projects?.name || 'All Sites',
      projectId: alert.project_id,
      timestamp: new Date(alert.created_at),
      status: 'active',
      actionRequired: alert.severity === 'high' || alert.severity === 'critical'
    }))
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'safety': return Shield;
      case 'budget': return DollarSign;
      case 'weather': return Zap;
      case 'schedule': return Calendar;
      case 'compliance': return FileCheck;
      default: return Bell;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.project?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projectsRiskData.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary stats
  const totalProjects = projectsRiskData.length;
  const highRiskProjects = projectsRiskData.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
  const totalActiveAlerts = projectsRiskData.reduce((sum, p) => sum + p.activeAlerts, 0);
  const avgRiskScore = totalProjects > 0 
    ? Math.round(projectsRiskData.reduce((sum, p) => sum + p.overallRisk, 0) / totalProjects)
    : 0;

  const handleAlertAction = (alertId: string, action: string) => {
    toast({
      title: `Alert ${action}`,
      description: `Alert has been ${action.toLowerCase()}`
    });
  };

  // Alerts sub-feature checks (map tab values to feature keys)
  const ALERTS_TAB_FEATURE_MAP: Record<string, string> = {
    'overview': 'alerts_overview',
    'projects': 'alerts_by_project',
    'alerts': 'alerts_all',
    'weather': 'alerts_weather',
  };

  const isAlertsTabEnabled = (tabValue: string) => 
    isFeatureEnabled(ALERTS_TAB_FEATURE_MAP[tabValue] || 'ai_risk_management');
  const isAlertsTabUpcoming = (tabValue: string) => 
    isFeatureUpcoming(ALERTS_TAB_FEATURE_MAP[tabValue] || 'ai_risk_management');

  // Sorted: enabled first, upcoming at end
  const tabOptions = [
    { value: 'overview', label: 'Overview', icon: TrendingUp },
    { value: 'projects', label: 'By Project', icon: Building2 },
    { value: 'alerts', label: 'All Alerts', icon: Bell },
    { value: 'weather', label: 'Weather', icon: Zap },
  ]
    .filter(tab => isAlertsTabEnabled(tab.value) || isAlertsTabUpcoming(tab.value))
    .sort((a, b) => {
      const aUpcoming = isAlertsTabUpcoming(a.value);
      const bUpcoming = isAlertsTabUpcoming(b.value);
      if (aUpcoming === bUpcoming) return 0;
      return aUpcoming ? 1 : -1;
    });

  return (
    <MobilePageWrapper
      title="AI Risk Alerts"
      subtitle="Consolidated risk monitoring across all your projects"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden md:inline-flex">
            <Settings className="h-4 w-4 mr-2" />
            Alert Settings
          </Button>
        </div>
      }
    >
      {/* Coming Soon Message */}
      {!aiRiskFeatureEnabled && aiRiskFeatureUpcoming ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                AI-powered risk alerts and weather monitoring features are currently under development 
                and will be available soon. Stay tuned for advanced project risk management capabilities.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <MobileCard
              title="Avg Risk Score"
              value={`${avgRiskScore}%`}
              icon={<TrendingUp className={`h-5 w-5 ${avgRiskScore >= 50 ? 'text-destructive' : 'text-green-600'}`} />}
              variant="filled"
            />
            <MobileCard
              title="High Risk Projects"
              value={highRiskProjects.toString()}
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
            />
            <MobileCard
              title="Active Alerts"
              value={totalActiveAlerts.toString()}
              icon={<Bell className="h-5 w-5 text-orange-600" />}
            />
            <MobileCard
              title="Total Projects"
              value={totalProjects.toString()}
              icon={<Building2 className="h-5 w-5 text-primary" />}
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects or alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Mobile Segmented Control */}
          <div className="md:hidden">
            <MobileSegmentedControl
              options={tabOptions}
              value={selectedTab}
              onChange={setSelectedTab}
              variant="card"
            />
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="hidden md:flex w-full">
              {tabOptions.map(tab => {
                const upcoming = isAlertsTabUpcoming(tab.value);
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className={`relative flex-1 ${upcoming ? 'opacity-50' : 'font-semibold'}`}
                    disabled={upcoming}
                  >
                    {upcoming && (
                      <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                    )}
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
            {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Risk Distribution by Category
                  </CardTitle>
                  <CardDescription>Real-time risk analysis across all projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Risk Categories */}
                  <div className="space-y-4">
                    {[
                      { label: 'Budget', value: projectsRiskData.length > 0 ? Math.round(projectsRiskData.reduce((s, p) => s + p.budgetRisk, 0) / projectsRiskData.length) : 0, icon: DollarSign },
                      { label: 'Schedule', value: projectsRiskData.length > 0 ? Math.round(projectsRiskData.reduce((s, p) => s + p.scheduleRisk, 0) / projectsRiskData.length) : 0, icon: Calendar },
                      { label: 'Safety', value: projectsRiskData.length > 0 ? Math.round(projectsRiskData.reduce((s, p) => s + p.safetyRisk, 0) / projectsRiskData.length) : 0, icon: HardHat },
                      { label: 'Compliance', value: projectsRiskData.length > 0 ? Math.round(projectsRiskData.reduce((s, p) => s + p.complianceRisk, 0) / projectsRiskData.length) : 0, icon: FileCheck },
                      { label: 'Weather', value: projectsRiskData.length > 0 ? Math.round(projectsRiskData.reduce((s, p) => s + p.weatherRisk, 0) / projectsRiskData.length) : 0, icon: Zap },
                    ].map((item) => {
                      const getProgressColor = (val: number) => {
                        if (val >= 75) return 'bg-destructive';
                        if (val >= 50) return 'bg-orange-500';
                        if (val >= 25) return 'bg-yellow-500';
                        return 'bg-green-500';
                      };
                      const getTextColor = (val: number) => {
                        if (val >= 75) return 'text-destructive';
                        if (val >= 50) return 'text-orange-600';
                        if (val >= 25) return 'text-yellow-600';
                        return 'text-green-600';
                      };
                      
                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-muted">
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <span className={`text-sm font-semibold ${getTextColor(item.value)}`}>
                              {item.value}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getProgressColor(item.value)} transition-all duration-500 rounded-full`}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">System Status</div>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Monitored</div>
                      <div className="text-sm font-semibold">{totalProjects} Projects</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Active Alerts</div>
                      <div className={`text-sm font-semibold ${totalActiveAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {totalActiveAlerts}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Avg Risk</div>
                      <div className={`text-sm font-semibold ${
                        avgRiskScore >= 75 ? 'text-destructive' :
                        avgRiskScore >= 50 ? 'text-orange-600' :
                        avgRiskScore >= 25 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>{avgRiskScore}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Critical Projects */}
              {highRiskProjects > 0 && (
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      High Risk Projects Requiring Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredProjects
                        .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
                        .slice(0, 5)
                        .map(project => (
                          <Link key={project.id} to={`/projects/${project.id}`}>
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  project.riskLevel === 'critical' ? 'bg-destructive' : 'bg-orange-500'
                                }`} />
                                <div>
                                  <p className="font-medium">{project.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {project.activeAlerts} active alerts
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getRiskLevelBadge(project.riskLevel) as any}>
                                  {project.overallRisk}% Risk
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* By Project Tab */}
            <TabsContent value="projects" className="space-y-4">
              {filteredProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                    <p className="text-muted-foreground">Create a project to start monitoring risks.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredProjects.map(project => (
                  <Card key={project.id} className={`border-l-4 ${
                    project.riskLevel === 'critical' ? 'border-l-destructive' :
                    project.riskLevel === 'high' ? 'border-l-orange-500' :
                    project.riskLevel === 'medium' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link to={`/projects/${project.id}`} className="hover:underline">
                            <h4 className="font-semibold">{project.name}</h4>
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {project.activeAlerts} active alerts
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            project.riskLevel === 'critical' ? 'text-destructive' :
                            project.riskLevel === 'high' ? 'text-orange-600' :
                            project.riskLevel === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {project.overallRisk}%
                          </div>
                          <Badge variant={getRiskLevelBadge(project.riskLevel) as any}>
                            {project.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: 'Budget', value: project.budgetRisk, icon: DollarSign },
                          { label: 'Schedule', value: project.scheduleRisk, icon: Calendar },
                          { label: 'Safety', value: project.safetyRisk, icon: HardHat },
                          { label: 'Compliance', value: project.complianceRisk, icon: FileCheck },
                          { label: 'Weather', value: project.weatherRisk, icon: Zap },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <item.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <div className={`text-sm font-medium ${
                              item.value >= 75 ? 'text-destructive' :
                              item.value >= 50 ? 'text-orange-600' :
                              item.value >= 25 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>{item.value}%</div>
                            <div className="text-xs text-muted-foreground">{item.label}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link to={`/projects/${project.id}`}>
                            View Details
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* All Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <AlertList alerts={filteredAlerts} onAction={handleAlertAction} />
            </TabsContent>

            {/* Weather Tab */}
            <TabsContent value="weather" className="space-y-4">
              <AlertList 
                alerts={filteredAlerts.filter(a => a.type === 'weather')} 
                onAction={handleAlertAction} 
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </MobilePageWrapper>
  );
};

interface AlertListProps {
  alerts: any[];
  onAction: (alertId: string, action: string) => void;
}

const AlertList: React.FC<AlertListProps> = ({ alerts, onAction }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'safety': return Shield;
      case 'budget': return DollarSign;
      case 'weather': return Zap;
      case 'schedule': return Calendar;
      case 'compliance': return FileCheck;
      default: return Bell;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Alerts</h3>
          <p className="text-muted-foreground">There are no alerts matching your criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const IconComponent = getAlertIcon(alert.type);
        
        return (
          <Card key={alert.id} className={`border-l-4 ${
            getSeverityColor(alert.severity).includes('red') ? 'border-l-destructive' :
            getSeverityColor(alert.severity).includes('orange') ? 'border-l-orange-500' :
            getSeverityColor(alert.severity).includes('yellow') ? 'border-l-yellow-500' :
            'border-l-green-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${getSeverityColor(alert.severity)}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => onAction(alert.id, 'Dismissed')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </Badge>
                    {alert.actionRequired && (
                      <Badge variant="destructive" className="text-xs">Action Required</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {alert.project} • {formatTimeAgo(alert.timestamp)}
                    </span>
                  </div>
                  
                  {alert.projectId && (
                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/projects/${alert.projectId}`}>
                          View Project
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AlertsPage;
