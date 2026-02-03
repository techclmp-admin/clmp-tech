import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, UserCog, Trash2, Shield, Mail, Calendar, Ban, CheckCircle, AlertTriangle, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/utils/deleteUser';
import { Textarea } from '@/components/ui/textarea';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminPresence } from '@/hooks/useAdminPresence';

export const AdminUserManagement = () => {
  const { isSystemAdmin } = useUserRole();
  const { onlineUsers, onlineCount, isOnline, getUserPresence } = useAdminPresence();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [banReason, setBanReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get roles for each user
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );

      return usersWithRoles;
    }
  });

  // Fetch orphan auth users (users in auth but not in profiles)
  const { data: orphanAuthUsers, isLoading: orphansLoading } = useQuery({
    queryKey: ['orphan-auth-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_orphan_auth_users');
      if (error) throw error;
      return data || [];
    }
  });

  // Ban user mutation
  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.rpc('ban_user', {
        p_user_id: userId,
        p_reason: reason
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'User banned',
        description: 'User has been successfully banned',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to ban user',
        variant: 'destructive',
      });
    }
  });

  // Unban user mutation
  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('unban_user', {
        p_user_id: userId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'User unbanned',
        description: 'User can now sign in again. They may need to refresh their browser.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unban user',
        variant: 'destructive',
      });
    }
  });

  // Delete orphan profile mutation (profile without auth user)
  const deleteOrphanMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase.rpc('admin_delete_orphan_profile', {
        p_profile_id: profileId
      });
      if (error) throw error;
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: 'Orphan profile deleted',
          description: 'Profile has been deleted. User can now sign up with this email.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete orphan profile',
        variant: 'destructive',
      });
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUser(userId);
      if (!result.success) throw result.error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'User deleted',
        description: 'User has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['orphan-auth-users'] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  });

  // Delete orphan auth user mutation
  const deleteOrphanAuthMutation = useMutation({
    mutationFn: async (authUserId: string) => {
      const result = await deleteUser(authUserId);
      if (!result.success) throw result.error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Orphan auth user deleted',
        description: 'Auth user has been deleted. The email can now be used to sign up again.',
      });
      queryClient.invalidateQueries({ queryKey: ['orphan-auth-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete orphan auth user',
        variant: 'destructive',
      });
    }
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Remove existing roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: role as 'admin' | 'moderator' | 'user'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Role updated',
        description: 'User role has been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    }
  });

  const filteredUsers = users?.filter(user => {
    const search = searchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const matchesSearch = fullName.includes(search) || email.includes(search);
    
    // Operation Admins cannot see System Admins
    if (!isSystemAdmin) {
      const hasSystemAdminRole = user.user_roles?.some((ur: any) => ur.role === 'system_admin');
      if (hasSystemAdminRole) return false;
    }
    
    return matchesSearch;
  });

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

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Orphan Auth Users Warning */}
      {orphanAuthUsers && orphanAuthUsers.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Orphan Auth Users Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These users exist in authentication but not in profiles. This causes "Account already exists" errors when trying to sign up.
              Delete them to allow re-registration with these emails.
            </p>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Auth ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orphanAuthUsers.map((orphan: any) => (
                    <TableRow key={orphan.auth_user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {orphan.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {orphan.auth_user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(orphan.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteOrphanAuthMutation.mutate(orphan.auth_user_id)}
                          disabled={deleteOrphanAuthMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Auth User
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User Management</span>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                {onlineCount} online
              </Badge>
              <Badge variant="secondary">{filteredUsers?.length || 0} users</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator */}
                          {isOnline(user.id) && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            {isOnline(user.id) && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5 text-green-600 border-green-300">
                                Online
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                            {getUserPresence(user.id)?.city && (
                              <span className="ml-2">• {getUserPresence(user.id)?.city}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.user_roles?.length > 0 ? (
                          user.user_roles.map((ur: any, idx: number) => (
                            <Badge key={idx} variant={getRoleBadgeVariant(ur.role)}>
                              {getRoleDisplayName(ur.role)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No role</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <Ban className="h-3 w-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Ban/Unban Button */}
                        {user.is_banned ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unbanMutation.mutate(user.id)}
                            disabled={unbanMutation.isPending}
                            title="Unban user"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Dialog open={banDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setBanDialogOpen(open);
                            if (!open) {
                              setSelectedUser(null);
                              setBanReason('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                title="Ban user"
                              >
                                <Ban className="h-4 w-4 text-orange-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ban User</DialogTitle>
                                <DialogDescription>
                                  Ban {user.first_name} {user.last_name} from accessing the system. They can be unbanned later.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Reason (optional)</Label>
                                  <Textarea
                                    placeholder="Enter reason for banning this user..."
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setBanDialogOpen(false);
                                  setSelectedUser(null);
                                  setBanReason('');
                                }}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => banMutation.mutate({ 
                                    userId: user.id, 
                                    reason: banReason 
                                  })}
                                  disabled={banMutation.isPending}
                                >
                                  {banMutation.isPending ? 'Banning...' : 'Ban User'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Role Management Button */}
                        <Dialog open={roleDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setRoleDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setSelectedRole(user.user_roles?.[0]?.role || '');
                              }}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage User Role</DialogTitle>
                              <DialogDescription>
                                Assign or change the role for {user.first_name} {user.last_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                    <SelectItem value="admin">Operation Admin</SelectItem>
                                    {/* Only System Admin can assign System Admin role */}
                                    {isSystemAdmin && (
                                      <SelectItem value="system_admin">System Admin</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => assignRoleMutation.mutate({ 
                                  userId: user.id, 
                                  role: selectedRole 
                                })}
                                disabled={!selectedRole || assignRoleMutation.isPending}
                              >
                                {assignRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={deleteDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setDeleteDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                              <DialogDescription>
                                Choose how to delete {user.first_name} {user.last_name}:
                                {user.email && <div className="mt-2 text-sm font-medium">Email: {user.email}</div>}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Clean Orphan Profile (Recommended for login issues)</p>
                                <p className="text-xs text-muted-foreground">
                                  Use this if the user cannot login. This removes the profile from database so the user can sign up again.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Delete Completely</p>
                                <p className="text-xs text-muted-foreground">
                                  Permanently deletes the user from both auth and profiles. This action cannot be undone.
                                </p>
                              </div>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                              <Button variant="outline" onClick={() => {
                                setDeleteDialogOpen(false);
                                setSelectedUser(null);
                              }}>
                                Cancel
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  deleteOrphanMutation.mutate(user.email);
                                  setDeleteDialogOpen(false);
                                }}
                                disabled={deleteOrphanMutation.isPending}
                              >
                                {deleteOrphanMutation.isPending ? 'Cleaning...' : 'Clean Orphan Profile'}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(user.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete Completely'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
