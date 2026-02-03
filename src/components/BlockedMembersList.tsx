import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";

interface BlockedMembersListProps {
  projectId: string;
}

interface BlockedMember {
  id: string;
  user_id: string;
  reason: string | null;
  blocked_at: string;
  blocked_by: string;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  blocker?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export const BlockedMembersList: React.FC<BlockedMembersListProps> = ({ projectId }) => {
  const [selectedMember, setSelectedMember] = useState<BlockedMember | null>(null);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch blocked members
  const { data: blockedMembers = [], isLoading } = useQuery({
    queryKey: ['blocked-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_members')
        .select('*')
        .eq('project_id', projectId)
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (blockedMember) => {
          const [profileResult, blockerResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('id', blockedMember.user_id)
              .single(),
            supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('id', blockedMember.blocked_by)
              .single()
          ]);

          return {
            ...blockedMember,
            profile: profileResult.data,
            blocker: blockerResult.data
          };
        })
      );

      return membersWithProfiles as BlockedMember[];
    },
  });

  // Unblock member mutation using secure RPC function
  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('unblock_project_member', {
        p_project_id: projectId,
        p_user_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-members', projectId] });
      toast({
        title: '✅ Member unblocked',
        description: 'This member can now be invited to the project again.',
      });
      setIsUnblockDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock member',
        variant: 'destructive',
      });
    },
  });

  const handleUnblock = (member: BlockedMember) => {
    setSelectedMember(member);
    setIsUnblockDialogOpen(true);
  };

  const getMemberName = (member: BlockedMember) => {
    if (member.profile) {
      const fullName = `${member.profile.first_name || ''} ${member.profile.last_name || ''}`.trim();
      return fullName || member.profile.email || 'Unknown User';
    }
    return 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5" />
            Blocked Members
          </CardTitle>
          <CardDescription>Loading blocked members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (blockedMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5" />
            Blocked Members
          </CardTitle>
          <CardDescription>No blocked members in this project</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5" />
            Blocked Members
          </CardTitle>
          <CardDescription>
            {blockedMembers.length} {blockedMembers.length === 1 ? 'member' : 'members'} blocked from joining
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blockedMembers.map((member) => {
              const memberName = getMemberName(member);
              const blockerName = member.blocker
                ? `${member.blocker.first_name || ''} ${member.blocker.last_name || ''}`.trim() || member.blocker.email
                : 'Unknown';

              return (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar>
                      <AvatarFallback className="bg-destructive/10 text-destructive">
                        {getInitials(memberName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{memberName}</p>
                        <Badge variant="destructive" className="text-xs">
                          <ShieldBan className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.profile?.email}
                      </p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <p>Blocked by {blockerName} on {format(new Date(member.blocked_at), 'MMM dd, yyyy')}</p>
                        {member.reason && (
                          <p className="mt-1 italic">Reason: {member.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(member)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Unblock
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={isUnblockDialogOpen} onOpenChange={setIsUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock <strong>{selectedMember ? getMemberName(selectedMember) : ''}</strong>?
              They will be able to be invited and join this project again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unblockMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMember && unblockMutation.mutate(selectedMember.user_id)}
              disabled={unblockMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {unblockMutation.isPending ? 'Unblocking...' : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
