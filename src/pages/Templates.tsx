import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TemplatePreviewDialog } from '@/components/templates/TemplatePreviewDialog';
import { SeedTemplatesButton } from '@/components/templates/SeedTemplatesButton';
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from '@/components/mobile';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText,
  Search,
  Filter,
  Download,
  Heart,
  Star,
  Plus,
  Eye,
  Copy,
  Edit,
  Trash2,
  Building,
  Home,
  Factory,
  Wrench
} from 'lucide-react';

const TemplatesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  
  const featureEnabled = isFeatureEnabled('project_templates');
  const featureUpcoming = isFeatureUpcoming('project_templates');

  // Tab options for mobile grid
  const tabOptions = [
    { value: 'all', label: 'All Templates' },
    { value: 'featured', label: 'Featured' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Recently Added' },
  ];

  // Fetch templates from database
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['project-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Setup realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_templates'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-templates'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const categories = [
    { id: 'all', name: 'All Templates', icon: FileText },
    { id: 'residential', name: 'Residential', icon: Home },
    { id: 'commercial', name: 'Commercial', icon: Building },
    { id: 'industrial', name: 'Industrial', icon: Factory },
    { id: 'safety', name: 'Safety', icon: Wrench },
    { id: 'finance', name: 'Finance', icon: FileText },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench }
  ];

  const templateTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'project', name: 'Project Templates' },
    { id: 'checklist', name: 'Checklists' },
    { id: 'report', name: 'Reports' },
    { id: 'schedule', name: 'Schedules' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = filteredTemplates.filter(template => template.is_system_template);
  
  const popularTemplates = [...filteredTemplates].sort((a, b) => {
    // Sort by system templates first, then by updated date
    if (a.is_system_template !== b.is_system_template) {
      return b.is_system_template ? 1 : -1;
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  
  const recentTemplates = [...filteredTemplates].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleTemplateAction = async (templateId: string, action: string) => {
    if (action === 'Used') {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Error',
            description: 'You must be logged in to use templates',
            variant: 'destructive'
          });
          return;
        }

        // Get template data
        const { data: template, error: templateError } = await supabase
          .from('project_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (templateError) throw templateError;

        // Create project from template
        const templateData = (template.template_data as any) || {};
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: template.name,
            description: template.description,
            category: template.category,
            status: 'planning',
            budget: Number(templateData.budget) || 0,
            start_date: templateData.start_date || new Date().toISOString().split('T')[0],
            end_date: templateData.end_date || null,
            created_by: user.id,
            owner_id: user.id,
            priority: templateData.priority || 'medium',
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Create tasks from template
        const defaultTasks = (templateData.default_tasks as any[]) || [];
        if (defaultTasks.length > 0) {
          const tasksToInsert = defaultTasks.map((task: any, index: number) => ({
            project_id: project.id,
            title: task.name || task.title || `Task ${index + 1}`,
            description: task.description || `Task from ${template.name} template`,
            status: 'todo',
            priority: task.priority || 'medium',
            created_by: user.id,
            assigned_to: task.assigned_to || null,
            due_date: task.due_date || null,
            estimated_hours: task.estimated_hours || task.duration ? parseInt(task.duration) : null,
            tags: task.phase ? [task.phase] : [],
            completion_percentage: 0
          }));

          const { error: tasksError } = await supabase
            .from('project_tasks')
            .insert(tasksToInsert);

          if (tasksError) {
            console.error('Error creating tasks:', tasksError);
            // Don't throw, just log - project is already created
          }
        }

        // Create milestones from template if any
        const milestones = (templateData.milestones as any[]) || [];
        if (milestones.length > 0) {
          const milestonesToInsert = milestones.map((milestone: any) => ({
            project_id: project.id,
            name: typeof milestone === 'string' ? milestone : milestone.title || milestone.name,
            description: typeof milestone === 'string' ? '' : (milestone.description || ''),
            due_date: milestone.due_date || milestone.target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          }));

          const { error: milestonesError } = await (supabase as any)
            .from('project_milestones')
            .insert(milestonesToInsert);

          if (milestonesError) {
            console.error('Error creating milestones:', milestonesError);
            // Don't throw, just log
          }
        }

        // Creator is automatically added as admin by database trigger
        
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast({
          title: 'Success',
          description: `Project "${template.name}" created with ${defaultTasks.length} tasks`,
        });

        // Navigate to the new project
        window.location.href = `/projects/${project.id}`;
      } catch (error: any) {
        console.error('Error creating project from template:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create project from template',
          variant: 'destructive'
        });
      }
    } else if (action === 'Copied') {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Error',
            description: 'You must be logged in to copy templates',
            variant: 'destructive'
          });
          return;
        }

        // Get template data
        const { data: template, error: templateError } = await supabase
          .from('project_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (templateError) throw templateError;

        // Create a copy of the template
        const { data: copiedTemplate, error: copyError } = await supabase
          .from('project_templates')
          .insert({
            name: `${template.name} (Copy)`,
            description: template.description,
            category: template.category,
            template_data: template.template_data,
            estimated_duration: template.estimated_duration,
            estimated_budget: template.estimated_budget,
            complexity: template.complexity,
            is_active: true,
            is_public: false,
            is_system_template: false,
            required_permits: template.required_permits,
            created_by: user.id,
          })
          .select()
          .single();

        if (copyError) throw copyError;

        queryClient.invalidateQueries({ queryKey: ['project-templates'] });
        
        toast({
          title: 'Template Copied',
          description: `"${copiedTemplate.name}" has been created in your templates`,
        });
      } catch (error: any) {
        console.error('Error copying template:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to copy template',
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: `Template ${action}`,
        description: `Template has been ${action.toLowerCase()}`
      });
    }
  };

  const handleDeleteRequest = (templateId: string, templateName: string) => {
    setDeleteConfirm({ id: templateId, name: templateName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete templates',
          variant: 'destructive',
        });
        return;
      }

      // Delete only templates created by the current user (copies).
      // If RLS denies delete, PostgREST returns 0 affected rows (no error), so we must check count.
      const { error, count } = await supabase
        .from('project_templates')
        .delete({ count: 'exact' })
        .eq('id', deleteConfirm.id)
        .eq('created_by', user.id)
        .or('is_system_template.eq.false,is_system_template.is.null');

      if (error) throw error;

      if (!count || count < 1) {
        toast({
          title: 'Cannot delete template',
          description: 'Template was not deleted (no permission or it is a system template).',
          variant: 'destructive',
        });
        return;
      }

      // Optimistic cache update for instant UI feedback
      queryClient.setQueryData(['project-templates'], (old: any) =>
        Array.isArray(old) ? old.filter((t) => t?.id !== deleteConfirm.id) : old
      );

      // Force refetch to update UI
      await queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      await queryClient.refetchQueries({ queryKey: ['project-templates'] });
      
      toast({
        title: 'Template Deleted',
        description: `"${deleteConfirm.name}" has been removed`,
      });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive'
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData?.icon || FileText;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-primary/10 text-primary';
      case 'checklist': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'report': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'schedule': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return (
      <MobilePageWrapper
        title="Templates"
        subtitle="This feature is currently disabled"
      >
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Feature Disabled</h3>
              <p className="text-muted-foreground">
                Project Templates is currently disabled. Contact your administrator.
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
        title="Templates"
        subtitle="Pre-built project templates for Ontario building code categories"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Templates
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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

  return (
    <MobilePageWrapper
      title="Templates"
      subtitle="Browse and use pre-built templates to kickstart your projects"
      actions={
        <div className="flex gap-2">
          <SeedTemplatesButton />
          <Button variant="outline" size="sm" className="md:hidden">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="hidden md:flex">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      }
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Category Filter - Native Chips */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <IconComponent className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{category.name}</span>
              <span className="md:hidden">{category.id === 'all' ? 'All' : category.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Template Stats - Mobile Native Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MobileCard
          title="Total Templates"
          value={templates.length}
          icon={FileText}
        />
        <MobileCard
          title="Featured"
          value={featuredTemplates.length}
          icon={Star}
        />
        <MobileCard
          title="Categories"
          value={categories.length - 1}
          subtitle="template types"
          icon={Filter}
        />
        <MobileCard
          title="Active"
          value={templates.filter(t => t.is_active).length}
          icon={Heart}
        />
      </div>

      {/* Mobile Segmented Control for Tabs */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          size="sm"
        />
      </div>

      {/* Template Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        {/* Desktop TabsList */}
        <TabsList className="hidden md:flex">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="popular">Most Popular</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TemplateGrid templates={filteredTemplates} onAction={handleTemplateAction} onPreview={setPreviewTemplate} onDelete={handleDeleteRequest} />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <TemplateGrid templates={featuredTemplates} onAction={handleTemplateAction} onPreview={setPreviewTemplate} onDelete={handleDeleteRequest} />
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <TemplateGrid templates={popularTemplates} onAction={handleTemplateAction} onPreview={setPreviewTemplate} onDelete={handleDeleteRequest} />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <TemplateGrid templates={recentTemplates} onAction={handleTemplateAction} onPreview={setPreviewTemplate} onDelete={handleDeleteRequest} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemplatePreviewDialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        template={previewTemplate}
        onUseTemplate={() => handleTemplateAction(previewTemplate?.id, 'Used')}
      />
    </MobilePageWrapper>
  );
};

interface TemplateGridProps {
  templates: any[];
  onAction: (templateId: string, action: string) => void;
  onPreview: (template: any) => void;
  onDelete: (templateId: string, templateName: string) => void;
}

const TemplateGrid: React.FC<TemplateGridProps> = ({ templates, onAction, onPreview, onDelete }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential': return Home;
      case 'commercial': return Building;
      case 'industrial': return Factory;
      case 'safety': return Wrench;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-primary/10 text-primary';
      case 'checklist': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'report': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'schedule': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No templates found</h3>
        <p className="text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => {
        const CategoryIcon = getCategoryIcon(template.category);
        
        return (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium leading-tight">{template.name}</h3>
                      {template.featured && (
                        <Badge variant="outline" className="mt-1">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                {/* Template Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline" className="capitalize">
                      {template.category}
                    </Badge>
                  </div>
                  
                  {template.estimated_duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{template.estimated_duration}</span>
                    </div>
                  )}
                  
                  {template.estimated_budget && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget Range</span>
                      <span>{template.estimated_budget}</span>
                    </div>
                  )}

                  {template.complexity && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Complexity</span>
                      <Badge variant="outline" className="capitalize">
                        {template.complexity}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                  {template.is_system_template && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>System</span>
                    </div>
                  )}
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onAction(template.id, 'Used')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Use Template
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onPreview(template)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAction(template.id, 'Copied')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {!template.is_system_template && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => onDelete(template.id, template.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Creator Info */}
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <div>Updated {new Date(template.updated_at || template.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TemplatesPage;