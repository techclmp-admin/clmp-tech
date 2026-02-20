import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { markReturningUser } from '@/hooks/useReturningUser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  settingUpAccount: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithSSO: (provider: 'google' | 'facebook' | 'linkedin_oidc' | 'github') => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  updateProfile: (data: { first_name?: string; last_name?: string; avatar_url?: string; bio?: string }) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingUpAccount, setSettingUpAccount] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Remember this browser has an account so the landing page
          // can show "Login" instead of "Start Free Trial" on future visits
          markReturningUser();

          // Show loading indicator
          setSettingUpAccount(true);
          
          // Defer ban check and other async operations
          setTimeout(async () => {
            // Retry logic to wait for profile creation by trigger
            let profile = null;
            let retries = 0;
            const maxRetries = 5;
            
            while (!profile && retries < maxRetries) {
              const { data, error: profileError } = await supabase
                .from('profiles')
                .select('is_banned, banned_reason, created_at')
                .eq('id', session.user.id)
                .maybeSingle();
              
              profile = data;
              
              // If profile not found and no error, wait and retry
              if (!profile && !profileError) {
                retries++;
                if (retries < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 500 * retries)); // Exponential backoff
                  continue;
                }
              }
              break;
            }

            // Check if profile exists after retries (user not deleted)
            if (!profile) {
              setSettingUpAccount(false);
              await supabase.auth.signOut();
              toast({
                title: "Account Setup Error",
                description: "There was an issue setting up your account. Please try signing up again or contact support.",
                variant: "destructive",
                duration: 5000
              });
              navigate('/');
              return;
            }

            // Check if user is banned
            if (profile?.is_banned) {
              setSettingUpAccount(false);
              await supabase.auth.signOut();
              toast({
                title: "Account Banned",
                description: profile.banned_reason || "Your account has been banned. Please contact support for more information.",
                variant: "destructive",
                duration: 7000
              });
              navigate('/');
              return;
            }

            // Check if this is a new SSO user (profile created within last 30 seconds)
            const profileCreatedAt = new Date(profile.created_at);
            const now = new Date();
            const isNewUser = (now.getTime() - profileCreatedAt.getTime()) < 30000; // 30 seconds

            // Send welcome email for new SSO users
            if (isNewUser && session.user.app_metadata?.provider !== 'email') {
              const userName = session.user.user_metadata?.full_name || 
                               session.user.user_metadata?.name ||
                               session.user.email?.split('@')[0] || 'User';
              
              supabase.functions.invoke('send-email', {
                body: {
                  template_key: 'welcome',
                  recipient_email: session.user.email,
                  recipient_user_id: session.user.id,
                  variables: {
                    user_name: userName,
                    dashboard_url: 'https://clmp.ca/dashboard'
                  }
                }
              }).catch(err => {
                console.warn('Failed to send welcome email for SSO user:', err);
              });
            }

            // Update last_login
            updateLastLogin(session.user.id);
            
            // Hide loading indicator
            setSettingUpAccount(false);
            
            // Only redirect to dashboard if user is on auth page or landing page
            // Don't redirect if user is already on an app page (e.g., after refresh)
            const currentPath = window.location.pathname;
            if (currentPath === '/auth' || currentPath === '/') {
              navigate('/dashboard');
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setSettingUpAccount(false);
          navigate('/');
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if current user still has valid profile and is not banned
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned, banned_reason')
          .eq('id', session.user.id)
          .maybeSingle();

        // If profile doesn't exist, user was deleted - sign them out
        if (!profile && !profileError) {
          await supabase.auth.signOut();
          toast({
            title: "Account Not Found",
            description: "Your account has been deleted. Please contact support if you believe this is an error.",
            variant: "destructive",
            duration: 5000
          });
          setSession(null);
          setUser(null);
        } else if (profile?.is_banned) {
          // If user is banned, sign them out with reason
          await supabase.auth.signOut();
          toast({
            title: "Account Banned",
            description: profile.banned_reason || "Your account has been banned. Please contact support for more information.",
            variant: "destructive",
            duration: 7000
          });
          setSession(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const updateLastLogin = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName
          }
        }
      });

      if (error) {
        // Provide helpful message for existing users
        if (error.message?.includes('already registered')) {
          toast({
            title: "Account already exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link"
        });

        // Send welcome email asynchronously (don't block signup flow)
        if (data?.user) {
          const userName = displayName || email.split('@')[0];
          supabase.functions.invoke('send-email', {
            body: {
              template_key: 'welcome',
              recipient_email: email,
              recipient_user_id: data.user.id,
              variables: {
                user_name: userName,
                dashboard_url: 'https://clmp.ca/dashboard'
              }
            }
          }).catch(err => {
            console.warn('Failed to send welcome email:', err);
          });
        }
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Check if user profile exists and status
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned, banned_reason')
          .eq('id', data.user.id)
          .maybeSingle();

        // If profile doesn't exist, user was deleted
        if (!profile && !profileError) {
          await supabase.auth.signOut();
          const deleteError = new Error('This account no longer exists.');
          toast({
            title: "Account Not Found",
            description: "This account has been deleted. Please contact support if you believe this is an error.",
            variant: "destructive",
            duration: 5000
          });
          return { error: deleteError };
        }

        // If user is banned, show reason and sign out
        if (profile?.is_banned) {
          await supabase.auth.signOut();
          const banError = new Error(profile.banned_reason || 'Your account has been banned.');
          toast({
            title: "Account Banned",
            description: profile.banned_reason || "Your account has been banned. Please contact support for more information.",
            variant: "destructive",
            duration: 7000
          });
          return { error: banError };
        }
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signInWithSSO = async (provider: 'google' | 'facebook' | 'linkedin_oidc' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast({
          title: "SSO sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "SSO sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password reset email sent",
          description: "Check your email for password reset instructions"
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully"
        });

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
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const updateProfile = async (data: { first_name?: string; last_name?: string; avatar_url?: string; bio?: string }) => {
    try {
      if (!user) return { error: new Error('No user logged in') };

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully"
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      settingUpAccount,
      signUp,
      signIn,
      signInWithSSO,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};