import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface GlobalFeatureSetting {
  id: string;
  feature_key: string;
  feature_name: string;
  enabled: boolean;
  display_name: string;
  description: string | null;
  show_as_upcoming: boolean;
  parent_feature_key: string | null;
  category: string | null;
  // Sidebar integration
  show_in_sidebar: boolean;
  sidebar_order: number | null;
  sidebar_icon: string | null;
  sidebar_path: string | null;
}

// Mapping from short aliases to actual feature_keys
const FEATURE_KEY_ALIASES: Record<string, string> = {
  // Tab value aliases
  'kanban': 'kanban_board',
  'timeline': 'gantt_chart',
  'weather': 'weather_widget',
  'tasks': 'task_management',
  'team': 'team_collaboration',
  'chat': 'chat_rooms',
  'files': 'file_management',
  'overview': 'project_management',
  'budget': 'budget_tracking',
  'compliance': 'compliance_tracking',
  'permits': 'permit_tracking',
  'inspections': 'inspection_tracking',
  'templates': 'project_templates',
  'reports': 'reports_analytics',
  'calendar': 'calendar_view',
  'alerts': 'ai_risk_management',
  'quickbooks': 'quickbooks_integration',
  'sage50': 'sage50_integration',
  'ai_chatbot': 'ai_chatbot',
  'ai_assistant': 'ai_chatbot',
  
  // Budget sub-features (tabs)
  'budget_categories': 'budget_categories',
  'budget_invoices': 'budget_invoices',
  'budget_analytics': 'budget_analytics',
  'budget_trends': 'budget_trends',
  'budget_forecasting': 'budget_forecasting',
  'budget_tax_calculator': 'budget_tax_calculator',
  
  // Compliance sub-features  
  'compliance_permits': 'compliance_permits',
  'compliance_inspections': 'compliance_inspections',
  'compliance_obc': 'compliance_obc',
  'compliance_safety': 'compliance_safety',
  
  // Project detail tabs
  'project_overview_tab': 'project_overview_tab',
  'project_tasks_tab': 'project_tasks_tab',
  'project_finance_tab': 'project_finance_tab',
  'project_calendar_tab': 'project_calendar_tab',
  'project_risk_tab': 'project_risk_tab',
  'project_compliance_tab': 'project_compliance_tab',
  'project_documents_tab': 'project_documents_tab',
  'project_activity_tab': 'project_activity_tab',
  'project_team_tab': 'project_team_tab',
  
  // Chat sub-features
  'chat_direct_messages': 'chat_direct_messages',
  'chat_group_rooms': 'chat_group_rooms',
  'chat_file_sharing': 'chat_file_sharing',
  
  // Reports sub-features (tabs)
  'reports_export': 'reports_export',
  'reports_dashboard': 'reports_dashboard',
  'reports_overview': 'reports_overview',
  'reports_performance': 'reports_performance',
  'reports_financial': 'reports_financial',
  'reports_risk': 'reports_risk',
  'reports_trends': 'reports_trends',
  
  // Alerts sub-features (tabs)
  'alerts_overview': 'alerts_overview',
  'alerts_by_project': 'alerts_by_project',
  'alerts_all': 'alerts_all',
  'alerts_weather': 'alerts_weather',
  
  // CCTV AI System features
  'cctv': 'cctv_ai_system',
  'cctv_ai_system': 'cctv_ai_system',
  'cctv_live_view': 'cctv_live_view',
  'cctv_ai_detection': 'cctv_ai_detection',
  'cctv_analytics': 'cctv_analytics',
  'cctv_progress_tracking': 'cctv_progress_tracking',
  'cctv_quality_control': 'cctv_quality_control',
  'cctv_risk_detection': 'cctv_risk_detection',
  'live': 'cctv_live_view',
  'ai_alerts': 'cctv_ai_detection',
  'analytics': 'cctv_analytics',
  'progress': 'cctv_progress_tracking',
  'quality': 'cctv_quality_control',
  'risk': 'cctv_risk_detection',
  
  // Full keys (no change needed)
  'kanban_board': 'kanban_board',
  'gantt_chart': 'gantt_chart',
  'weather_widget': 'weather_widget',
  'task_management': 'task_management',
  'team_collaboration': 'team_collaboration',
  'chat_rooms': 'chat_rooms',
  'file_management': 'file_management',
  'project_management': 'project_management',
  'budget_tracking': 'budget_tracking',
  'compliance_tracking': 'compliance_tracking',
  'permit_tracking': 'permit_tracking',
  'inspection_tracking': 'inspection_tracking',
  'project_templates': 'project_templates',
  'reports_analytics': 'reports_analytics',
  'calendar_view': 'calendar_view',
  'ai_risk_management': 'ai_risk_management',
  'quickbooks_integration': 'quickbooks_integration',
  'sage50_integration': 'sage50_integration',
  
  // Configuration features
  'google_signin': 'google_signin',
  'magic_link': 'magic_link',
  'email_password': 'email_password',
  'pwa': 'pwa',
  'dark_mode': 'dark_mode',
  'notifications': 'notifications',
  'receipt_scanner': 'receipt_scanner',
  'ai_risk_analysis': 'ai_risk_analysis',
  'project_chat': 'project_chat',
  'file_manager': 'file_manager',
  'map_view': 'map_view',
  'document_manager': 'document_manager',
};

