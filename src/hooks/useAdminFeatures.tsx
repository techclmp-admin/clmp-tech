import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface AdminFeatureSetting {
  id: string;
  feature_key: string;
  feature_name: string;
  is_enabled: boolean;
  show_as_upcoming: boolean;
}

export const useAdminFeatures = () => {
  const { isSystemAdmin, isAdmin } = useUserRole();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["admin-feature-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_feature_settings")
        .select("id, feature_key, feature_name, is_enabled, show_as_upcoming")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as AdminFeatureSetting[];
    },
    enabled: isAdmin,
  });

  // Check if a feature is accessible
  const canAccessFeature = (featureKey: string): boolean => {
    // System Admin has access to everything
    if (isSystemAdmin) return true;
    
    const feature = features.find(f => f.feature_key === featureKey);
    if (!feature) return true; // Default to accessible if not in the list
    
    return feature.is_enabled && !feature.show_as_upcoming;
  };

  // Check if a feature shows as "Coming Soon"
  const isFeatureUpcoming = (featureKey: string): boolean => {
    if (isSystemAdmin) return false; // System Admin never sees "coming soon"
    
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.show_as_upcoming || false;
  };

  // Get feature info
  const getFeatureInfo = (featureKey: string) => {
    return features.find(f => f.feature_key === featureKey);
  };

  return {
    features,
    isLoading,
    canAccessFeature,
    isFeatureUpcoming,
    getFeatureInfo,
  };
};
