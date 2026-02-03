import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Settings2, Loader2, ChevronDown, ChevronRight, Bot, Folder, Building2, MessageSquare, FileText, BarChart3, Wrench, Plug, Menu, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface GlobalFeatureSetting {
  id: string;
  feature_key: string;
  feature_name: string;
  enabled: boolean;
  display_name: string | null;
  description: string | null;
  show_as_upcoming: boolean;
  parent_feature_key: string | null;
  category: string | null;
  sort_order: number | null;
  requires_subscription: string[] | null;
  show_in_sidebar: boolean;
  sidebar_order: number | null;
  sidebar_icon: string | null;
  sidebar_path: string | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'app': { label: 'App & Core', icon: Settings2, color: 'text-slate-500' },
  'authentication': { label: 'Authentication', icon: KeyRound, color: 'text-emerald-500' },
  'project': { label: 'Project Management', icon: Folder, color: 'text-blue-500' },
  'finance': { label: 'Finance & Budget', icon: Building2, color: 'text-green-500' },
  'communication': { label: 'Communication', icon: MessageSquare, color: 'text-purple-500' },
  'compliance': { label: 'Compliance & Safety', icon: FileText, color: 'text-orange-500' },
  'reports': { label: 'Reports & Analytics', icon: BarChart3, color: 'text-cyan-500' },
  'ai': { label: 'AI Features', icon: Bot, color: 'text-pink-500' },
  'tools': { label: 'Tools & Utilities', icon: Wrench, color: 'text-yellow-500' },
  'integrations': { label: 'Integrations', icon: Plug, color: 'text-indigo-500' },
};

