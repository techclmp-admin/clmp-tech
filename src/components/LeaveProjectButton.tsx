import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Crown } from 'lucide-react';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';

interface LeaveProjectButtonProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  currentOwnerId: string;
  teamMembers?: any[];
}

export const LeaveProjectButton: React.FC<LeaveProjectButtonProps> = ({
  projectId,
  projectName,
  isOwner,
  currentOwnerId,
  teamMembers = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLeaveProject = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Attempting to leave project:', { projectId, userId: user.id });

      // Delete member record
      const { data, error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .select(); // Select to see what was deleted

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No rows were deleted - RLS policy may be blocking');
        throw new Error('Could not leave project. Please try again.');
      }

      console.log('Successfully deleted membership');

      // Clear all project-related cache completely
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });
      await queryClient.cancelQueries({ queryKey: ['project-membership', projectId] });
      await queryClient.cancelQueries({ queryKey: ['project-members', projectId] });
      await queryClient.cancelQueries({ queryKey: ['project-tasks', projectId] });
      
      // Reset queries to force fresh fetch
      queryClient.resetQueries({ queryKey: ['projects'], exact: false });
      queryClient.resetQueries({ queryKey: ['project', projectId] });
      queryClient.resetQueries({ queryKey: ['project-membership', projectId] });
      queryClient.resetQueries({ queryKey: ['project-members', projectId] });
      queryClient.resetQueries({ queryKey: ['project-tasks', projectId] });

      toast({
        title: 'Left project',
        description: `You have left ${projectName}`,
      });

      // Navigate back to projects - the component will refetch fresh data on mount
      navigate('/projects', { replace: true });
    } catch (error: any) {
      console.error('Leave project error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Leave Project
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isOwner ? 'Cannot Leave Project' : 'Leave Project'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isOwner ? (
                <>
                  As the project owner, you cannot leave <strong>{projectName}</strong>. 
                  You have two options:
                  <ul className="mt-3 space-y-2 list-disc list-inside">
                    <li><strong>Transfer ownership</strong> to another team member first</li>
                    <li><strong>Delete the project</strong> if it's no longer needed</li>
                  </ul>
                </>
              ) : (
                <>
                  Are you sure you want to leave <strong>{projectName}</strong>? You will lose access to all project data and will need to be re-invited to rejoin.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isOwner ? (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    setShowTransferDialog(true);
                  }}
                  className="bg-primary"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Transfer Ownership
                </Button>
              </>
            ) : (
              <>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeaveProject}
                  disabled={loading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {loading ? 'Leaving...' : 'Leave Project'}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TransferOwnershipDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        projectId={projectId}
        projectName={projectName}
        teamMembers={teamMembers}
        currentOwnerId={currentOwnerId}
      />
    </>
  );
};
