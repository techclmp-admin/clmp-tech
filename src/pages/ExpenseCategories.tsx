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
  DialogFooter,
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
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  MobilePageHeader,
  MobileCard,
} from '@/components/mobile';

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
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6B7280', // Gray
  '#14B8A6', // Teal
];

export default function ExpenseCategories() {
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
    queryKey: ['expense-categories-management'],
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
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      is_active: true,
    });
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
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

      toast({
        title: "Category Created",
        description: `"${formData.name}" has been added successfully`,
      });

      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['expense-categories-management'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
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

      toast({
        title: "Category Updated",
        description: `"${formData.name}" has been updated successfully`,
      });

      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['expense-categories-management'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
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

      toast({
        title: "Category Deleted",
        description: `"${deleteCategory.name}" has been deleted`,
      });

      setDeleteCategory(null);
      queryClient.invalidateQueries({ queryKey: ['expense-categories-management'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category. It may be in use by expenses.",
        variant: "destructive",
      });
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

      queryClient.invalidateQueries({ queryKey: ['expense-categories-management'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeCount = categories?.filter(c => c.is_active).length || 0;
  const totalCount = categories?.length || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="px-4 md:px-0 pt-4 md:pt-0">
        <MobilePageHeader
          title="Expense Categories"
          subtitle="Manage expense classification categories"
          actions={
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          }
        />
      </div>

      {/* Summary Cards */}
      <div className="px-4 md:px-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <MobileCard
            title="Total Categories"
            value={totalCount.toString()}
            subtitle="All categories"
            icon={Tag}
          />
          <MobileCard
            title="Active"
            value={activeCount.toString()}
            subtitle="Available for use"
            icon={Check}
          />
          <MobileCard
            title="Inactive"
            value={(totalCount - activeCount).toString()}
            subtitle="Disabled categories"
            icon={X}
            className="col-span-2 md:col-span-1"
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 md:px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="px-4 md:px-0">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Create and manage expense categories for better financial tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCategories.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Color</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteCategory(category)}
                            >
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
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No Categories Found' : 'No Categories Yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search query' 
                    : 'Create your first expense category to get started'}
                </p>
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
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new expense category for classifying expenses
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Transportation"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-20 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Custom color</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive categories won't appear in expense forms
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the expense category details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name">Name *</Label>
              <Input
                id="edit-category-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Transportation"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-20 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Custom color</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive categories won't appear in expense forms
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? This action cannot be undone.
              {deleteCategory && (
                <span className="block mt-2 text-destructive">
                  Note: If this category is used by existing expenses, deletion will fail.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
