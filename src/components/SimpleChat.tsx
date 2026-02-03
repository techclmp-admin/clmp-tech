import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { MessageCircle, Users, Send } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SimpleChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("general");

  // Fetch chat messages from database
  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', selectedChannel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_room_id', selectedChannel)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((msg: any) => msg.sender_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return data.map((msg: any) => ({ ...msg, profile: null }));
        }

        return data.map((msg: any) => ({
          ...msg,
          profile: profiles?.find((p: any) => p.id === msg.sender_id) || null
        }));
      }
      
      return data || [];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedChannel,
          content,
          user_id: user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChannel] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Setup realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('chat-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_room_id=eq.${selectedChannel}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChannel] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannel, queryClient]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Internal Chat</h1>
        <p className="text-muted-foreground mt-2">
          Team communication and collaboration hub
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Rooms */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Chat Rooms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant={selectedChannel === 'general' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => setSelectedChannel('general')}
            >
              # General
            </Button>
            <Button 
              variant={selectedChannel === 'project_team' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => setSelectedChannel('project_team')}
            >
              # Project Team
            </Button>
            <Button 
              variant={selectedChannel === 'announcements' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => setSelectedChannel('announcements')}
            >
              # Announcements
            </Button>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              #{selectedChannel.replace('_', ' ')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4 h-96 overflow-y-auto">
              {messages.map((msg: any) => {
                const senderName = msg.profile
                  ? `${msg.profile.first_name || ''} ${msg.profile.last_name || ''}`.trim() || msg.profile.email
                  : 'Unknown User';
                const timestamp = new Date(msg.created_at).toLocaleTimeString('en-CA', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                
                return (
                  <div key={msg.id} className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{senderName}</span>
                      <span className="text-xs text-muted-foreground">{timestamp}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleChat;