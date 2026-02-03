import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "./types";
import { Loader2, Search, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface InviteMembersDialogProps {
  room: ChatRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteMembersDialog = ({ room, open, onOpenChange }: InviteMembersDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Fetch current members
  const { data: currentMemberIds = [] } = useQuery({
    queryKey: ['room-members-ids', room.id],
    queryFn: async () => {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_room_id', room.id);

      return participants?.map(p => p.user_id) || [];
    },
    enabled: open,
  });

  // Fetch all team members
  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ['all-team-members'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, avatar_url, member_code')
        .order('first_name');

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      console.log('Fetched profiles:', profiles);
      return profiles || [];
    },
    enabled: open,
  });

  // Filter out current members and apply search
  const availableMembers = allMembers
    .filter(member => !currentMemberIds.includes(member.user_id || member.id))
    .filter((member) =>
      searchQuery
        ? `${member.first_name} ${member.last_name} ${member.email} ${member.member_code || ''}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true
    );

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Add invited users as participants
      const participants = selectedUserIds.map((userId) => ({
        chat_room_id: room.id,
        user_id: userId,
        role: 'member'
      }));

      const { error } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (error) throw error;

      // Send a system message about the invitation
      if (room.created_by) {
        await supabase.from('chat_messages').insert({
          room_id: room.id,
          user_id: room.created_by,
          content: `Invited ${selectedUserIds.length} member(s) to the room`
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Members invited",
        description: `Successfully invited ${selectedUserIds.length} member(s) to the room.`,
      });
      queryClient.invalidateQueries({ queryKey: ['room-members', room.id] });
      queryClient.invalidateQueries({ queryKey: ['room-members-ids', room.id] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room.id] });
      setSelectedUserIds([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMember = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Members to Room</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or member code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No members found' : 'All team members are already in this room'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableMembers.map((member) => {
                const memberUserId = member.user_id || member.id;
                return (
                <div
                  key={memberUserId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => toggleMember(memberUserId)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                        {member.member_code && (
                          <span className="ml-2 text-xs text-muted-foreground">#{member.member_code}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedUserIds.includes(member.user_id || member.id)}
                    onCheckedChange={() => toggleMember(member.user_id || member.id)}
                  />
                </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => inviteMutation.mutate()} 
              disabled={inviteMutation.isPending || selectedUserIds.length === 0}
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Invite {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
