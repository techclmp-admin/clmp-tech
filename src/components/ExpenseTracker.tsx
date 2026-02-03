import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit,
  Trash2,
  Receipt,
  Calendar,
  DollarSign,
  Filter,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  project: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
}

interface ExpenseTrackerProps {
  projectId?: string;
  onExpenseAdded?: (expense: Expense) => void;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ 
  projectId, 
  onExpenseAdded 
}) => {
  const { toast } = useToast();
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock expense data - in real app, this would come from Supabase
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      description: 'Construction materials - concrete and steel',
      amount: 15420.50,
      category: 'Materials',
      date: '2024-08-05',
      project: 'E-commerce Website Redesign',
      status: 'approved',
    },
    {
      id: '2',
      description: 'Project management software license',
      amount: 299.99,
      category: 'Software',
      date: '2024-08-04',
      project: 'Mobile App Development',
      status: 'pending',
    },
    {
      id: '3',
      description: 'Equipment rental - excavator',
      amount: 2500.00,
      category: 'Equipment',
      date: '2024-08-03',
      project: 'Data Analytics Dashboard',
      status: 'approved',
    },
    {
      id: '4',
      description: 'Subcontractor services - electrical work',
      amount: 8750.00,
      category: 'Labor',
      date: '2024-08-02',
      project: 'E-commerce Website Redesign',
      status: 'rejected',
    },
  ]);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    project: '',
  });

  const categories = ['Materials', 'Labor', 'Equipment', 'Software', 'Travel', 'Other'];
  const projects = ['E-commerce Website Redesign', 'Mobile App Development', 'Data Analytics Dashboard'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      project: newExpense.project || projects[0],
      status: 'pending',
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({
      description: '',
      amount: '',
      category: '',
      date: '',
      project: '',
    });
    setIsAddingExpense(false);

    if (onExpenseAdded) {
      onExpenseAdded(expense);
    }

    toast({
      title: "Expense Added",
      description: "The expense has been added and is pending approval.",
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed.",
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    const categoryMatch = selectedCategory === 'all' || expense.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || expense.status === selectedStatus;
    const projectMatch = !projectId || expense.project === projectId;
    return categoryMatch && statusMatch && projectMatch;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const approvedExpenses = filteredExpenses
    .filter(exp => exp.status === 'approved')
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = filteredExpenses
    .filter(exp => exp.status === 'pending')
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} expenses recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(approvedExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.filter(exp => exp.status === 'approved').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new project expense for tracking and approval.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the expense..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (CAD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project">Project</Label>
                <Select value={newExpense.project} onValueChange={(value) => setNewExpense({ ...newExpense, project: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingExpense(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>
                  Add Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            All recorded expenses with their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.project}</TableCell>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(expense.status) as any}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No expenses found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseTracker;