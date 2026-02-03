import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface SidebarSetting {
  id: string;
  menu_name: string;
  enabled: boolean;
  display_name: string;
  description: string | null;
  menu_order: number;
  show_as_upcoming: boolean;
}

export const useSidebarSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['global-sidebar-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_sidebar_settings')
        .select('*')
        .order('menu_order');

      if (error) throw error;
      return data as SidebarSetting[];
    },
    staleTime: 0, // Always refetch for immediate updates
  });

  // Real-time subscription for immediate updates
  useEffect(() => {
    const channel = supabase
      .channel('global-sidebar-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_sidebar_settings' },
        () => {
          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ queryKey: ['global-sidebar-settings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const isMenuEnabled = (menuName: string): boolean => {
    if (!settings) return true; // Default to enabled if not loaded yet
    const setting = settings.find(s => s.menu_name === menuName);
    return setting?.enabled ?? true; // Default to enabled if setting not found
  };

  const isMenuUpcoming = (menuName: string): boolean => {
    if (!settings) return false;
    const setting = settings.find(s => s.menu_name === menuName);
    return !setting?.enabled && setting?.show_as_upcoming === true;
  };

  return {
    settings,
    isLoading,
    isMenuEnabled,
    isMenuUpcoming,
  };
};