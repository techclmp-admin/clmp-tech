import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export const DeleteAccountDialog = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');

  const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

  const handleProceedToConfirm = () => {
    setStep('confirm');
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      toast({
        title: "Confirmation Required",
        description: `Please type "${CONFIRM_PHRASE}" exactly to confirm deletion.`,
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id }
      });

      if (data?.error) throw new Error(data.error);
      if (error) {
        const context = await error.context?.json?.().catch(() => null);
        throw new Error(context?.error || error.message);
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted. We're sorry to see you go.",
      });

      await signOut();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setStep('warning');
      setConfirmText('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('warning');
    setConfirmText('');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {step === 'warning' ? (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3 pt-2">
                <p>
                  This action is <strong>permanent and cannot be undone</strong>. 
                  All your data will be permanently deleted, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your profile and personal information</li>
                  <li>All projects you own (other members will lose access)</li>
                  <li>Your messages and chat history</li>
                  <li>Your subscription and billing history</li>
                  <li>All files and documents you uploaded</li>
                </ul>
                <p className="text-destructive font-medium">
                  This cannot be reversed. Please be certain.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={handleProceedToConfirm}>
                I Understand, Continue
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-4 pt-2">
                <p>
                  To confirm deletion, please type <strong>{CONFIRM_PHRASE}</strong> below:
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete" className="sr-only">
                    Confirmation text
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={CONFIRM_PHRASE}
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={confirmText !== CONFIRM_PHRASE || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Permanently Delete Account
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
