import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PlusCircle,
  FileText,
  Calendar,
  Camera,
  BarChart3,
  Download,
  Eye,
  Pencil,
  Trash2,
  Tag,
  Receipt,
  Upload,
  Loader2,
  ExternalLink,
  Check,
  XCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import CanadianTaxCalculator from '@/components/CanadianTaxCalculator';
import BudgetAnalytics from '@/components/BudgetAnalytics';
import { ReceiptScanner } from '@/components/ReceiptScanner';
import { BudgetInvoicesTab } from '@/components/budget/BudgetInvoicesTab';
import { BudgetCategoriesTab } from '@/components/budget/BudgetCategoriesTab';
import {
  MobilePageHeader,
  MobileCard,
  MobileSegmentedControl,
  MobileFilterChip,
  MobileProgressCard,
} from '@/components/mobile';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  subMonths,
  format 
} from 'date-fns';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

interface BudgetData {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  projectCount: number;
}

interface ProjectBudget {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: string;
  endDate: string;
}

export default function Budget() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const isReceiptScannerEnabled = isFeatureEnabled('receipt_scanner');
  const isReceiptScannerUpcoming = isFeatureUpcoming('receipt_scanner');
  // Categories button on header uses same feature as Categories tab
  const isCategoriesEnabled = isFeatureEnabled('budget_categories');
  const isCategoriesUpcoming = isFeatureUpcoming('budget_categories');
  const featureEnabled = isFeatureEnabled('budget_tracking');
  const featureUpcoming = isFeatureUpcoming('budget_tracking');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedReceiptFilter, setSelectedReceiptFilter] = useState('all');
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isViewExpenseOpen, setIsViewExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  
  // Edit/Delete states
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [isEditScanning, setIsEditScanning] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'budget' | 'expense'; id: string } | null>(null);

  // Form state for new budget entry
  const [newBudget, setNewBudget] = useState({
    project_id: '',
    category: '',
    budgeted_amount: '',
    notes: '',
  });

  // Form state for new expense entry
  const [newExpense, setNewExpense] = useState({
    project_id: '',
    budget_id: '',
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    receipt_image: '' as string, // base64 image for upload
  });

  // Setup realtime subscriptions with immediate refetch
  useEffect(() => {
    const refetchAll = () => {
      void queryClient.refetchQueries({ queryKey: ['budget-overview'] });
      void queryClient.refetchQueries({ queryKey: ['project-budgets'] });
      void queryClient.refetchQueries({ queryKey: ['budget-categories'] });
      void queryClient.refetchQueries({ queryKey: ['budget-items'] });
      void queryClient.refetchQueries({ queryKey: ['recent-expenses'] });
      void queryClient.refetchQueries({ queryKey: ['spending-trends'] });
      void queryClient.refetchQueries({ queryKey: ['budget-forecast'] });
      void queryClient.refetchQueries({ queryKey: ['projects-list'] });
      void queryClient.refetchQueries({ queryKey: ['budget-income'] });
    };

    const channel = supabase
      .channel('budget-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        refetchAll
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_budgets'
        },
        refetchAll
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets'
        },
        refetchAll
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        refetchAll
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invoices'
        },
        refetchAll
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Helper function to get date range based on selected period
  const getDateRange = (period: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'current-month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last-month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'current-quarter':
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        break;
      case 'current-year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  // Fetch budget overview data with real database integration (filtered by user's projects)
  const { data: budgetOverview, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget-overview', selectedPeriod, selectedProject, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          percentageUsed: 0,
          projectCount: 0,
        } as BudgetData;
      }

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) {
        return {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          percentageUsed: 0,
          projectCount: 0,
        } as BudgetData;
      }

      // Fetch projects with budgets that user has access to
      let projectQuery = supabase
        .from('projects')
        .select('id, name, budget, status, end_date, created_at')
        .in('id', userProjectIds)
        .not('budget', 'is', null);
      
      // If a specific project is selected, filter by it
      if (selectedProject && selectedProject !== 'all') {
        projectQuery = projectQuery.eq('id', selectedProject);
      }
      
      const { data: projects, error: projectsError } = await projectQuery;

      if (projectsError) throw projectsError;

      const projectIds = projects?.map(p => p.id) || [];

      if (projectIds.length === 0) {
        return {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          percentageUsed: 0,
          projectCount: 0,
        } as BudgetData;
      }

      // Fetch actual budget data from project_budgets
      const { data: projectBudgetsData, error: budgetsError } = await supabase
        .from('project_budgets')
        .select('project_id, budgeted_amount, actual_amount, created_at')
        .in('project_id', projectIds);

      if (budgetsError) throw budgetsError;

      // BUG 10 FIX: Commented out - 'budgets' table does not exist, causing query failure
      // const { data: budgetsData, error: budgetsTableError } = await supabase
      //   .from('budgets')
      //   .select('*')
      //   .in('project_id', projectIds);
      // if (budgetsTableError) throw budgetsTableError;

      // Calculate total from projects.budget (main budget for each project)
      const totalFromProjects = projects?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0;
      
      // Use projects total as the primary budget source
      const totalBudget = totalFromProjects;
      
      // Fetch actual expenses from the expenses table (primary source for spent)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, project_id')
        .in('project_id', projectIds);
      
      if (expensesError) throw expensesError;
      
      // Total spent = sum of all expenses (this is the true source of spending)
      const totalSpent = expensesData?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
      
      const totalRemaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        totalBudget,
        totalSpent,
        totalRemaining,
        percentageUsed,
        projectCount: projects?.length || 0,
      } as BudgetData;
    },
    enabled: !!user?.id,
  });

  // Fetch project budgets with real data (filtered by user's projects)
  const { data: projectBudgets, isLoading: projectsLoading } = useQuery({
    queryKey: ['project-budgets', selectedProject, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      let projectQuery = supabase
        .from('projects')
        .select('id, name, budget, status, end_date')
        .in('id', userProjectIds)
        .not('budget', 'is', null);

      if (selectedProject !== 'all') {
        projectQuery = projectQuery.eq('id', selectedProject);
      }

      const { data: projects, error: projectsError } = await projectQuery;
      if (projectsError) throw projectsError;

      // Fetch actual budget data for these projects
      const projectIds = projects?.map(p => p.id) || [];
      
      const { data: budgetData, error: budgetError } = await supabase
        .from('project_budgets')
        .select('project_id, budgeted_amount, actual_amount')
        .in('project_id', projectIds);

      if (budgetError) throw budgetError;

      // BUG 10 FIX: Commented out - 'budgets' table does not exist, causing query failure
      // const { data: budgetsData2, error: budgetsTableError2 } = await supabase
      //   .from('budgets')
      //   .select('*')
      //   .in('project_id', projectIds);
      // if (budgetsTableError2) throw budgetsTableError2;

      // Also fetch expenses for these projects
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, project_id')
        .in('project_id', projectIds);
      
      if (expensesError) throw expensesError;

      return projects?.map(project => {
        // Get expenses for this project - this is the true source of spending
        const projectExpenses = expensesData?.filter(e => e.project_id === project.id) || [];
        const spent = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
        const budget = project.budget || 0;
        const remaining = budget - spent;
        const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;

        return {
          id: project.id,
          name: project.name,
          budget,
          spent,
          remaining,
          percentageUsed,
          status: project.status,
          endDate: project.end_date,
        };
      }) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch expense categories
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch budget by categories with correct expenses (filtered by user's projects)
  const { data: budgetCategories } = useQuery({
    queryKey: ['budget-categories', selectedProject, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      let budgetQuery = supabase
        .from('project_budgets')
        .select('category, budgeted_amount, project_id')
        .in('project_id', userProjectIds);

      if (selectedProject !== 'all') {
        budgetQuery = budgetQuery.eq('project_id', selectedProject);
      }

      const { data: budgetData, error: budgetError } = await budgetQuery;
      if (budgetError) throw budgetError;

      // Fetch expenses to calculate actual spent (filtered by user's projects)
      let expenseQuery = supabase
        .from('expenses')
        .select('category, amount, project_id')
        .in('project_id', userProjectIds);

      if (selectedProject !== 'all') {
        expenseQuery = expenseQuery.eq('project_id', selectedProject);
      }

      const { data: expenseData, error: expenseError } = await expenseQuery;
      if (expenseError) throw expenseError;

      // Group budgets by category
      const categoryMap = new Map<string, { name: string; allocated: number; spent: number; percentage: number; status: 'on-track' | 'warning' | 'critical' }>();
      
      budgetData?.forEach(item => {
        if (categoryMap.has(item.category)) {
          const existing = categoryMap.get(item.category)!;
          existing.allocated += item.budgeted_amount || 0;
        } else {
          categoryMap.set(item.category, {
            name: item.category,
            allocated: item.budgeted_amount || 0,
            spent: 0,
            percentage: 0,
            status: 'on-track' as const,
          });
        }
      });

      // Add expenses to categories
      expenseData?.forEach(expense => {
        if (categoryMap.has(expense.category)) {
          const existing = categoryMap.get(expense.category)!;
          existing.spent += Number(expense.amount) || 0;
        }
      });

      // Calculate percentages and status
      return Array.from(categoryMap.values()).map(cat => {
        cat.percentage = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
        cat.status = cat.percentage >= 90 ? 'critical' : cat.percentage >= 75 ? 'warning' : 'on-track';
        return cat;
      });
    },
    enabled: !!user?.id,
  });

  // Fetch available projects for filter (only user's projects)
  const { data: projects } = useQuery({
    queryKey: ['projects-list', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', userProjectIds)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch budget items with expenses (filtered by user's projects)
  const { data: budgetItems } = useQuery({
    queryKey: ['budget-items', selectedProject, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      let budgetQuery = supabase
        .from('project_budgets')
        .select(`
          id,
          project_id,
          category,
          budgeted_amount,
          actual_amount,
          notes,
          created_at,
          projects (name)
        `)
        .in('project_id', userProjectIds)
        .order('created_at', { ascending: false });

      if (selectedProject !== 'all') {
        budgetQuery = budgetQuery.eq('project_id', selectedProject);
      }

      const { data: budgets, error: budgetsError } = await budgetQuery;
      if (budgetsError) throw budgetsError;

      return budgets || [];
    },
    enabled: !!user?.id,
  });

  // Fetch recent expenses (filtered by user's projects)
  const { data: recentExpenses } = useQuery({
    queryKey: ['recent-expenses', selectedProject, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return [];

      let expenseQuery = supabase
        .from('expenses')
        .select(`
          id,
          project_id,
          category,
          amount,
          description,
          expense_date,
          vendor,
          created_at,
          status,
          projects (name)
        `)
        .in('project_id', userProjectIds)
        .order('expense_date', { ascending: false })
        .limit(50);

      if (selectedProject !== 'all') {
        expenseQuery = expenseQuery.eq('project_id', selectedProject);
      }

      const { data: expenses, error: expensesError } = await expenseQuery;
      if (expensesError) throw expensesError;

      return expenses || [];
    },
    enabled: !!user?.id,
  });

  // Fetch income data from project_invoices (filtered by user's projects)
  const { data: incomeData } = useQuery({
    queryKey: ['budget-income', selectedProject, user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalInvoiced: 0, totalPaid: 0, totalPending: 0, invoiceCount: 0 };

      // First, get user's project memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      if (userProjectIds.length === 0) return { totalInvoiced: 0, totalPaid: 0, totalPending: 0, invoiceCount: 0 };

      let invoiceQuery = supabase
        .from('project_invoices')
        .select('id, project_id, amount, status')
        .in('project_id', userProjectIds);

      if (selectedProject !== 'all') {
        invoiceQuery = invoiceQuery.eq('project_id', selectedProject);
      }

      const { data: invoices, error } = await invoiceQuery;
      if (error) throw error;

      const totalInvoiced = invoices?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      const totalPaid = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
      const totalPending = invoices?.filter(inv => inv.status !== 'paid' && inv.status !== 'draft').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;

      return { totalInvoiced, totalPaid, totalPending, invoiceCount: invoices?.length || 0 };
    },
    enabled: !!user?.id,
  });

  // Fetch user's project memberships to check approval permissions
  const { data: userMemberships } = useQuery({
    queryKey: ['user-project-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Helper to check if user can approve expenses for a project
  const canApproveForProject = (projectId: string) => {
    const membership = userMemberships?.find(m => m.project_id === projectId);
    return membership?.role === 'owner' || membership?.role === 'admin';
  };

  // Update expense status mutation
  const handleUpdateExpenseStatus = async (expenseId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', expenseId);
      
      if (error) throw error;
      
      toast({
        title: status === 'approved' ? '✓ Expense approved' : 'Expense rejected',
        description: status === 'approved' ? 'The expense has been approved.' : 'The expense has been rejected.',
      });
      
      await queryClient.refetchQueries({ queryKey: ['recent-expenses'] });
      await queryClient.refetchQueries({ queryKey: ['budget-items'] });
    } catch (error: any) {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Helper to render status badge
  const getExpenseStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  // Fetch spending trends data from expenses table
  const { data: trendData } = useQuery({
    queryKey: ['spending-trends', selectedPeriod, selectedProject],
    queryFn: async () => {
      const dateRange = getDateRange(selectedPeriod);
      
      let expenseQuery = supabase
        .from('expenses')
        .select('project_id, amount, expense_date, category')
        .gte('expense_date', dateRange.start.split('T')[0])
        .lte('expense_date', dateRange.end.split('T')[0]);

      if (selectedProject !== 'all') {
        expenseQuery = expenseQuery.eq('project_id', selectedProject);
      }

      const { data, error } = await expenseQuery;
      if (error) throw error;

      // Group by month
      const monthlyData = new Map<string, number>();
      data?.forEach(item => {
        const month = format(new Date(item.expense_date), 'MMM yyyy');
        if (monthlyData.has(month)) {
          monthlyData.set(month, monthlyData.get(month)! + (Number(item.amount) || 0));
        } else {
          monthlyData.set(month, Number(item.amount) || 0);
        }
      });

      return Array.from(monthlyData.entries()).map(([month, amount]) => ({
        month,
        amount,
      }));
    },
  });

  // Fetch 12-month historical spending data
  const { data: monthlyTrackingData } = useQuery({
    queryKey: ['monthly-tracking', selectedProject],
    queryFn: async () => {
      const now = new Date();
      const twelveMonthsAgo = subMonths(now, 11);
      const startDate = startOfMonth(twelveMonthsAgo);
      
      let expenseQuery = supabase
        .from('expenses')
        .select('amount, expense_date, category')
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .lte('expense_date', now.toISOString().split('T')[0]);

      if (selectedProject !== 'all') {
        expenseQuery = expenseQuery.eq('project_id', selectedProject);
      }

      const { data: expenses, error } = await expenseQuery;
      if (error) throw error;

      // Fetch budget allocations for the same period
      let budgetQuery = supabase
        .from('project_budgets')
        .select('budgeted_amount, created_at, category');

      if (selectedProject !== 'all') {
        budgetQuery = budgetQuery.eq('project_id', selectedProject);
      }

      const { data: budgets, error: budgetError } = await budgetQuery;
      if (budgetError) throw budgetError;

      // Calculate monthly budget (divide total by 12 for monthly average)
      const totalBudget = budgets?.reduce((sum, b) => sum + (Number(b.budgeted_amount) || 0), 0) || 0;
      const monthlyBudgetTarget = totalBudget / 12;

      // Generate all 12 months
      const months: { month: string; monthKey: string; spending: number; budget: number; cumulative: number }[] = [];
      let cumulativeSpending = 0;

      for (let i = 0; i < 12; i++) {
        const monthDate = subMonths(now, 11 - i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM');
        
        // Sum expenses for this month
        const monthSpending = expenses?.filter(e => {
          const expenseMonth = format(new Date(e.expense_date), 'yyyy-MM');
          return expenseMonth === monthKey;
        }).reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
        
        cumulativeSpending += monthSpending;
        
        months.push({
          month: monthLabel,
          monthKey,
          spending: monthSpending,
          budget: monthlyBudgetTarget,
          cumulative: cumulativeSpending,
        });
      }

      return {
        months,
        totalBudget,
        totalSpending: cumulativeSpending,
        averageMonthly: cumulativeSpending / 12,
        monthlyBudgetTarget,
      };
    },
  });

  // Calculate forecast data from expenses table
  const { data: forecastData } = useQuery({
    queryKey: ['budget-forecast', selectedProject],
    queryFn: async () => {
      let projectQuery = supabase
        .from('projects')
        .select('id, name, budget, status, start_date, end_date, created_at')
        .not('budget', 'is', null);

      if (selectedProject !== 'all') {
        projectQuery = projectQuery.eq('id', selectedProject);
      }

      const { data: projects, error: projectsError } = await projectQuery;
      if (projectsError) throw projectsError;

      const projectIds = projects?.map(p => p.id) || [];

      if (projectIds.length === 0) return [];

      // Get actual expenses for each project
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('project_id, amount, expense_date')
        .in('project_id', projectIds);

      if (expensesError) throw expensesError;

      // Calculate spending rate and forecast
      return projects?.map(project => {
        const projectExpenses = expenses?.filter(e => e.project_id === project.id) || [];
        const totalSpent = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
        // Calculate days since project start
        const startDate = project.start_date ? new Date(project.start_date) : new Date(project.created_at);
        const today = new Date();
        const daysPassed = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Calculate daily spending rate
        const dailyRate = totalSpent / daysPassed;
        
        // Calculate days until project end (or default 90 days)
        const endDate = project.end_date ? new Date(project.end_date) : new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Forecast remaining spend
        const forecastSpend = dailyRate * daysRemaining;
        const projectedTotal = totalSpent + forecastSpend;
        const budgetVariance = project.budget - projectedTotal;
        const variancePercentage = project.budget > 0 ? (budgetVariance / project.budget) * 100 : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          currentBudget: project.budget,
          currentSpent: totalSpent,
          projectedTotal,
          budgetVariance,
          variancePercentage,
          dailyRate,
          daysRemaining,
          status: variancePercentage < -10 ? 'over-budget' : variancePercentage < 5 ? 'at-risk' : 'on-track',
        };
      }) || [];
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getBudgetStatus = (percentageUsed: number) => {
    if (percentageUsed >= 90) return { label: 'Critical', color: 'destructive' };
    if (percentageUsed >= 75) return { label: 'Warning', color: 'default' };
    return { label: 'Good', color: 'secondary' };
  };

  const handleAddBudget = async () => {
    if (isAddingBudget) return; // Prevent duplicate submissions
    
    if (!newBudget.project_id || !newBudget.category || !newBudget.budgeted_amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add a budget",
        variant: "destructive",
      });
      return;
    }

    setIsAddingBudget(true);
    try {
      const { error } = await supabase
        .from('project_budgets')
        .insert({
          project_id: newBudget.project_id,
          category: newBudget.category,
          budgeted_amount: parseFloat(newBudget.budgeted_amount),
          actual_amount: 0,
          notes: newBudget.notes || null,
        });

      if (error) throw error;

      toast({
        title: "Budget Added",
        description: "Budget entry has been added successfully",
      });

      setIsAddBudgetOpen(false);
      setNewBudget({
        project_id: '',
        category: '',
        budgeted_amount: '',
        notes: '',
      });

      // Refresh data immediately
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['budget-overview'] }),
        queryClient.refetchQueries({ queryKey: ['project-budgets'] }),
        queryClient.refetchQueries({ queryKey: ['budget-categories'] }),
        queryClient.refetchQueries({ queryKey: ['budget-items'] }),
        queryClient.refetchQueries({ queryKey: ['spending-trends'] }),
        queryClient.refetchQueries({ queryKey: ['budget-forecast'] }),
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add budget",
        variant: "destructive",
      });
    } finally {
      setIsAddingBudget(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // Prepare CSV data
      const csvRows = [
        ['Project', 'Budget', 'Spent', 'Remaining', 'Percentage Used', 'Status'].join(',')
      ];

      projectBudgets?.forEach(project => {
        const status = getBudgetStatus(project.percentageUsed);
        csvRows.push([
          project.name,
          project.budget.toFixed(2),
          project.spent.toFixed(2),
          project.remaining.toFixed(2),
          project.percentageUsed.toFixed(1) + '%',
          status.label
        ].join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `budget-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Exported",
        description: "Budget report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export budget report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddExpense = async () => {
    if (isAddingExpense) return; // Prevent duplicate submissions
    
    if (!newExpense.project_id || !newExpense.category || !newExpense.amount || !newExpense.expense_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add an expense",
        variant: "destructive",
      });
      return;
    }

    setIsAddingExpense(true);
    try {
      let receiptUrl: string | null = null;
      
      // Upload receipt image if exists
      if (newExpense.receipt_image) {
        const base64Data = newExpense.receipt_image.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        const fileName = `${user.id}/${Date.now()}-receipt.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
        
        if (uploadError) {
          console.error('Receipt upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
          receiptUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: newExpense.project_id,
          category: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description || 'Expense',
          expense_date: newExpense.expense_date,
          vendor: newExpense.vendor || null,
          created_by: user.id,
          receipt_url: receiptUrl,
        });

      if (error) throw error;

      toast({
        title: "Expense Added",
        description: receiptUrl ? "Expense and receipt saved successfully" : "Expense has been recorded successfully",
      });

      setIsAddExpenseOpen(false);
      setNewExpense({
        project_id: '',
        budget_id: '',
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '',
        receipt_image: '',
      });

      // Refresh data immediately
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['budget-overview'] }),
        queryClient.refetchQueries({ queryKey: ['project-budgets'] }),
        queryClient.refetchQueries({ queryKey: ['recent-expenses'] }),
        queryClient.refetchQueries({ queryKey: ['budget-categories'] }),
        queryClient.refetchQueries({ queryKey: ['budget-items'] }),
        queryClient.refetchQueries({ queryKey: ['spending-trends'] }),
        queryClient.refetchQueries({ queryKey: ['budget-forecast'] }),
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleEditBudget = async () => {
    if (!editBudget) return;
    
    try {
      const { error } = await supabase
        .from('project_budgets')
        .update({
          category: editBudget.category,
          budgeted_amount: parseFloat(editBudget.budgeted_amount),
          notes: editBudget.notes,
        })
        .eq('id', editBudget.id);

      if (error) throw error;

      toast({
        title: "Budget Updated",
        description: "Budget entry has been updated successfully",
      });

      setIsEditBudgetOpen(false);
      setEditBudget(null);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['budget-overview'] }),
        queryClient.refetchQueries({ queryKey: ['project-budgets'] }),
        queryClient.refetchQueries({ queryKey: ['budget-categories'] }),
        queryClient.refetchQueries({ queryKey: ['budget-items'] }),
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update budget",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Budget Deleted",
        description: "Budget entry has been deleted",
      });

      setDeleteConfirm(null);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['budget-overview'] }),
        queryClient.refetchQueries({ queryKey: ['project-budgets'] }),
        queryClient.refetchQueries({ queryKey: ['budget-categories'] }),
        queryClient.refetchQueries({ queryKey: ['budget-items'] }),
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete budget",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = async () => {
    if (!editExpense || !user) return;
    
    try {
      let receiptUrl = editExpense.receipt_url;
      
      // Upload new receipt if provided
      if (editExpense.new_receipt_image) {
        const base64Data = editExpense.new_receipt_image.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        const fileName = `${user.id}/${Date.now()}-receipt.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
        
        if (uploadError) {
          console.error('Receipt upload error:', uploadError);
          toast({ title: "Warning", description: "Receipt upload failed, but expense will be updated", variant: "destructive" });
        } else {
          const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
          receiptUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('expenses')
        .update({
          category: editExpense.category,
          amount: parseFloat(editExpense.amount),
          description: editExpense.description || null,
          expense_date: editExpense.expense_date,
          vendor: editExpense.vendor || null,
          receipt_url: receiptUrl,
        })
        .eq('id', editExpense.id);

      if (error) throw error;

      toast({
        title: "Expense Updated",
        description: editExpense.new_receipt_image ? "Expense and receipt updated successfully" : "Expense has been updated successfully",
      });

      setIsEditExpenseOpen(false);
      setEditExpense(null);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['budget-overview'] }),
        queryClient.refetchQueries({ queryKey: ['project-budgets'] }),
        queryClient.refetchQueries({ queryKey: ['recent-expenses'] }),
        queryClient.refetchQueries({ queryKey: ['budget-categories'] }),
        queryClient.refetchQueries({ queryKey: ['spending-trends'] }),
        queryClient.refetchQueries({ queryKey: ['budget-forecast'] }),
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Expense Deleted",
        description: "Expense has been deleted",
      });

      setDeleteConfirm(null);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['budget-overview'] }),
        queryClient.refetchQueries({ queryKey: ['project-budgets'] }),
        queryClient.refetchQueries({ queryKey: ['recent-expenses'] }),
        queryClient.refetchQueries({ queryKey: ['budget-categories'] }),
        queryClient.refetchQueries({ queryKey: ['spending-trends'] }),
        queryClient.refetchQueries({ queryKey: ['budget-forecast'] }),
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  // If feature is disabled and not marked as upcoming, show disabled message
  if (!featureEnabled && !featureUpcoming) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="px-4 md:px-0 pt-4 md:pt-0">
          <MobilePageHeader title="Budget" subtitle="This feature is currently disabled" />
        </div>
        <Card className="mx-4 md:mx-0">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Feature Disabled</h3>
              <p className="text-muted-foreground">
                Budget Tracking is currently disabled. Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="px-4 md:px-0 pt-4 md:pt-0">
          <MobilePageHeader title="Budget" subtitle="Track budgets, expenses & finances" />
        </div>
        <Card className="mx-4 md:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Tracking
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                This feature is currently under development and will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (budgetLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const periodOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'current-quarter', label: 'This Quarter' },
    { value: 'current-year', label: 'This Year' },
  ];

  // Budget sub-feature checks (map tab values to feature keys)
  const BUDGET_TAB_FEATURE_MAP: Record<string, string> = {
    'projects': 'budget_tracking', // always show if parent is enabled
    'budget-expenses': 'budget_tracking', // always show if parent is enabled
    'invoices': 'budget_invoices',
    'categories': 'budget_categories',
    'trends': 'budget_trends',
    'forecasting': 'budget_forecasting',
    'tax-calculator': 'budget_tax_calculator',
  };

  const isBudgetTabEnabled = (tabValue: string) => 
    isFeatureEnabled(BUDGET_TAB_FEATURE_MAP[tabValue] || 'budget_tracking');
  const isBudgetTabUpcoming = (tabValue: string) => 
    isFeatureUpcoming(BUDGET_TAB_FEATURE_MAP[tabValue] || 'budget_tracking');

  // Sorted: enabled first, upcoming at end
  const tabOptions = [
    { value: 'projects', label: 'Projects' },
    { value: 'budget-expenses', label: 'Expenses' },
    { value: 'invoices', label: 'Invoices' },
    { value: 'categories', label: 'Categories' },
    { value: 'trends', label: 'Trends' },
    { value: 'forecasting', label: 'Forecast' },
    { value: 'tax-calculator', label: 'Tax' },
  ]
    .filter(tab => isBudgetTabEnabled(tab.value) || isBudgetTabUpcoming(tab.value))
    .sort((a, b) => {
      const aUpcoming = isBudgetTabUpcoming(a.value);
      const bUpcoming = isBudgetTabUpcoming(b.value);
      if (aUpcoming === bUpcoming) return 0;
      return aUpcoming ? 1 : -1;
    });

  const getBudgetHealthColor = (percentageUsed: number): 'success' | 'warning' | 'danger' => {
    if (percentageUsed >= 90) return 'danger';
    if (percentageUsed >= 75) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="px-4 md:px-0 pt-4 md:pt-0">
        <MobilePageHeader
          title="Budget"
          subtitle="Track budgets, expenses & finances"
          actions={
            <div className="flex items-center gap-2">
              {/* Mobile: Icon-only buttons */}
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden h-9 w-9 rounded-full"
                onClick={handleExportReport} 
                disabled={isExporting}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden h-9 w-9 rounded-full"
                onClick={() => setIsAddBudgetOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button 
                size="icon"
                className="md:hidden h-9 w-9 rounded-full bg-primary"
                onClick={() => setIsAddExpenseOpen(true)}
              >
                <DollarSign className="h-4 w-4" />
              </Button>
              
              {/* Desktop: Full buttons */}
              <div className="hidden md:flex gap-2">
                {(isCategoriesEnabled || isCategoriesUpcoming) && (
                  <Button 
                    variant="outline" 
                    asChild={!isCategoriesUpcoming}
                    disabled={isCategoriesUpcoming}
                    className={isCategoriesUpcoming ? 'opacity-50 relative' : ''}
                  >
                    {isCategoriesUpcoming ? (
                      <span className="flex items-center">
                        <Badge variant="secondary" className="absolute -top-2 -right-2 text-[9px] px-1 py-0 h-4">Soon</Badge>
                        <Tag className="mr-2 h-4 w-4" />
                        Categories
                      </span>
                    ) : (
                      <Link to="/expense-categories">
                        <Tag className="mr-2 h-4 w-4" />
                        Categories
                      </Link>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-pulse" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Export Report
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsAddBudgetOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Budget
                </Button>
                <Button onClick={() => setIsAddExpenseOpen(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </div>
          }
        />
      </div>

      {/* Mobile-Native Filter Chips */}
      <div className="px-4 md:px-0">
        <div className="flex flex-wrap gap-2">
          <MobileFilterChip
            options={periodOptions}
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            placeholder="Period"
          />
          <MobileFilterChip
            options={[
              { value: 'all', label: 'All Projects' },
              ...(projects?.map(p => ({ value: p.id, label: p.name })) || [])
            ]}
            value={selectedProject}
            onChange={setSelectedProject}
            placeholder="Project"
          />
          <MobileFilterChip
            options={[
              { value: 'all', label: 'All Receipts' },
              { value: 'with', label: 'With Receipt' },
              { value: 'without', label: 'No Receipt' },
            ]}
            value={selectedReceiptFilter}
            onChange={setSelectedReceiptFilter}
            placeholder="Receipt"
          />
        </div>
      </div>

      {/* Mobile-Native Summary Cards */}
      <div className="px-4 md:px-0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <MobileCard
            title="Total Budget"
            value={formatCurrency(budgetOverview?.totalBudget || 0)}
            subtitle={`Across ${budgetOverview?.projectCount || 0} projects`}
            icon={DollarSign}
          />
          <MobileCard
            title="Total Spent"
            value={formatCurrency(budgetOverview?.totalSpent || 0)}
            subtitle={`${budgetOverview?.percentageUsed?.toFixed(1) || 0}% of total budget`}
            icon={TrendingDown}
          />
          <MobileCard
            title="Total Income"
            value={formatCurrency(incomeData?.totalPaid || 0)}
            subtitle={`${formatCurrency(incomeData?.totalInvoiced || 0)} invoiced`}
            icon={TrendingUp}
            iconClassName="bg-emerald-500/10"
          />
          <MobileCard
            title="Net Balance"
            value={formatCurrency((incomeData?.totalPaid || 0) - (budgetOverview?.totalSpent || 0))}
            subtitle={(incomeData?.totalPaid || 0) - (budgetOverview?.totalSpent || 0) >= 0 ? 'Profit' : 'Loss'}
            icon={(incomeData?.totalPaid || 0) - (budgetOverview?.totalSpent || 0) >= 0 ? TrendingUp : TrendingDown}
            iconClassName={(incomeData?.totalPaid || 0) - (budgetOverview?.totalSpent || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}
          />
          <MobileProgressCard
            title="Budget Health"
            status={getBudgetStatus(budgetOverview?.percentageUsed || 0).label}
            statusColor={getBudgetHealthColor(budgetOverview?.percentageUsed || 0)}
            progress={budgetOverview?.percentageUsed || 0}
          />
        </div>
      </div>

      {/* Mobile-Native Segmented Control (Mobile) / Tabs (Desktop) */}
      <div className="px-4 md:px-0">
        {/* Mobile Segmented Control */}
        <div className="md:hidden">
          <MobileSegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
            size="sm"
          />
        </div>
        
        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              {tabOptions.map(tab => {
                const upcoming = isBudgetTabUpcoming(tab.value);
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
          </Tabs>
        </div>
      </div>

      {/* Tab Content - now controlled */}
      <div className="px-4 md:px-0 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="hidden">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="budget-expenses">Budget & Expenses</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="tax-calculator">Tax Calculator</TabsTrigger>
          </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <BudgetInvoicesTab selectedProject={selectedProject} projects={projects} />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <BudgetCategoriesTab />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Budget Overview</CardTitle>
              <CardDescription>
                Budget allocation and spending across all active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                      <div className="h-2 bg-muted rounded w-full mb-3" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : projectBudgets && projectBudgets.length > 0 ? (
                <div className="space-y-4">
                  {projectBudgets.map((project) => {
                    const status = getBudgetStatus(project.percentageUsed);
                    const progressColor = status.label === 'Critical' 
                      ? 'bg-destructive' 
                      : status.label === 'Warning' 
                      ? 'bg-yellow-500' 
                      : 'bg-primary';
                    
                    return (
                      <div 
                        key={project.id} 
                        className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedProject(project.id)}
                      >
                        <div className="flex flex-col gap-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                                  {project.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {project.status === 'in_progress' ? 'In Progress' : 
                                   project.status === 'completed' ? 'Completed' : 
                                   project.status === 'on_hold' ? 'On Hold' : project.status || 'Active'}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={status.label === 'Critical' ? 'destructive' : status.label === 'Warning' ? 'default' : 'secondary'}
                              className="shrink-0"
                            >
                              {status.label}
                            </Badge>
                          </div>
                          
                          {/* Progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{project.percentageUsed.toFixed(1)}% used</span>
                              <span>{formatCurrency(project.remaining)} remaining</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${progressColor} transition-all duration-500`}
                                style={{ width: `${Math.min(project.percentageUsed, 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Budget</p>
                              <p className="font-semibold text-sm">{formatCurrency(project.budget)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Spent</p>
                              <p className="font-semibold text-sm text-primary">{formatCurrency(project.spent)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Remaining</p>
                              <p className={`font-semibold text-sm ${project.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                {formatCurrency(project.remaining)}
                              </p>
                            </div>
                          </div>
                          
                          {/* End Date */}
                          {project.endDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {new Date(project.endDate).toLocaleDateString('en-CA', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Projects with Budgets</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start tracking your project finances by creating a project with a budget, or add budget allocations to existing projects.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button onClick={() => setIsAddBudgetOpen(true)} className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Budget Allocation
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/projects/new'}>
                      Create New Project
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Stats Cards */}
          {projectBudgets && projectBudgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">On Track</p>
                      <p className="text-2xl font-bold">
                        {projectBudgets.filter(p => p.percentageUsed < 75).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                      <p className="text-2xl font-bold">
                        {projectBudgets.filter(p => p.percentageUsed >= 75 && p.percentageUsed < 90).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Over Budget</p>
                      <p className="text-2xl font-bold">
                        {projectBudgets.filter(p => p.percentageUsed >= 90).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="budget-expenses" className="space-y-4">
          {/* Category Analytics Section */}
          {budgetCategories && budgetCategories.length > 0 && (
            <BudgetAnalytics
              totalBudget={budgetOverview?.totalBudget || 0}
              totalSpent={budgetOverview?.totalSpent || 0}
              categories={budgetCategories}
              timeframe={selectedPeriod}
            />
          )}

          {/* Budget Items List with Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocations & Expenses</CardTitle>
              <CardDescription>
                Budget allocations with their associated expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budgetItems && budgetItems.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Group budget items by category + project_id
                    const groupedBudgets = new Map<string, {
                      key: string;
                      category: string;
                      project_id: string;
                      project_name: string;
                      total_budgeted: number;
                      notes: string[];
                      budget_ids: string[];
                      items: any[];
                    }>();

                    budgetItems.forEach((item: any) => {
                      const groupKey = `${item.category}_${item.project_id}`;
                      if (groupedBudgets.has(groupKey)) {
                        const existing = groupedBudgets.get(groupKey)!;
                        existing.total_budgeted += item.budgeted_amount || 0;
                        if (item.notes) existing.notes.push(item.notes);
                        existing.budget_ids.push(item.id);
                        existing.items.push(item);
                      } else {
                        groupedBudgets.set(groupKey, {
                          key: groupKey,
                          category: item.category,
                          project_id: item.project_id,
                          project_name: item.projects?.name || 'Unknown Project',
                          total_budgeted: item.budgeted_amount || 0,
                          notes: item.notes ? [item.notes] : [],
                          budget_ids: [item.id],
                          items: [item],
                        });
                      }
                    });

                    return Array.from(groupedBudgets.values()).map((group) => {
                      // Find expenses matching this budget's category and project (with receipt filter)
                      const matchingExpenses = recentExpenses?.filter(
                        (e: any) => {
                          const categoryMatch = e.category === group.category && e.project_id === group.project_id;
                          const receiptMatch = selectedReceiptFilter === 'all' 
                            || (selectedReceiptFilter === 'with' && e.receipt_url)
                            || (selectedReceiptFilter === 'without' && !e.receipt_url);
                          return categoryMatch && receiptMatch;
                        }
                      ) || [];
                      
                      // Calculate actual spent from expenses
                      const actualSpent = matchingExpenses.reduce(
                        (sum: number, e: any) => sum + (Number(e.amount) || 0), 0
                      );
                      
                      const percentUsed = group.total_budgeted > 0 
                        ? (actualSpent / group.total_budgeted) * 100 
                        : 0;
                      const status = getBudgetStatus(percentUsed);
                      const remaining = group.total_budgeted - actualSpent;
                      
                      return (
                        <div key={group.key} className="border rounded-lg overflow-hidden">
                          {/* Budget Header */}
                          <div className="p-4 space-y-3 bg-muted/30">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-lg">{group.category}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {group.project_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={status.color as any}>{status.label}</Badge>
                                {group.items.length === 1 && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        const item = group.items[0];
                                        setEditBudget({
                                          id: item.id,
                                          project_id: item.project_id,
                                          category: item.category,
                                          budgeted_amount: item.budgeted_amount?.toString() || '',
                                          notes: item.notes || '',
                                        });
                                        setIsEditBudgetOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteConfirm({ type: 'budget', id: group.items[0].id })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-between gap-1 text-xs sm:text-sm">
                              <span>Allocated: {formatCurrency(group.total_budgeted)}</span>
                              <span className={actualSpent > 0 ? 'text-primary font-medium' : ''}>
                                Spent: {formatCurrency(actualSpent)}
                              </span>
                              <span className={remaining < 0 ? 'text-destructive font-medium' : ''}>
                                Remaining: {formatCurrency(remaining)}
                              </span>
                            </div>
                            {group.notes.length > 0 && (
                              <p className="text-sm text-muted-foreground">{group.notes.join(' | ')}</p>
                            )}
                          </div>
                          
                          {/* Expenses List for this Budget */}
                          {matchingExpenses.length > 0 && (
                            <div className="border-t">
                              <div className="px-4 py-2 bg-muted/10">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Expenses ({matchingExpenses.length})
                                </p>
                              </div>
                              <div className="divide-y">
                                {matchingExpenses.map((expense: any) => (
                                  <div key={expense.id} className="px-3 sm:px-4 py-3 hover:bg-muted/20 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                      <div className="space-y-0.5 flex-1 min-w-0">
                                        {expense.description && (
                                          <p className="text-sm truncate">{expense.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                          {expense.vendor && <span>Vendor: {expense.vendor}</span>}
                                          <span>{new Date(expense.expense_date).toLocaleDateString('en-CA')}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end gap-1">
                                        {expense.receipt_url && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-primary"
                                            onClick={() => window.open(expense.receipt_url, '_blank')}
                                            title="View Receipt"
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                        {!expense.receipt_url && (
                                          <span title="No receipt" className="h-7 w-7 flex items-center justify-center">
                                            <Receipt className="h-3.5 w-3.5 text-muted-foreground/50" />
                                          </span>
                                        )}
                                        <p className="font-medium text-sm">{formatCurrency(Number(expense.amount))}</p>
                                        {getExpenseStatusBadge(expense.status || 'pending')}
                                        
                                        {/* Approve/Reject buttons for pending expenses */}
                                        {canApproveForProject(expense.project_id) && expense.status === 'pending' && (
                                          <div className="flex items-center gap-0.5">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              onClick={() => handleUpdateExpenseStatus(expense.id, 'approved')}
                                              title="Approve Expense"
                                            >
                                              <Check className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              onClick={() => handleUpdateExpenseStatus(expense.id, 'rejected')}
                                              title="Reject Expense"
                                            >
                                              <XCircle className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => {
                                              setSelectedExpense(expense);
                                              setIsViewExpenseOpen(true);
                                            }}
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => {
                                              setEditExpense({
                                                id: expense.id,
                                                project_id: expense.project_id,
                                                category: expense.category,
                                                amount: expense.amount?.toString() || '',
                                                description: expense.description || '',
                                                expense_date: expense.expense_date,
                                                vendor: expense.vendor || '',
                                                receipt_url: expense.receipt_url || null,
                                                new_receipt_image: '',
                                              });
                                              setIsEditExpenseOpen(true);
                                            }}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteConfirm({ type: 'expense', id: expense.id })}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {matchingExpenses.length === 0 && (
                            <div className="px-4 py-3 border-t text-center text-sm text-muted-foreground">
                              No expenses recorded for this budget
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No budget allocations yet</p>
                  <p className="text-sm">Click "Add Budget" to create budget allocations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Expenses (not linked to a budget) */}
          {recentExpenses && recentExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Other Expenses</CardTitle>
                <CardDescription>
                  Expenses not linked to a specific budget allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const linkedCategories = new Set(budgetItems?.map((b: any) => `${b.category}-${b.project_id}`) || []);
                  const unlinkedExpenses = recentExpenses.filter(
                    (e: any) => {
                      const notLinked = !linkedCategories.has(`${e.category}-${e.project_id}`);
                      const receiptMatch = selectedReceiptFilter === 'all' 
                        || (selectedReceiptFilter === 'with' && e.receipt_url)
                        || (selectedReceiptFilter === 'without' && !e.receipt_url);
                      return notLinked && receiptMatch;
                    }
                  );
                  
                  if (unlinkedExpenses.length === 0) {
                    return (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No matching expenses found</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {unlinkedExpenses.map((expense: any) => (
                        <div key={expense.id} className="border rounded-lg p-3 sm:p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <h4 className="font-medium text-sm">{expense.category}</h4>
                                <Badge variant="outline" className="text-xs">{expense.projects?.name || 'Unknown'}</Badge>
                                {expense.receipt_url ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-primary"
                                    onClick={(e) => { e.stopPropagation(); window.open(expense.receipt_url, '_blank'); }}
                                    title="View Receipt"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <span title="No receipt" className="h-6 w-6 flex items-center justify-center">
                                    <Receipt className="h-3.5 w-3.5 text-muted-foreground/50" />
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-sm sm:text-base shrink-0">{formatCurrency(Number(expense.amount))}</p>
                            </div>
                            {expense.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{expense.description}</p>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {expense.vendor && <span>Vendor: {expense.vendor}</span>}
                                <span>{new Date(expense.expense_date).toLocaleDateString('en-CA')}</span>
                                {getExpenseStatusBadge(expense.status || 'pending')}
                              </div>
                              <div className="flex items-center gap-0.5">
                                {/* Approve/Reject buttons for pending expenses */}
                                {canApproveForProject(expense.project_id) && expense.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleUpdateExpenseStatus(expense.id, 'approved')}
                                      title="Approve Expense"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleUpdateExpenseStatus(expense.id, 'rejected')}
                                      title="Reject Expense"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedExpense(expense); setIsViewExpenseOpen(true); }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditExpense({ id: expense.id, project_id: expense.project_id, category: expense.category, amount: expense.amount?.toString() || '', description: expense.description || '', expense_date: expense.expense_date, vendor: expense.vendor || '', receipt_url: expense.receipt_url || null, new_receipt_image: '' }); setIsEditExpenseOpen(true); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: 'expense', id: expense.id })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* 12-Month Budget Tracking Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                12-Month Budget Tracking
              </CardTitle>
              <CardDescription>
                Monthly spending vs budget target over the past year
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrackingData && monthlyTrackingData.months.some(m => m.spending > 0) ? (
                <>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrackingData.months} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const variance = data.budget - data.spending;
                              return (
                                <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[180px]">
                                  <p className="font-medium text-sm mb-2">{label}</p>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Spending:</span>
                                      <span className="font-medium text-primary">{formatCurrency(data.spending)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Budget Target:</span>
                                      <span className="font-medium">{formatCurrency(data.budget)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t">
                                      <span className="text-muted-foreground">Variance:</span>
                                      <span className={`font-medium ${variance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>Cumulative:</span>
                                      <span>{formatCurrency(data.cumulative)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="top"
                          height={36}
                          formatter={(value) => (
                            <span className="text-sm text-muted-foreground">
                              {value === 'spending' ? 'Monthly Spending' : 
                               value === 'budget' ? 'Budget Target' : 'Cumulative Spending'}
                            </span>
                          )}
                        />
                        <ReferenceLine 
                          y={monthlyTrackingData.monthlyBudgetTarget} 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeDasharray="5 5"
                          label={{ value: 'Target', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Bar 
                          dataKey="spending" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                          name="spending"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cumulative" 
                          stroke="hsl(var(--destructive))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 0, r: 3 }}
                          name="cumulative"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total (12 mo)</p>
                      <p className="text-lg font-bold">{formatCurrency(monthlyTrackingData.totalSpending)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Monthly Avg</p>
                      <p className="text-lg font-bold">{formatCurrency(monthlyTrackingData.averageMonthly)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Budget Target</p>
                      <p className="text-lg font-bold">{formatCurrency(monthlyTrackingData.monthlyBudgetTarget)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">vs Budget</p>
                      <p className={`text-lg font-bold ${monthlyTrackingData.averageMonthly <= monthlyTrackingData.monthlyBudgetTarget ? 'text-green-600' : 'text-destructive'}`}>
                        {monthlyTrackingData.averageMonthly <= monthlyTrackingData.monthlyBudgetTarget ? 'Under' : 'Over'} Budget
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No spending data available</p>
                    <p className="text-sm">Add expenses to see 12-month trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Period-Specific Spending Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Period Spending Trends</CardTitle>
              <CardDescription>
                Monthly spending patterns for selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.4}
                      name="Spending"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No spending data available for this period</p>
                    <p className="text-sm">Add expenses to see trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend Analysis Stats */}
          {trendData && trendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Monthly Spend</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(trendData.reduce((sum, d) => sum + d.amount, 0) / trendData.length)}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Highest Month</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Math.max(...trendData.map(d => d.amount)))}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Lowest Month</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Math.min(...trendData.map(d => d.amount)))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Forecasting</CardTitle>
              <CardDescription>
                Predicted spending and budget projections based on historical data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forecastData && forecastData.length > 0 ? (
                <div className="space-y-4">
                  {forecastData.map((forecast) => (
                    <div key={forecast.projectId} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">{forecast.projectName}</h3>
                        <Badge variant={
                          forecast.status === 'over-budget' ? 'destructive' : 
                          forecast.status === 'at-risk' ? 'default' : 
                          'secondary'
                        }>
                          {forecast.status === 'over-budget' ? 'Over Budget' : 
                           forecast.status === 'at-risk' ? 'At Risk' : 
                           'On Track'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Budget</p>
                          <p className="font-medium">{formatCurrency(forecast.currentBudget)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spent to Date</p>
                          <p className="font-medium">{formatCurrency(forecast.currentSpent)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Projected Total</p>
                          <p className="font-medium">{formatCurrency(forecast.projectedTotal)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Variance</p>
                          <p className={`font-medium ${forecast.budgetVariance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(forecast.budgetVariance))} 
                            ({forecast.variancePercentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Daily spending rate: {formatCurrency(forecast.dailyRate)}</span>
                          <span>{forecast.daysRemaining} days remaining</span>
                        </div>
                      </div>

                      {forecast.status !== 'on-track' && (
                        <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            {forecast.status === 'over-budget' ? (
                              <p>
                                Warning: Project is projected to exceed budget by {formatCurrency(Math.abs(forecast.budgetVariance))}. 
                                Consider reducing daily spending or requesting additional budget.
                              </p>
                            ) : (
                              <p>
                                Caution: Project is approaching budget limit. Monitor spending closely 
                                to avoid overruns.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>No forecast data available</p>
                    <p className="text-sm">Add projects and spending data to see projections</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forecast methodology */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Methodology</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>How forecasts are calculated:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Daily spending rate = Total spent ÷ Days since project start</li>
                <li>Projected remaining spend = Daily rate × Days remaining</li>
                <li>Projected total = Current spent + Projected remaining spend</li>
                <li>Budget variance = Current budget - Projected total</li>
              </ul>
              <p className="pt-2">
                <strong>Status indicators:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>On Track:</strong> Variance &gt; 5%</li>
                <li><strong>At Risk:</strong> Variance 0-5%</li>
                <li><strong>Over Budget:</strong> Variance &lt; -10%</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax-calculator" className="space-y-4">
          <CanadianTaxCalculator />
        </TabsContent>
        </Tabs>
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Budget Entry</DialogTitle>
            <DialogDescription>
              Add a new budget allocation for a project category
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={newBudget.project_id} 
                onValueChange={(value) => setNewBudget(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              {categories && categories.length > 0 ? (
                <Select 
                  value={newBudget.category} 
                  onValueChange={(value) => setNewBudget(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="category"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category name"
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Budget Amount (CAD) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={newBudget.budgeted_amount}
                onChange={(e) => setNewBudget(prev => ({ ...prev, budgeted_amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newBudget.notes}
                onChange={(e) => setNewBudget(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBudgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBudget} disabled={isAddingBudget}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isAddingBudget ? 'Adding...' : 'Add Budget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Scan a receipt or manually enter expense details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Receipt Scanner */}
            {isReceiptScannerEnabled ? (
              <ReceiptScanner
                onScanComplete={(data, imageBase64) => {
                  setNewExpense(prev => ({
                    ...prev,
                    vendor: data.vendor || prev.vendor,
                    amount: data.amount || prev.amount,
                    expense_date: data.date || prev.expense_date,
                    description: data.description || prev.description,
                    category: data.category || prev.category,
                    receipt_image: imageBase64,
                  }));
                }}
              />
            ) : isReceiptScannerUpcoming ? (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Receipt Scanner (OCR)</div>
                        <div className="text-sm text-muted-foreground">
                          Coming soon — scan a receipt to auto‑fill expense details.
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5">Soon</Badge>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <Button type="button" variant="outline" disabled>
                      <Camera className="mr-2 h-4 w-4" />
                      Take Photo
                    </Button>
                    <Button type="button" variant="outline" disabled>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            
            {/* Divider - only show if Receipt Scanner is enabled */}
            {(isReceiptScannerEnabled || isReceiptScannerUpcoming) && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="expense-project">Project *</Label>
              <Select 
                value={newExpense.project_id} 
                onValueChange={(value) => setNewExpense(prev => ({ ...prev, project_id: value, budget_id: '' }))}
              >
                <SelectTrigger id="expense-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-category">Category *</Label>
              {categories && categories.length > 0 ? (
                <Select 
                  value={newExpense.category} 
                  onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="expense-category"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category name"
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-amount">Amount (CAD) *</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-date">Date *</Label>
              <Input
                id="expense-date"
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense(prev => ({ ...prev, expense_date: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-vendor">Vendor</Label>
              <Input
                id="expense-vendor"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
                placeholder="Vendor name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-description">Description</Label>
              <Textarea
                id="expense-description"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Expense description..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense} disabled={isAddingExpense}>
              <DollarSign className="mr-2 h-4 w-4" />
              {isAddingExpense ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={isViewExpenseOpen} onOpenChange={setIsViewExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Full details of the expense record
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Category</Label>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Project</Label>
                  <p className="font-medium">{selectedExpense.projects?.name || 'Unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Amount</Label>
                  <p className="font-bold text-xl text-primary">{formatCurrency(Number(selectedExpense.amount))}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Date</Label>
                  <p className="font-medium">{new Date(selectedExpense.expense_date).toLocaleDateString('en-CA')}</p>
                </div>
              </div>

              {selectedExpense.description && (
                <div>
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <p className="font-medium">{selectedExpense.description}</p>
                </div>
              )}

              {selectedExpense.vendor && (
                <div>
                  <Label className="text-muted-foreground text-sm">Vendor</Label>
                  <p className="font-medium">{selectedExpense.vendor}</p>
                </div>
              )}


              {selectedExpense.receipt_url && (
                <div>
                  <Label className="text-muted-foreground text-sm">Receipt</Label>
                  <a 
                    href={selectedExpense.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-2"
                  >
                    <img 
                      src={selectedExpense.receipt_url} 
                      alt="Receipt" 
                      className="max-w-full h-auto max-h-48 rounded-lg border object-contain hover:opacity-90 transition-opacity cursor-pointer"
                    />
                    <span className="text-xs text-primary hover:underline mt-1 inline-block">Click to view full size</span>
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-t pt-4">
                <div>
                  <Label className="text-xs">Created</Label>
                  <p>{new Date(selectedExpense.created_at).toLocaleString('en-CA')}</p>
                </div>
                {selectedExpense.updated_at && (
                  <div>
                    <Label className="text-xs">Last Updated</Label>
                    <p>{new Date(selectedExpense.updated_at).toLocaleString('en-CA')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewExpenseOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditBudgetOpen} onOpenChange={setIsEditBudgetOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Update budget allocation details
            </DialogDescription>
          </DialogHeader>
          {editBudget && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                {categories && categories.length > 0 ? (
                  <Select 
                    value={editBudget.category} 
                    onValueChange={(value) => setEditBudget((prev: any) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={editBudget.category}
                    onChange={(e) => setEditBudget((prev: any) => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category name"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label>Budgeted Amount (CAD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editBudget.budgeted_amount}
                  onChange={(e) => setEditBudget((prev: any) => ({ ...prev, budgeted_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                  value={editBudget.notes}
                  onChange={(e) => setEditBudget((prev: any) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditBudgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBudget}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense details or change receipt
            </DialogDescription>
          </DialogHeader>
          {editExpense && (
            <div className="grid gap-4 py-4">
              {/* Current Receipt Display */}
              {editExpense.receipt_url && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Current Receipt</Label>
                  <div className="flex items-center gap-3">
                    <a href={editExpense.receipt_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={editExpense.receipt_url} 
                        alt="Current receipt" 
                        className="w-16 h-16 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                      />
                    </a>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Click image to view full size</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive p-0 h-auto"
                        onClick={() => setEditExpense((prev: any) => ({ ...prev, receipt_url: null, new_receipt_image: '' }))}
                      >
                        Remove receipt
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Upload with AI Scan - Only show if feature is enabled */}
              {isReceiptScannerEnabled && (
                <div className="space-y-2">
                  <Label className="text-sm">{editExpense.receipt_url ? 'Replace Receipt (AI Scan)' : 'Add Receipt (AI Scan)'}</Label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="edit-receipt-input"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
                            return;
                          }
                          
                          setIsEditScanning(true);
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const imageBase64 = reader.result as string;
                            setEditExpense((prev: any) => ({ ...prev, new_receipt_image: imageBase64 }));
                            
                            // AI Scan the receipt
                            try {
                              const { data, error } = await supabase.functions.invoke('scan-receipt', {
                                body: { imageBase64 }
                              });
                              
                              if (!error && data?.success && data?.data) {
                                const scanned = data.data;
                                setEditExpense((prev: any) => ({
                                  ...prev,
                                  vendor: scanned.vendor || prev.vendor,
                                  amount: scanned.amount || prev.amount,
                                  expense_date: scanned.date || prev.expense_date,
                                  description: scanned.description || prev.description,
                                  category: scanned.category || prev.category,
                                }));
                                toast({ title: "Receipt Scanned!", description: `Extracted: ${scanned.vendor} - $${scanned.amount}` });
                              } else {
                                toast({ title: "Scan Complete", description: "Receipt saved. Could not auto-extract data.", variant: "default" });
                              }
                            } catch (scanError) {
                              console.error('Scan error:', scanError);
                              toast({ title: "Receipt Uploaded", description: "Image saved but AI scan failed." });
                            } finally {
                              setIsEditScanning(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('edit-receipt-input')?.click()}
                      disabled={isEditScanning}
                    >
                      {isEditScanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {editExpense.new_receipt_image ? 'Scan Another' : 'Upload & Scan'}
                        </>
                      )}
                    </Button>
                    {editExpense.new_receipt_image && !isEditScanning && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={editExpense.new_receipt_image} 
                          alt="New receipt preview" 
                          className="w-10 h-10 object-cover rounded border"
                        />
                        <span className="text-xs text-primary font-medium">✓ Scanned</span>
                      </div>
                    )}
                  </div>
                  {isEditScanning && (
                    <p className="text-xs text-muted-foreground">AI is extracting data from your receipt...</p>
                  )}
                </div>
              )}

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Expense Details</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Category</Label>
                {categories && categories.length > 0 ? (
                  <Select 
                    value={editExpense.category} 
                    onValueChange={(value) => setEditExpense((prev: any) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={editExpense.category}
                    onChange={(e) => setEditExpense((prev: any) => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category name"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label>Amount (CAD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editExpense.amount}
                  onChange={(e) => setEditExpense((prev: any) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editExpense.expense_date}
                  onChange={(e) => setEditExpense((prev: any) => ({ ...prev, expense_date: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Vendor</Label>
                <Input
                  value={editExpense.vendor}
                  onChange={(e) => setEditExpense((prev: any) => ({ ...prev, vendor: e.target.value }))}
                  placeholder="Vendor name"
                />
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={editExpense.description}
                  onChange={(e) => setEditExpense((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Expense description..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditExpense}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteConfirm?.type === 'budget' ? 'budget allocation' : 'expense'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'budget') {
                  handleDeleteBudget(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'expense') {
                  handleDeleteExpense(deleteConfirm.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}