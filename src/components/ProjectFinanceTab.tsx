import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Plus, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Sparkles,
  Eye,
  Pencil,
  ExternalLink,
  Check,
  XCircle,
  Upload
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { format } from "date-fns";
import InvoiceManager from "./InvoiceManager";

interface ProjectFinanceTabProps {
  projectId: string;
  projectName: string;
  projectBudget: number | null;
}

export const ProjectFinanceTab = ({ projectId, projectName, projectBudget }: ProjectFinanceTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled } = useProjectFeatures();
  const isReceiptScannerEnabled = isFeatureEnabled('receipt_scanner');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [isViewReceiptOpen, setIsViewReceiptOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditScanning, setIsEditScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Fetch current user's project role
  const { data: userMembership } = useQuery({
    queryKey: ['project-membership', projectId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user?.id,
  });

  const canApproveExpenses = userMembership?.role === 'owner' || userMembership?.role === 'admin';
  const [editExpense, setEditExpense] = useState<any>(null);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: '',
    receipt_image: null as string | null,
  });

  // Fetch project expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['project-finance-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch budget allocations for this project
  const { data: budgetAllocations } = useQuery({
    queryKey: ['project-finance-budgets', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch invoices for income summary
  const { data: invoices } = useQuery({
    queryKey: ['project-invoices-summary', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_invoices')
        .select('total_amount, status')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Calculate income stats
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
  const totalPaidIncome = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      let receiptUrl = null;

      // Upload receipt if exists
      if (expenseData.receipt_image) {
        const base64Data = expenseData.receipt_image.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        const fileName = `${user?.id}/${Date.now()}-receipt.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(uploadData.path);
        
        receiptUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: projectId,
          description: expenseData.description || 'Expense',
          amount: parseFloat(expenseData.amount),
          category: expenseData.category,
          expense_date: expenseData.expense_date,
          vendor: expenseData.vendor || null,
          notes: expenseData.notes || null,
          receipt_url: receiptUrl,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-finance-expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
      toast({ title: 'Expense added successfully' });
      setIsAddExpenseOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error adding expense:', error);
      toast({ title: 'Failed to add expense', variant: 'destructive' });
    },
  });

  // Edit expense mutation
  const editExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      let receiptUrl = expenseData.receipt_url;

      // Upload new receipt if provided
      if (expenseData.new_receipt_image) {
        const base64Data = expenseData.new_receipt_image.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        const fileName = `${user?.id}/${Date.now()}-receipt.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(uploadData.path);
        
        receiptUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('expenses')
        .update({
          description: expenseData.description || 'Expense',
          amount: parseFloat(expenseData.amount),
          category: expenseData.category,
          expense_date: expenseData.expense_date,
          vendor: expenseData.vendor || null,
          notes: expenseData.notes || null,
          receipt_url: receiptUrl,
        })
        .eq('id', expenseData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-finance-expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
      toast({ title: 'Expense updated successfully' });
      setIsEditExpenseOpen(false);
      setEditExpense(null);
    },
    onError: (error) => {
      console.error('Error updating expense:', error);
      toast({ title: 'Failed to update expense', variant: 'destructive' });
    },
  });

  // Approve/Reject expense mutation
  const updateExpenseStatusMutation = useMutation({
    mutationFn: async ({ expenseId, status }: { expenseId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['project-finance-expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
      toast({ 
        title: status === 'approved' ? '✓ Expense approved' : 'Expense rejected',
        description: status === 'approved' ? 'The expense has been approved.' : 'The expense has been rejected.',
      });
    },
    onError: (error) => {
      console.error('Error updating expense status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  // Handle edit receipt scan
  const handleEditReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageBase64 = reader.result as string;
      setEditExpense((prev: any) => ({ ...prev, new_receipt_image: imageBase64 }));

      setIsEditScanning(true);
      try {
        const { data, error } = await supabase.functions.invoke('scan-receipt', {
          body: { imageBase64 }
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          const scanned = data.data;
          setEditExpense((prev: any) => ({
            ...prev,
            vendor: scanned.vendor || prev.vendor,
            amount: scanned.amount?.toString() || prev.amount,
            expense_date: scanned.date || prev.expense_date,
            description: scanned.description || prev.description,
            category: scanned.category || prev.category,
          }));
          toast({
            title: '✨ Receipt scanned!',
            description: `Vendor: ${scanned.vendor || 'N/A'}, Amount: $${scanned.amount || 'N/A'}`,
          });
        }
      } catch (error) {
        console.error('Scan error:', error);
        toast({ title: 'Scan failed', variant: 'destructive' });
      } finally {
        setIsEditScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setNewExpense({
      description: '',
      amount: '',
      category: '',
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
      receipt_image: null,
    });
    setReceiptPreview(null);
  };

  // AI Receipt Scan
  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageBase64 = reader.result as string;
      setReceiptPreview(imageBase64);
      setNewExpense(prev => ({ ...prev, receipt_image: imageBase64 }));

      // AI Scan
      setIsScanning(true);
      try {
        const { data, error } = await supabase.functions.invoke('scan-receipt', {
          body: { imageBase64 }
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          const scanned = data.data;
          setNewExpense(prev => ({
            ...prev,
            vendor: scanned.vendor || prev.vendor,
            amount: scanned.amount?.toString() || prev.amount,
            expense_date: scanned.date || prev.expense_date,
            description: scanned.description || prev.description,
            category: scanned.category || prev.category,
          }));
          toast({
            title: '✨ Receipt scanned!',
            description: `Vendor: ${scanned.vendor || 'N/A'}, Amount: $${scanned.amount || 'N/A'}`,
          });
        }
      } catch (error) {
        console.error('Scan error:', error);
        toast({ title: 'Scan failed, please fill manually', variant: 'destructive' });
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Calculate stats
  const totalSpent = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
  const approvedExpenses = expenses?.filter(e => e.status === 'approved') || [];
  const pendingExpenses = expenses?.filter(e => e.status === 'pending') || [];
  const totalApproved = approvedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalPending = pendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const withReceipt = expenses?.filter(e => e.receipt_url) || [];
  const withoutReceipt = expenses?.filter(e => !e.receipt_url) || [];
  
  const budgetUsedPercent = projectBudget ? (totalSpent / projectBudget) * 100 : 0;
  const remaining = projectBudget ? projectBudget - totalSpent : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categories = [
    'Materials', 'Labor', 'Equipment', 'Permits', 'Professional Services',
    'Subcontractors', 'Utilities', 'Transportation', 'Safety', 'Other'
  ];

  if (expensesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">{projectBudget ? formatCurrency(projectBudget) : 'N/A'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                {projectBudget && (
                  <p className="text-xs text-muted-foreground">{budgetUsedPercent.toFixed(1)}% used</p>
                )}
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {projectBudget ? formatCurrency(remaining) : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold">{expenses?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{withReceipt.length} with receipts</p>
              </div>
              <Receipt className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {projectBudget && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress 
              value={Math.min(budgetUsedPercent, 100)} 
              className={`h-3 ${budgetUsedPercent > 90 ? '[&>div]:bg-destructive' : budgetUsedPercent > 75 ? '[&>div]:bg-yellow-500' : ''}`}
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{formatCurrency(totalSpent)} spent</span>
              <span>{formatCurrency(remaining)} remaining</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3 md:pt-4 md:pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Approved</p>
                <p className="text-base md:text-lg font-bold text-green-800 dark:text-green-300 truncate">{formatCurrency(totalApproved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-3 md:pt-4 md:pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending</p>
                <p className="text-base md:text-lg font-bold text-yellow-800 dark:text-yellow-300 truncate">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${withoutReceipt.length > 0 ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' : 'bg-muted/50'}`}>
          <CardContent className="p-3 md:pt-4 md:pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 shrink-0 ${withoutReceipt.length > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${withoutReceipt.length > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-muted-foreground'}`}>No Receipt</p>
                <p className={`text-base md:text-lg font-bold ${withoutReceipt.length > 0 ? 'text-orange-800 dark:text-orange-300' : 'text-muted-foreground'}`}>{withoutReceipt.length} items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Expenses and Income */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Income / Invoices
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses">
          {/* Expenses List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>All expenses for {projectName}</CardDescription>
                </div>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                  <DialogDescription>Add a new expense for {projectName}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Receipt Upload with AI Scan - Only show if feature is enabled */}
                  {isReceiptScannerEnabled && (
                    <div className="space-y-2">
                      <Label>Receipt (AI Scan)</Label>
                      {receiptPreview ? (
                        <div className="relative">
                          <img src={receiptPreview} alt="Receipt" className="w-full h-32 object-cover rounded-lg" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => {
                              setReceiptPreview(null);
                              setNewExpense(prev => ({ ...prev, receipt_image: null }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {isScanning && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                              <span className="text-white ml-2">Scanning...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Sparkles className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">Upload receipt for AI scan</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleReceiptScan} />
                        </label>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={newExpense.expense_date}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, expense_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Input
                      placeholder="Vendor name"
                      value={newExpense.vendor}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Expense description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => addExpenseMutation.mutate(newExpense)}
                    disabled={!newExpense.amount || !newExpense.category || addExpenseMutation.isPending}
                  >
                    {addExpenseMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Add Expense</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {expenses && expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setEditExpense({
                      id: expense.id,
                      description: expense.description || '',
                      amount: expense.amount?.toString() || '',
                      category: expense.category || '',
                      expense_date: expense.expense_date || '',
                      vendor: expense.vendor || '',
                      notes: expense.notes || '',
                      receipt_url: expense.receipt_url || null,
                      new_receipt_image: null,
                    });
                    setIsEditExpenseOpen(true);
                  }}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg shrink-0 ${expense.receipt_url ? 'bg-primary/10' : 'bg-muted'}`}>
                          {expense.receipt_url ? (
                            <Receipt className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{expense.vendor || expense.description}</p>
                          <p className="text-xs text-muted-foreground">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold">{formatCurrency(Number(expense.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.expense_date ? format(new Date(expense.expense_date), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(expense.status || 'pending')}
                      <div className="flex items-center gap-1">
                        {expense.receipt_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExpense(expense);
                              setIsViewReceiptOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditExpense({
                              id: expense.id,
                              description: expense.description || '',
                              amount: expense.amount?.toString() || '',
                              category: expense.category || '',
                              expense_date: expense.expense_date || '',
                              vendor: expense.vendor || '',
                              notes: expense.notes || '',
                              receipt_url: expense.receipt_url || null,
                              new_receipt_image: null,
                            });
                            setIsEditExpenseOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canApproveExpenses && expense.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateExpenseStatusMutation.mutate({ expenseId: expense.id, status: 'approved' });
                              }}
                              disabled={updateExpenseStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateExpenseStatusMutation.mutate({ expenseId: expense.id, status: 'rejected' });
                              }}
                              disabled={updateExpenseStatusMutation.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${expense.receipt_url ? 'bg-primary/10' : 'bg-muted'}`}>
                        {expense.receipt_url ? (
                          <Receipt className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{expense.vendor || expense.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{expense.category}</span>
                          <span>•</span>
                          <span>{expense.expense_date ? format(new Date(expense.expense_date), 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expense.receipt_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExpense(expense);
                            setIsViewReceiptOpen(true);
                          }}
                          title="View Receipt"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditExpense({
                            id: expense.id,
                            description: expense.description || '',
                            amount: expense.amount?.toString() || '',
                            category: expense.category || '',
                            expense_date: expense.expense_date || '',
                            vendor: expense.vendor || '',
                            notes: expense.notes || '',
                            receipt_url: expense.receipt_url || null,
                            new_receipt_image: null,
                          });
                          setIsEditExpenseOpen(true);
                        }}
                        title="Edit Expense"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      {canApproveExpenses && expense.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExpenseStatusMutation.mutate({ expenseId: expense.id, status: 'approved' });
                            }}
                            disabled={updateExpenseStatusMutation.isPending}
                            title="Approve Expense"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExpenseStatusMutation.mutate({ expenseId: expense.id, status: 'rejected' });
                            }}
                            disabled={updateExpenseStatusMutation.isPending}
                            title="Reject Expense"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {getStatusBadge(expense.status || 'pending')}
                      <span className="font-bold min-w-[80px] text-right">{formatCurrency(Number(expense.amount))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No expenses recorded yet</p>
              <p className="text-sm">Add your first expense to start tracking</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="income">
          <InvoiceManager projectId={projectId} projectName={projectName} />
        </TabsContent>
      </Tabs>

      {/* View Receipt Dialog */}
      <Dialog open={isViewReceiptOpen} onOpenChange={setIsViewReceiptOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              {selectedExpense?.vendor || selectedExpense?.description} - {formatCurrency(Number(selectedExpense?.amount || 0))}
            </DialogDescription>
          </DialogHeader>
          {selectedExpense?.receipt_url && (
            <div className="space-y-4">
              <img 
                src={selectedExpense.receipt_url} 
                alt="Receipt" 
                className="w-full max-h-[60vh] object-contain rounded-lg border"
              />
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.open(selectedExpense.receipt_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Size
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          
          {editExpense && (
            <div className="space-y-4">
              {/* Receipt Section - Only show if feature is enabled */}
              {isReceiptScannerEnabled && (
                <div className="space-y-2">
                  <Label>Receipt</Label>
                  {(editExpense.receipt_url || editExpense.new_receipt_image) ? (
                    <div className="relative">
                      <img 
                        src={editExpense.new_receipt_image || editExpense.receipt_url} 
                        alt="Receipt" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setEditExpense((prev: any) => ({ 
                          ...prev, 
                          receipt_url: null, 
                          new_receipt_image: null 
                        }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {isEditScanning && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                          <span className="text-white ml-2">Scanning...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Sparkles className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">Upload receipt for AI scan</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleEditReceiptScan} />
                    </label>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editExpense.amount}
                    onChange={(e) => setEditExpense((prev: any) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={editExpense.expense_date}
                    onChange={(e) => setEditExpense((prev: any) => ({ ...prev, expense_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  placeholder="Vendor name"
                  value={editExpense.vendor}
                  onChange={(e) => setEditExpense((prev: any) => ({ ...prev, vendor: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={editExpense.category}
                  onValueChange={(value) => setEditExpense((prev: any) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Expense description"
                  value={editExpense.description}
                  onChange={(e) => setEditExpense((prev: any) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={editExpense.notes || ''}
                  onChange={(e) => setEditExpense((prev: any) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => editExpenseMutation.mutate(editExpense)}
                disabled={!editExpense.amount || !editExpense.category || editExpenseMutation.isPending}
              >
                {editExpenseMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Pencil className="h-4 w-4 mr-2" />Save Changes</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
