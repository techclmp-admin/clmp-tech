import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Smile } from "lucide-react";
import { ChatMessage } from "./types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  onTyping?: () => void;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const EMOJI_LIST = ['👍', '❤️', '😊', '🎉', '🔥', '👏', '✅', '💯'];

export const ChatInput = ({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  disabled = false,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage("");
      setAttachments([]);
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // File upload temporarily disabled
    console.log('File upload coming soon');
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t bg-background p-4 space-y-2">
      {replyingTo && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Replying to {replyingTo.profile?.first_name || 'User'}
            </p>
            <p className="text-sm truncate">{replyingTo.content}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelReply}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}


      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" disabled={disabled}>
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {EMOJI_LIST.map((emoji) => (
                <Button
                  key={emoji}
                  size="sm"
                  variant="ghost"
                  onClick={() => insertEmoji(emoji)}
                  className="h-8 w-8 p-0"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping?.();
          }}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
