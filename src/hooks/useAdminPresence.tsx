import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

interface OnlineUser {
  user_id: string;
  email: string;
  online_at: string;
  city?: string;
  country?: string;
}

export const useAdminPresence = () => {
  const { user } = useAuth();
  const { isSystemAdmin } = useUserRole();
  const [allOnlineUsers, setAllOnlineUsers] = useState<OnlineUser[]>([]);
  const [systemAdminIds, setSystemAdminIds] = useState<string[]>([]);
  const [locationInfo, setLocationInfo] = useState<{ city?: string; country?: string }>({});

  // Fetch system admin IDs
  useEffect(() => {
    const fetchSystemAdmins = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'system_admin');
      
      if (data) {
        setSystemAdminIds(data.map(r => r.user_id));
      }
    };
    
    fetchSystemAdmins();
  }, []);

  // Fetch user's location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          setLocationInfo({
            city: data.city,
            country: data.country_name
          });
        }
      } catch (error) {
        console.log('Could not fetch location:', error);
      }
    };
    
    fetchLocation();
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('admin-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        
        const users: OnlineUser[] = [];
        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.user_id && presence.email) {
              users.push({
                user_id: presence.user_id,
                email: presence.email,
                online_at: presence.online_at,
                city: presence.city,
                country: presence.country,
              });
            }
          }
        });

        setAllOnlineUsers(users);
        console.log('Admin presence sync:', users.length, 'users online');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User came online:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User went offline:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceTrackStatus = await channel.track({
            user_id: user.id,
            email: user.email || '',
            online_at: new Date().toISOString(),
            city: locationInfo.city,
            country: locationInfo.country,
          });
          console.log('Admin presence tracking status:', presenceTrackStatus);
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, locationInfo]);

  // Filter out system admins if current user is not a system admin
  const onlineUsers = useMemo(() => {
    if (isSystemAdmin) {
      return allOnlineUsers;
    }
    // Hide system admins from non-system admins
    return allOnlineUsers.filter(u => !systemAdminIds.includes(u.user_id));
  }, [allOnlineUsers, systemAdminIds, isSystemAdmin]);

  const onlineCount = useMemo(() => onlineUsers.length, [onlineUsers]);

  const isOnline = useCallback((userId: string) => {
    return onlineUsers.some(u => u.user_id === userId);
  }, [onlineUsers]);

  const getUserPresence = useCallback((userId: string) => {
    return onlineUsers.find(u => u.user_id === userId);
  }, [onlineUsers]);

  // Get cities with user counts
  const getOnlineCities = useCallback(() => {
    const cityMap = new Map<string, number>();
    onlineUsers.forEach(u => {
      if (u.city) {
        cityMap.set(u.city, (cityMap.get(u.city) || 0) + 1);
      }
    });
    return Array.from(cityMap.entries()).map(([city, count]) => ({ city, count }));
  }, [onlineUsers]);

  return {
    onlineUsers,
    onlineCount,
    isOnline,
    getUserPresence,
    getOnlineCities,
  };
};
