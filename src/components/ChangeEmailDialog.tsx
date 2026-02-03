import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" }).max(255);

export const ChangeEmailDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleChangeEmail = async () => {
    setError('');

    // Validate new email
    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Check emails match
    if (newEmail !== confirmEmail) {
      setError('Email addresses do not match');
      return;
    }

    // Check if same as current
    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setError('New email must be different from current email');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: result.data
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Verification email sent",
        description: "Please check both your current and new email addresses to confirm the change."
      });

      setOpen(false);
      setNewEmail('');
      setConfirmEmail('');
    } catch (err: any) {
      console.error('Email change error:', err);
      setError(err.message || 'Failed to update email');
      toast({
        title: "Failed to change email",
        description: err.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const emailsMatch = newEmail === confirmEmail;
  const isValidEmail = emailSchema.safeParse(newEmail).success;
  const canSubmit = newEmail && confirmEmail && emailsMatch && isValidEmail && !loading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Change Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address. You'll need to verify both your current and new email addresses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              After changing your email, you'll receive verification emails at both addresses. 
              You must confirm both to complete the change.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="current-email">Current Email</Label>
            <Input
              id="current-email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError('');
              }}
              disabled={loading}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">Confirm New Email</Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder="Confirm new email address"
              value={confirmEmail}
              onChange={(e) => {
                setConfirmEmail(e.target.value);
                setError('');
              }}
              disabled={loading}
              maxLength={255}
            />
            {confirmEmail && !emailsMatch && (
              <p className="text-sm text-destructive">Email addresses do not match</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleChangeEmail}
            disabled={!canSubmit}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Verification Emails
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
