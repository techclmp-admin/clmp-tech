import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface RejoinRequestsManagerProps {
  projectId: string;
}

export const RejoinRequestsManager: React.FC<RejoinRequestsManagerProps> = ({
  projectId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['rejoin-requests', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rejoin_requests')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription for new rejoin requests
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('rejoin-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rejoin_requests',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // Fetch user profile for notification
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', payload.new.user_id)
            .single();

          const userName = profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.email || 'Someone';

          toast({
            title: 'New rejoin request',
            description: `${userName} wants to rejoin the project`,
          });

          queryClient.invalidateQueries({ queryKey: ['rejoin-requests', projectId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rejoin_requests',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rejoin-requests', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, toast, queryClient]);

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'approved' | 'rejected' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update request status
      const { error: updateError } = await supabase
        .from('rejoin_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, add user back to project
      if (status === 'approved') {
        const request = requests?.find(r => r.id === requestId);
        if (!request) throw new Error('Request not found');

        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: projectId,
            user_id: request.user_id,
            role: 'member',
          });

        if (memberError) throw memberError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rejoin-requests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      
      toast({
        title: variables.status === 'approved' ? 'Request approved' : 'Request rejected',
        description: variables.status === 'approved' 
          ? 'The user has been added back to the project'
          : 'The rejoin request has been rejected',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process request',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rejoin Requests</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Rejoin Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
        <CardDescription>
          Review requests from users who want to rejoin this project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => {
          const profile = request.profiles as any;
          const userName = profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.email || 'Unknown User';
          const initials = profile?.first_name && profile?.last_name
            ? `${profile.first_name[0]}${profile.last_name[0]}`
            : (profile?.email?.[0] || 'U').toUpperCase();

          return (
            <div
              key={request.id}
              className="flex items-start gap-4 p-4 border rounded-lg"
            >
              <Avatar>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{userName}</p>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profile?.email}
                </p>
                {request.message && (
                  <p className="text-sm mt-2 p-2 bg-muted rounded">
                    "{request.message}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Requested {format(new Date(request.created_at), 'PPp')}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => updateRequestMutation.mutate({
                    requestId: request.id,
                    status: 'approved',
                  })}
                  disabled={updateRequestMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateRequestMutation.mutate({
                    requestId: request.id,
                    status: 'rejected',
                  })}
                  disabled={updateRequestMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
