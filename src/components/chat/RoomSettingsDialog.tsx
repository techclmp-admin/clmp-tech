import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChatRoom } from "./types";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface RoomSettingsDialogProps {
  room: ChatRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomDeleted?: () => void;
}

export const RoomSettingsDialog = ({ room, open, onOpenChange, onRoomDeleted }: RoomSettingsDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Update local state when room prop changes
  useEffect(() => {
    setName(room.name);
    setDescription(room.description || "");
  }, [room]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('project_chat_rooms')
        .update({
          name,
          description,
        })
        .eq('id', room.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Room settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'], exact: false });
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First delete all messages in the room
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', room.id);

      if (messagesError) {
        console.error('Failed to delete messages:', messagesError);
        throw new Error(`Failed to delete messages: ${messagesError.message}`);
      }

      // Delete chat participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_room_id', room.id);

      if (participantsError) {
        console.error('Failed to delete participants:', participantsError);
        throw new Error(`Failed to delete participants: ${participantsError.message}`);
      }

      // Delete chat_room_members if exists
      const { error: membersError } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('room_id', room.id);

      // Ignore error for chat_room_members as it might not have entries
      if (membersError) {
        console.warn('Note: chat_room_members delete:', membersError.message);
      }

      // Then delete the room
      const { error: roomError, data: deletedData } = await supabase
        .from('project_chat_rooms')
        .delete()
        .eq('id', room.id)
        .select();

      if (roomError) {
        console.error('Failed to delete room:', roomError);
        throw new Error(`Failed to delete room: ${roomError.message}`);
      }

      console.log('Room deleted successfully:', deletedData);
      
      // Verify room is deleted
      const { data: checkRoom } = await supabase
        .from('project_chat_rooms')
        .select('id')
        .eq('id', room.id)
        .single();
      
      if (checkRoom) {
        console.error('Room still exists after delete!');
        throw new Error('Room deletion may have been blocked by RLS policy');
      }
    },
    onSuccess: () => {
      toast({
        title: "Room deleted",
        description: "The chat room has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'], exact: false });
      setShowDeleteDialog(false);
      onOpenChange(false);
      onRoomDeleted?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Room Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room-description">Description</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter room description"
              rows={3}
            />
          </div>

          {/* Active toggle removed (table doesn't support is_active) */}

          <div className="flex flex-col gap-4 pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Room
            </Button>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{room.name}" and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Room'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
