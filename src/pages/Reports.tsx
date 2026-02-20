import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  PieChart,
  LineChart as LineChartIcon,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatProjectStatus } from "@/lib/utils";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from '@/components/mobile';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface ProjectMetrics {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  daysRemaining: number;
  teamSize: number;
  tasksCompleted: number;
  totalTasks: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface AnalyticsData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  totalInvoiced: number;
  netBalance: number;
  averageProgress: number;
  onTimeProjects: number;
  delayedProjects: number;
}

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  
  const featureEnabled = isFeatureEnabled('reports_analytics');
  const featureUpcoming = isFeatureUpcoming('reports_analytics');

  // Sync dropdown with tabs
  const handleReportTypeChange = (value: string) => {
    setActiveTab(value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Reports sub-feature checks (map tab values to feature keys)
  const REPORTS_TAB_FEATURE_MAP: Record<string, string> = {
    'overview': 'reports_overview',
    'performance': 'reports_performance',
    'financial': 'reports_financial',
    'risk': 'reports_risk',
    'trends': 'reports_trends',
  };

  const isReportsTabEnabled = (tabValue: string) => 
    isFeatureEnabled(REPORTS_TAB_FEATURE_MAP[tabValue] || 'reports_analytics');
  const isReportsTabUpcoming = (tabValue: string) => 
    isFeatureUpcoming(REPORTS_TAB_FEATURE_MAP[tabValue] || 'reports_analytics');

  // Tab options for mobile grid - sorted: enabled first, upcoming at end
  const tabOptions = [
    { value: 'overview', label: 'Overview' },
    { value: 'performance', label: 'Performance' },
    { value: 'financial', label: 'Financial' },
    { value: 'risk', label: 'Risk Analysis' },
    { value: 'trends', label: 'Trends' },
  ]
    .filter(tab => isReportsTabEnabled(tab.value) || isReportsTabUpcoming(tab.value))
    .sort((a, b) => {
      const aUpcoming = isReportsTabUpcoming(a.value);
      const bUpcoming = isReportsTabUpcoming(b.value);
      if (aUpcoming === bUpcoming) return 0;
      return aUpcoming ? 1 : -1;
    });

  // Realtime subscription for projects
  useEffect(() => {
    const channel = supabase
      .channel('reports-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
          queryClient.invalidateQueries({ queryKey: ['project-metrics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Realtime subscription for budgets
  useEffect(() => {
    const channel = supabase
      .channel('reports-budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_budgets'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
          queryClient.invalidateQueries({ queryKey: ['project-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['reports-trends'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Realtime subscription for expenses
  useEffect(() => {
    const channel = supabase
      .channel('reports-expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
          queryClient.invalidateQueries({ queryKey: ['project-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['reports-trends'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Realtime subscription for invoices (income tracking)
  useEffect(() => {
    const channel = supabase
      .channel('reports-invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invoices'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch analytics data with real database calculations
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-overview', selectedPeriod],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get date range based on selected period
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case 'current-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'current-quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'current-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'last-year':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          break;
      }

      // Get project IDs where user is a member
      const { data: membershipData } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      const projectIds = membershipData?.map(m => m.project_id) || [];
      
      if (projectIds.length === 0) {
        return {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalBudget: 0,
          totalSpent: 0,
          totalIncome: 0,
          totalInvoiced: 0,
          netBalance: 0,
          averageProgress: 0,
          onTimeProjects: 0,
          delayedProjects: 0,
        } as AnalyticsData;
      }

      // Fetch projects user has access to
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, budget, progress, end_date, created_at, start_date')
        .in('id', projectIds)
        .gte('created_at', startDate.toISOString());

      if (projectsError) throw projectsError;

      const analyticsProjectIds = projects?.map(project => project.id) || [];
      const { data: allocations, error: allocationsError } = await supabase
        .from('project_budgets')
        .select('project_id, budgeted_amount')
        .in('project_id', analyticsProjectIds);

      if (allocationsError) throw allocationsError;

      const additionalByProject = (allocations || []).reduce((acc, item) => {
        acc[item.project_id] = (acc[item.project_id] || 0) + (Number(item.budgeted_amount) || 0);
        return acc;
      }, {} as Record<string, number>);

      // Fetch expenses data for user's projects
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('project_id, amount')
        .in('project_id', projectIds);

      if (expensesError) throw expensesError;

      // Fetch income data from project_invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('project_invoices')
        .select('project_id, amount, status')
        .in('project_id', projectIds);

      if (invoicesError) throw invoicesError;

      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
      const totalBudget = projects?.reduce((sum, project) => {
        const baseBudget = Number(project.budget) || 0;
        const additionalBudget = additionalByProject[project.id] || 0;
        return sum + baseBudget + additionalBudget;
      }, 0) || 0;
      
      // Calculate actual spent from expenses table
      const totalSpent = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
      
      // Calculate income from invoices
      const totalInvoiced = invoices?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      const totalIncome = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      const netBalance = totalIncome - totalSpent;
      
      const averageProgress = totalProjects > 0 
        ? projects?.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects 
        : 0;
      
      // Calculate on-time vs delayed projects based on end dates
      let onTimeProjects = 0;
      let delayedProjects = 0;
      
      projects?.forEach(p => {
        if (p.status === 'active' && p.end_date) {
          const daysRemaining = Math.ceil((new Date(p.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const expectedProgress = p.start_date 
            ? ((now.getTime() - new Date(p.start_date).getTime()) / (new Date(p.end_date).getTime() - new Date(p.start_date).getTime())) * 100
            : 50;
          
          if ((p.progress || 0) >= expectedProgress || daysRemaining > 0) {
            onTimeProjects++;
          } else {
            delayedProjects++;
          }
        }
      });

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        totalBudget,
        totalSpent,
        totalIncome,
        totalInvoiced,
        netBalance,
        averageProgress,
        onTimeProjects,
        delayedProjects,
      } as AnalyticsData;
    },
  });

  // Fetch detailed project metrics with real data
  const { data: projectMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['project-metrics', selectedPeriod],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get project IDs where user is a member
      const { data: membershipData } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      const projectIds = membershipData?.map(m => m.project_id) || [];
      
      if (projectIds.length === 0) return [];

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, budget, progress, end_date, start_date')
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const metricsProjectIds = projects?.map(project => project.id) || [];
      const { data: allocations, error: allocationsError } = await supabase
        .from('project_budgets')
        .select('project_id, budgeted_amount')
        .in('project_id', metricsProjectIds);

      if (allocationsError) throw allocationsError;

      const additionalByProject = (allocations || []).reduce((acc, item) => {
        acc[item.project_id] = (acc[item.project_id] || 0) + (Number(item.budgeted_amount) || 0);
        return acc;
      }, {} as Record<string, number>);

      // Fetch expenses data for user's projects
      const { data: expenses } = await supabase
        .from('expenses')
        .select('project_id, amount')
        .in('project_id', projectIds);

      // Fetch team members count for user's projects
      const { data: members } = await supabase
        .from('project_members')
        .select('project_id, user_id')
        .in('project_id', projectIds);

      // Fetch actual tasks for user's projects
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('id, project_id, status')
        .in('project_id', projectIds);

      return await Promise.all(projects?.map(async project => {
        // Get actual spent from expenses
        const projectExpenses = expenses?.filter(e => e.project_id === project.id) || [];
        const spent = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
        const daysRemaining = project.end_date 
          ? Math.max(0, Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        
        // Count actual team members
        const teamSize = members?.filter(m => m.project_id === project.id).length || 0;
        
        // Get actual tasks from database
        const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];
        const totalTasks = projectTasks.length;
        const tasksCompleted = projectTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
        
        // Calculate risk level based on progress vs timeline
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        const now = new Date();
        
        if (project.status === 'active' && project.start_date && project.end_date) {
          const totalDuration = new Date(project.end_date).getTime() - new Date(project.start_date).getTime();
          const elapsed = now.getTime() - new Date(project.start_date).getTime();
          const expectedProgress = (elapsed / totalDuration) * 100;
          const progressGap = expectedProgress - (project.progress || 0);
          
          if (progressGap > 20 || daysRemaining < 14) {
            riskLevel = 'high';
          } else if (progressGap > 10 || daysRemaining < 30) {
            riskLevel = 'medium';
          }
        }

        const effectiveBudget = (Number(project.budget) || 0) + (additionalByProject[project.id] || 0);

        // Check budget overrun risk
        if (spent > effectiveBudget * 0.9) {
          riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        }

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          progress: project.progress || 0,
          budget: effectiveBudget,
          spent,
          daysRemaining,
          teamSize,
          tasksCompleted,
          totalTasks: totalTasks || 1, // Avoid division by zero
          riskLevel,
        };
      }) || []);
    },
  });

  // Fetch trends data for charts
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['reports-trends', selectedPeriod],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { spendingTrend: [], projectTrend: [], categoryData: [], budgetUtilization: [] };

      // Get project IDs where user is a member
      const { data: membershipData } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      const projectIds = membershipData?.map(m => m.project_id) || [];
      
      if (projectIds.length === 0) {
        return { spendingTrend: [], projectTrend: [], categoryData: [], budgetUtilization: [] };
      }

      // Get date range based on selected period
      const now = new Date();
      let startDate = new Date();
      let daysBack = 30;
      
      switch (selectedPeriod) {
        case 'current-month':
          daysBack = 30;
          break;
        case 'last-month':
          daysBack = 60;
          break;
        case 'current-quarter':
          daysBack = 90;
          break;
        case 'current-year':
          daysBack = 365;
          break;
        case 'last-year':
          daysBack = 730;
          break;
      }
      
      startDate.setDate(now.getDate() - daysBack);

      // Fetch expenses for user's projects
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('expense_date, amount, category, project_id')
        .in('project_id', projectIds)
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .order('expense_date', { ascending: true });

      if (expensesError) throw expensesError;

      // Fetch projects user has access to
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, progress, created_at, budget')
        .in('id', projectIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (projectsError) throw projectsError;

      const trendsProjectIds = projects?.map(project => project.id) || [];
      const { data: allocations, error: allocationsError } = await supabase
        .from('project_budgets')
        .select('project_id, budgeted_amount')
        .in('project_id', trendsProjectIds);

      if (allocationsError) throw allocationsError;

      const additionalByProject = (allocations || []).reduce((acc, item) => {
        acc[item.project_id] = (acc[item.project_id] || 0) + (Number(item.budgeted_amount) || 0);
        return acc;
      }, {} as Record<string, number>);

      // Group expenses by date for spending trend
      const spendingByDate: Record<string, number> = {};
      const categorySpending: Record<string, number> = {};
      
      expenses?.forEach(expense => {
        const date = expense.expense_date;
        spendingByDate[date] = (spendingByDate[date] || 0) + Number(expense.amount);
        
        const cat = expense.category || 'Other';
        categorySpending[cat] = (categorySpending[cat] || 0) + Number(expense.amount);
      });

      // Create spending trend data
      const spendingTrend = Object.entries(spendingByDate)
        .map(([date, amount]) => ({
          date: new Date(date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
          amount,
          fullDate: date,
        }))
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

      // Create cumulative spending
      let cumulative = 0;
      const cumulativeSpending = spendingTrend.map(item => {
        cumulative += item.amount;
        return { ...item, cumulative };
      });

      // Group projects by week for project creation trend
      const projectsByWeek: Record<string, number> = {};
      projects?.forEach(project => {
        const date = new Date(project.created_at);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        projectsByWeek[weekKey] = (projectsByWeek[weekKey] || 0) + 1;
      });

      const projectTrend = Object.entries(projectsByWeek)
        .map(([week, count]) => ({
          week: new Date(week).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
          count,
        }))
        .slice(-12); // Last 12 weeks

      // Category distribution
      const categoryData = Object.entries(categorySpending)
        .map(([category, amount]) => ({
          category,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);

      // Budget utilization by project (use expenses already fetched)
      const budgetUtilization = projects?.map(project => {
        const projectExpenses = expenses?.filter(e => e.project_id === project.id) || [];
        const spent = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const budget = (Number(project.budget) || 0) + (additionalByProject[project.id] || 0) || 1;
        
        return {
          name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
          budget,
          spent,
          utilization: Math.min(100, (spent / budget) * 100),
        };
      }).slice(0, 6) || [];

      return {
        spendingTrend: cumulativeSpending,
        projectTrend,
        categoryData,
        budgetUtilization,
      };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive'
    };
    return variants[risk as keyof typeof variants] || 'default';
  };

  const handleExportReport = async () => {
    if (!projectMetrics || !analytics) return;
    
    setIsExporting(true);
    
    try {
      // Generate CSV content
      const headers = ['Project Name', 'Status', 'Progress (%)', 'Budget', 'Spent', 'Remaining', 'Team Size', 'Days Remaining', 'Risk Level'];
      const rows = projectMetrics.map(p => [
        p.name,
        p.status,
        p.progress.toFixed(1),
        formatCurrency(p.budget),
        formatCurrency(p.spent),
        formatCurrency(p.budget - p.spent),
        p.teamSize.toString(),
        p.daysRemaining.toString(),
        p.riskLevel
      ]);
      
      // Add summary section
      const summary = [
        [],
        ['SUMMARY'],
        ['Total Projects', analytics.totalProjects.toString()],
        ['Active Projects', analytics.activeProjects.toString()],
        ['Completed Projects', analytics.completedProjects.toString()],
        ['Total Budget', formatCurrency(analytics.totalBudget)],
        ['Total Spent', formatCurrency(analytics.totalSpent)],
        ['Average Progress', `${analytics.averageProgress.toFixed(1)}%`],
        ['On-Time Projects', analytics.onTimeProjects.toString()],
        ['Delayed Projects', analytics.delayedProjects.toString()],
      ];
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
        ...summary.map(row => row.join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `project-report-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Your report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // If feature is disabled and not marked as upcoming, show disabled message
  if (!featureEnabled && !featureUpcoming) {
    return (
      <MobilePageWrapper
        title="Reports & Analytics"
        subtitle="This feature is currently disabled"
      >
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Feature Disabled</h3>
              <p className="text-muted-foreground">
                Reports & Analytics is currently disabled. Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </MobilePageWrapper>
    );
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <MobilePageWrapper
        title="Reports & Analytics"
        subtitle="Comprehensive project performance reports"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reports & Analytics
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                This feature is currently under development and will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </MobilePageWrapper>
    );
  }

  if (analyticsLoading || metricsLoading || trendsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobilePageWrapper
      title="Reports & Analytics"
      subtitle="Comprehensive insights into project performance"
      actions={
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportReport}
          disabled={isExporting || !projectMetrics}
          className="md:hidden"
        >
          <Download className="h-4 w-4" />
        </Button>
      }
    >
      {/* Desktop Export Button */}
      <div className="hidden md:flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={handleExportReport}
          disabled={isExporting || !projectMetrics}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 md:gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Current Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="current-quarter">Current Quarter</SelectItem>
            <SelectItem value="current-year">Current Year</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={activeTab} onValueChange={handleReportTypeChange}>
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            {tabOptions.map(tab => (
              <SelectItem key={tab.value} value={tab.value} disabled={isReportsTabUpcoming(tab.value)}>
                {tab.label}
                {isReportsTabUpcoming(tab.value) ? ' (Soon)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Overview Cards - Mobile Native */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <MobileCard
          title="Total Projects"
          value={analytics?.totalProjects || 0}
          subtitle={`${analytics?.activeProjects || 0} active, ${analytics?.completedProjects || 0} completed`}
          icon={BarChart3}
        />
        <MobileCard
          title="Average Progress"
          value={`${analytics?.averageProgress?.toFixed(1) || 0}%`}
          icon={TrendingUp}
        />
        <MobileCard
          title="Total Spent"
          value={formatCurrency(analytics?.totalSpent || 0)}
          subtitle={`${analytics?.totalBudget ? ((analytics.totalSpent / analytics.totalBudget) * 100).toFixed(0) : 0}% of budget`}
          icon={TrendingDown}
        />
        <MobileCard
          title="Total Income"
          value={formatCurrency(analytics?.totalIncome || 0)}
          subtitle={`${formatCurrency(analytics?.totalInvoiced || 0)} invoiced`}
          icon={DollarSign}
          iconClassName="bg-emerald-500/10"
        />
        <MobileCard
          title="Net Balance"
          value={formatCurrency(analytics?.netBalance || 0)}
          subtitle={(analytics?.netBalance || 0) >= 0 ? 'Profit' : 'Loss'}
          icon={(analytics?.netBalance || 0) >= 0 ? TrendingUp : TrendingDown}
          iconClassName={(analytics?.netBalance || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}
        />
      </div>

      {/* Mobile Segmented Control for Tabs */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={handleTabChange}
          size="sm"
        />
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {/* Desktop TabsList */}
        <TabsList className="hidden md:flex">
          {tabOptions.map(tab => {
            const upcoming = isReportsTabUpcoming(tab.value);
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                disabled={upcoming}
                className={`relative ${upcoming ? 'opacity-50' : 'font-semibold'}`}
              >
                {upcoming && (
                  <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                )}
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>
                Comprehensive view of all projects and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectMetrics?.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {formatProjectStatus(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-16">
                          <Progress value={project.progress} />
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(project.budget)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {project.teamSize}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadge(project.riskLevel) as any}>
                          {project.riskLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Rate</CardTitle>
                <CardDescription>Average task completion across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectMetrics?.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center space-x-4">
                      <div className="w-32 text-sm font-medium truncate">{project.name}</div>
                      <div className="flex-1">
                        <Progress value={(project.tasksCompleted / project.totalTasks) * 100} />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>{project.tasksCompleted}/{project.totalTasks} tasks</span>
                          <span>{((project.tasksCompleted / project.totalTasks) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline Performance</CardTitle>
                <CardDescription>Project delivery timeline analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">On Schedule</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics?.onTimeProjects || 0}</div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Delayed</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics?.delayedProjects || 0}</div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Average Progress</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics?.averageProgress?.toFixed(1) || 0}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual Spending</CardTitle>
                <CardDescription>Financial performance across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectMetrics?.slice(0, 5).map((project) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{project.name}</span>
                        <span>{((project.spent / project.budget) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(project.spent / project.budget) * 100} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Budget: {formatCurrency(project.budget)}</span>
                        <span>Spent: {formatCurrency(project.spent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Overall financial metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Total Budget Allocated</p>
                      <p className="text-2xl font-bold">{formatCurrency(analytics?.totalBudget || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Total Spent</p>
                      <p className="text-2xl font-bold">{formatCurrency(analytics?.totalSpent || 0)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Budget Utilization</p>
                      <p className="text-2xl font-bold">
                        {analytics?.totalBudget ? ((analytics.totalSpent / analytics.totalBudget) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Project risk analysis and mitigation recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectMetrics?.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.daysRemaining} days remaining • {project.progress}% complete
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRiskBadge(project.riskLevel) as any}>
                        {project.riskLevel} risk
                      </Badge>
                      {project.riskLevel === 'high' && (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Spending</CardTitle>
                <CardDescription>Total spending over time</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsData?.spendingTrend && trendsData.spendingTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={trendsData.spendingTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                        name="Cumulative"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>No spending data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Creation</CardTitle>
                <CardDescription>New projects per week</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsData?.projectTrend && trendsData.projectTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={trendsData.projectTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis allowDecimals={false} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Projects" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>No project data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Expense distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsData?.categoryData && trendsData.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={trendsData.categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} className="text-xs" />
                      <YAxis type="category" dataKey="category" width={100} className="text-xs" />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                      <Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
                <CardDescription>Budget vs actual spending per project</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsData?.budgetUtilization && trendsData.budgetUtilization.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={trendsData.budgetUtilization}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} className="text-xs" />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Legend />
                      <Bar dataKey="budget" fill="hsl(var(--muted-foreground))" name="Budget" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spent" fill="hsl(var(--primary))" name="Spent" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>No budget data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MobilePageWrapper>
  );
}
