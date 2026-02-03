import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface MagicLinkFormProps {
  onBack: () => void;
}

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" }).max(255);

export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    try {
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email: result.data,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (supabaseError) {
        toast({
          title: "Failed to send magic link",
          description: supabaseError.message,
          variant: "destructive"
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Magic link sent!",
          description: "Check your email for the login link"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a magic link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in the email to sign in instantly. The link will expire in 1 hour.
          </p>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Sign in with Magic Link</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to sign in instantly - no password needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="magic-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                className="pl-9"
                required
                disabled={isLoading}
                maxLength={255}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !email.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Sparkles className="mr-2 h-4 w-4" />
            Send Magic Link
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            onClick={onBack}
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
