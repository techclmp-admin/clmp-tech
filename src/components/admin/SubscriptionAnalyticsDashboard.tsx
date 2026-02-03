import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, UserCheck, UserX, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

const COLORS = {
  professional: '#0ea5e9',
  enterprise: '#f59e0b',
  trial: '#8b5cf6',
  churn: '#ef4444',
};

export function SubscriptionAnalyticsDashboard() {
  const { isSystemAdmin } = useUserRole();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

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

  // Fetch subscription analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['subscription-analytics', dateRange, isSystemAdmin],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Filter out system admins if not system admin
      let filteredProfiles = profiles || [];
      if (!isSystemAdmin && systemAdminIds.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => !systemAdminIds.includes(p.id));
      }

      const { data: history, error: historyError } = await supabase
        .from('subscription_history')
        .select('*')
        .gte('changed_at', dateRange.from.toISOString())
        .lte('changed_at', dateRange.to.toISOString())
        .order('changed_at', { ascending: true });

      if (historyError) throw historyError;

      // Calculate MRR (Monthly Recurring Revenue)
      const activeProfessional = filteredProfiles.filter(
        p => p.subscription_plan === 'professional' && 
        p.subscription_status === 'active' &&
        (!p.trial_end_date || new Date(p.trial_end_date) < new Date())
      ).length || 0;

      const activeEnterprise = filteredProfiles.filter(
        p => p.subscription_plan === 'enterprise' && 
        p.subscription_status === 'active' &&
        (!p.trial_end_date || new Date(p.trial_end_date) < new Date())
      ).length || 0;

      const mrr = (activeProfessional * 49) + (activeEnterprise * 199);

      // Calculate trial conversion rate
      const trialStarted = filteredProfiles.filter(p => p.trial_start_date).length || 0;
      const converted = filteredProfiles.filter(
        p => p.subscription_status === 'active' && 
        p.trial_end_date &&
        new Date(p.trial_end_date) < new Date()
      ).length || 0;
      const conversionRate = trialStarted > 0 ? (converted / trialStarted) * 100 : 0;

      // Calculate churn rate
      const cancelled = filteredProfiles.filter(p => p.subscription_status === 'cancelled').length || 0;
      const totalPaid = activeProfessional + activeEnterprise + cancelled;
      const churnRate = totalPaid > 0 ? (cancelled / totalPaid) * 100 : 0;

      // Revenue by plan
      const revenueByPlan = [
        { name: 'Professional', value: activeProfessional * 49, count: activeProfessional },
        { name: 'Enterprise', value: activeEnterprise * 199, count: activeEnterprise },
      ];

      // Growth over time (monthly)
      const growthData = [];
      for (let i = 5; i >= 0; i--) {
        const date = subDays(new Date(), i * 30);
        const monthProfiles = filteredProfiles.filter(
          p => new Date(p.created_at) <= date
        ).length || 0;
        growthData.push({
          month: format(date, 'MMM yyyy'),
          users: monthProfiles,
        });
      }

      // Trial funnel data
      const trialing = filteredProfiles.filter(
        p => p.trial_end_date && 
        new Date(p.trial_end_date) > new Date() &&
        p.subscription_status === 'active'
      ).length || 0;

      const expired = filteredProfiles.filter(
        p => p.subscription_status === 'pending'
      ).length || 0;

      const funnelData = [
        { name: 'Trial Started', value: trialStarted },
        { name: 'Currently Trialing', value: trialing },
        { name: 'Converted', value: converted },
        { name: 'Expired/Pending', value: expired },
      ];

      return {
        mrr,
        conversionRate,
        churnRate,
        revenueByPlan,
        growthData,
        funnelData,
        totalUsers: filteredProfiles.length,
        activeSubscriptions: activeProfessional + activeEnterprise,
        trialingUsers: trialing,
      };
    },
  });

  const stats = [
    {
      title: 'MRR',
      value: `$${analytics?.mrr.toLocaleString() || 0} CAD`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Trial Conversion',
      value: `${analytics?.conversionRate.toFixed(1) || 0}%`,
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      title: 'Churn Rate',
      value: `${analytics?.churnRate.toFixed(1) || 0}%`,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '-2.1%',
      trendUp: false,
    },
    {
      title: 'Active Subscriptions',
      value: analytics?.activeSubscriptions || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+8 this month',
      trendUp: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Subscription Analytics</h2>
          <p className="text-muted-foreground">
            Track revenue, conversions, and growth metrics
          </p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[300px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from && dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange({
                  from: startOfMonth(new Date()),
                  to: endOfMonth(new Date()),
                })}
              >
                This Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange({
                  from: subDays(new Date(), 30),
                  to: new Date(),
                })}
              >
                Last 30 Days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange({
                  from: subDays(new Date(), 90),
                  to: new Date(),
                })}
              >
                Last 90 Days
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <div className={cn(
                    "flex items-center text-xs",
                    stat.trendUp ? "text-green-600" : "text-red-600"
                  )}>
                    {stat.trendUp ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Monthly recurring revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.revenueByPlan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, count }) => `${name}: $${value} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics?.revenueByPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.professional : COLORS.enterprise} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${value} CAD`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trial Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Conversion Funnel</CardTitle>
            <CardDescription>User journey from trial to paid</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.trial} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>Total users accumulated over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke={COLORS.professional} 
                  strokeWidth={2}
                  name="Total Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold">{analytics?.totalUsers}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-3xl font-bold text-green-600">{analytics?.activeSubscriptions}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Users on Trial</p>
              <p className="text-3xl font-bold text-blue-600">{analytics?.trialingUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
