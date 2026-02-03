import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Send,
  Eye,
  Trash2,
  Loader2,
  Receipt,
  Search,
  Filter,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MobileCard } from '@/components/mobile';

interface BudgetInvoicesTabProps {
  selectedProject: string;
  projects: { id: string; name: string }[] | undefined;
}

interface Invoice {
  id: string;
  project_id: string;
  invoice_number: string | null;
  client_name: string | null;
  client_email: string | null;
  amount: number;
  tax_amount: number | null;
  total_amount: number;
  status: string | null;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  projects?: { name: string } | null;
}

export const BudgetInvoicesTab = ({ selectedProject, projects }: BudgetInvoicesTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newInvoice, setNewInvoice] = useState({
    project_id: '',
    client_name: '',
    client_email: '',
    amount: '',
    tax_rate: '13',
    due_date: '',
    notes: '',
  });

  // Fetch all invoices with project filter
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['budget-invoices-tab', selectedProject],
    queryFn: async () => {
      let query = supabase
        .from('project_invoices')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });

      if (selectedProject && selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });

  // Filter invoices by search and status
  const filteredInvoices = invoices?.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate summary stats
  const stats = {
    totalInvoiced: invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
    totalPaid: invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
    totalPending: invoices?.filter(inv => inv.status === 'sent' || inv.status === 'draft').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
    totalOverdue: invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
    count: invoices?.length || 0,
  };

  const generateInvoiceNumber = (projectName: string) => {
    const prefix = projectName.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${prefix}-${timestamp}`;
  };

  // Add invoice mutation
  const addInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: typeof newInvoice) => {
      const project = projects?.find(p => p.id === invoiceData.project_id);
      const amount = parseFloat(invoiceData.amount);
      const taxRate = parseFloat(invoiceData.tax_rate) / 100;
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;

      const { error } = await supabase
        .from('project_invoices')
        .insert({
          project_id: invoiceData.project_id,
          invoice_number: generateInvoiceNumber(project?.name || 'PRJ'),
          client_name: invoiceData.client_name,
          client_email: invoiceData.client_email || null,
          amount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'draft',
          due_date: invoiceData.due_date || null,
          notes: invoiceData.notes || null,
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-invoices-tab'] });
      queryClient.invalidateQueries({ queryKey: ['budget-income'] });
      toast({ title: 'Invoice created successfully' });
      setIsAddInvoiceOpen(false);
      setNewInvoice({ project_id: '', client_name: '', client_email: '', amount: '', tax_rate: '13', due_date: '', notes: '' });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast({ title: 'Failed to create invoice', variant: 'destructive' });
    },
  });

  // Update invoice status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status, paid_date }: { invoiceId: string; status: string; paid_date?: string }) => {
      const updateData: any = { status };
      if (paid_date) updateData.paid_date = paid_date;
      
      const { error } = await supabase
        .from('project_invoices')
        .update(updateData)
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-invoices-tab'] });
      queryClient.invalidateQueries({ queryKey: ['budget-income'] });
      toast({ title: 'Invoice updated' });
    },
  });

  // Delete invoice
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('project_invoices')
        .delete()
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-invoices-tab'] });
      queryClient.invalidateQueries({ queryKey: ['budget-income'] });
      toast({ title: 'Invoice deleted' });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'sent':
        return <Badge variant="secondary"><Send className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MobileCard
          title="Total Invoiced"
          value={formatCurrency(stats.totalInvoiced)}
          subtitle={`${stats.count} invoices`}
          icon={FileText}
        />
        <MobileCard
          title="Paid"
          value={formatCurrency(stats.totalPaid)}
          subtitle="Received"
          icon={CheckCircle2}
          iconClassName="bg-green-500/10"
        />
        <MobileCard
          title="Pending"
          value={formatCurrency(stats.totalPending)}
          subtitle="Awaiting payment"
          icon={Clock}
          iconClassName="bg-yellow-500/10"
        />
        <MobileCard
          title="Overdue"
          value={formatCurrency(stats.totalOverdue)}
          subtitle="Past due date"
          icon={XCircle}
          iconClassName="bg-red-500/10"
        />
        <MobileCard
          title="Collection Rate"
          value={stats.totalInvoiced > 0 ? `${((stats.totalPaid / stats.totalInvoiced) * 100).toFixed(0)}%` : '0%'}
          subtitle="Paid vs Invoiced"
          icon={DollarSign}
          iconClassName="bg-primary/10"
        />
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              All Invoices
            </CardTitle>
            <CardDescription>
              Manage invoices across {selectedProject === 'all' ? 'all projects' : 'selected project'}
            </CardDescription>
          </div>
          <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Create an invoice for a project</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select 
                    value={newInvoice.project_id} 
                    onValueChange={(v) => setNewInvoice(prev => ({ ...prev, project_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input
                    placeholder="Client or company name"
                    value={newInvoice.client_name}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, client_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input
                    type="email"
                    placeholder="client@example.com"
                    value={newInvoice.client_email}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, client_email: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (CAD) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Select value={newInvoice.tax_rate} onValueChange={(v) => setNewInvoice(prev => ({ ...prev, tax_rate: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Tax (0%)</SelectItem>
                        <SelectItem value="5">GST (5%)</SelectItem>
                        <SelectItem value="13">HST Ontario (13%)</SelectItem>
                        <SelectItem value="15">HST Atlantic (15%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newInvoice.amount && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(parseFloat(newInvoice.amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({newInvoice.tax_rate}%):</span>
                      <span>{formatCurrency((parseFloat(newInvoice.amount) || 0) * (parseFloat(newInvoice.tax_rate) / 100))}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span>{formatCurrency((parseFloat(newInvoice.amount) || 0) * (1 + parseFloat(newInvoice.tax_rate) / 100))}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => addInvoiceMutation.mutate(newInvoice)}
                  disabled={!newInvoice.project_id || !newInvoice.client_name || !newInvoice.amount || addInvoiceMutation.isPending}
                >
                  {addInvoiceMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" />Create Invoice</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{invoice.invoice_number}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span>{invoice.client_name}</span>
                        {invoice.projects?.name && (
                          <>
                            <span>•</span>
                            <span className="text-primary">{invoice.projects.name}</span>
                          </>
                        )}
                        {invoice.due_date && (
                          <>
                            <span>•</span>
                            <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatCurrency(Number(invoice.total_amount))}</span>
                    
                    {invoice.status !== 'paid' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => updateStatusMutation.mutate({ 
                          invoiceId: invoice.id, 
                          status: 'paid', 
                          paid_date: new Date().toISOString().split('T')[0] 
                        })}
                        title="Mark as Paid"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    {invoice.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateStatusMutation.mutate({ invoiceId: invoice.id, status: 'sent' })}
                        title="Mark as Sent"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setIsViewInvoiceOpen(true);
                      }}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteInvoiceMutation.mutate(invoice.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No invoices found</p>
              <p className="text-sm">Create your first invoice to start tracking income</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewInvoiceOpen} onOpenChange={setIsViewInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{selectedInvoice.invoice_number}</span>
                {getStatusBadge(selectedInvoice.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedInvoice.client_email || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(Number(selectedInvoice.amount))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax</p>
                  <p className="font-medium">{formatCurrency(Number(selectedInvoice.tax_amount || 0))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(selectedInvoice.total_amount))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy') : '—'}
                  </p>
                </div>
              </div>
              {selectedInvoice.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetInvoicesTab;
