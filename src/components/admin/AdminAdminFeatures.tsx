import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Settings2, 
  Loader2, 
  RefreshCw,
  Clock,
  Check,
  X,
  Edit,
  Save,
  ChevronDown,
  ChevronRight,
  Layers
} from "lucide-react";

interface AdminFeatureSetting {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  show_as_upcoming: boolean;
  sort_order: number;
  parent_feature_key: string | null;
  created_at: string;
  updated_at: string;
}

// Tab icons mapping to show which tab each feature controls
const tabIcons: Record<string, string> = {
  admin_dashboard: "📊",
  admin_users: "👥",
  admin_roles: "🛡️",
  admin_projects: "📁",
  admin_emails: "📧",
  admin_contacts: "📬",
  admin_support: "🎧",
  admin_promo_codes: "🏷️",
  admin_subscriptions: "💳",
  admin_system: "⚡",
  admin_analytics: "📈",
  admin_audit_logs: "📋",
  admin_security: "🔐",
  admin_settings: "⚙️",
};

const categoryLabels: Record<string, string> = {
  overview: "Overview Tabs",
  users: "User Management Tabs",
  content: "Content Tabs",
  communication: "Communication Tabs",
  finance: "Finance Tabs",
  system: "System Tabs",
  reports: "Reports Tabs",
};