export const AdminFeatureManagement = () => {
  const queryClient = useQueryClient();
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['app', 'authentication', 'project', 'finance', 'communication', 'compliance', 'reports', 'ai', 'tools', 'integrations']));

  const { data: features, isLoading } = useQuery({
    queryKey: ['global-feature-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_feature_settings')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as GlobalFeatureSetting[];
    },
  });

  // Organize features by category and parent
  const organizedFeatures = useMemo(() => {
    if (!features) return {};
    
    const byCategory: Record<string, { root: GlobalFeatureSetting[]; children: Record<string, GlobalFeatureSetting[]> }> = {};
    
    // First pass: organize root features by category
    features.forEach(feature => {
      if (!feature.parent_feature_key) {
        // Normalize category to lowercase for consistent matching with CATEGORY_CONFIG
        const category = (feature.category || 'other').toLowerCase();
        if (!byCategory[category]) {
          byCategory[category] = { root: [], children: {} };
        }
        byCategory[category].root.push(feature);
      }
    });
    
    // Second pass: organize child features under their parents
    features.forEach(feature => {
      if (feature.parent_feature_key) {
        // Find parent's category
        const parent = features.find(f => f.feature_key === feature.parent_feature_key);
        // Normalize category to lowercase for consistent matching with CATEGORY_CONFIG
        const category = (parent?.category || feature.category || 'other').toLowerCase();
        if (!byCategory[category]) {
          byCategory[category] = { root: [], children: {} };
        }
        if (!byCategory[category].children[feature.parent_feature_key]) {
          byCategory[category].children[feature.parent_feature_key] = [];
        }
        byCategory[category].children[feature.parent_feature_key].push(feature);
      }
    });
    
    return byCategory;
  }, [features]);

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ 
      featureKey, 
      enabled,
      showAsUpcoming,
      showInSidebar
    }: { 
      featureKey: string; 
      enabled?: boolean;
      showAsUpcoming?: boolean;
      showInSidebar?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      
      // CRITICAL: Sync both 'enabled' and 'is_enabled' columns for full compatibility
      // Some legacy components may read from 'is_enabled' instead of 'enabled'
      if (enabled !== undefined) {
        updates.enabled = enabled;
        updates.is_enabled = enabled; // Keep both columns in sync
      }
      if (showAsUpcoming !== undefined) updates.show_as_upcoming = showAsUpcoming;
      if (showInSidebar !== undefined) updates.show_in_sidebar = showInSidebar;

      // IMPORTANT:
      // With RLS, PostgREST may return 204 even when 0 rows are updated.
      // Request the updated row(s) back so we can detect permission issues.
      const { data, error } = await supabase
        .from('global_feature_settings')
        .update(updates)
        .eq('feature_key', featureKey)
        .select('id, feature_key, enabled, is_enabled');

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Update blocked by permissions (RLS) or feature not found.');
      }
      
      console.log('Feature updated successfully:', data[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-feature-settings'] });
      toast.success('Feature setting updated successfully');
    },
    onError: (error) => {
      console.error('Error updating feature:', error);
      toast.error('Failed to update feature setting: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const toggleFeatureExpand = (featureKey: string) => {
    setExpandedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureKey)) {
        next.delete(featureKey);
      } else {
        next.add(featureKey);
      }
      return next;
    });
  };

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getChildFeatures = (parentKey: string) => {
    return features?.filter(f => f.parent_feature_key === parentKey) || [];
  };

  const hasChildren = (featureKey: string) => {
    return features?.some(f => f.parent_feature_key === featureKey) || false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderFeatureRow = (feature: GlobalFeatureSetting, isChild: boolean = false) => {
    const children = getChildFeatures(feature.feature_key);
    const hasChildFeatures = children.length > 0;
    const isExpanded = expandedFeatures.has(feature.feature_key);
    const hasSidebarConfig = feature.sidebar_path !== null;

    return (
      <div key={feature.id}>
        <div className={cn(
          "flex items-center gap-4 py-3 px-4 border-b hover:bg-muted/50 transition-colors",
          isChild && "pl-12 bg-muted/20"
        )}>
          {/* Expand button for features with children */}
          <div className="w-6">
            {hasChildFeatures && (
              <button 
                onClick={() => toggleFeatureExpand(feature.feature_key)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Feature name */}
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className={cn("font-medium", isChild && "text-sm")}>
                {feature.display_name || feature.feature_name}
              </span>
              {hasChildFeatures && (
                <Badge variant="secondary" className="text-xs">
                  {children.length} sub-features
                </Badge>
              )}
              {hasSidebarConfig && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Menu className="h-3 w-3" />
                  Menu
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex-[2] text-muted-foreground text-sm">
            {feature.description || 'No description'}
          </div>

          {/* Show in Menu toggle - only for features with sidebar config */}
          <div className="w-[80px] flex justify-center">
            {hasSidebarConfig && (
              <Switch
                checked={feature.show_in_sidebar !== false}
                onCheckedChange={(checked) => {
                  updateFeatureMutation.mutate({
                    featureKey: feature.feature_key,
                    showInSidebar: checked,
                  });
                }}
              />
            )}
          </div>

          {/* Enabled toggle */}
          <div className="w-[80px] flex justify-center">
            <Switch
              checked={feature.enabled}
              onCheckedChange={(checked) => {
                updateFeatureMutation.mutate({
                  featureKey: feature.feature_key,
                  enabled: checked,
                });
              }}
            />
          </div>

          {/* Show as Upcoming toggle */}
          <div className="w-[100px] flex justify-center">
            {!feature.enabled && (
              <Switch
                checked={feature.show_as_upcoming}
                onCheckedChange={(checked) => {
                  updateFeatureMutation.mutate({
                    featureKey: feature.feature_key,
                    showAsUpcoming: checked,
                  });
                }}
              />
            )}
          </div>
        </div>

        {/* Child features */}
        {hasChildFeatures && isExpanded && (
          <div className="border-l-2 border-primary/20 ml-6">
            {children.map(child => renderFeatureRow(child, true))}
          </div>
        )}
      </div>
    );
  };

  const renderCategory = (categoryKey: string) => {
    const categoryData = organizedFeatures[categoryKey];
    if (!categoryData || categoryData.root.length === 0) return null;

    const config = CATEGORY_CONFIG[categoryKey] || { 
      label: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1), 
      icon: Folder, 
      color: 'text-muted-foreground' 
    };
    const Icon = config.icon;
    const isExpanded = expandedCategories.has(categoryKey);

    return (
      <Collapsible 
        key={categoryKey} 
        open={isExpanded} 
        onOpenChange={() => toggleCategoryExpand(categoryKey)}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 transition-colors rounded-t-lg border-b cursor-pointer">
            <Icon className={cn("h-5 w-5", config.color)} />
            <span className="font-semibold">{config.label}</span>
            <Badge variant="secondary" className="ml-2">
              {categoryData.root.length} features
            </Badge>
            <div className="flex-1" />
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-x border-b rounded-b-lg overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-4 py-2 px-4 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
              <div className="w-6" />
              <div className="flex-1 min-w-[180px]">Feature Name</div>
              <div className="flex-[2]">Description</div>
              <div className="w-[80px] text-center">In Menu</div>
              <div className="w-[80px] text-center">Enabled</div>
              <div className="w-[100px] text-center">Upcoming</div>
            </div>
            {categoryData.root.map(feature => renderFeatureRow(feature))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const categoryOrder = ['app', 'authentication', 'project', 'finance', 'communication', 'compliance', 'reports', 'ai', 'tools', 'integrations'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle>Global Features & Menu</CardTitle>
          </div>
          <CardDescription>
            Manage features and sidebar menu visibility in one place. Features marked with "Menu" badge can be shown/hidden from the sidebar. Expand categories to control sub-features and tabs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryOrder.map(cat => renderCategory(cat))}
          
          {/* Render uncategorized features if any */}
          {organizedFeatures['other'] && organizedFeatures['other'].root.length > 0 && (
            renderCategory('other')
          )}
        </CardContent>
      </Card>
    </div>
  );
};
