import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Mail, Users, Trash2, Send, Copy, Check, Hash, Crown, AlertTriangle, Edit, ShieldBan } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProjectActivityLog } from "@/components/ProjectActivityLog";
import { useAuth } from "@/hooks/useAuth";

interface InviteTeamMemberProps {
  projectId: string;
  projectName: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  invitation_token: string;
}

interface TeamMember {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  invited_by: string | null;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    member_code: string | null;
    avatar_url?: string | null;
  } | null;
}

const InviteTeamMember: React.FC<InviteTeamMemberProps> = ({ projectId, projectName }) => {
  const { user: authUser } = useAuth();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [isRoleChangeDialogOpen, setIsRoleChangeDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState('');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [directEmailInput, setDirectEmailInput] = useState('');
  const [inviteMode, setInviteMode] = useState<'email' | 'team'>('email');
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<{
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    member_code: string | null;
  } | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; userId: string; name: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const featureEnabled = isFeatureEnabled('team_collaboration');
  const featureUpcoming = isFeatureUpcoming('team_collaboration');

  // Get current user's member code
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('member_code')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch pending and declined/rejected invitations (show both for owner visibility)
  // Only show the most recent invitation per email, exclude users who are already members
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations', projectId],
    queryFn: async () => {
      // First get current project members' emails
      const { data: members } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId);

      const memberUserIds = members?.map(m => m.user_id) || [];
      
      // Get member emails from profiles
      const { data: memberProfiles } = await supabase
        .from('profiles')
        .select('email')
        .in('user_id', memberUserIds);
      
      const memberEmails = new Set(memberProfiles?.map(p => p.email?.toLowerCase()).filter(Boolean) || []);

      // Fetch invitations
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'declined', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Deduplicate by email - keep only the most recent invitation per email
      // AND exclude users who are already members
      const emailMap = new Map<string, typeof data[0]>();
      for (const inv of data || []) {
        const emailLower = inv.email.toLowerCase();
        // Skip if user is already a member
        if (memberEmails.has(emailLower)) continue;
        // Keep only first (most recent) invitation per email
        if (!emailMap.has(emailLower)) {
          emailMap.set(emailLower, inv);
        }
      }
      
      return Array.from(emailMap.values()) as TeamInvitation[];
    },
  });

  // Setup realtime subscription for invitations with enhanced notifications
  useEffect(() => {
    const channel = supabase
      .channel(`team-invitations-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_invitations',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
        
        // Show toast for status changes
        if (payload.eventType === 'UPDATE') {
          const newStatus = payload.new?.status;
          const email = payload.new?.email;
          
          if (newStatus === 'accepted') {
            toast({
              title: '🎉 Invitation accepted!',
              description: `${email} has joined the project`,
            });
          } else if (newStatus === 'declined' || newStatus === 'rejected') {
            toast({
              title: 'Invitation declined',
              description: `${email} has declined the invitation`,
              variant: 'destructive',
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, toast]);

  // Fetch current team members - using same query key and data structure as ProjectDetails
  const { data: teamMembers } = useQuery({
    // Include user id to avoid cross-user cache bleed (switching accounts can show stale member list)
    queryKey: ['project-members', projectId, authUser?.id],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('project_members')
        .select('id, role, joined_at, user_id, invited_by, permissions')
        .eq('project_id', projectId);

      if (error) throw error;

      if (members && members.length > 0) {
        const userIds = members.map(member => member.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, member_code, avatar_url')
          .in('id', userIds);

        // Return with 'profiles' key to match ProjectDetails structure
        return members.map(member => ({
          ...member,
          profiles: profilesData?.find(p => p.id === member.user_id) || null
        }));
      }

      return [];
    },
    enabled: !!projectId && !!authUser?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch available users to invite (only Team members not in this project)
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Step 1: Get team members from team_members table (company members) - only accepted
      const { data: myTeamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_owner_id', user.id)
        .eq('status', 'accepted');

      if (!myTeamMembers || myTeamMembers.length === 0) return [];
      const teamUserIds = myTeamMembers.map(m => m.user_id);

      // Step 2: Get current project members (to exclude)
      const { data: currentMembers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId);

      const currentMemberIds = currentMembers?.map(m => m.user_id) || [];

      // Step 3: Get blocked members (to exclude)
      const { data: blockedMembers } = await supabase
        .from('blocked_members')
        .select('user_id')
        .eq('project_id', projectId);

      const blockedIds = blockedMembers?.map(m => m.user_id) || [];

      // Step 4: Get profiles only for team members
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, member_code')
        .in('id', teamUserIds)
        .order('email');

      if (error) throw error;

      // Filter out current project members and blocked members
      return profiles?.filter(p => 
        !currentMemberIds.includes(p.id) && !blockedIds.includes(p.id)
      ) || [];
    },
    enabled: isOpen,
  });

  // Setup realtime subscription for team members
  useEffect(() => {
    const channel = supabase
      .channel('project-members-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_members',
        filter: `project_id=eq.${projectId}`
      }, () => {
        // Keep in sync with the actual query key used by this component
        queryClient.invalidateQueries({ queryKey: ['project-members', projectId, authUser?.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, authUser?.id]);

  // Check if current user is admin and get project creator
  const { data: currentUserData } = useQuery({
    queryKey: ['current-user-role', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: memberData } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      const { data: projectData } = await supabase
        .from('projects')
        .select('created_by')
        .eq('id', projectId)
        .single();

      return {
        role: memberData?.role,
        isOwner: projectData?.created_by === user.id,
        userId: user.id,
        projectCreatorId: projectData?.created_by
      };
    },
  });

  const currentUserRole = currentUserData?.role;
  const isCurrentUserOwner = currentUserData?.isOwner || false;
  const projectCreatorId = currentUserData?.projectCreatorId;

  const otherAdmins = teamMembers?.filter(
    member => member.role === 'admin' && member.user_id !== currentUserData?.userId
  ) || [];

  const filteredTeamMembers = teamMembers?.filter(member => {
    if (roleFilter !== 'all' && member.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const fullName = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.toLowerCase();
      return fullName.includes(query) || 
             member.profiles?.email?.toLowerCase().includes(query) ||
             member.profiles?.member_code?.toLowerCase().includes(query);
    }
    return true;
  }) || [];

  const filteredAvailableUsers = availableUsers?.filter(user => {
    if (!inviteSearchQuery.trim()) return true;
    const query = inviteSearchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    return fullName.includes(query) || 
           user.email?.toLowerCase().includes(query) ||
           user.member_code?.toLowerCase().includes(query);
  }) || [];

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return ((firstName?.charAt(0) || '') + (lastName?.charAt(0) || '')).toUpperCase() || '?';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'accepted': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const copyMemberCode = () => {
    if (currentUserProfile?.member_code) {
      navigator.clipboard.writeText(currentUserProfile.member_code);
      setCopiedCode(true);
      toast({ title: "Copied!", description: "Member code copied to clipboard" });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const sendInvitation = async () => {
    // Determine email based on invite mode
    let inviteEmail: string | null = null;
    let inviteUserId: string | null = null;

    if (inviteMode === 'email') {
      // Direct email input
      if (!directEmailInput.trim()) {
        toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
        return;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(directEmailInput.trim())) {
        toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
        return;
      }
      inviteEmail = directEmailInput.trim();
    } else {
      // Team member selection
      if (!selectedUserToInvite) {
        toast({ title: "Error", description: "Please select a member to invite", variant: "destructive" });
        return;
      }
      inviteEmail = selectedUserToInvite.email;
      inviteUserId = selectedUserToInvite.id;
    }

    if (!inviteEmail) {
      toast({ title: "Error", description: "No valid email address", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get project name for notification
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', inviteUserId || 'no-match')
        .maybeSingle();

      if (existingMember) {
        toast({ title: "Already a member", description: "This user is already a member of this project", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('team_invitations')
        .select('id, status')
        .eq('project_id', projectId)
        .ilike('email', inviteEmail)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        toast({ title: "Invitation pending", description: "An invitation has already been sent to this email", variant: "destructive" });
        setLoading(false);
        return;
      }

      const invitationToken = crypto.randomUUID();
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          project_id: projectId,
          invited_by: user.id,
          email: inviteEmail,
          role,
          invitation_token: invitationToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      // Create notification for the invitee if they have a user account
      if (inviteUserId) {
        await supabase.from('notifications').insert({
          user_id: inviteUserId,
          title: 'New project invitation',
          message: `You've been invited to join "${projectData?.name || projectName}" as ${role}`,
          type: 'info',
          entity_type: 'project_invitation',
          entity_id: projectId,
          action_url: '/dashboard',
        });
      }

      // Send email invitation using edge function
      try {
        const { data: inviterProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        await supabase.functions.invoke('send-invitation', {
          body: {
            email: inviteEmail,
            projectId: projectId,
            projectName: projectData?.name || projectName,
            inviterName: inviterProfile?.full_name || 'A team member',
            role: role,
            invitationToken: invitationToken
          }
        });
      } catch (emailError) {
        console.warn('Failed to send email invitation:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast({ title: "Invitation sent!", description: `Invitation email sent to ${inviteEmail}` });
      setSelectedUserToInvite(null);
      setInviteSearchQuery('');
      setDirectEmailInput('');
      setRole('member');
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      queryClient.invalidateQueries({ queryKey: ['available-users', projectId] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send invitation", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
      toast({ title: "Invitation cancelled" });
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resendInvitation = async (invitation: TeamInvitation) => {
    try {
      // Update the invitation with a new expiration date and reset status to pending
      const { error } = await supabase
        .from('team_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending' // Reset status to pending when resending/reinviting
        })
        .eq('id', invitation.id);

      if (error) throw error;

      // Trigger the send-invitation edge function
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();

        await supabase.functions.invoke('send-invitation', {
          body: {
            email: invitation.email,
            projectId: projectId,
            projectName: project?.name || 'Project',
            role: invitation.role,
            inviterName: profile?.full_name || 'A team member',
            invitationToken: invitation.invitation_token
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      toast({ 
        title: invitation.status === 'declined' ? "Invitation sent again" : "Invitation resent", 
        description: `Invitation sent to ${invitation.email}` 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to resend invitation", variant: "destructive" });
    }
  };

  const openRoleChangeDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setRoleChangeReason('');
    setIsRoleChangeDialogOpen(true);
  };

  const changeRole = async () => {
    if (!selectedMember || !newRole || newRole === selectedMember.role) return;

    setRoleChangeLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', selectedMember.id);

      if (error) throw error;

      await supabase.from('role_changes').insert({
        project_id: projectId,
        user_id: selectedMember.user_id,
        changed_by: user.id,
        old_role: selectedMember.role,
        new_role: newRole,
        reason: roleChangeReason || null
      });

      const memberName = `${selectedMember.profiles?.first_name || ''} ${selectedMember.profiles?.last_name || ''}`.trim() || 'Member';
      toast({ title: "Role updated!", description: `${memberName}'s role changed to ${newRole}` });

      setIsRoleChangeDialogOpen(false);
      setSelectedMember(null);
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId, authUser?.id] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const openRemoveDialog = (memberId: string, userId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, userId, name: memberName });
    setIsRemoveDialogOpen(true);
  };

  const removeMember = async () => {
    if (!memberToRemove) return;

    try {
      // Use secure RPC function for removing member
      const { error } = await supabase.rpc('remove_project_member', {
        p_project_id: projectId,
        p_user_id: memberToRemove.userId
      });

      if (error) throw error;

      toast({ title: "Member removed", description: `${memberToRemove.name} has been removed from the project` });
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId, authUser?.id] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openBlockDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setBlockReason('');
    setIsBlockDialogOpen(true);
  };

  const blockMember = async () => {
    if (!selectedMember) return;

    setBlockLoading(true);
    try {
      // Use secure RPC function for blocking member
      const { error } = await supabase.rpc('block_project_member', {
        p_project_id: projectId,
        p_user_id: selectedMember.user_id,
        p_reason: blockReason.trim() || null
      });

      if (error) throw error;

      const memberName = `${selectedMember.profiles?.first_name || ''} ${selectedMember.profiles?.last_name || ''}`.trim() || 'Member';
      toast({ title: "Member blocked", description: `${memberName} has been blocked from this project` });

      setIsBlockDialogOpen(false);
      setSelectedMember(null);
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId, authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['blocked-members', projectId] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBlockLoading(false);
    }
  };

  const transferOwnership = async () => {
    if (!selectedNewOwner) return;

    setTransferLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.from('projects').update({ created_by: selectedNewOwner }).eq('id', projectId);
      await supabase.from('project_members').update({ invited_by: selectedNewOwner }).eq('project_id', projectId).eq('user_id', user.id);

      toast({ title: "Ownership transferred!" });
      setIsTransferDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['current-user-role', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId, authUser?.id] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setTransferLoading(false);
    }
  };

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Collaboration
            <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Member Code Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Your Member Code
          </CardTitle>
          <CardDescription>Share this code with admins to be added to projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-background rounded-lg border-2 border-dashed">
            <code className="flex-1 text-2xl font-bold tracking-wider text-primary">
              {currentUserProfile?.member_code || 'Loading...'}
            </code>
            <Button variant="outline" size="icon" onClick={copyMemberCode} disabled={!currentUserProfile?.member_code}>
              {copiedCode ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>{filteredTeamMembers.length} of {teamMembers?.length || 0} members</CardDescription>
            </div>
            {isCurrentUserOwner && otherAdmins.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIsTransferDialogOpen(true)}>
                <Crown className="h-4 w-4 mr-2" />
                Transfer Ownership
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              placeholder="Search by name, email, or member code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredTeamMembers.length > 0 ? (
              filteredTeamMembers.map((member) => {
                const isMemberOwner = member.user_id === projectCreatorId;
                const memberName = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.trim() || member.profiles?.email || 'Member';
                return (
                  <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(member.profiles?.first_name, member.profiles?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{memberName}</p>
                        {isMemberOwner && <Badge variant="default" className="text-xs">Owner</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{member.profiles?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {member.role}
                      </Badge>
                      {(currentUserRole === 'admin' || isCurrentUserOwner) && !isMemberOwner && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openRoleChangeDialog(member)} title="Change role">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openBlockDialog(member)} title="Block member" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                            <ShieldBan className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openRemoveDialog(member.id, member.user_id, memberName)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No team members yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>Invitations that haven't been accepted yet</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setSelectedUserToInvite(null);
                setInviteSearchQuery('');
                setRole('member');
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Send an invitation by email or select from your team</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Invite Mode Toggle */}
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <Button 
                      variant={inviteMode === 'email' ? 'default' : 'ghost'} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setInviteMode('email')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      By Email
                    </Button>
                    <Button 
                      variant={inviteMode === 'team' ? 'default' : 'ghost'} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setInviteMode('team')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      From Team
                    </Button>
                  </div>

                  {/* Email Mode */}
                  {inviteMode === 'email' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          placeholder="colleague@company.com"
                          value={directEmailInput}
                          onChange={(e) => setDirectEmailInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendInvitation()}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          They will receive an email invitation to join this project
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Team Mode */}
                  {inviteMode === 'team' && (
                    <>
                      <div>
                        <Label>Search Members</Label>
                        <Input
                          placeholder="Search by name or email..."
                          value={inviteSearchQuery}
                          onChange={(e) => setInviteSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {filteredAvailableUsers.length > 0 ? (
                          filteredAvailableUsers.map(user => (
                            <div
                              key={user.id}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedUserToInvite?.id === user.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setSelectedUserToInvite(user)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {getInitials(user.first_name, user.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              </div>
                              {selectedUserToInvite?.id === user.id && (
                                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-3 text-sm text-muted-foreground">
                            <p>No team members available</p>
                            <p className="text-xs mt-1">Use "By Email" to invite new people</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={sendInvitation} 
                      disabled={loading || (inviteMode === 'email' ? !directEmailInput.trim() : !selectedUserToInvite)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="text-center py-4">Loading invitations...</div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{invitation.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(invitation.status) as any}>{invitation.status}</Badge>
                      <Badge variant="outline">{invitation.role}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {(invitation.status === 'declined' || invitation.status === 'rejected') && (
                      <Badge variant="destructive" className="mr-2">Declined</Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => resendInvitation(invitation)}>
                      <Send className="h-3 w-3 mr-1" />
                      {(invitation.status === 'declined' || invitation.status === 'rejected') ? 'Reinvite' : 'Resend'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => cancelInvitation(invitation.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">No pending invitations</div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <ProjectActivityLog projectId={projectId} />

      {/* Transfer Ownership Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Transfer Project Ownership
            </DialogTitle>
            <DialogDescription>Transfer ownership to another admin. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Important Warning</p>
                <p className="text-yellow-800 dark:text-yellow-300">
                  Once you transfer ownership, you will no longer be the project owner.
                </p>
              </div>
            </div>
            <div>
              <Label>Select New Owner</Label>
              <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an admin" />
                </SelectTrigger>
                <SelectContent>
                  {otherAdmins.map((admin) => (
                    <SelectItem key={admin.user_id} value={admin.user_id}>
                      {admin.profiles?.first_name} {admin.profiles?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)} disabled={transferLoading}>Cancel</Button>
              <Button variant="destructive" onClick={transferOwnership} disabled={!selectedNewOwner || transferLoading}>
                {transferLoading ? "Transferring..." : "Transfer Ownership"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isRoleChangeDialogOpen} onOpenChange={setIsRoleChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Change Member Role
            </DialogTitle>
            <DialogDescription>
              Update role for {selectedMember?.profiles?.first_name} {selectedMember?.profiles?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(selectedMember.profiles?.first_name, selectedMember.profiles?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMember.profiles?.first_name} {selectedMember.profiles?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.profiles?.email}</p>
                    <Badge variant="outline" className="mt-1">Current: {selectedMember.role}</Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  placeholder="Why are you changing this member's role?"
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRoleChangeDialogOpen(false)} disabled={roleChangeLoading}>Cancel</Button>
                <Button onClick={changeRole} disabled={roleChangeLoading || !newRole || newRole === selectedMember.role}>
                  {roleChangeLoading ? 'Updating...' : 'Update Role'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block Member Dialog */}
      <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-orange-600" />
              Block Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member and prevent them from joining again until unblocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                      {getInitials(selectedMember.profiles?.first_name, selectedMember.profiles?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMember.profiles?.first_name} {selectedMember.profiles?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.profiles?.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Why are you blocking this member?"
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={blockMember} disabled={blockLoading} className="bg-orange-600 hover:bg-orange-700">
              {blockLoading ? 'Blocking...' : 'Block Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Remove Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from this project? 
              They will lose access but can be re-invited later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeMember} className="bg-destructive hover:bg-destructive/90">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InviteTeamMember;
