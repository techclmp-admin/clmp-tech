import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FolderOpen, 
  User, 
  Clock,
  AlertTriangle,
  LogIn
} from 'lucide-react';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  project_id: string;
  expires_at: string;
  invited_by: string;
  project_name: string;
  inviter_name: string;
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link. No token provided.');
        setLoading(false);
        return;
      }

      try {
        // Fetch invitation by token
        const { data: inviteData, error: inviteError } = await supabase
          .from('team_invitations')
          .select(`
            id,
            email,
            role,
            status,
            project_id,
            expires_at,
            invited_by,
            projects (name)
          `)
          .eq('invitation_token', token)
          .single();

        if (inviteError || !inviteData) {
          setError('Invitation not found or has been deleted.');
          setLoading(false);
          return;
        }

        // Check if invitation is expired
        if (new Date(inviteData.expires_at) < new Date()) {
          setError('This invitation has expired. Please ask the project owner to send a new invitation.');
          setLoading(false);
          return;
        }

        // Check if already processed
        if (inviteData.status !== 'pending') {
          if (inviteData.status === 'accepted') {
            setError('This invitation has already been accepted.');
          } else if (inviteData.status === 'rejected' || inviteData.status === 'declined') {
            setError('This invitation has been declined.');
          } else {
            setError(`This invitation is no longer valid (status: ${inviteData.status}).`);
          }
          setLoading(false);
          return;
        }

        // Get inviter's profile
        let inviterName = 'A team member';
        if (inviteData.invited_by) {
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('full_name, first_name, last_name')
            .eq('user_id', inviteData.invited_by)
            .single();

          if (inviterProfile) {
            inviterName = inviterProfile.full_name || 
              `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || 
              'A team member';
          }
        }

        setInvitation({
          ...inviteData,
          project_name: (inviteData.projects as any)?.name || 'Unknown Project',
          inviter_name: inviterName,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Failed to load invitation details. Please try again.');
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Handle accept invitation
  const handleAccept = async () => {
    if (!invitation || !user) return;

    // Verify email matches
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(`This invitation was sent to ${invitation.email}. You are logged in as ${user.email}. Please log in with the correct account.`);
      return;
    }

    setProcessing(true);

    try {
      // Check if user is blocked from this project
      const { data: blockedCheck } = await supabase
        .from('blocked_members')
        .select('id, reason')
        .eq('project_id', invitation.project_id)
        .eq('user_id', user.id)
        .single();

      if (blockedCheck) {
        setError(
          blockedCheck.reason 
            ? `You cannot join this project. Reason: ${blockedCheck.reason}` 
            : 'You have been blocked from joining this project.'
        );
        setProcessing(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', invitation.project_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        // Already a member - just update invitation status and redirect
        await supabase
          .from('team_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);

        toast({
          title: 'Already a member',
          description: `You are already a member of ${invitation.project_name}`,
        });

        navigate(`/projects/${invitation.project_id}`);
        return;
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

      setSuccess(true);
      toast({
        title: 'Invitation accepted!',
        description: `You've joined ${invitation.project_name}`,
      });

      // Redirect to project after a brief delay
      setTimeout(() => {
        navigate(`/projects/${invitation.project_id}`);
      }, 2000);

    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle decline invitation
  const handleDecline = async () => {
    if (!invitation) return;

    setProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast({
        title: 'Invitation declined',
        description: 'You have declined the project invitation.',
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error declining invitation:', err);
      setError(err.message || 'Failed to decline invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Redirect to auth if not logged in
  const handleLogin = () => {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    navigate('/auth');
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="default">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Welcome to the team!</CardTitle>
            <CardDescription>
              You've successfully joined {invitation?.project_name}. Redirecting you to the project...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              You need to sign in to accept this project invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitation && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <span className="font-medium">{invitation.project_name}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Invited by: {invitation.inviter_name}</p>
                  <p>Role: <Badge variant="secondary">{invitation.role}</Badge></p>
                  <p>Invitation for: {invitation.email}</p>
                </div>
              </div>
            )}
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Accept
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account? You can create one after clicking Sign In.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation details
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Details */}
          <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-primary shrink-0" />
              <span className="font-semibold text-lg">{invitation?.project_name}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Invited by</span>
              </div>
              <span>{invitation?.inviter_name}</span>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="h-5">{invitation?.role}</Badge>
              </div>
              <span className="text-muted-foreground">Your role</span>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expires</span>
              </div>
              <span>{invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Email mismatch warning */}
          {user.email?.toLowerCase() !== invitation?.email.toLowerCase() && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">Email mismatch</p>
                <p className="text-amber-700 dark:text-amber-400">
                  This invitation was sent to <strong>{invitation?.email}</strong>. 
                  You are logged in as <strong>{user.email}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDecline}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
            </Button>
            <Button 
              className="flex-1"
              onClick={handleAccept}
              disabled={processing || user.email?.toLowerCase() !== invitation?.email.toLowerCase()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
