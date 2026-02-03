import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FolderOpen, 
  Shield, 
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Circle,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminPresence } from '@/hooks/useAdminPresence';

export const AdminDashboard = () => {
  const { isSystemAdmin } = useUserRole();
  const { onlineUsers, onlineCount, getOnlineCities } = useAdminPresence();

  // Fetch overview statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats', isSystemAdmin],
    queryFn: async () => {
      // Get all users with their roles to filter out system admins if needed
      const [usersResult, projects, activeProjects, rolesResult, recentActivityResult] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('profiles').select('id, created_at').order('created_at', { ascending: false }).limit(20)
      ]);

      // Filter out system admins if current user is not system admin
      let filteredUserIds: string[] = [];
      let filteredRolesCount = 0;
      let filteredRecentActivity: any[] = [];

      if (!isSystemAdmin) {
        // Get system admin user IDs
        const systemAdminIds = (rolesResult.data || [])
          .filter(r => r.role === 'system_admin')
          .map(r => r.user_id);

        // Filter users
        filteredUserIds = (usersResult.data || [])
          .filter(u => !systemAdminIds.includes(u.id))
          .map(u => u.id);

        // Filter roles (exclude system_admin roles)
        filteredRolesCount = (rolesResult.data || [])
          .filter(r => r.role !== 'system_admin' && !systemAdminIds.includes(r.user_id))
          .length;

        // Filter recent activity
        filteredRecentActivity = (recentActivityResult.data || [])
          .filter(a => !systemAdminIds.includes(a.id))
          .slice(0, 10);
      } else {
        filteredUserIds = (usersResult.data || []).map(u => u.id);
        filteredRolesCount = rolesResult.count || (rolesResult.data || []).length;
        filteredRecentActivity = (recentActivityResult.data || []).slice(0, 10);
      }

      // Calculate growth (simplified - last 7 days vs previous 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      
      const [recentUsers, previousUsers] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', sevenDaysAgo),
        supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo)
      ]);

      const userGrowth = previousUsers.count && previousUsers.count > 0
        ? ((((recentUsers.count || 0) - previousUsers.count) / previousUsers.count) * 100).toFixed(1)
        : '0';

      return {
        totalUsers: filteredUserIds.length,
        totalProjects: projects.count || 0,
        activeProjects: activeProjects.count || 0,
        totalRoleAssignments: filteredRolesCount,
        newUsersThisWeek: recentUsers.count || 0,
        userGrowth: parseFloat(userGrowth),
        recentActivity: filteredRecentActivity
      };
    }
  });

  // Fetch system health
  const { data: health } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      // Check database responsiveness
      const start = Date.now();
      await supabase.from('profiles').select('id').limit(1);
      const dbLatency = Date.now() - start;

      return {
        database: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'warning' : 'critical',
        dbLatency,
        status: 'operational'
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {health?.status === 'operational' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium">
                {health?.status === 'operational' ? 'All Systems Operational' : 'Minor Issues Detected'}
              </span>
            </div>
            <Badge variant={health?.database === 'healthy' ? 'default' : 'secondary'}>
              Database: {health?.dbLatency}ms
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats?.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
                {stats?.userGrowth !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className={`h-3 w-3 ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-xs ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}% this week
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalProjects}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.activeProjects} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalRoleAssignments}</p>
                <p className="text-sm text-muted-foreground">Role Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.newUsersThisWeek}</p>
                <p className="text-sm text-muted-foreground">New Users This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Users Card */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 fill-green-500 text-green-500" />
              Users Online Now
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">
              {onlineCount} online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Online Users List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              {onlineUsers.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {onlineUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm truncate">{user.email}</span>
                      {user.city && (
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.city}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No users currently online</p>
              )}
            </div>
            
            {/* Cities */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Online by City
              </p>
              {getOnlineCities().length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {getOnlineCities().map(({ city, count }) => (
                    <Badge key={city} variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {city}: {count}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Location data not available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New user registered</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">User</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
