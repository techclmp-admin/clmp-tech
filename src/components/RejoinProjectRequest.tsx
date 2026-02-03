import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface RejoinProjectRequestProps {
  projectId: string;
  projectName: string;
  userId: string;
}

export const RejoinProjectRequest: React.FC<RejoinProjectRequestProps> = ({
  projectId,
  projectName,
  userId,
}) => {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if there's an existing request
  const { data: existingRequest, isLoading } = useQuery({
    queryKey: ['rejoin-request', projectId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rejoin_requests')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Real-time subscription for request status changes
  useEffect(() => {
    if (!projectId || !userId) return;

    const channel = supabase
      .channel('rejoin-request-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rejoin_requests',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // Check if this update is for current user
          if (payload.new.user_id === userId) {
            if (payload.new.status === 'approved') {
              toast({
                title: 'Request approved!',
                description: 'Your rejoin request has been approved. Redirecting...',
              });
              
              // Wait a moment then refresh membership and redirect
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['project-membership', projectId, userId] });
                window.location.reload();
              }, 1500);
            } else if (payload.new.status === 'rejected') {
              queryClient.invalidateQueries({ queryKey: ['rejoin-request', projectId, userId] });
              toast({
                title: 'Request rejected',
                description: 'Your rejoin request has been rejected',
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, userId, toast, queryClient, navigate]);

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('rejoin_requests')
        .insert({
          project_id: projectId,
          user_id: userId,
          message: message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rejoin-request', projectId, userId] });
      toast({
        title: 'Request sent',
        description: 'Your rejoin request has been sent to the project administrators',
      });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send rejoin request',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/projects">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Rejoin Project
          </CardTitle>
          <CardDescription>
            Request to rejoin <strong>{projectName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingRequest ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                You have a pending rejoin request for this project. The project administrators will review your request.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertDescription>
                  You are not currently a member of this project. You can request to rejoin, and a project administrator will review your request.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Message to administrators (optional)
                </label>
                <Textarea
                  placeholder="Why would you like to rejoin this project?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/500 characters
                </p>
              </div>

              <Button
                onClick={() => createRequestMutation.mutate()}
                disabled={createRequestMutation.isPending}
                className="w-full"
              >
                {createRequestMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Request...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Rejoin Request
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
