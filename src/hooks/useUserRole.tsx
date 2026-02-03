import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'system_admin' | 'admin' | 'moderator' | 'user';

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data.map((r: any) => r.role as UserRole);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // System Admin has highest privileges
  const isSystemAdmin = roles.includes('system_admin');
  // Operation Admin (regular admin)
  const isOperationAdmin = roles.includes('admin');
  // Any type of admin access
  const isAdmin = isSystemAdmin || isOperationAdmin;
  const isModerator = roles.includes('moderator');
  const isUser = roles.includes('user');

  const hasRole = (role: UserRole) => roles.includes(role);
  const hasAnyRole = (requiredRoles: UserRole[]) => 
    requiredRoles.some(role => roles.includes(role));

  return {
    roles,
    isSystemAdmin,
    isOperationAdmin,
    isAdmin,
    isModerator,
    isUser,
    hasRole,
    hasAnyRole,
    isLoading
  };
};
