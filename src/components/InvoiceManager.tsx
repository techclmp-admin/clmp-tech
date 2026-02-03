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
  Pencil,
  Trash2,
  Loader2,
  Receipt
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InvoiceManagerProps {
  projectId: string;
  projectName: string;
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
  line_items: any;
  created_at: string;
}

export const InvoiceManager = ({ projectId, projectName }: InvoiceManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    client_name: '',
    client_email: '',
    amount: '',
    tax_rate: '13', // Default HST
    due_date: '',
    notes: '',
  });

  // Fetch invoices for this project
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!projectId,
  });

  // Calculate summary stats
  const stats = {
    totalInvoiced: invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
    totalPaid: invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
    totalPending: invoices?.filter(inv => inv.status === 'sent' || inv.status === 'draft').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
    totalOverdue: invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = projectName.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${prefix}-${timestamp}`;
  };

  // Add invoice mutation
  const addInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: typeof newInvoice) => {
      const amount = parseFloat(invoiceData.amount);
      const taxRate = parseFloat(invoiceData.tax_rate) / 100;
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;

      const { error } = await supabase
        .from('project_invoices')
        .insert({
          project_id: projectId,
          invoice_number: generateInvoiceNumber(),
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
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
      toast({ title: 'Invoice created successfully' });
      setIsAddInvoiceOpen(false);
      setNewInvoice({ client_name: '', client_email: '', amount: '', tax_rate: '13', due_date: '', notes: '' });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast({ title: 'Failed to create invoice', variant: 'destructive' });
    },
  });

  // Update invoice status mutation
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
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
      toast({ title: 'Invoice updated' });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('project_invoices')
        .delete()
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Invoiced</p>
              <p className="font-bold text-sm">{formatCurrency(stats.totalInvoiced)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-bold text-sm text-green-600">{formatCurrency(stats.totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-bold text-sm text-yellow-600">{formatCurrency(stats.totalPending)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="font-bold text-sm text-red-600">{formatCurrency(stats.totalOverdue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices
            </CardTitle>
            <CardDescription>Manage invoices and track payments</CardDescription>
          </div>
          <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Create an invoice for {projectName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
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
                  disabled={!newInvoice.client_name || !newInvoice.amount || addInvoiceMutation.isPending}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invoice.invoice_number}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{invoice.client_name}</span>
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
                    
                    {/* Quick Actions */}
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
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No invoices yet</p>
              <p className="text-sm">Create your first invoice to start tracking income</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewInvoiceOpen} onOpenChange={setIsViewInvoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>{selectedInvoice?.invoice_number}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(selectedInvoice.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{selectedInvoice.client_name}</span>
              </div>
              {selectedInvoice.client_email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{selectedInvoice.client_email}</span>
                </div>
              )}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(selectedInvoice.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(Number(selectedInvoice.tax_amount || 0))}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(Number(selectedInvoice.total_amount))}</span>
                </div>
              </div>
              {selectedInvoice.due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {selectedInvoice.paid_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Date</span>
                  <span className="text-green-600">{format(new Date(selectedInvoice.paid_date), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {selectedInvoice.notes && (
                <div>
                  <span className="text-muted-foreground text-sm">Notes</span>
                  <p className="text-sm mt-1">{selectedInvoice.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                {selectedInvoice.status !== 'paid' && (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      updateStatusMutation.mutate({ 
                        invoiceId: selectedInvoice.id, 
                        status: 'paid', 
                        paid_date: new Date().toISOString().split('T')[0] 
                      });
                      setIsViewInvoiceOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsViewInvoiceOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManager;
