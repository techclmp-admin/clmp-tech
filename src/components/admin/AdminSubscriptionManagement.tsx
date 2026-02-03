import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Crown, Users, Building2, Loader2, Calendar, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';

export function AdminSubscriptionManagement() {
  const { isSystemAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [setTrialDialogOpen, setSetTrialDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [extensionDays, setExtensionDays] = useState<string>('30');
  const [trialDays, setTrialDays] = useState<string>('30');
  const [isExtending, setIsExtending] = useState(false);
  const [isSettingTrial, setIsSettingTrial] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch system admin IDs using RPC (bypasses RLS)
  const { data: systemAdminIds = [] } = useQuery({
    queryKey: ['system-admin-ids-rpc'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_admin_ids');
      if (error) {
        console.error('Error fetching system admin IDs:', error);
        return [];
      }
      return data || [];
    },
    enabled: !isSystemAdmin
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter, planFilter, isSystemAdmin, systemAdminIds],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }

      if (planFilter !== 'all') {
        query = query.eq('subscription_plan', planFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out system admins if not system admin
      if (!isSystemAdmin && systemAdminIds.length > 0) {
        return (data || []).filter(u => !systemAdminIds.includes(u.user_id));
      }
      
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-subscription-stats', isSystemAdmin, systemAdminIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, subscription_plan, subscription_status, trial_end_date');

      if (error) throw error;

      // Filter out system admins if not system admin
      let filteredData = data || [];
      if (!isSystemAdmin && systemAdminIds.length > 0) {
        filteredData = filteredData.filter(u => !systemAdminIds.includes(u.user_id));
      }

      const stats = {
        total: filteredData.length,
        professional: filteredData.filter(u => u.subscription_plan === 'professional').length,
        enterprise: filteredData.filter(u => u.subscription_plan === 'enterprise').length,
        active: filteredData.filter(u => u.subscription_status === 'active').length,
        pending: filteredData.filter(u => u.subscription_status === 'pending').length,
        trialing: filteredData.filter(u => 
          u.trial_end_date && 
          new Date(u.trial_end_date) > new Date() && 
          u.subscription_status === 'active'
        ).length,
      };

      return stats;
    },
  });

  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleUpdateSubscription = async (userId: string, plan: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_plan: plan,
          subscription_status: status
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Subscription updated',
        description: 'User subscription has been successfully updated',
      });

      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    }
  };

  const handleExtendTrial = async () => {
    if (!selectedUser) return;

    const days = parseInt(extensionDays);
    if (isNaN(days) || days <= 0 || days > 365) {
      toast({
        title: 'Invalid input',
        description: 'Days must be between 1 and 365',
        variant: 'destructive',
      });
      return;
    }

    setIsExtending(true);

    try {
      const { error } = await supabase.rpc('extend_trial', {
        p_user_id: selectedUser.id,
        p_days: days,
      });

      if (error) throw error;

      toast({
        title: 'Trial Extended',
        description: `Successfully added ${days} days to user's trial period`,
      });

      setExtendDialogOpen(false);
      setSelectedUser(null);
      setExtensionDays('30');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    } catch (error: any) {
      console.error('Error extending trial:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to extend trial',
        variant: 'destructive',
      });
    } finally {
      setIsExtending(false);
    }
  };

  const openExtendDialog = (user: any) => {
    setSelectedUser(user);
    setExtendDialogOpen(true);
  };

  const openSetTrialDialog = (user: any) => {
    setSelectedUser(user);
    setTrialDays('30');
    setSetTrialDialogOpen(true);
  };

  const handleSetTrial = async () => {
    if (!selectedUser) return;

    const days = parseInt(trialDays);
    if (isNaN(days) || days <= 0 || days > 365) {
      toast({
        title: 'Invalid input',
        description: 'Days must be between 1 and 365',
        variant: 'destructive',
      });
      return;
    }

    setIsSettingTrial(true);

    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + days);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_plan: 'trial',
          subscription_status: 'active',
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEndDate.toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Trial Set',
        description: `User switched to trial with ${days} days`,
      });

      setSetTrialDialogOpen(false);
      setSelectedUser(null);
      setTrialDays('30');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] });
    } catch (error: any) {
      console.error('Error setting trial:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set trial',
        variant: 'destructive',
      });
    } finally {
      setIsSettingTrial(false);
    }
  };

  const handlePlanChange = (user: any, plan: string) => {
    if (plan === 'trial') {
      openSetTrialDialog(user);
    } else {
      handleUpdateSubscription(user.id, plan, user.subscription_status || 'active');
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'professional':
        return 'default';
      case 'enterprise':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'destructive';
      case 'suspended':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const calculateTrialDaysLeft = (trialEndDate: string | null) => {
    if (!trialEndDate) return null;
    const now = new Date();
    const endDate = new Date(trialEndDate);
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return daysLeft;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.trialing || 0} on trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professional</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.professional || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.enterprise || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Manage user subscriptions, plans, and statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial Info</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => {
                    const trialDaysLeft = calculateTrialDaysLeft(user.trial_end_date);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.first_name || user.last_name
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : 'No name'}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPlanBadgeVariant(user.subscription_plan || 'free')}>
                            {(user.subscription_plan || 'free').charAt(0).toUpperCase() + 
                             (user.subscription_plan || 'free').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.subscription_status || 'active')}>
                            {(user.subscription_status || 'active').charAt(0).toUpperCase() + 
                             (user.subscription_status || 'active').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.trial_end_date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {trialDaysLeft === 0 ? (
                                  <span className="text-destructive font-medium">Expires today</span>
                                ) : trialDaysLeft && trialDaysLeft > 0 ? (
                                  <span>{trialDaysLeft} days left</span>
                                ) : (
                                  <span className="text-muted-foreground">Expired</span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No trial</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Extend Trial Button */}
                            {(user.subscription_plan === 'professional' || user.subscription_plan === 'enterprise') && 
                             user.trial_end_date && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openExtendDialog(user)}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Extend Trial
                              </Button>
                            )}
                            
                            <Select
                              value={user.subscription_plan || 'free'}
                              onValueChange={(plan) => handlePlanChange(user, plan)}
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={user.subscription_status || 'active'}
                              onValueChange={(status) => 
                                handleUpdateSubscription(user.id, user.subscription_plan || 'free', status)
                              }
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Extend Trial Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial Period</DialogTitle>
            <DialogDescription>
              Add additional days to {selectedUser?.email}'s trial period
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedUser && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <Badge variant="outline">
                    {selectedUser.subscription_plan?.charAt(0).toUpperCase() + 
                     selectedUser.subscription_plan?.slice(1)}
                  </Badge>
                </div>
                {selectedUser.trial_end_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Trial End:</span>
                    <span className="font-medium">
                      {format(new Date(selectedUser.trial_end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Days Remaining:</span>
                  <span className="font-medium">
                    {calculateTrialDaysLeft(selectedUser.trial_end_date)} days
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="extension-days">Days to Add</Label>
              <Input
                id="extension-days"
                type="number"
                min="1"
                max="365"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                placeholder="Enter number of days (1-365)"
              />
              <p className="text-xs text-muted-foreground">
                Enter the number of days to extend the trial period (max 365 days)
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtensionDays('7')}
                className="flex-1"
              >
                +7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtensionDays('14')}
                className="flex-1"
              >
                +14 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtensionDays('30')}
                className="flex-1"
              >
                +30 days
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExtendDialogOpen(false)}
              disabled={isExtending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendTrial}
              disabled={isExtending}
            >
              {isExtending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                'Extend Trial'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Trial Dialog */}
      <Dialog open={setTrialDialogOpen} onOpenChange={setSetTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Trial Period</DialogTitle>
            <DialogDescription>
              Switch {selectedUser?.email} to trial plan with custom duration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedUser && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <Badge variant="outline">
                    {(selectedUser.subscription_plan || 'free').charAt(0).toUpperCase() + 
                     (selectedUser.subscription_plan || 'free').slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Status:</span>
                  <Badge variant="outline">
                    {(selectedUser.subscription_status || 'active').charAt(0).toUpperCase() + 
                     (selectedUser.subscription_status || 'active').slice(1)}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="trial-days">Trial Duration (Days)</Label>
              <Input
                id="trial-days"
                type="number"
                min="1"
                max="365"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="Enter number of days (1-365)"
              />
              <p className="text-xs text-muted-foreground">
                User will be switched to trial plan starting from today
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrialDays('7')}
                className="flex-1"
              >
                7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrialDays('14')}
                className="flex-1"
              >
                14 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrialDays('30')}
                className="flex-1"
              >
                30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrialDays('60')}
                className="flex-1"
              >
                60 days
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSetTrialDialogOpen(false)}
              disabled={isSettingTrial}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetTrial}
              disabled={isSettingTrial}
            >
              {isSettingTrial ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting...
                </>
              ) : (
                'Set Trial'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
