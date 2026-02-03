import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Hash, Users, X, Search, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionUpgradeModal } from "@/components/SubscriptionUpgradeModal";

interface TeamMember {
  value: string;
  type: 'email' | 'member_code';
  displayName?: string;
}

interface TeamMemberInviteProps {
  teamMembers: TeamMember[];
  onAddMember: (member: TeamMember) => void;
  onRemoveMember: (value: string) => void;
  subscriptionLimits?: {
    max_users: number;
    current_users: number;
    can_add_user: boolean;
    plan_name?: string;
  } | null;
}

export const TeamMemberInvite = ({ teamMembers, onAddMember, onRemoveMember, subscriptionLimits }: TeamMemberInviteProps) => {
  const [inviteType, setInviteType] = useState<'email' | 'member_code'>('email');
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactsOpen, setContactsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();

  // Fetch contacts from profiles
  const { data: contacts = [] } = useQuery({
    queryKey: ['team-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, member_code, avatar_url')
        .not('email', 'is', null)
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      contact.first_name?.toLowerCase().includes(search) ||
      contact.last_name?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.member_code?.toLowerCase().includes(search)
    );
  });

  const handleAdd = () => {
    if (!inputValue.trim()) return;

    // Check subscription limits
    if (subscriptionLimits && !subscriptionLimits.can_add_user) {
      setShowUpgradeModal(true);
      return;
    }

    if (inviteType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputValue)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
    }

    if (teamMembers.some(m => m.value === inputValue.trim())) {
      toast({
        title: "Already added",
        description: "This member has already been added",
        variant: "destructive",
      });
      return;
    }

    onAddMember({
      value: inputValue.trim(),
      type: inviteType,
    });
    setInputValue('');
  };

  const handleContactSelect = (contact: any) => {
    // Check subscription limits
    if (subscriptionLimits && !subscriptionLimits.can_add_user) {
      setShowUpgradeModal(true);
      return;
    }

    const member: TeamMember = {
      value: contact.email,
      type: 'email',
      displayName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    };

    if (teamMembers.some(m => m.value === member.value)) {
      toast({
        title: "Already added",
        description: "This member has already been added",
        variant: "destructive",
      });
      return;
    }

    onAddMember(member);
    setContactsOpen(false);
  };

  const canAddMore = !subscriptionLimits || subscriptionLimits.can_add_user;

  return (
    <div className="space-y-4">
      <div>
        <Label>Invite Team Members (Optional)</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Add team members by email or member code. They'll receive an invitation to join the project.
        </p>
        {subscriptionLimits && (
          <p className="text-sm text-muted-foreground">
            Team Members: {subscriptionLimits.current_users}/{subscriptionLimits.max_users}
          </p>
        )}
      </div>

      {subscriptionLimits && !subscriptionLimits.can_add_user && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Team Member Limit Reached</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>You've reached the maximum number of team members ({subscriptionLimits.current_users}/{subscriptionLimits.max_users}) for your {subscriptionLimits.plan_name || 'current'} plan.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-background hover:bg-background/80"
            >
              View Upgrade Options
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={inviteType} onValueChange={(v) => setInviteType(v as 'email' | 'member_code')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="member_code" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Member Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter email address"
              type="email"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Dialog open={contactsOpen} onOpenChange={setContactsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Users className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Select from Contacts</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts..."
                      className="pl-9"
                    />
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => handleContactSelect(contact)}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {contact.first_name?.[0]}{contact.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                            {contact.member_code && (
                              <p className="text-xs text-muted-foreground">Code: {contact.member_code}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredContacts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No contacts found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleAdd} disabled={!inputValue.trim() || !canAddMore}>
              Add
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="member_code" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter member code (e.g., MC12345)"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!inputValue.trim() || !canAddMore}>
              Add
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {teamMembers.length > 0 && (
        <div className="space-y-2">
          <Label>Team Members to Invite ({teamMembers.length}):</Label>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.value}
                className="flex items-center justify-between gap-2 bg-accent/50 p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {member.type === 'email' ? (
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {member.displayName || member.value}
                    </p>
                    {member.displayName && (
                      <p className="text-sm text-muted-foreground truncate">{member.value}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {member.type === 'email' ? 'Email' : 'Code'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveMember(member.value)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <SubscriptionUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="users"
        currentPlan={subscriptionLimits?.plan_name}
        currentUsage={subscriptionLimits ? { current: subscriptionLimits.current_users, max: subscriptionLimits.max_users } : undefined}
      />
    </div>
  );
};
