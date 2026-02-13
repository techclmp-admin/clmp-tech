import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function TrialStatusBanner() {
  const { limits, isTrialing } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (!limits?.trial_end_date) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(limits.trial_end_date!);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Trial expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [limits?.trial_end_date]);

  // Handle direct upgrade to Standard plan
  const handleUpgradeNow = async () => {
    setIsUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upgrade",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const response = await supabase.functions.invoke('stripe-checkout', {
        body: {
          planId: 'standard_monthly',
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!isTrialing || !limits) return null;

  const daysLeft = limits.trial_days_left || 0;
  const totalDays = 30;
  const progressValue = ((totalDays - daysLeft) / totalDays) * 100;

  // Color scheme based on days left
  const getColorScheme = () => {
    if (daysLeft <= 3) return {
      gradient: 'from-red-500/10 via-red-500/5 to-background',
      border: 'border-red-500/20',
      badge: 'bg-red-500/10 text-red-600 border-red-500/20',
      icon: 'text-red-600',
      progress: 'bg-red-500'
    };
    if (daysLeft <= 7) return {
      gradient: 'from-amber-500/10 via-amber-500/5 to-background',
      border: 'border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: 'text-amber-600',
      progress: 'bg-amber-500'
    };
    return {
      gradient: 'from-primary/10 via-primary/5 to-background',
      border: 'border-primary/20',
      badge: 'bg-primary/10 text-primary border-primary/20',
      icon: 'text-primary',
      progress: 'bg-primary'
    };
  };

  const colors = getColorScheme();

  return (
    <Card className={`relative overflow-hidden border-2 ${colors.border} bg-gradient-to-r ${colors.gradient} animate-in fade-in slide-in-from-top-2 duration-500`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl bg-background border ${colors.border} shadow-sm`}>
              <Sparkles className={`h-6 w-6 ${colors.icon}`} />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className={`${colors.badge} font-semibold text-sm px-3 py-1`}>
                  {limits.plan_name} Trial Active
                </Badge>
                <div className={`flex items-center gap-2 text-sm font-medium ${colors.icon}`}>
                  <Clock className="h-4 w-4" />
                  <span>{timeLeft} remaining</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-foreground font-medium">
                    Trial Progress - {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </p>
                  <span className="text-muted-foreground">
                    {totalDays - daysLeft} / {totalDays} days used
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  You're enjoying full access to {limits.plan_name} features. Upgrade anytime to continue after trial ends.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 lg:flex-col w-full lg:w-auto">
            <Button 
              onClick={handleUpgradeNow}
              disabled={isUpgrading}
              size="lg"
              className="flex-1 lg:flex-initial bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isUpgrading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Upgrade Now
              {!isUpgrading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            <Button 
              onClick={() => navigate('/billing')}
              variant="outline"
              size="lg"
              className="flex-1 lg:flex-initial"
            >
              View Plans
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
