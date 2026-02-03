import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Tag,
  Palette,
  Search,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { MobileCard } from '@/components/mobile';

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6B7280', '#14B8A6',
];

export const BudgetCategoriesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<ExpenseCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
  });

  // Fetch expense categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['budget-expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });

  // Filter categories based on search
  const filteredCategories = categories?.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6', is_active: true });
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Category name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('expense_categories')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          is_active: formData.is_active,
        });

      if (error) throw error;

      toast({ title: "Category Created", description: `"${formData.name}" has been added` });
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['budget-expense-categories'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create category", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast({ title: "Validation Error", description: "Category name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          is_active: formData.is_active,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({ title: "Category Updated", description: `"${formData.name}" has been updated` });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['budget-expense-categories'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update category", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', deleteCategory.id);

      if (error) throw error;

      toast({ title: "Category Deleted", description: `"${deleteCategory.name}" has been deleted` });
      setDeleteCategory(null);
      queryClient.invalidateQueries({ queryKey: ['budget-expense-categories'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete category", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      is_active: category.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const toggleCategoryStatus = async (category: ExpenseCategory) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: category.is_active ? "Category Deactivated" : "Category Activated",
        description: `"${category.name}" has been ${category.is_active ? 'deactivated' : 'activated'}`,
      });

      queryClient.invalidateQueries({ queryKey: ['budget-expense-categories'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    }
  };

  const activeCount = categories?.filter(c => c.is_active).length || 0;
  const totalCount = categories?.length || 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <MobileCard title="Total Categories" value={totalCount.toString()} subtitle="All categories" icon={Tag} />
        <MobileCard title="Active" value={activeCount.toString()} subtitle="Available for use" icon={Check} iconClassName="bg-green-500/10" />
        <MobileCard title="Inactive" value={(totalCount - activeCount).toString()} subtitle="Disabled" icon={X} iconClassName="bg-muted" />
      </div>

      {/* Search & Add */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Expense Categories
          </CardTitle>
          <CardDescription>Manage categories for expense classification</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div 
                          className="h-6 w-6 rounded-full border-2 border-background shadow-sm"
                          style={{ backgroundColor: category.color || '#6B7280' }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">
                          {category.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {category.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={category.is_active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleCategoryStatus(category)}
                        >
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteCategory(category)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{searchQuery ? 'No Categories Found' : 'No Categories Yet'}</p>
              <p className="text-sm mb-4">{searchQuery ? 'Try adjusting your search' : 'Create your first category'}</p>
              {!searchQuery && (
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new expense category</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Transportation" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description..." rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Input type="color" value={formData.color} onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))} className="h-8 w-16 p-1" />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
            </div>
            <Button onClick={handleAddCategory} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><PlusCircle className="h-4 w-4 mr-2" />Create Category</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update expense category details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
            </div>
            <Button onClick={handleEditCategory} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : 'Update Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteCategory?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetCategoriesTab;
