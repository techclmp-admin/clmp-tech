import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, MessageSquare, FolderKanban } from "lucide-react";
import { ChatRoom } from "./types";
import { cn } from "@/lib/utils";

interface RoomListProps {
  rooms: ChatRoom[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
}

export const RoomList = ({ rooms, selectedRoomId, onSelectRoom }: RoomListProps) => {
  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="w-4 h-4" />;
      case 'direct':
        return <MessageSquare className="w-4 h-4" />;
      case 'group':
        return <Users className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const projectRooms = rooms.filter(r => r.room_type === 'project');
  // Show all direct rooms (removed last_message_at filter since it's always null)
  const directRooms = rooms.filter(r => r.room_type === 'direct');
  const generalRooms = rooms.filter(r => r.room_type === 'general' || r.room_type === 'group');

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {projectRooms.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
              Project Rooms
            </h3>
            <div className="space-y-1">
              {projectRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={selectedRoomId === room.id ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start gap-2 h-auto py-2",
                    selectedRoomId === room.id && "bg-secondary"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  {getRoomIcon(room.room_type)}
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="font-medium truncate">{room.name}</div>
                    {room.project && (
                      <div className="text-xs text-muted-foreground truncate">
                        {room.project.name}
                      </div>
                    )}
                  </div>
                  {room.unread_count && room.unread_count > 0 && (
                    <Badge variant="default" className="ml-auto">
                      {room.unread_count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {directRooms.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
              Direct Messages
            </h3>
            <div className="space-y-1">
              {directRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={selectedRoomId === room.id ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start gap-2",
                    selectedRoomId === room.id && "bg-secondary"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  {getRoomIcon(room.room_type)}
                  <span className="truncate">{room.name}</span>
                  {room.unread_count && room.unread_count > 0 && (
                    <Badge variant="default" className="ml-auto">
                      {room.unread_count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {generalRooms.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
              General Channels
            </h3>
            <div className="space-y-1">
              {generalRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={selectedRoomId === room.id ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start gap-2",
                    selectedRoomId === room.id && "bg-secondary"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  {getRoomIcon(room.room_type)}
                  <span className="truncate">{room.name}</span>
                  {room.unread_count && room.unread_count > 0 && (
                    <Badge variant="default" className="ml-auto">
                      {room.unread_count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
