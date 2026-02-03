import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from '@/components/mobile';
import { 
  Users, 
  UserPlus, 
  Search, 
  Settings,
  Mail,
  MoreVertical,
  Shield,
  Edit,
  Copy,
  CheckCircle,
  FolderOpen,
  Calendar,
  UserCheck,
  Clock,
  Loader2,
  AlertCircle,
  Trash2,
  UserCog,
  Eye,
  LogOut
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { usePresence } from '@/hooks/usePresence';
import { formatProjectStatus } from '@/lib/utils';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  member_code: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  projects: {
    id: string;
    name: string;
  }[];
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  project_id: string;
  projects: {
    name: string;
  } | null;
}

interface MemberPreview {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
}

const TeamPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteMemberCode, setInviteMemberCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMode, setInviteMode] = useState<'email' | 'code'>('email');
  const [inviteRole, setInviteRole] = useState('member');
  const [copiedCode, setCopiedCode] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState('');
  const [removeConfirmDialogOpen, setRemoveConfirmDialogOpen] = useState(false);
  const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
  const [memberPreview, setMemberPreview] = useState<MemberPreview | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [leaveTeamDialogOpen, setLeaveTeamDialogOpen] = useState(false);
  const [leaveTeamTarget, setLeaveTeamTarget] = useState<{ id: string; ownerName: string } | null>(null);
  
  // Real-time presence tracking
  const { onlineUsers, onlineCount, isOnline } = usePresence('team-presence');
  const navigate = useNavigate();

  // Fetch current user's member code
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('member_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch all team members from team_members table (company members) - only accepted
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['all-team-members'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Step 1: Get team members where current user is the owner and status is accepted
      const { data: myTeamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('id, user_id, role, created_at, status')
        .eq('team_owner_id', user.id)
        .eq('status', 'accepted');

      if (teamError) throw teamError;
      if (!myTeamMembers || myTeamMembers.length === 0) return [];

      const teamUserIds = myTeamMembers.map(m => m.user_id);

      // Step 2: Get profiles for team members - using user_id
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url, member_code')
        .in('user_id', teamUserIds);

      if (profilesError) throw profilesError;

      // Step 3: Get project memberships to show which projects each team member is in
      const { data: projectMemberships } = await supabase
        .from('project_members')
        .select('user_id, project_id, projects(id, name)')
        .in('user_id', teamUserIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Group projects by user_id
      const userProjectsMap = new Map<string, { id: string; name: string }[]>();
      projectMemberships?.forEach((pm: any) => {
        if (pm.projects) {
          const existing = userProjectsMap.get(pm.user_id) || [];
          if (!existing.find(p => p.id === pm.projects.id)) {
            existing.push({ id: pm.projects.id, name: pm.projects.name });
          }
          userProjectsMap.set(pm.user_id, existing);
        }
      });

      // Map team members with their profiles and projects
      return myTeamMembers.map(member => {
        const profile = profilesMap.get(member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          member_code: profile?.member_code || null,
          created_at: member.created_at,
          profiles: profile || null,
          projects: userProjectsMap.get(member.user_id) || []
        };
      }).filter(m => m.profiles !== null) as TeamMember[];
    },
  });

  // Fetch pending team invitations FOR current user (invitations to join other teams)
  const { data: pendingTeamInvites } = useQuery({
    queryKey: ['pending-team-invites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('id, team_owner_id, role, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get owner profiles - using user_id
      const ownerIds = data.map(d => d.team_owner_id);
      const { data: ownerProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', ownerIds);

      const ownerMap = new Map(ownerProfiles?.map(p => [p.user_id, p]) || []);

      return data.map(invite => ({
        ...invite,
        owner_profile: ownerMap.get(invite.team_owner_id) || null
      }));
    },
  });

  // Fetch sent invitations (pending status) from current user
  const { data: sentInvitations } = useQuery({
    queryKey: ['sent-team-invites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, role, created_at')
        .eq('team_owner_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data.map(inv => ({
        ...inv,
        email: profileMap.get(inv.user_id)?.email || '',
        profile: profileMap.get(inv.user_id)
      }));
    },
  });

  // Fetch pending PROJECT invitations for current user (from team_invitations)
  const { data: projectInvitations } = useQuery({
    queryKey: ['my-project-invitations'],
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
          projects (
            name
          )
        `)
        .eq('email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch teams where current user is a MEMBER (not owner) - "My Memberships"
  const { data: teamsImIn } = useQuery({
    queryKey: ['teams-im-member-of'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get teams where I'm a member (not owner)
      const { data, error } = await supabase
        .from('team_members')
        .select('id, team_owner_id, role, created_at')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get owner profiles - using user_id
      const ownerIds = data.map(d => d.team_owner_id);
      const { data: ownerProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url')
        .in('user_id', ownerIds);

      const ownerMap = new Map(ownerProfiles?.map(p => [p.user_id, p]) || []);

      return data.map(membership => ({
        ...membership,
        owner_profile: ownerMap.get(membership.team_owner_id) || null
      }));
    },
  });

  // Fetch projects where current user is a member
  const { data: myProjects, isLoading: myProjectsLoading } = useQuery({
    queryKey: ['my-project-memberships'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: memberships, error } = await supabase
        .from('project_members')
        .select('id, project_id, role, joined_at')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!memberships || memberships.length === 0) return [];

      const projectIds = memberships.map(m => m.project_id);
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, created_by')
        .in('id', projectIds);

      // Get project owners' profiles
      const ownerIds = [...new Set(projects?.map(p => p.created_by) || [])];
      const { data: ownerProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', ownerIds);

      const ownerMap = new Map(ownerProfiles?.map(p => [p.id, p]) || []);

      return memberships.map(m => {
        const project = projects?.find(p => p.id === m.project_id);
        return {
          ...m,
          project: project || null,
          owner_profile: project ? ownerMap.get(project.created_by) || null : null
        };
      });
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Calculate online count filtered by actual team members
  const teamMemberUserIds = React.useMemo(() => {
    return new Set(teamMembers?.map(m => m.user_id) || []);
  }, [teamMembers]);

  // Filter online users to only count team members
  const filteredOnlineCount = React.useMemo(() => {
    return onlineUsers.filter(u => teamMemberUserIds.has(u.user_id)).length;
  }, [onlineUsers, teamMemberUserIds]);

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['team-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalMembers: 0, activeProjects: 0, differentRoles: 0 };

      // Get team members from team_members table - only accepted
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('team_owner_id', user.id)
        .eq('status', 'accepted');
      
      if (membersError) throw membersError;

      // Get active projects count for current user
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      const projectIds = userProjects?.map(p => p.project_id) || [];
      
      let activeProjectsCount = 0;
      if (projectIds.length > 0) {
        const { count } = await supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .in('id', projectIds)
          .eq('status', 'active');
        activeProjectsCount = count || 0;
      }

      // Calculate unique roles count
      const uniqueRoles = new Set(membersData?.map(m => m.role) || []);

      return {
        totalMembers: membersData?.length || 0,
        activeProjects: activeProjectsCount,
        differentRoles: uniqueRoles.size,
      };
    },
  });

  // Add member by code mutation - adds to team_members with status = 'pending'
  const addMemberByCodeMutation = useMutation({
    mutationFn: async ({ memberCode, role }: { memberCode: string; role: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find user by member code
      const { data: targetUser, error: findError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('member_code', memberCode.toUpperCase())
        .maybeSingle();

      if (findError) throw findError;
      if (!targetUser) throw new Error('Member code not found. Please check and try again.');

      // Check if member already exists in team
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('team_owner_id', user.id)
        .eq('user_id', targetUser.id)
        .maybeSingle();

      if (existingMember) {
        if (existingMember.status === 'pending') {
          throw new Error('Invitation already sent to this member.');
        }
        throw new Error('This member is already in your team.');
      }

      // Add member to team with pending status
      const { error: insertError } = await (supabase as any)
        .from('team_members')
        .insert({
          team_owner_id: user.id,
          user_id: targetUser.id,
          role: role,
          status: 'pending'
        });

      if (insertError) throw insertError;
      
      return targetUser;
    },
    onSuccess: (targetUser) => {
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${targetUser.first_name || targetUser.email}. They need to accept to join your team.`,
      });
      queryClient.invalidateQueries({ queryKey: ['all-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sent-team-invites'] });
      setInviteDialogOpen(false);
      setInviteMemberCode('');
      setInviteRole('member');
      setMemberPreview(null);
      setLookupError(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send email invitation mutation
  const sendEmailInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if user with this email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      let userExists = false;

      if (existingProfile) {
        userExists = true;
        // Check if already in team
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id, status')
          .eq('team_owner_id', user.id)
          .eq('user_id', existingProfile.user_id)
          .maybeSingle();

        if (existingMember?.status === 'accepted') {
          throw new Error('This member is already in your team.');
        }
        if (existingMember?.status === 'pending') {
          throw new Error('Invitation already sent to this member.');
        }

        // Create team_members record for existing user with pending status
        const { error: insertError } = await (supabase as any)
          .from('team_members')
          .insert({
            team_owner_id: user.id,
            user_id: existingProfile.user_id,
            role: role,
            status: 'pending'
          });

        if (insertError) throw insertError;
      }

      // Get inviter profile
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      const inviterName = inviterProfile?.full_name || 
        `${inviterProfile?.first_name || ''} ${inviterProfile?.last_name || ''}`.trim() || 
        'A team admin';

      // Create invitation token
      const invitationToken = crypto.randomUUID();
      
      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: email.toLowerCase(),
          projectId: 'team-invite', // Special marker for team invite
          projectName: 'Your Team',
          inviterName,
          role,
          invitationToken
        }
      });

      if (emailError) {
        console.warn('Email sending failed:', emailError);
        // Don't fail - continue to show success since we want manual follow-up option
      }

      return { email, userExists };
    },
    onSuccess: ({ email, userExists }) => {
      const message = userExists
        ? `Invitation sent to ${email}. They can accept it from their Team page.`
        : `Email invitation sent to ${email}. They can sign up and share their member code with you.`;
      
      toast({
        title: 'Invitation sent!',
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ['sent-team-invites'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Accept team invitation mutation
  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation accepted',
        description: 'You have joined the team',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-team-invites'] });
      queryClient.invalidateQueries({ queryKey: ['all-team-members'] });
    },
  });

  // Reject team invitation mutation
  const rejectInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation rejected',
        description: 'You have rejected the team invitation',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-team-invites'] });
    },
  });

  // Cancel sent invitation mutation - delete from team_members
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled',
      });
      queryClient.invalidateQueries({ queryKey: ['sent-team-invites'] });
    },
  });

  // Update team member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Role updated',
        description: 'Team member role has been updated',
      });
      queryClient.invalidateQueries({ queryKey: ['all-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      setEditMemberDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Member removed',
        description: 'Team member has been removed from your team',
      });
      queryClient.invalidateQueries({ queryKey: ['all-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      setEditMemberDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Leave team mutation (for members to leave a team they belong to)
  const leaveTeamMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Left team',
        description: leaveTeamTarget?.ownerName 
          ? `You have left ${leaveTeamTarget.ownerName}'s team` 
          : 'You have left the team',
      });
      queryClient.invalidateQueries({ queryKey: ['teams-im-member-of'] });
      setLeaveTeamDialogOpen(false);
      setLeaveTeamTarget(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle message team member
  const handleMessageMember = (member: TeamMember) => {
    // Navigate to chat with this member
    navigate(`/chat?userId=${member.user_id}`);
  };

  // Handle edit team member
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditMemberDialogOpen(true);
  };

  // Accept PROJECT invitation mutation (from team_invitations)
  const acceptProjectInviteMutation = useMutation({
    mutationFn: async (invitation: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user is blocked from this project
      const { data: blockedCheck } = await supabase
        .from('blocked_members')
        .select('id, reason')
        .eq('project_id', invitation.project_id)
        .eq('user_id', user.id)
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
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this project');
      }

      // Add to project_members
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: invitation.role,
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      return invitation;
    },
    onSuccess: (invitation) => {
      toast({
        title: 'Invitation accepted',
        description: `You've joined ${invitation.projects?.name || 'the project'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-project-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-project-memberships'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject PROJECT invitation mutation
  const rejectProjectInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation rejected',
        description: 'You have declined the project invitation',
      });
      queryClient.invalidateQueries({ queryKey: ['my-project-invitations'] });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    const membersChannel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-team-members'] });
          queryClient.invalidateQueries({ queryKey: ['team-stats'] });
          queryClient.invalidateQueries({ queryKey: ['teams-im-member-of'] });
          queryClient.invalidateQueries({ queryKey: ['pending-team-invites'] });
          queryClient.invalidateQueries({ queryKey: ['sent-team-invites'] });
        }
      )
      .subscribe();

    const invitationsChannel = supabase
      .channel('team-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_invitations'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
          queryClient.invalidateQueries({ queryKey: ['my-project-invitations'] });
          queryClient.invalidateQueries({ queryKey: ['sent-team-invites'] });
          queryClient.invalidateQueries({ queryKey: ['pending-team-invites'] });
          queryClient.invalidateQueries({ queryKey: ['team-stats'] });
        }
      )
      .subscribe();

    const projectMembersChannel = supabase
      .channel('project-members-changes-team')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-project-memberships'] });
          queryClient.invalidateQueries({ queryKey: ['team-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(invitationsChannel);
      supabase.removeChannel(projectMembersChannel);
    };
  }, [queryClient]);

  // Lookup member when code changes (debounced)
  useEffect(() => {
    const lookupMember = async () => {
      const code = inviteMemberCode.trim().toUpperCase();
      
      if (code.length < 6) {
        setMemberPreview(null);
        setLookupError(null);
        return;
      }

      setIsLookingUp(true);
      setLookupError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, email, avatar_url')
          .eq('member_code', code)
          .maybeSingle();

        if (error) {
          setLookupError('Error looking up member');
          setMemberPreview(null);
        } else if (!data) {
          setLookupError('No member found with this code');
          setMemberPreview(null);
        } else {
          setMemberPreview(data);
          setLookupError(null);
        }
      } catch (err) {
        setLookupError('Error looking up member');
        setMemberPreview(null);
      } finally {
        setIsLookingUp(false);
      }
    };

    const timeoutId = setTimeout(lookupMember, 500);
    return () => clearTimeout(timeoutId);
  }, [inviteMemberCode]);

  const copyMemberCode = () => {
    if (currentUser?.member_code) {
      navigator.clipboard.writeText(currentUser.member_code);
      setCopiedCode(true);
      toast({
        title: 'Copied!',
        description: 'Member code copied to clipboard',
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filteredMembers = teamMembers?.filter(member => {
    const fullName = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.toLowerCase();
    const email = member.profiles?.email?.toLowerCase() || '';
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || email.includes(search) || member.role.toLowerCase().includes(search);
  });

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  const tabOptions = [
    { value: 'members', label: 'Members', icon: <Users className="h-5 w-5" /> },
    { value: 'memberships', label: 'Memberships', icon: <UserCheck className="h-5 w-5" /> },
    { value: 'invitations', label: 'Invitations', icon: <Clock className="h-5 w-5" /> },
  ];

  const [activeTab, setActiveTab] = useState('members');

  return (
    <>
    <MobilePageWrapper
      title="Team Management"
      subtitle="Manage your team members, roles, and permissions"
      actions={
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Team Settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Team Settings</DialogTitle>
              <DialogDescription>
                Configure team preferences and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Role for New Members</Label>
                <Select defaultValue="member">
                  <SelectTrigger>
                    <SelectValue placeholder="Select default role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team Visibility</Label>
                <Select defaultValue="private">
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private - Only members can view</SelectItem>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Settings saved',
                    description: 'Team settings have been updated',
                  });
                  setSettingsDialogOpen(false);
                }}>
                  Save Settings
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Member Code Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 text-foreground">
                # Your Member Code
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Share this code with admins to be added to projects
              </p>
              <div className="mt-2 md:mt-3 flex items-center gap-3">
                <code className="text-xl md:text-2xl font-bold text-orange-600 tracking-wider">
                  {currentUser?.member_code || 'Loading...'}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyMemberCode}
                  className="h-8 w-8 p-0"
                >
                  {copiedCode ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Mobile Native */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MobileCard
          title="Total Members"
          value={(stats?.totalMembers || 0).toString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <MobileCard
          title="Active Projects"
          value={(stats?.activeProjects || 0).toString()}
          icon={<FolderOpen className="h-5 w-5 text-green-600" />}
        />
        <MobileCard
          title="Different Roles"
          value={(stats?.differentRoles || 0).toString()}
          icon={<Shield className="h-5 w-5 text-orange-600" />}
        />
        <MobileCard
          title="Online Now"
          value={filteredOnlineCount.toString()}
          icon={
            <div className="relative">
              <Calendar className="h-5 w-5 text-purple-600" />
              {filteredOnlineCount > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          }
        />
      </div>

      {/* Pending Invitations Alert Banner */}
      {(pendingTeamInvites && pendingTeamInvites.length > 0) && (
        <Card className="border-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setActiveTab('invitations')}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary">
                    You have {pendingTeamInvites.length} pending team invitation{pendingTeamInvites.length > 1 ? 's' : ''}!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click here to view and accept invitations from other teams
                  </p>
                </div>
              </div>
              <Button variant="default" size="sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                View Invitations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Segmented Control */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          variant="card"
        />
      </div>

      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block w-full">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="memberships">
            My Memberships
            {((teamsImIn?.length || 0) + (myProjects?.length || 0)) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {(teamsImIn?.length || 0) + (myProjects?.length || 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations
            {((pendingTeamInvites?.length || 0) + (sentInvitations?.length || 0) + (projectInvitations?.length || 0)) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {(pendingTeamInvites?.length || 0) + (sentInvitations?.length || 0) + (projectInvitations?.length || 0)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
              setInviteDialogOpen(open);
              if (!open) {
                setInviteMemberCode('');
                setInviteEmail('');
                setMemberPreview(null);
                setLookupError(null);
                setInviteRole('member');
                setInviteMode('email');
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation by email or use their member code
                  </DialogDescription>
                </DialogHeader>
                
                {/* Invite Mode Tabs */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={inviteMode === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInviteMode('email')}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    By Email
                  </Button>
                  <Button
                    variant={inviteMode === 'code' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInviteMode('code')}
                    className="flex-1"
                  >
                    # By Code
                  </Button>
                </div>

                <div className="space-y-4">
                  {inviteMode === 'email' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="colleague@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          They will receive an email invitation to join your team
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="memberCode">Member Code</Label>
                        <div className="relative">
                          <Input
                            id="memberCode"
                            type="text"
                            placeholder="e.g., 46FC5F01"
                            value={inviteMemberCode}
                            onChange={(e) => setInviteMemberCode(e.target.value.toUpperCase())}
                            className="font-mono tracking-wider pr-10"
                          />
                          {isLookingUp && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ask the team member to share their code from the Team page
                        </p>
                      </div>

                      {/* Member Preview */}
                      {memberPreview && (
                        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={memberPreview.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(memberPreview.first_name, memberPreview.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {memberPreview.first_name || ''} {memberPreview.last_name || ''}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {memberPreview.email}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {lookupError && inviteMemberCode.trim().length >= 6 && (
                        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          <p className="text-sm text-destructive">{lookupError}</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {inviteMode === 'email' ? (
                    <Button
                      className="w-full"
                      onClick={() => sendEmailInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                      disabled={!inviteEmail.trim() || sendEmailInviteMutation.isPending}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sendEmailInviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => addMemberByCodeMutation.mutate({ memberCode: inviteMemberCode, role: inviteRole })}
                      disabled={!memberPreview || addMemberByCodeMutation.isPending}
                    >
                      {addMemberByCodeMutation.isPending ? 'Adding...' : 'Add Member'}
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Team Members Grid */}
          {membersLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading team members...</p>
            </div>
          ) : filteredMembers && filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(member.profiles?.first_name, member.profiles?.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">
                            {member.profiles?.first_name || ''} {member.profiles?.last_name || ''}
                          </h4>
                          <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedMember(member);
                            setViewProfileDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMember(member)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedMember(member);
                              setRemoveConfirmDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                     <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Role</span>
                          {isOnline(member.user_id) && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online" />
                          )}
                        </div>
                        <Badge variant="secondary">{member.role}</Badge>
                      </div>

                      {member.member_code && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Code</span>
                          <code className="text-xs font-mono">{member.member_code}</code>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Projects</span>
                        <div className="flex flex-wrap gap-1">
                          {(member.projects || []).map((project) => (
                            <Badge key={project.id} variant="outline" className="text-xs">
                              {project.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleMessageMember(member)}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your team by inviting members
                </p>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* My Memberships Tab */}
      {activeTab === 'memberships' && (
        <div className="space-y-6">
          {/* Teams I belong to */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams I Belong To
              </CardTitle>
              <CardDescription>Teams where other users have added you as a member</CardDescription>
            </CardHeader>
            <CardContent>
              {teamsImIn && teamsImIn.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamsImIn.map((team: any) => {
                    const ownerName = team.owner_profile?.first_name || team.owner_profile?.last_name 
                      ? `${team.owner_profile?.first_name || ''} ${team.owner_profile?.last_name || ''}`.trim()
                      : team.owner_profile?.email?.split('@')[0] || 'Unknown';
                    return (
                      <div key={team.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                        <Avatar>
                          <AvatarImage src={team.owner_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(team.owner_profile?.first_name, team.owner_profile?.last_name) || team.owner_profile?.email?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {ownerName}'s Team
                          </p>
                          <p className="text-sm text-muted-foreground">{team.owner_profile?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">{team.role}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Joined {new Date(team.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => {
                            setLeaveTeamTarget({ id: team.id, ownerName });
                            setLeaveTeamDialogOpen(true);
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Leave
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">You haven't joined any other teams yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share your member code to get invited to other teams
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects I'm a member of */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                My Project Memberships
              </CardTitle>
              <CardDescription>All projects where you are a team member</CardDescription>
            </CardHeader>
            <CardContent>
              {myProjects && myProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProjects.map((membership: any) => (
                    <div 
                      key={membership.id} 
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${membership.project?.id}`)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <p className="font-medium truncate">{membership.project?.name || 'Unknown Project'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">{membership.role}</Badge>
                        <Badge 
                          variant={membership.project?.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {membership.project?.status ? formatProjectStatus(membership.project.status) : 'Unknown'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Owner: {membership.owner_profile?.first_name || membership.owner_profile?.last_name 
                          ? `${membership.owner_profile?.first_name || ''} ${membership.owner_profile?.last_name || ''}`.trim()
                          : membership.owner_profile?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(membership.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">You are not a member of any projects yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accept project invitations to join projects
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {/* Project Invitations - invitations to join projects */}
          <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                Project Invitations
                {projectInvitations && projectInvitations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{projectInvitations.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>Invitations to join projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projectInvitations && projectInvitations.length > 0 ? (
                <div className="space-y-4">
                  {projectInvitations.map((invitation: any) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">
                          {invitation.projects?.name || 'Unknown Project'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">{invitation.role}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => acceptProjectInviteMutation.mutate(invitation)}
                          disabled={acceptProjectInviteMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => rejectProjectInviteMutation.mutate(invitation.id)}
                          disabled={rejectProjectInviteMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No project invitations pending</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Received Team Invitations - from others to join their teams */}
          <Card>
            <CardHeader>
              <CardTitle>Team Invitations</CardTitle>
              <CardDescription>Invitations from others to join their team</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTeamInvites && pendingTeamInvites.length > 0 ? (
                <div className="space-y-4">
                  {pendingTeamInvites.map((invite: any) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                      <div>
                        <p className="font-medium">
                          {invite.owner_profile?.first_name || ''} {invite.owner_profile?.last_name || invite.owner_profile?.email || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          invited you as {invite.role} • {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => acceptInviteMutation.mutate(invite.id)}
                          disabled={acceptInviteMutation.isPending}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => rejectInviteMutation.mutate(invite.id)}
                          disabled={rejectInviteMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No pending invitations to accept</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sent Invitations - invitations you sent to others */}
          <Card>
            <CardHeader>
              <CardTitle>Sent Invitations</CardTitle>
              <CardDescription>Invitations you sent waiting for acceptance</CardDescription>
            </CardHeader>
            <CardContent>
              {sentInvitations && sentInvitations.length > 0 ? (
                <div className="space-y-4">
                  {sentInvitations.map((invitation: any) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{invitation.profile?.first_name || ''} {invitation.profile?.last_name || invitation.email || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {invitation.role} • Invited {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                          disabled={cancelInvitationMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No sent invitations pending</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </MobilePageWrapper>

      {/* Edit Member Dialog */}
      <Dialog open={editMemberDialogOpen} onOpenChange={setEditMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update role or remove {selectedMember?.profiles?.first_name || selectedMember?.profiles?.email} from your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Avatar>
                <AvatarImage src={selectedMember?.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(selectedMember?.profiles?.first_name || null, selectedMember?.profiles?.last_name || null)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {selectedMember?.profiles?.first_name || ''} {selectedMember?.profiles?.last_name || ''}
                </p>
                <p className="text-sm text-muted-foreground">{selectedMember?.profiles?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  if (selectedMember) {
                    updateMemberRoleMutation.mutate({ 
                      memberId: selectedMember.id, 
                      newRole: editRole 
                    });
                  }
                }}
                disabled={updateMemberRoleMutation.isPending || editRole === selectedMember?.role}
              >
                {updateMemberRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRemoveConfirmDialogOpen(true)}
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeConfirmDialogOpen} onOpenChange={setRemoveConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.profiles?.first_name || selectedMember?.profiles?.email || 'this member'} from your team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMember) {
                  removeMemberMutation.mutate(selectedMember.id);
                }
                setRemoveConfirmDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Profile Dialog */}
      <Dialog open={viewProfileDialogOpen} onOpenChange={setViewProfileDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Member Profile</DialogTitle>
            <DialogDescription>
              View details about this team member
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedMember.profiles?.first_name, selectedMember.profiles?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedMember.profiles?.first_name || ''} {selectedMember.profiles?.last_name || ''}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.profiles?.email}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant="secondary">{selectedMember.role}</Badge>
                </div>
                
                {selectedMember.member_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Code</span>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{selectedMember.member_code}</code>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm">{new Date(selectedMember.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    {isOnline(selectedMember.user_id) ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm text-green-600">Online</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                        <span className="text-sm text-muted-foreground">Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {selectedMember.projects && selectedMember.projects.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Projects</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedMember.projects.map((project) => (
                        <Badge key={project.id} variant="outline" className="text-xs">
                          {project.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    handleMessageMember(selectedMember);
                    setViewProfileDialogOpen(false);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setViewProfileDialogOpen(false);
                    handleEditMember(selectedMember);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Member
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Team Confirmation Dialog */}
      <AlertDialog open={leaveTeamDialogOpen} onOpenChange={setLeaveTeamDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <strong>{leaveTeamTarget?.ownerName}'s team</strong>? 
              You will need to be re-invited to rejoin this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveTeamMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveTeamTarget && leaveTeamMutation.mutate(leaveTeamTarget.id)}
              disabled={leaveTeamMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {leaveTeamMutation.isPending ? 'Leaving...' : 'Leave Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamPage;