export const useProjectFeatures = () => {
  const queryClient = useQueryClient();

  const { data: features, isLoading } = useQuery({
    queryKey: ['global-feature-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_feature_settings')
        .select('*');

      if (error) throw error;
      return data as GlobalFeatureSetting[];
    },
    staleTime: 0, // Always refetch for immediate updates
  });

  // Real-time subscription for immediate updates
  useEffect(() => {
    const channel = supabase
      .channel('global-feature-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_feature_settings' },
        () => {
          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ queryKey: ['global-feature-settings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Check by feature_key using aliases for short names
  // Also checks parent feature - if parent is disabled, child is also considered disabled
  const isFeatureEnabled = (featureIdentifier: string): boolean => {
    if (!features) return true; // Default to enabled if not loaded yet
    
    // Get the actual feature_key using alias mapping
    const featureKey = FEATURE_KEY_ALIASES[featureIdentifier] || featureIdentifier;
    
    // Find by feature_key
    const feature = features.find(f => f.feature_key === featureKey);
    
    if (!feature) return true; // Default to enabled if feature not found
    
    // If feature is disabled, return false
    if (!feature.enabled) return false;
    
    // If feature has a parent, check if parent is enabled
    if (feature.parent_feature_key) {
      const parentFeature = features.find(f => f.feature_key === feature.parent_feature_key);
      if (parentFeature && !parentFeature.enabled) {
        return false; // Parent is disabled, so child is also disabled
      }
    }
    
    return true;
  };

  const isFeatureUpcoming = (featureIdentifier: string): boolean => {
    if (!features) return false;
    
    // Get the actual feature_key using alias mapping
    const featureKey = FEATURE_KEY_ALIASES[featureIdentifier] || featureIdentifier;
    
    // Find by feature_key
    const feature = features.find(f => f.feature_key === featureKey);
    
    if (!feature) return false;
    
    // Check if this feature or its parent is marked as upcoming
    if (!feature.enabled && feature.show_as_upcoming) return true;
    
    // If feature has a parent that's upcoming, this is also upcoming
    if (feature.parent_feature_key) {
      const parentFeature = features.find(f => f.feature_key === feature.parent_feature_key);
      if (parentFeature && !parentFeature.enabled && parentFeature.show_as_upcoming) {
        return true;
      }
    }
    
    return false;
  };

  // Check if a feature should appear in sidebar (for Sidebar component)
  const isMenuEnabled = (menuKey: string): boolean => {
    if (!features) return true;
    
    // Map menu keys to feature keys
    const menuToFeatureMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'projects': 'project_management',
      'new-project': 'new_project',
      'team': 'team_management',
      'budget': 'budget_tracking',
      'calendar': 'calendar_view',
      'reports': 'reports_analytics',
      'templates': 'templates',
      'compliance': 'compliance_tracking',
      'alerts': 'ai_risk_management',
      'chat': 'chat_rooms',
      'cctv': 'cctv_ai_system',
      'admin': 'admin',
      'integrations': 'integrations',
      'security': 'security_dashboard',
    };
    
    const featureKey = menuToFeatureMap[menuKey] || menuKey;
    const feature = features.find(f => f.feature_key === featureKey);
    
    if (!feature) return true; // Default to enabled if not found
    return feature.enabled && feature.show_in_sidebar !== false;
  };

  const isMenuUpcoming = (menuKey: string): boolean => {
    if (!features) return false;
    
    const menuToFeatureMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'projects': 'project_management',
      'new-project': 'new_project',
      'team': 'team_management',
      'budget': 'budget_tracking',
      'calendar': 'calendar_view',
      'reports': 'reports_analytics',
      'templates': 'templates',
      'compliance': 'compliance_tracking',
      'alerts': 'ai_risk_management',
      'chat': 'chat_rooms',
      'cctv': 'cctv_ai_system',
      'admin': 'admin',
      'integrations': 'integrations',
      'security': 'security_dashboard',
    };
    
    const featureKey = menuToFeatureMap[menuKey] || menuKey;
    const feature = features.find(f => f.feature_key === featureKey);
    
    if (!feature) return false;
    return !feature.enabled && feature.show_as_upcoming === true;
  };

  // Get sidebar items sorted by order
  const getSidebarItems = () => {
    if (!features) return [];
    return features
      .filter(f => f.show_in_sidebar && f.sidebar_path)
      .sort((a, b) => (a.sidebar_order || 99) - (b.sidebar_order || 99));
  };

  return {
    features,
    isLoading,
    isFeatureEnabled,
    isFeatureUpcoming,
    // Sidebar integration
    isMenuEnabled,
    isMenuUpcoming,
    getSidebarItems,
  };
};