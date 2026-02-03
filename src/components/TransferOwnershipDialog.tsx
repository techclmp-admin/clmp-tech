import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Crown, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  teamMembers: any[];
  currentOwnerId: string;
}

export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  teamMembers,
  currentOwnerId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter out current owner
  const eligibleMembers = teamMembers.filter(
    (member) => member.user_id !== currentOwnerId
  );

  const selectedMember = eligibleMembers.find(
    (member) => member.user_id === selectedUserId
  );

  const handleTransfer = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      // Use secure RPC function for ownership transfer
      const { error } = await supabase.rpc('transfer_project_ownership', {
        p_project_id: projectId,
        p_new_owner_id: selectedUserId,
      });

      if (error) throw error;

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      toast({
        title: 'Ownership transferred',
        description: `${selectedMember?.profiles?.first_name || selectedMember?.profiles?.email} is now the project owner`,
      });

      onOpenChange(false);
      setConfirmStep(false);
      setSelectedUserId('');
    } catch (error: any) {
      console.error('Transfer ownership error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to transfer ownership',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setConfirmStep(false);
      setSelectedUserId('');
    }
  };

  if (eligibleMembers.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>
              You need at least one other team member to transfer ownership.
              Invite team members first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (confirmStep && selectedMember) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transfer</DialogTitle>
            <DialogDescription>
              You are about to transfer ownership of <strong>{projectName}</strong> to:
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <Avatar>
              <AvatarImage src={selectedMember.profiles?.avatar_url} />
              <AvatarFallback>
                {selectedMember.profiles?.first_name?.[0]}
                {selectedMember.profiles?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {selectedMember.profiles?.first_name} {selectedMember.profiles?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedMember.profiles?.email}
              </p>
            </div>
            <Crown className="h-5 w-5 text-yellow-500 ml-auto" />
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>After transfer:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>They will have full control over the project</li>
              <li>You will become a regular member</li>
              <li>They can remove you from the project</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setConfirmStep(false)}
              variant="outline"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={loading}
              className="bg-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Ownership</DialogTitle>
          <DialogDescription>
            Select a team member to become the new owner of <strong>{projectName}</strong>
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedUserId} onValueChange={setSelectedUserId}>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {eligibleMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                onClick={() => setSelectedUserId(member.user_id)}
              >
                <RadioGroupItem value={member.user_id} id={member.user_id} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profiles?.avatar_url} />
                  <AvatarFallback>
                    {member.profiles?.first_name?.[0]}
                    {member.profiles?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor={member.user_id}
                  className="flex-1 cursor-pointer"
                >
                  <div>
                    <p className="font-medium">
                      {member.profiles?.first_name} {member.profiles?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.profiles?.email}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => setConfirmStep(true)}
            disabled={!selectedUserId || loading}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
