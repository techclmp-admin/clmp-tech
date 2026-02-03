import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface NotificationPreference {
  id: string;
  notification_type: string;
  is_enabled: boolean;
  channels: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  frequency: string;
}

const DEFAULT_PREFERENCES: Record<string, boolean> = {
  emailAlerts: true,
  pushNotifications: true,
  projectUpdates: true,
  securityAlerts: true
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Record<string, boolean>>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Start with defaults and merge with database values
      const mergedPrefs = { ...DEFAULT_PREFERENCES };
      
      if (data && data.length > 0) {
        data.forEach((pref) => {
          // Convert snake_case to camelCase
          const key = pref.notification_type.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          if (key in mergedPrefs) {
            mergedPrefs[key] = pref.is_enabled ?? true;
          }
        });
      }
      
      setPreferences(mergedPrefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: boolean) => {
    if (!user?.id) return;

    const notificationType = key.replace(/([A-Z])/g, '_$1').toLowerCase();

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          notification_type: notificationType,
          is_enabled: value,
          channel: 'email'
        }, {
          onConflict: 'user_id,notification_type'
        });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, [key]: value }));

      toast({
        title: "Preference Updated",
        description: "Your notification preference has been saved."
      });
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update preference",
        variant: "destructive"
      });
    }
  };

  return {
    preferences,
    loading,
    updatePreference
  };
};
