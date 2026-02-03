import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { ChatMessage, ChatRoom, TypingIndicator } from "./types";
import { RoomSettingsDialog } from "./RoomSettingsDialog";
import { RoomMembersDialog } from "./RoomMembersDialog";
import { ChatHeader } from "./ChatHeader";

interface ChatWindowProps {
  room: ChatRoom;
}

export const ChatWindow = ({ room }: ChatWindowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', room.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch profiles for all senders
      const senderIds = [...new Set(data?.map((m: any) => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, avatar_url')
        .in('user_id', senderIds);

      const profilesMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});

      return (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.user_id,
        chat_room_id: msg.room_id,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        profile: profilesMap[msg.user_id],
        is_edited: !!msg.is_edited,
        is_deleted: false,
        attachments: [],
        mentions: [],
        message_type: (msg.message_type || 'text'),
        reactions: []
      })) as ChatMessage[];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachments }: { content: string; attachments?: File[] }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          content,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // React to message - disabled for now (table not in schema)
  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      // Reactions feature temporarily disabled
      console.log('Reaction feature coming soon');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room.id] });
    },
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room.id] });
    },
  });

  // Mark messages as read when viewing the room
  useEffect(() => {
    if (!user || !room.id) return;

    const markAsRead = async () => {
      try {
        await supabase
          .from('chat_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('chat_room_id', room.id)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAsRead();
  }, [user, room.id, messages.length]);

  // Setup realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', room.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, queryClient]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatHeader
        room={room}
        onMembersClick={() => setShowMembers(true)}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                currentUserId={user?.id}
                onReply={setReplyingTo}
                onDelete={(messageId) => deleteMutation.mutate(messageId)}
              />
            ))}
          </div>
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="text-sm text-muted-foreground italic py-2 px-4">
            {typingUsers.map(u => u.profile?.first_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSendMessage={(content, attachments) =>
          sendMessageMutation.mutate({ content, attachments })
        }
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={sendMessageMutation.isPending}
      />

      {/* Dialogs */}
      <RoomSettingsDialog
        room={room}
        open={showSettings}
        onOpenChange={setShowSettings}
        onRoomDeleted={() => {
          // Room was deleted, this will be handled by the parent component
          setShowSettings(false);
        }}
      />
      <RoomMembersDialog
        room={room}
        open={showMembers}
        onOpenChange={setShowMembers}
      />
    </div>
  );
};
