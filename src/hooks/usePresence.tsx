import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PresenceState {
  user_id: string;
  email: string;
  online_at: string;
}

export const usePresence = (channelName: string = 'team-presence') => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Create presence channel
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Listen to presence sync events
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        
        // Convert presence state to array of users
        const users: PresenceState[] = [];
        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.user_id && presence.email) {
              users.push({
                user_id: presence.user_id,
                email: presence.email,
                online_at: presence.online_at,
              });
            }
          }
        });

        setOnlineUsers(users);
        setOnlineCount(users.length);
        console.log('Presence sync:', users.length, 'users online');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          const presenceTrackStatus = await channel.track({
            user_id: user.id,
            email: user.email || '',
            online_at: new Date().toISOString(),
          });
          console.log('Presence tracking status:', presenceTrackStatus);
        }
      });

    // Cleanup on unmount
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, channelName]);

  return {
    onlineUsers,
    onlineCount,
    isOnline: (userId: string) => onlineUsers.some(u => u.user_id === userId),
  };
};
