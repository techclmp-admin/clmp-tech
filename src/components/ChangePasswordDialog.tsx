import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key, Eye, EyeOff, Loader2 } from "lucide-react";

export const ChangePasswordDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      // Get current user for email
      const { data: { user } } = await supabase.auth.getUser();
      
      // Send password change confirmation email
      if (user?.email) {
        try {
          const now = new Date();
          await supabase.functions.invoke('send-email', {
            body: {
              template_key: 'password_change_confirmation',
              recipient_email: user.email,
              recipient_user_id: user.id,
              variables: {
                user_name: user.user_metadata?.display_name || user.email.split('@')[0],
                change_date: now.toLocaleDateString('en-CA', { 
                  timeZone: 'America/Toronto',
                  dateStyle: 'full'
                }),
                change_time: now.toLocaleTimeString('en-CA', { 
                  timeZone: 'America/Toronto',
                  timeStyle: 'short'
                }),
                timezone: 'EST',
                reset_password_url: `${window.location.origin}/auth`
              }
            }
          });
        } catch (emailError) {
          console.error('Failed to send password change email:', emailError);
        }
      }

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated."
      });

      setPasswords({ current: '', new: '', confirm: '' });
      setOpen(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Key className="h-4 w-4 mr-2" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your new password below. Make sure it's at least 6 characters long.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="Enter new password"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Confirm new password"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={loading || !passwords.new || !passwords.confirm}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
