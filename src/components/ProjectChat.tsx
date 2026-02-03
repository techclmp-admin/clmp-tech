import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { Loader2, MessageSquare, ArrowLeft, Plus } from "lucide-react";
import { ChatWindow } from "./chat/ChatWindow";
import { ChatRoom } from "./chat/types";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProjectChatProps {
  projectId: string;
  projectName: string;
}

export const ProjectChat = ({ projectId, projectName }: ProjectChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  
  const featureEnabled = isFeatureEnabled('project_chat');
  const featureUpcoming = isFeatureUpcoming('project_chat');

  // Fetch all project chat rooms
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['project-chat-rooms', projectId],
    queryFn: async () => {
      if (!user) return [];

      console.log('Fetching project chat rooms for:', projectId);

      // Get all rooms for this project where user is a participant
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .eq('user_id', user.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      const roomIds = participants?.map(p => p.chat_room_id) || [];

      if (roomIds.length === 0) {
        console.log('User is not participant in any rooms');
        return [];
      }

      // Get all active project rooms for this project
      const { data: projectRooms, error: roomError } = await supabase
        .from('project_chat_rooms')
        .select('*')
        .eq('project_id', projectId)
        .eq('room_type', 'project')
        .in('id', roomIds)
        .order('created_at', { ascending: true });

      if (roomError) {
        console.error('Error fetching rooms:', roomError);
        throw roomError;
      }

      console.log('Found project rooms:', projectRooms);
      return (projectRooms || []) as ChatRoom[];
    },
    enabled: !!user && !!projectId,
  });

  // Auto-select first room
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    } else if (selectedRoomId && !rooms.find(r => r.id === selectedRoomId)) {
      // Current room was deleted, select first available room
      setSelectedRoomId(rooms.length > 0 ? rooms[0].id : undefined);
    }
  }, [rooms, selectedRoomId]);

  // Setup realtime for room updates
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-chat-rooms-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_chat_rooms',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-chat-rooms', projectId] });
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
          queryClient.invalidateQueries({ queryKey: ['project-chat-rooms', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  // Mutation to create a new project chat room
  const createRoomMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!newRoomName.trim()) throw new Error("Room name is required");

      // Use RPC to create room (bypasses RLS)
      const { data: roomId, error } = await supabase.rpc('create_chat_room', {
        p_name: newRoomName.trim(),
        p_description: newRoomDescription.trim() || null,
        p_room_type: 'project',
        p_project_id: projectId
      });

      if (error) throw error;
      if (!roomId) throw new Error("Failed to create room");

      return roomId;
    },
    onSuccess: (roomId) => {
      toast({
        title: "Room created",
        description: "Your project chat room has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['project-chat-rooms', projectId] });
      setNewRoomName("");
      setNewRoomDescription("");
      setShowCreateDialog(false);
      setSelectedRoomId(roomId);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Create Room Dialog
  const CreateRoomDialogContent = (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Project Chat Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g., General Discussion"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-desc">Description (Optional)</Label>
            <Textarea
              id="room-desc"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              placeholder="What's this room about?"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRoomMutation.mutate()}
              disabled={createRoomMutation.isPending || !newRoomName.trim()}
            >
              {createRoomMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/20">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <Badge variant="secondary" className="mb-3">Coming Soon</Badge>
          <h3 className="text-lg font-medium mb-2">Project Chat</h3>
          <p className="text-muted-foreground">
            This feature is currently under development and will be available soon.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Loading project chats...</p>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <>
        {CreateRoomDialogContent}
        <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/20">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No chat rooms for this project yet.</p>
            <Button 
              className="mt-4" 
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Chat Room
            </Button>
          </div>
        </div>
      </>
    );
  }

  const showRoomListMobile = !selectedRoom;

  return (
    <>
      {CreateRoomDialogContent}
      <div className="h-[600px] border rounded-lg overflow-hidden">
        <div className="h-full flex flex-col md:flex-row md:gap-4">
          {/* Room List (mobile: only when no room selected) */}
          <Card
            className={cn(
              "flex flex-col rounded-none md:rounded-lg md:w-64",
              showRoomListMobile ? "flex" : "hidden md:flex"
            )}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Project Rooms</h3>
                <p className="text-xs text-muted-foreground mt-1">{rooms.length} room(s)</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateDialog(true)}
                aria-label="Create room"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    "hover:bg-accent active:bg-accent/80",
                    selectedRoomId === room.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{room.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {room.description || 'Project chat room'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window (mobile: full width; includes back to rooms) */}
        <div className={cn("flex-1 min-w-0", selectedRoom ? "block" : "hidden md:block")}>
          {selectedRoom ? (
            <div className="h-full flex flex-col">
              <div className="md:hidden p-3 border-b flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRoomId(undefined)}
                  aria-label="Back to rooms"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedRoom.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{projectName}</p>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <ChatWindow room={selectedRoom} />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a room to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
