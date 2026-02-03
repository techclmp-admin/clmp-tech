import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, MessageSquare, Mail } from "lucide-react";
import { useState } from "react";

interface ContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat?: (userId: string) => void;
  isCreatingRoom?: boolean;
}

export const ContactsDialog = ({ open, onOpenChange, onStartChat, isCreatingRoom = false }: ContactsDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, avatar_url, member_code')
        .order('first_name');

      return profiles || [];
    },
    enabled: open,
  });

  const filteredContacts = searchQuery
    ? contacts.filter((contact) =>
        `${contact.first_name} ${contact.last_name} ${contact.email} ${contact.member_code || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : contacts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Team Directory ({contacts.length} members)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No contacts found' : 'No team members yet'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar>
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback>
                        {contact.first_name?.[0] || 'U'}{contact.last_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {contact.first_name || 'Unknown'} {contact.last_name || 'User'}
                        </p>
                        {contact.member_code && (
                          <Badge variant="secondary" className="text-xs">
                            {contact.member_code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.location.href = `mailto:${contact.email}`}
                      title="Send email"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={async () => {
                        const targetUserId = contact.user_id || contact.id;
                        setLoadingUserId(targetUserId);
                        await onStartChat?.(targetUserId);
                        setLoadingUserId(null);
                      }}
                      disabled={loadingUserId === (contact.user_id || contact.id)}
                      title="Start chat"
                    >
                      {loadingUserId === contact.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
