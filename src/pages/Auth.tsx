import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, Chrome, User, Mail, Lock, Sparkles } from 'lucide-react';
import { PasswordResetForm } from '@/components/PasswordResetForm';
import { PasswordUpdateForm } from '@/components/PasswordUpdateForm';
import { MagicLinkForm } from '@/components/MagicLinkForm';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';

const Auth = () => {
  const { isFeatureEnabled, isFeatureUpcoming, isLoading: featuresLoading } = useProjectFeatures();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, settingUpAccount, signUp, signIn, signInWithSSO } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Feature states for auth methods
  const googleEnabled = isFeatureEnabled('google_signin');
  const googleUpcoming = isFeatureUpcoming('google_signin');
  const emailEnabled = isFeatureEnabled('email_password');
  const emailUpcoming = isFeatureUpcoming('email_password');
  const magicLinkEnabled = isFeatureEnabled('magic_link');
  const magicLinkUpcoming = isFeatureUpcoming('magic_link');

  // If ALL auth methods are disabled (not upcoming), fallback to email/password as default
  const hasAnyAuthMethod = featuresLoading || googleEnabled || emailEnabled || magicLinkEnabled;
  
  // Show email/password form if explicitly enabled OR as fallback when all methods disabled
  const showEmailPasswordForm = emailEnabled || !hasAnyAuthMethod;

  // Check for password reset mode
  const mode = searchParams.get('mode');
  
  // Redirect if already authenticated (except for password reset)
  // Don't redirect while account is being set up to avoid race conditions
  useEffect(() => {
    if (user && mode !== 'reset' && !settingUpAccount) {
      // Check if there's a redirect URL stored (e.g., from invitation page)
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        // Navigate to the stored URL (but use the path only for security)
        try {
          const url = new URL(redirectUrl);
          navigate(url.pathname + url.search);
        } catch {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, mode, settingUpAccount]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        // If user already exists, suggest signing in instead
        if (error?.message?.includes('already registered')) {
          setIsSignUp(false);
        }
      } else {
        await signIn(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSO = async (provider: 'google' | 'facebook' | 'linkedin_oidc' | 'github') => {
    setIsLoading(true);
    try {
      await signInWithSSO(provider);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset mode
  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <PasswordUpdateForm />
      </div>
    );
  }

  // Handle magic link form
  if (showMagicLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <MagicLinkForm onBack={() => setShowMagicLink(false)} />
      </div>
    );
  }

  // Handle password reset form
  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <PasswordResetForm onBack={() => setShowPasswordReset(false)} />
      </div>
    );
  }

  // Show loading overlay while setting up account
  if (settingUpAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Setting Up Your Account</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we create your profile...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <img 
            src="/images/clmp-logo-full.png" 
            alt="CLMP Tech Inc" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to CLMP
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
          </p>
        </div>

        <Card className="border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google SSO Button - enabled or upcoming */}
            {(googleEnabled || googleUpcoming) && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full relative ${googleUpcoming ? 'opacity-60' : ''}`}
                  onClick={() => handleSSO('google')}
                  disabled={isLoading || googleUpcoming}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Continue with Google
                  {googleUpcoming && (
                    <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Soon</Badge>
                  )}
                </Button>
              </div>
            )}

            {(googleEnabled || googleUpcoming) && showEmailPasswordForm && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Email/Password Form - controlled by feature flag or fallback */}
            {showEmailPasswordForm && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Enter your full name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isSignUp ? "Create a password" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>
            )}

            <div className="text-center space-y-2">
              {!isSignUp && (
                <div className="flex flex-col items-center gap-1">
                  {showEmailPasswordForm && (
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm"
                      onClick={() => setShowPasswordReset(true)}
                    >
                      Forgot your password?
                    </Button>
                  )}
                  {(magicLinkEnabled || magicLinkUpcoming) && (
                    <Button
                      type="button"
                      variant="link"
                      className={`text-sm text-primary ${magicLinkUpcoming ? 'opacity-60' : ''}`}
                      onClick={() => setShowMagicLink(true)}
                      disabled={magicLinkUpcoming}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Sign in with Magic Link
                      {magicLinkUpcoming && (
                        <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Soon</Badge>
                      )}
                    </Button>
                  )}
                </div>
              )}
              {showEmailPasswordForm && (
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <Button
                    type="button"
                    variant="link"
                    className="pl-1"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </Button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;