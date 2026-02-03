import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Reply, 
  Smile, 
  Pin, 
  Edit, 
  Trash,
  Download,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatMessage } from "./types";
import { MessageReactions } from "./MessageReactions";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: ChatMessage;
  currentUserId?: string;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
}

export const MessageItem = ({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
}: MessageItemProps) => {
  const [showActions, setShowActions] = useState(false);
  
  const isOwnMessage = message.sender_id === currentUserId;
  const senderName = message.profile
    ? `${message.profile.first_name || ''} ${message.profile.last_name || ''}`.trim() || message.profile.email
    : 'Unknown User';
  
  const timestamp = new Date(message.created_at).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Attachments feature temporarily disabled
  const renderAttachments = () => null;

  return (
    <div
      className={cn(
        "group relative py-2 px-4 hover:bg-muted/50 transition-colors",
        isOwnMessage && "bg-primary/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isOwnMessage ? (
        /* Own message - Right aligned */
        <div className="flex gap-3 justify-end">
          {/* Action buttons for own messages */}
          {showActions && !message.is_deleted && (
            <div className="flex items-center gap-1 mr-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply?.(message);
                }}
              >
                <Reply className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(message.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className="flex flex-col max-w-[70%]">
            <div className="flex items-baseline gap-2 justify-end mb-1">
              <span className="text-xs text-muted-foreground">{timestamp}</span>
              <span className="font-semibold text-sm">{senderName}</span>
              {message.is_edited && (
                <span className="text-xs text-muted-foreground italic">(edited)</span>
              )}
            </div>

            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
              {message.is_deleted ? (
                <p className="text-sm italic opacity-70">
                  Message deleted
                </p>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>

            {message.replies && message.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-6 text-xs self-end"
                onClick={() => onReply?.(message)}
              >
                <Reply className="w-3 h-3 mr-1" />
                {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>

          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={message.profile?.avatar_url} />
            <AvatarFallback>
              {senderName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      ) : (
        /* Other's message - Left aligned */
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={message.profile?.avatar_url} />
            <AvatarFallback>
              {senderName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col max-w-[70%]">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-sm">{senderName}</span>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
              {message.is_edited && (
                <span className="text-xs text-muted-foreground italic">(edited)</span>
              )}
            </div>

            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
              {message.is_deleted ? (
                <p className="text-sm text-muted-foreground italic">
                  Message deleted
                </p>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>

            {message.replies && message.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-6 text-xs self-start"
                onClick={() => onReply?.(message)}
              >
                <Reply className="w-3 h-3 mr-1" />
                {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>

          {/* Action buttons for other's messages */}
          {showActions && !message.is_deleted && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply?.(message);
                }}
              >
                <Reply className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
