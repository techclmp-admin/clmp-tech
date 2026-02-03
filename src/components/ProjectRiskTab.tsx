import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  DollarSign, 
  Calendar, 
  HardHat, 
  FileCheck,
  TrendingUp,
  Clock,
  CloudRain,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIRiskManager } from './AIRiskManager';

interface ProjectRiskTabProps {
  projectId: string;
  projectBudget?: number;
  projectEndDate?: string;
}

interface RiskItem {
  id: string;
  type: 'budget' | 'schedule' | 'safety' | 'compliance' | 'weather' | 'resource';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'mitigated' | 'resolved';
  impact: string;
  probability: number;
  mitigation?: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'low': return 'outline';
    case 'medium': return 'secondary';
    case 'high': return 'default';
    case 'critical': return 'destructive';
    default: return 'outline';
  }
};

export const ProjectRiskTab: React.FC<ProjectRiskTabProps> = ({ 
  projectId, 
  projectBudget,
  projectEndDate 
}) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch budget data
  const { data: budgetData } = useQuery({
    queryKey: ['project-budget-risk', projectId],
    queryFn: async () => {
      const { data: expenses } = await supabase
        .from('project_expenses')
        .select('amount')
        .eq('project_id', projectId);
      
      const totalSpent = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const budgetUsage = projectBudget ? (totalSpent / projectBudget) * 100 : 0;
      
      return { totalSpent, budgetUsage };
    },
  });

  // Fetch schedule data
  const { data: scheduleData } = useQuery({
    queryKey: ['project-schedule-risk', projectId],
    queryFn: async () => {
      const { data: tasks } = await (supabase as any)
        .from('tasks')
        .select('id, status, due_date')
        .eq('project_id', projectId);
      
      const overdueTasks = tasks?.filter((t: any) => 
        t.due_date && 
        new Date(t.due_date) < new Date() && 
        t.status !== 'done' && 
        t.status !== 'completed'
      ).length || 0;
      
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((t: any) => t.status === 'done' || t.status === 'completed').length || 0;
      
      return { overdueTasks, totalTasks, completedTasks };
    },
  });

  // Fetch safety incidents
  const { data: safetyData } = useQuery({
    queryKey: ['project-safety-risk', projectId],
    queryFn: async () => {
      const { data: incidents } = await (supabase as any)
        .from('safety_incidents')
        .select('id, severity, status')
        .eq('project_id', projectId)
        .eq('status', 'open');
      
      return {
        openIncidents: incidents?.length || 0,
        criticalIncidents: incidents?.filter((i: any) => i.severity === 'critical' || i.severity === 'high').length || 0,
      };
    },
  });

  // Fetch compliance data
  const { data: complianceData } = useQuery({
    queryKey: ['project-compliance-risk', projectId],
    queryFn: async () => {
      const { data: permits } = await supabase
        .from('permits')
        .select('id, status, expiry_date')
        .eq('project_id', projectId);
      
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id, status, result')
        .eq('project_id', projectId);
      
      const expiredPermits = permits?.filter(p => 
        p.expiry_date && new Date(p.expiry_date) < new Date()
      ).length || 0;
      
      const pendingPermits = permits?.filter(p => p.status === 'pending').length || 0;
      const failedInspections = inspections?.filter(i => i.result === 'failed').length || 0;
      
      return { expiredPermits, pendingPermits, failedInspections };
    },
  });

  // Fetch weather risk assessments
  const { data: weatherRisks } = useQuery({
    queryKey: ['project-weather-risk', projectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('risk_assessments')
        .select('id, risk_score, severity, risk_factors')
        .eq('project_id', projectId)
        .eq('risk_type', 'weather')
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      
      return data?.[0] || null;
    },
  });

  // Calculate overall risk score
  const calculateOverallRisk = () => {
    let riskScore = 0;
    let factors = 0;

    // Budget risk (0-25)
    if (budgetData) {
      factors++;
      if (budgetData.budgetUsage > 100) riskScore += 25;
      else if (budgetData.budgetUsage > 90) riskScore += 20;
      else if (budgetData.budgetUsage > 80) riskScore += 10;
      else riskScore += 5;
    }

    // Schedule risk (0-25)
    if (scheduleData) {
      factors++;
      const overdueRatio = scheduleData.totalTasks > 0 
        ? (scheduleData.overdueTasks / scheduleData.totalTasks) * 100 
        : 0;
      if (overdueRatio > 30) riskScore += 25;
      else if (overdueRatio > 20) riskScore += 20;
      else if (overdueRatio > 10) riskScore += 10;
      else riskScore += 5;
    }

    // Safety risk (0-25)
    if (safetyData) {
      factors++;
      if (safetyData.criticalIncidents > 0) riskScore += 25;
      else if (safetyData.openIncidents > 3) riskScore += 15;
      else if (safetyData.openIncidents > 0) riskScore += 10;
      else riskScore += 5;
    }

    // Compliance risk (0-25)
    if (complianceData) {
      factors++;
      if (complianceData.expiredPermits > 0 || complianceData.failedInspections > 0) riskScore += 25;
      else if (complianceData.pendingPermits > 2) riskScore += 15;
      else if (complianceData.pendingPermits > 0) riskScore += 10;
      else riskScore += 5;
    }

    return factors > 0 ? Math.round(riskScore / factors) : 0;
  };

  const overallRisk = calculateOverallRisk();
  const getOverallRiskLevel = () => {
    if (overallRisk >= 75) return 'critical';
    if (overallRisk >= 50) return 'high';
    if (overallRisk >= 25) return 'medium';
    return 'low';
  };

  const riskCategories = [
    {
      id: 'budget',
      title: 'Budget Risk',
      icon: DollarSign,
      value: budgetData?.budgetUsage ? `${budgetData.budgetUsage.toFixed(0)}%` : 'N/A',
      description: budgetData?.budgetUsage && budgetData.budgetUsage > 90 
        ? 'Budget is nearly exhausted' 
        : 'Budget is on track',
      severity: budgetData?.budgetUsage && budgetData.budgetUsage > 100 ? 'critical' 
        : budgetData?.budgetUsage && budgetData.budgetUsage > 90 ? 'high'
        : budgetData?.budgetUsage && budgetData.budgetUsage > 80 ? 'medium' 
        : 'low',
      details: `$${(budgetData?.totalSpent || 0).toLocaleString()} spent of $${(projectBudget || 0).toLocaleString()} budget`,
    },
    {
      id: 'schedule',
      title: 'Schedule Risk',
      icon: Calendar,
      value: `${scheduleData?.overdueTasks || 0}`,
      description: scheduleData?.overdueTasks ? `${scheduleData.overdueTasks} overdue tasks` : 'All tasks on schedule',
      severity: scheduleData?.overdueTasks && scheduleData.overdueTasks > 5 ? 'critical'
        : scheduleData?.overdueTasks && scheduleData.overdueTasks > 2 ? 'high'
        : scheduleData?.overdueTasks && scheduleData.overdueTasks > 0 ? 'medium'
        : 'low',
      details: `${scheduleData?.completedTasks || 0} of ${scheduleData?.totalTasks || 0} tasks completed`,
    },
    {
      id: 'safety',
      title: 'Safety Risk',
      icon: HardHat,
      value: `${safetyData?.openIncidents || 0}`,
      description: safetyData?.openIncidents ? `${safetyData.openIncidents} open incidents` : 'No open safety incidents',
      severity: safetyData?.criticalIncidents && safetyData.criticalIncidents > 0 ? 'critical'
        : safetyData?.openIncidents && safetyData.openIncidents > 3 ? 'high'
        : safetyData?.openIncidents && safetyData.openIncidents > 0 ? 'medium'
        : 'low',
      details: safetyData?.criticalIncidents ? `${safetyData.criticalIncidents} critical/high priority` : 'All clear',
    },
    {
      id: 'compliance',
      title: 'Compliance Risk',
      icon: FileCheck,
      value: `${(complianceData?.expiredPermits || 0) + (complianceData?.failedInspections || 0)}`,
      description: complianceData?.expiredPermits 
        ? `${complianceData.expiredPermits} expired permits` 
        : 'Permits up to date',
      severity: complianceData?.expiredPermits && complianceData.expiredPermits > 0 ? 'critical'
        : complianceData?.failedInspections && complianceData.failedInspections > 0 ? 'high'
        : complianceData?.pendingPermits && complianceData.pendingPermits > 2 ? 'medium'
        : 'low',
      details: `${complianceData?.pendingPermits || 0} pending permits, ${complianceData?.failedInspections || 0} failed inspections`,
    },
    {
      id: 'weather',
      title: 'Weather Risk',
      icon: CloudRain,
      value: weatherRisks?.risk_score ? `${weatherRisks.risk_score}%` : 'N/A',
      description: weatherRisks?.severity 
        ? `${weatherRisks.severity} weather impact` 
        : 'No active weather alerts',
      severity: weatherRisks?.severity || 'low',
      details: weatherRisks?.risk_factors?.length 
        ? `${weatherRisks.risk_factors.length} risk factors identified`
        : 'Run analysis for details',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card className={`border-l-4 ${
        getOverallRiskLevel() === 'critical' ? 'border-l-red-500' :
        getOverallRiskLevel() === 'high' ? 'border-l-orange-500' :
        getOverallRiskLevel() === 'medium' ? 'border-l-yellow-500' :
        'border-l-green-500'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Project Risk Overview
              </CardTitle>
              <CardDescription>
                Comprehensive risk assessment across all project dimensions
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                getOverallRiskLevel() === 'critical' ? 'text-red-600' :
                getOverallRiskLevel() === 'high' ? 'text-orange-600' :
                getOverallRiskLevel() === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {overallRisk}%
              </div>
              <Badge variant={getSeverityBadge(getOverallRiskLevel()) as any} className="mt-1">
                {getOverallRiskLevel().toUpperCase()} RISK
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={overallRisk} 
            className={`h-3 ${
              getOverallRiskLevel() === 'critical' ? '[&>div]:bg-red-500' :
              getOverallRiskLevel() === 'high' ? '[&>div]:bg-orange-500' :
              getOverallRiskLevel() === 'medium' ? '[&>div]:bg-yellow-500' :
              '[&>div]:bg-green-500'
            }`}
          />
        </CardContent>
      </Card>

      {/* Risk Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riskCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card key={category.id} className={`${getSeverityColor(category.severity)} border`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background/80">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{category.title}</h4>
                      <p className="text-sm opacity-80">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{category.value}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs opacity-70">{category.details}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="weather" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="weather" className="flex items-center gap-1">
            <CloudRain className="h-4 w-4" />
            <span className="hidden sm:inline">Weather</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-1">
            <HardHat className="h-4 w-4" />
            <span className="hidden sm:inline">Safety</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-1">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="mt-4">
          <AIRiskManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">${(projectBudget || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">${(budgetData?.totalSpent || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget Usage</span>
                  <span className="font-medium">{budgetData?.budgetUsage?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={budgetData?.budgetUsage || 0} />
              </div>
              {budgetData?.budgetUsage && budgetData.budgetUsage > 80 && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800">
                  <p className="text-sm font-medium">⚠️ Budget Alert</p>
                  <p className="text-xs">Budget usage is above 80%. Consider reviewing upcoming expenses.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{scheduleData?.totalTasks || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{scheduleData?.completedTasks || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{scheduleData?.overdueTasks || 0}</p>
                </div>
              </div>
              {projectEndDate && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Project Deadline</p>
                  <p className="font-medium">{new Date(projectEndDate).toLocaleDateString()}</p>
                  {new Date(projectEndDate) < new Date() && (
                    <Badge variant="destructive" className="mt-2">Project Overdue</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                Safety Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Open Incidents</p>
                  <p className={`text-2xl font-bold ${(safetyData?.openIncidents || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {safetyData?.openIncidents || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Critical/High</p>
                  <p className={`text-2xl font-bold ${(safetyData?.criticalIncidents || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {safetyData?.criticalIncidents || 0}
                  </p>
                </div>
              </div>
              {(safetyData?.openIncidents || 0) === 0 ? (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800">
                  <p className="text-sm font-medium">✅ No Open Safety Incidents</p>
                  <p className="text-xs">All safety incidents have been resolved.</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
                  <p className="text-sm font-medium">⚠️ Active Safety Concerns</p>
                  <p className="text-xs">There are open safety incidents requiring attention.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Compliance Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Expired Permits</p>
                  <p className={`text-2xl font-bold ${(complianceData?.expiredPermits || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {complianceData?.expiredPermits || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Pending Permits</p>
                  <p className="text-2xl font-bold text-yellow-600">{complianceData?.pendingPermits || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Failed Inspections</p>
                  <p className={`text-2xl font-bold ${(complianceData?.failedInspections || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {complianceData?.failedInspections || 0}
                  </p>
                </div>
              </div>
              {complianceData?.expiredPermits && complianceData.expiredPermits > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
                  <p className="text-sm font-medium">🚨 Expired Permits</p>
                  <p className="text-xs">Immediate action required to renew expired permits.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectRiskTab;
