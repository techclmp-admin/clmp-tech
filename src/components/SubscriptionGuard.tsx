import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { limits, loading, isPending, isTrialing } = useSubscription();
  const navigate = useNavigate();

  // Show loading spinner only for a short time, then render children anyway
  if (loading && !limits) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If limits is null but loading is done, just render children
  if (!limits) {
    return <>{children}</>;
  }

  // Show upgrade modal if trial is pending
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-2">Trial Period Expired</CardTitle>
              <CardDescription className="text-base">
                Your 30-day trial period has ended. Please choose a subscription plan to continue using CLMP.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What happens now?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Your account is temporarily suspended</li>
                <li>• Your projects and data are safe and secure</li>
                <li>• Choose a plan to restore full access immediately</li>
                <li>• All your data will be available once you upgrade</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/billing')} 
                className="flex-1"
                size="lg"
              >
                Choose a Plan
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show trial banner if in trial period
  if (isTrialing && limits?.trial_days_left !== undefined && limits.trial_days_left <= 7) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary/10 border-b border-primary/20 p-3">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">
                  {limits.trial_days_left === 0 
                    ? 'Your trial expires today!' 
                    : `${limits.trial_days_left} day${limits.trial_days_left !== 1 ? 's' : ''} left in your trial`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Choose Professional or Enterprise to continue
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/billing')}
              size="sm"
              variant="default"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
