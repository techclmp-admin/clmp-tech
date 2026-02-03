import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "./types";
import { Loader2, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { InviteMembersDialog } from "./InviteMembersDialog";

interface RoomMembersDialogProps {
  room: ChatRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoomMembersDialog = ({ room, open, onOpenChange }: RoomMembersDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['room-members', room.id],
    queryFn: async () => {
      // Get participants from chat_participants table
      const { data: participants, error } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          role,
          joined_at,
          profiles!user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            member_code
          )
        `)
        .eq('chat_room_id', room.id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching participants:', error);
        return [];
      }

      return participants?.map(p => {
        const profile = p.profiles as any;
        if (!profile) return null;
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          member_code: profile.member_code,
          role: p.role,
          joined_at: p.joined_at
        };
      }).filter(Boolean) || [];
    },
    enabled: open,
  });

  const filteredMembers = searchQuery
    ? members.filter((member: any) =>
        `${member.first_name || ''} ${member.last_name || ''} ${member.email || ''} ${member.member_code || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : members;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Room Members ({members.length})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search current members in this room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No members found' : 'No members in this room yet'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.first_name?.[0] || member.email?.[0]?.toUpperCase() || 'U'}
                        {member.last_name?.[0] || member.email?.[1]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.first_name || member.last_name || member.email}
                        {member.member_code && (
                          <span className="ml-2 text-xs text-muted-foreground">#{member.member_code}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full" variant="outline" onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        </div>
      </DialogContent>

      <InviteMembersDialog
        room={room}
        open={showInvite}
        onOpenChange={setShowInvite}
      />
    </Dialog>
  );
};