const categoryColors: Record<string, string> = {
  overview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  users: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  content: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  communication: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  finance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  system: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  reports: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

export const AdminAdminFeatures = () => {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<AdminFeatureSetting | null>(null);
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    feature_name: "",
    description: "",
  });

  // Fetch admin features
  const { data: features = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-feature-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_feature_settings")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as AdminFeatureSetting[];
    },
  });

  // Toggle enabled mutation
  const toggleEnabledMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("admin_feature_settings")
        .update({ is_enabled, show_as_upcoming: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feature status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-feature-settings"] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Toggle upcoming mutation
  const toggleUpcomingMutation = useMutation({
    mutationFn: async ({ id, show_as_upcoming }: { id: string; show_as_upcoming: boolean }) => {
      const { error } = await supabase
        .from("admin_feature_settings")
        .update({ 
          show_as_upcoming, 
          is_enabled: show_as_upcoming ? false : true 
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-feature-settings"] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, feature_name, description }: { id: string; feature_name: string; description: string }) => {
      const { error } = await supabase
        .from("admin_feature_settings")
        .update({ feature_name, description })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feature updated");
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-feature-settings"] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleEdit = (feature: AdminFeatureSetting) => {
    setSelectedFeature(feature);
    setEditForm({
      feature_name: feature.feature_name,
      description: feature.description || "",
    });
    setEditDialogOpen(true);
  };

  const toggleExpanded = (featureKey: string) => {
    setExpandedTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureKey)) {
        newSet.delete(featureKey);
      } else {
        newSet.add(featureKey);
      }
      return newSet;
    });
  };

  const getStatusBadge = (feature: AdminFeatureSetting) => {
    if (feature.show_as_upcoming) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          Coming Soon
        </Badge>
      );
    }
    if (feature.is_enabled) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400">
          <Check className="h-3 w-3 mr-1" />
          Enabled
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400">
        <X className="h-3 w-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  // Separate main tabs and sub-tabs
  const mainTabs = features.filter(f => !f.parent_feature_key);
  const subTabs = features.filter(f => f.parent_feature_key);

  // Get sub-tabs for a specific parent
  const getSubTabs = (parentKey: string) => {
    return subTabs.filter(s => s.parent_feature_key === parentKey);
  };

  // Group main tabs by category
  const groupedMainTabs = mainTabs.reduce((acc, feature) => {
    const category = feature.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, AdminFeatureSetting[]>);

  const stats = {
    totalTabs: mainTabs.length,
    totalSubTabs: subTabs.length,
    enabled: features.filter(f => f.is_enabled && !f.show_as_upcoming).length,
    upcoming: features.filter(f => f.show_as_upcoming).length,
  };

  const renderFeatureRow = (feature: AdminFeatureSetting, isSubTab: boolean = false) => {
    const featureSubTabs = getSubTabs(feature.feature_key);
    const hasSubTabs = featureSubTabs.length > 0;
    const isExpanded = expandedTabs.has(feature.feature_key);

    return (
      <div key={feature.id}>
        <div 
          className={`flex items-center gap-3 py-3 px-4 border-b last:border-b-0 ${
            isSubTab ? 'bg-muted/30 pl-12' : 'bg-background'
          } ${hasSubTabs ? 'cursor-pointer hover:bg-muted/50' : ''}`}
          onClick={hasSubTabs ? () => toggleExpanded(feature.feature_key) : undefined}
        >
          {/* Expand/Collapse for main tabs with sub-tabs */}
          <div className="w-5 shrink-0">
            {hasSubTabs && (
              isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {isSubTab && <Layers className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>

          {/* Icon & Name */}
          <div className="flex items-center gap-2 min-w-[180px]">
            {!isSubTab && <span className="text-lg">{tabIcons[feature.feature_key] || "📄"}</span>}
            <div>
              <div className={`font-medium ${isSubTab ? 'text-sm' : ''}`}>{feature.feature_name}</div>
              <div className="text-xs text-muted-foreground font-mono">{feature.feature_key}</div>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 text-sm text-muted-foreground hidden md:block">
            {feature.description || "-"}
          </div>

          {/* Sub-tabs count badge */}
          {hasSubTabs && (
            <Badge variant="secondary" className="text-xs">
              {featureSubTabs.length} sub-{featureSubTabs.length === 1 ? 'tab' : 'tabs'}
            </Badge>
          )}

          {/* Status */}
          <div className="shrink-0 w-[110px]">
            {getStatusBadge(feature)}
          </div>

          {/* Enable Switch */}
          <div className="shrink-0 w-[60px] flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={feature.is_enabled && !feature.show_as_upcoming}
              onCheckedChange={(checked) => {
                toggleEnabledMutation.mutate({ id: feature.id, is_enabled: checked });
              }}
              disabled={feature.show_as_upcoming || toggleEnabledMutation.isPending}
            />
          </div>

          {/* Coming Soon Switch */}
          <div className="shrink-0 w-[60px] flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={feature.show_as_upcoming}
              onCheckedChange={(checked) => {
                toggleUpcomingMutation.mutate({ id: feature.id, show_as_upcoming: checked });
              }}
              disabled={toggleUpcomingMutation.isPending}
            />
          </div>

          {/* Edit Button */}
          <div className="shrink-0 w-[40px]" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(feature)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sub-tabs (collapsible) */}
        {hasSubTabs && isExpanded && (
          <div className="border-l-2 border-primary/30 ml-6">
            {featureSubTabs.map(subTab => renderFeatureRow(subTab, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Admin Panel Tab Management</CardTitle>
                <CardDescription>
                  Control which tabs and sub-tabs Operation Admins can access
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalTabs}</div>
              <div className="text-sm text-muted-foreground">Main Tabs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSubTabs}</div>
              <div className="text-sm text-muted-foreground">Sub-Tabs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
              <div className="text-sm text-muted-foreground">Enabled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.upcoming}</div>
              <div className="text-sm text-muted-foreground">Coming Soon</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedMainTabs).map(([category, categoryFeatures]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                  {categoryLabels[category] || category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({categoryFeatures.length} {categoryFeatures.length === 1 ? 'tab' : 'tabs'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Header Row */}
              <div className="flex items-center gap-3 py-2 px-4 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                <div className="w-5 shrink-0"></div>
                <div className="min-w-[180px]">Tab</div>
                <div className="flex-1 hidden md:block">Description</div>
                <div className="w-[110px]"></div>
                <div className="shrink-0 w-[110px]">Status</div>
                <div className="shrink-0 w-[60px] text-center">Enable</div>
                <div className="shrink-0 w-[60px] text-center">Soon</div>
                <div className="shrink-0 w-[40px]"></div>
              </div>

              {/* Feature Rows */}
              {categoryFeatures.map(feature => renderFeatureRow(feature))}
            </CardContent>
          </Card>
        ))
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Settings2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How Tab & Sub-Tab Access Control Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Main Tabs:</strong> Control visibility of top-level tabs in Admin Panel</li>
                <li><strong>Sub-Tabs:</strong> Control specific features within each main tab (click to expand)</li>
                <li><strong>Enabled:</strong> Operation Admins can see and access this tab/feature</li>
                <li><strong>Disabled:</strong> Tab/feature is hidden from Operation Admins</li>
                <li><strong>Coming Soon:</strong> Shows with "Soon" badge but is locked</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground italic">
                Note: System Admins always have full access to all tabs regardless of these settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tab/Feature</DialogTitle>
            <DialogDescription>
              Update information for "{selectedFeature?.feature_key}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editForm.feature_name}
                onChange={(e) => setEditForm({ ...editForm, feature_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedFeature) {
                  updateFeatureMutation.mutate({
                    id: selectedFeature.id,
                    ...editForm,
                  });
                }
              }}
              disabled={updateFeatureMutation.isPending}
            >
              {updateFeatureMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
