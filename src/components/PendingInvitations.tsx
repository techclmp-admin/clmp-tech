import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Check, X, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  project_id: string;
  invited_by: string;
  projects: {
    name: string;
  } | null;
}

interface TeamInvitation {
  id: string;
  team_owner_id: string;
  role: string;
  status: string;
  created_at: string;
  owner_profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export const PendingInvitations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Realtime subscription for invitations (both new invitations and status changes)
  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel('my-invitations-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_invitations',
        filter: `email=eq.${user.email}`
      }, (payload) => {
        // Invalidate to refetch latest data
        queryClient.invalidateQueries({ queryKey: ['my-pending-project-invitations'] });
        
        // Show toast for new invitations
        if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
          toast({
            title: '🎉 New invitation!',
            description: 'You have a new project invitation',
          });
          // Also invalidate notifications
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, queryClient, toast]);

  // Fetch current user's pending project invitations
  const { data: projectInvitations, isLoading: projectLoading } = useQuery({
    queryKey: ['my-pending-project-invitations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id,
          email,
          role,
          status,
          created_at,
          expires_at,
          project_id,
          invited_by,
          projects (
            name
          )
        `)
        .eq('email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectInvitation[];
    },
  });

  // Fetch current user's pending team invitations
  const { data: teamInvitations, isLoading: teamLoading } = useQuery({
    queryKey: ['my-pending-team-invitations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch team invitations where user is invited (user_id = current user) and status is pending
      const { data, error } = await supabase
        .from('team_members')
        .select('id, team_owner_id, role, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) return [];

      // Fetch owner profiles - use user_id to query profiles
      const ownerIds = [...new Set(data.map(inv => inv.team_owner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .in('user_id', ownerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(inv => ({
        ...inv,
        owner_profile: profileMap.get(inv.team_owner_id)
      })) as TeamInvitation[];
    },
  });

  // Helper to create notification for project owner
  const createNotificationForOwner = async (
    ownerId: string, 
    projectId: string, 
    projectName: string, 
    inviteeName: string, 
    action: 'accepted' | 'declined'
  ) => {
    try {
      await supabase.from('notifications').insert({
        user_id: ownerId,
        title: action === 'accepted' 
          ? `${inviteeName} joined your project` 
          : `${inviteeName} declined your invitation`,
        message: action === 'accepted'
          ? `${inviteeName} has accepted the invitation to join "${projectName}"`
          : `${inviteeName} has declined the invitation to join "${projectName}"`,
        type: action === 'accepted' ? 'success' : 'warning',
        entity_type: 'project_invitation',
        entity_id: projectId,
        action_url: `/projects/${projectId}?tab=Team`,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  // Accept project invitation mutation
  const acceptProjectMutation = useMutation({
    mutationFn: async (invitation: ProjectInvitation) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Check if user is blocked
      const { data: blockedCheck } = await supabase
        .from('blocked_members')
        .select('id, reason')
        .eq('project_id', invitation.project_id)
        .eq('user_id', currentUser.id)
        .single();

      if (blockedCheck) {
        throw new Error(
          blockedCheck.reason 
            ? `You cannot join this project. Reason: ${blockedCheck.reason}` 
            : 'You have been blocked from joining this project'
        );
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', invitation.project_id)
        .eq('user_id', currentUser.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this project');
      }

      // Add to project_members
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: currentUser.id,
          role: invitation.role,
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Get current user's name for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', currentUser.id)
        .single();

      const inviteeName = profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile?.email?.split('@')[0] || 'A user';

      // Create notification for project owner
      await createNotificationForOwner(
        invitation.invited_by,
        invitation.project_id,
        invitation.projects?.name || 'the project',
        inviteeName,
        'accepted'
      );
    },
    onSuccess: (_, invitation) => {
      toast({
        title: 'Invitation accepted',
        description: `You've joined ${invitation.projects?.name || 'the project'}`,
      });
      // Invalidate all relevant queries for both invitee and inviter
      queryClient.invalidateQueries({ queryKey: ['my-pending-project-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['sent-team-invites'] });
      queryClient.invalidateQueries({ queryKey: ['pending-team-invites'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['project-members', invitation.project_id] });
      queryClient.invalidateQueries({ queryKey: ['invitations', invitation.project_id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject project invitation mutation
  const rejectProjectMutation = useMutation({
    mutationFn: async (invitation: ProjectInvitation) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      if (error) throw error;

      // Get current user's name for notification and activity log
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', currentUser.id)
          .single();

        const inviteeName = profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile?.email?.split('@')[0] || 'A user';

        // Create notification for project owner
        await createNotificationForOwner(
          invitation.invited_by,
          invitation.project_id,
          invitation.projects?.name || 'the project',
          inviteeName,
          'declined'
        );

        // Add to activity log
        await supabase.from('project_activity_log').insert({
          project_id: invitation.project_id,
          user_id: currentUser.id,
          action: 'invitation_declined',
          entity_type: 'team_invitation',
          entity_id: invitation.id,
          description: `${inviteeName} declined the invitation`,
          metadata: {
            email: invitation.email,
            role: invitation.role,
          }
        });
      }
    },
    onSuccess: (_, invitation) => {
      toast({
        title: 'Invitation declined',
        description: 'You have declined the invitation',
      });
      queryClient.invalidateQueries({ queryKey: ['my-pending-project-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', invitation.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-activity-log', invitation.project_id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Accept team invitation mutation
  const acceptTeamMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Team invitation accepted',
        description: 'You have joined the team',
      });
      queryClient.invalidateQueries({ queryKey: ['my-pending-team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['all-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-team-invites'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject team invitation mutation
  const rejectTeamMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Team invitation rejected',
        description: 'You have declined the team invitation',
      });
      queryClient.invalidateQueries({ queryKey: ['my-pending-team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-team-invites'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isLoading = projectLoading || teamLoading;
  const hasProjectInvitations = projectInvitations && projectInvitations.length > 0;
  const hasTeamInvitations = teamInvitations && teamInvitations.length > 0;
  const totalInvitations = (projectInvitations?.length || 0) + (teamInvitations?.length || 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading invitations...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasProjectInvitations && !hasTeamInvitations) {
    return null;
  }

  const getOwnerDisplayName = (inv: TeamInvitation) => {
    if (inv.owner_profile?.first_name || inv.owner_profile?.last_name) {
      return `${inv.owner_profile.first_name || ''} ${inv.owner_profile.last_name || ''}`.trim();
    }
    return inv.owner_profile?.email?.split('@')[0] || 'Unknown';
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Pending Invitations
          <Badge variant="secondary" className="ml-auto">
            {totalInvitations}
          </Badge>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          You have invitations waiting for your response
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Invitations */}
        {hasProjectInvitations && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Project Invitations
            </h4>
            {projectInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-background rounded-lg border"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {invitation.projects?.name || 'Unknown Project'}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="capitalize">
                      {invitation.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {format(new Date(invitation.expires_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => acceptProjectMutation.mutate(invitation)}
                    disabled={acceptProjectMutation.isPending || rejectProjectMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectProjectMutation.mutate(invitation)}
                    disabled={acceptProjectMutation.isPending || rejectProjectMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Invitations */}
        {hasTeamInvitations && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Invitations
            </h4>
            {teamInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-background rounded-lg border"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {getOwnerDisplayName(invitation)}'s Team
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="capitalize">
                      {invitation.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Invited {format(new Date(invitation.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => acceptTeamMutation.mutate(invitation.id)}
                    disabled={acceptTeamMutation.isPending || rejectTeamMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectTeamMutation.mutate(invitation.id)}
                    disabled={acceptTeamMutation.isPending || rejectTeamMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
