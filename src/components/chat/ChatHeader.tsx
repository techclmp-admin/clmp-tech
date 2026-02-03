import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pin, Users, Settings } from "lucide-react";
import { ChatRoom } from "./types";

interface ChatHeaderProps {
  room: ChatRoom;
  onMembersClick: () => void;
  onSettingsClick: () => void;
}

export const ChatHeader = ({ room, onMembersClick, onSettingsClick }: ChatHeaderProps) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg truncate">
            {room.room_type === 'project' && room.project
              ? `${room.project.name} - Project Room`
              : room.name}
          </h3>
          {room.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {room.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon">
            <Pin className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onMembersClick}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSettingsClick}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search in conversation..." className="pl-8" />
      </div>
    </div>
  );
};
