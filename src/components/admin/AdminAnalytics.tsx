import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, FolderOpen } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const AdminAnalytics = () => {
  // Fetch user growth data
  const { data: userGrowth } = useQuery({
    queryKey: ['admin-user-growth'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const grouped: Record<string, number> = {};
      data.forEach((profile) => {
        const date = new Date(profile.created_at).toLocaleDateString();
        grouped[date] = (grouped[date] || 0) + 1;
      });

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        users: count
      }));
    }
  });

  // Fetch project creation data
  const { data: projectGrowth } = useQuery({
    queryKey: ['admin-project-growth'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('projects')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const grouped: Record<string, number> = {};
      data.forEach((project) => {
        const date = new Date(project.created_at).toLocaleDateString();
        grouped[date] = (grouped[date] || 0) + 1;
      });

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        projects: count
      }));
    }
  });

  return (
    <div className="space-y-6">
      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Growth (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Creation (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="projects" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
