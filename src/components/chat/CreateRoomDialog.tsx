import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRoomDialog = ({ open, onOpenChange }: CreateRoomDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState<"group" | "project">("group");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Fetch user's projects
  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      return data || [];
    },
    enabled: open && !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!name.trim()) throw new Error("Room name is required");

      // Gọi function để tạo room (bypass RLS)
      const { data: roomId, error } = await supabase.rpc('create_chat_room', {
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_room_type: roomType,
        p_project_id: roomType === 'project' ? selectedProjectId : null
      });

      if (error) throw error;
      if (!roomId) throw new Error("Failed to create room");

      // Fetch room data để return
      const { data: room } = await supabase
        .from('project_chat_rooms')
        .select()
        .eq('id', roomId)
        .single();

      return room;
    },
    onSuccess: () => {
      toast({
        title: "Room created",
        description: "Your new chat room has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', user?.id] });
      setName("");
      setDescription("");
      setRoomType("group");
      setSelectedProjectId("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Chat Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-type">Room Type</Label>
            <Select value={roomType} onValueChange={(value: any) => setRoomType(value)}>
              <SelectTrigger id="room-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">General Channel</SelectItem>
                <SelectItem value="project">Project Room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {roomType === 'project' && (
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label htmlFor="room-description">Description (Optional)</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room about?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate()} 
              disabled={createMutation.isPending || !name.trim() || (roomType === 'project' && !selectedProjectId)}
            >
              {createMutation.isPending ? (
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
};
