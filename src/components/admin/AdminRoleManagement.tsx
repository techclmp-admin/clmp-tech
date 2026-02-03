import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export const AdminRoleManagement = () => {
  const { isSystemAdmin } = useUserRole();

  // Fetch system admin IDs for filtering
  const { data: systemAdminIds = [] } = useQuery({
    queryKey: ['system-admin-ids'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'system_admin');
      return (data || []).map(r => r.user_id);
    },
    enabled: !isSystemAdmin
  });

  // Fetch role statistics
  const { data: roleStats, isLoading } = useQuery({
    queryKey: ['admin-role-stats', isSystemAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, user_id');

      if (error) throw error;

      // Filter out system admin roles if not system admin
      let filteredData = data || [];
      if (!isSystemAdmin) {
        filteredData = filteredData.filter(r => 
          r.role !== 'system_admin' && !systemAdminIds.includes(r.user_id)
        );
      }

      const stats: Record<string, number> = {};
      filteredData.forEach((r) => {
        stats[r.role] = (stats[r.role] || 0) + 1;
      });

      return Object.entries(stats).map(([role, count]) => ({
        role,
        count
      }));
    }
  });

  // Fetch recent role assignments
  const { data: recentAssignments } = useQuery({
    queryKey: ['admin-recent-assignments', isSystemAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles!user_roles_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter out system admin assignments if not system admin
      if (!isSystemAdmin) {
        return (data || []).filter(a => 
          a.role !== 'system_admin' && !systemAdminIds.includes(a.user_id)
        ).slice(0, 10);
      }

      return (data || []).slice(0, 10);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'system_admin': return 'destructive';
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'system_admin': return 'System Admin';
      case 'admin': return 'Operation Admin';
      case 'moderator': return 'Moderator';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleStats?.map(({ role, count }) => (
              <Card key={role}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold">{count}</p>
                      <Badge variant={getRoleBadgeVariant(role)} className="mt-1">
                        {getRoleDisplayName(role)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Role Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAssignments?.map((assignment: any) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.profiles?.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getRoleBadgeVariant(assignment.role)}>
                    {getRoleDisplayName(assignment.role)}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};