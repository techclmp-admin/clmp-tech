import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users, MessageSquare, Clock } from "lucide-react";
import { RoomList } from "./RoomList";
import { ChatWindow } from "./ChatWindow";
import { ChatRoom } from "./types";
import { ContactsDialog } from "./ContactsDialog";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";

export const EnhancedChat = () => {
  const { isFeatureEnabled, isFeatureUpcoming, isLoading: featuresLoading } = useProjectFeatures();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [showContacts, setShowContacts] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const hasProcessedUserId = useRef(false);

  // Fetch available chat rooms
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('Fetching chat rooms for user:', user.id);

      // Get only rooms where user is a participant
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .eq('user_id', user.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      console.log('User is participant in rooms:', participants);

      const roomIds = participants?.map(p => p.chat_room_id) || [];
      
      if (roomIds.length === 0) {
        console.log('No rooms found for user');
        return [];
      }

      const { data: roomsData, error: roomsError } = await supabase
        .from('project_chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('created_at', { ascending: false });

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log('Fetched rooms:', roomsData);

      // Fetch project info for project rooms
      const projectIds = roomsData?.filter((r: any) => r.project_id).map((r: any) => r.project_id) || [];
      let projectsMap: Record<string, any> = {};
      
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
        
        projectsMap = (projects || []).reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }

      // Fetch unread counts for each room
      const roomsWithUnread = await Promise.all(
        (roomsData || []).map(async (room: any) => {
          // Get user's last_read_at for this room
          const { data: participantData } = await supabase
            .from('chat_participants')
            .select('last_read_at')
            .eq('chat_room_id', room.id)
            .eq('user_id', user.id)
            .maybeSingle();

          const lastReadAt = participantData?.last_read_at;

          // Count messages after last_read_at
          let unreadCount = 0;
          if (lastReadAt) {
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .gt('created_at', lastReadAt)
              .neq('user_id', user.id);
            unreadCount = count || 0;
          } else {
            // If never read, count all messages not from current user
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .neq('user_id', user.id);
            unreadCount = count || 0;
          }

          return {
            ...room,
            is_active: true,
            last_message_at: null,
            project: room.project_id ? projectsMap[room.project_id] : undefined,
            unread_count: unreadCount
          };
        })
      );

      return roomsWithUnread as ChatRoom[];
    },
    enabled: !!user,
  });

  // Helper function to start chat with a user (find existing or create new)
  const startChatWithUser = useCallback(async (userId: string) => {
    if (!user || isCreatingRoom) return;
    
    // Don't create chat with yourself
    if (userId === user.id) {
      toast({
        title: "Cannot create chat",
        description: "You cannot create a chat with yourself.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingRoom(true);
      console.log('Starting chat with user:', userId);

      // Find existing direct chat room between these two users
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .eq('user_id', userId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      // Filter to only direct rooms
      let directRoomIds: string[] = [];
      if (participants && participants.length > 0) {
        const roomIds = participants.map(p => p.chat_room_id);
        const { data: directRooms } = await supabase
          .from('project_chat_rooms')
          .select('id')
          .in('id', roomIds)
          .eq('room_type', 'direct');
        directRoomIds = (directRooms || []).map(r => r.id);
      }

      console.log('Found direct room IDs:', directRoomIds);

      let existingRoom = null;
      if (directRoomIds.length > 0) {
        // Check if current user is also a participant in any of these rooms
        for (const roomId of directRoomIds) {
          const { data: myParticipation } = await supabase
            .from('chat_participants')
            .select('chat_room_id')
            .eq('chat_room_id', roomId)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (myParticipation) {
            const { data: room } = await supabase
              .from('project_chat_rooms')
              .select('*')
              .eq('id', roomId)
              .single();
            existingRoom = room;
            console.log('Found existing room:', existingRoom);
            break;
          }
        }
      }

      if (existingRoom) {
        // Room exists, select it
        console.log('Selecting existing room:', existingRoom.id);
        setSelectedRoomId(existingRoom.id);
        toast({
          title: "Chat opened",
          description: "Opening existing conversation.",
        });
      } else {
        // Create new direct room
        console.log('Creating new direct room...');
        const { data: otherProfile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('user_id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        const roomName = otherProfile.first_name && otherProfile.last_name
          ? `${otherProfile.first_name} ${otherProfile.last_name}`
          : otherProfile.email || 'Direct Chat';

        const { data: newRoom, error: roomError } = await supabase
          .from('project_chat_rooms')
          .insert({
            name: roomName,
            room_type: 'direct',
            is_private: true,
            created_by: user.id,
            project_id: null,
          })
          .select()
          .single();

        if (roomError) {
          console.error('Error creating room:', roomError);
          throw roomError;
        }

        console.log('Created new room:', newRoom);

        if (newRoom) {
          // Add both users as participants
          const { error: participantError } = await Promise.all([
            supabase.from('chat_participants').insert({
              chat_room_id: newRoom.id,
              user_id: user.id,
              role: 'admin'
            }),
            supabase.from('chat_participants').insert({
              chat_room_id: newRoom.id,
              user_id: userId,
              role: 'member'
            })
          ]).then(results => ({ error: results.find(r => r.error)?.error }));

          if (participantError) {
            console.error('Error adding participants:', participantError);
            throw participantError;
          }

          console.log('Added participants to room');

          // Refresh room list
          await queryClient.invalidateQueries({ queryKey: ['chat-rooms', user.id] });
          
          // Select the new room
          setSelectedRoomId(newRoom.id);
          
          toast({
            title: "Chat created",
            description: `Started conversation with ${roomName}`,
          });
        }
      }
    } catch (error: any) {
      console.error('Error in startChatWithUser:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  }, [user, isCreatingRoom, queryClient, toast]);

  // Handle userId query parameter - auto-create/open DM
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (targetUserId && user && !isLoading && !hasProcessedUserId.current) {
      hasProcessedUserId.current = true;
      // Clear the param from URL
      searchParams.delete('userId');
      setSearchParams(searchParams, { replace: true });
      // Start chat with the target user
      startChatWithUser(targetUserId);
    }
  }, [searchParams, setSearchParams, user, isLoading, startChatWithUser]);

  // Auto-select first room or clear selection if current room is deleted
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    } else if (selectedRoomId && !rooms.find(r => r.id === selectedRoomId)) {
      // Current room was deleted, select first available room
      setSelectedRoomId(rooms.length > 0 ? rooms[0].id : undefined);
    }
  }, [rooms, selectedRoomId]);

  // Setup realtime for room list updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_chat_rooms',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-rooms', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-rooms', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Check feature flag status - show Coming Soon if disabled but upcoming
  const isChatDisabled = !isFeatureEnabled('chat');
  const isChatUpcoming = isFeatureUpcoming('chat');

  if (featuresLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Show Coming Soon state when feature is disabled but marked as upcoming
  if (isChatDisabled && isChatUpcoming) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <MessageSquare className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Coming Soon</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Team Chat</h2>
          <p className="text-muted-foreground">
            Real-time team communication and collaboration features are coming soon. 
            Stay tuned for direct messaging, group rooms, and file sharing capabilities.
          </p>
        </Card>
      </div>
    );
  }

  // Show disabled state when feature is completely disabled
  if (isChatDisabled) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-muted rounded-full">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Feature Unavailable</h2>
          <p className="text-muted-foreground">
            The Team Chat feature is currently disabled. 
            Please contact your administrator to enable this feature.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground">Team Chat</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
              Project communication and collaboration
            </p>
          </div>
          <div className="flex gap-2 md:justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowContacts(true)}>
              <Users className="w-4 h-4 mr-2" />
              Team Directory
            </Button>
            <Button size="sm" onClick={() => setShowCreateRoom(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: single pane (rooms OR active chat) */}
      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col md:flex-row md:gap-6 min-h-0">
          {/* Room List */}
          <Card className={selectedRoom ? "hidden md:flex md:w-80 flex-col" : "flex md:w-80 flex-col"}>
            <RoomList
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
            />
          </Card>

          {/* Chat Window */}
          <Card className={selectedRoom ? "flex flex-col flex-1 min-w-0" : "hidden md:flex flex-col flex-1 min-w-0"}>
            {selectedRoom ? (
              <ChatWindow room={selectedRoom} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a room to start chatting</p>
              </div>
            )}
          </Card>
        </div>

        {/* Mobile: quick back to room list */}
        {selectedRoom && (
          <div className="md:hidden pt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedRoomId(undefined)}
            >
              Back to rooms
            </Button>
          </div>
        )}
      </div>

      {/* Contacts Dialog */}
      <ContactsDialog
        open={showContacts}
        onOpenChange={setShowContacts}
        onStartChat={async (userId) => {
          await startChatWithUser(userId);
          setShowContacts(false);
        }}
      />

      {/* Create Room Dialog */}
      <CreateRoomDialog
        open={showCreateRoom}
        onOpenChange={setShowCreateRoom}
      />
    </div>
  );
};
