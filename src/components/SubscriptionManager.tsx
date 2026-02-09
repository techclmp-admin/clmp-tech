import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const SubscriptionManager = () => {
  const { limits, plans, loading } = useSubscription();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const handleSubscribe = async (planId: string, interval: 'monthly' | 'yearly' = 'monthly') => {
    setProcessingPlan(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('stripe-checkout', {
        body: {
          planId: `${planId}_${interval}`,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        // Open in new tab to avoid iframe restrictions from Stripe
        window.open(url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };


  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const response = await supabase.functions.invoke('stripe-portal', {
        body: {
          returnUrl: `${window.location.origin}/billing`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        // Open in new tab to avoid iframe restrictions from Stripe
        window.open(url, '_blank');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setOpeningPortal(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {limits?.has_subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Subscription
              <div className="flex items-center gap-2">
                <Badge variant={limits.status === 'active' ? 'default' : 'secondary'}>
                  {limits.status}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={openingPortal}
                >
                  {openingPortal ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Manage
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{limits.plan_name}</div>
                <div className="text-sm text-muted-foreground">Current Plan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{limits.current_projects}/{limits.max_projects}</div>
                <div className="text-sm text-muted-foreground">Projects Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{limits.current_users}/{limits.max_users}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {limits.current_period_end
                    ? new Date(limits.current_period_end).toLocaleDateString()
                    : limits.trial_end_date
                      ? new Date(limits.trial_end_date).toLocaleDateString()
                      : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {limits.trial_end_date && !limits.current_period_end ? 'Trial Ends' : 'Next Billing'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.name === 'Standard' ? 'border-primary' : ''}`}>
              {plan.name === 'Standard' && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                  POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price_prefix && (
                    <span className="text-base font-normal text-muted-foreground mr-1">{plan.price_prefix}</span>
                  )}
                  ${plan.price_cad.toLocaleString()} CAD
                  <span className="text-base font-normal text-muted-foreground">
                    /month/project
                  </span>
                </div>
                {plan.price_note && (
                  <p className="text-sm text-primary font-medium">{plan.price_note}</p>
                )}
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.includes_header && (
                  <p className="text-sm font-semibold text-foreground">{plan.includes_header}</p>
                )}
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleSubscribe(plan.id, 'monthly')}
                    disabled={limits?.plan_name === plan.name || processingPlan === plan.id}
                  >
                    {processingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {limits?.plan_name === plan.name ? 'Current Plan' : 'Monthly'}
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1" 
                    onClick={() => handleSubscribe(plan.id, 'yearly')}
                    disabled={limits?.plan_name === plan.name || processingPlan === plan.id}
                  >
                    Yearly (Save 20%)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>


      {/* Free Trial CTA */}
      {!limits?.has_subscription && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-2">Start Your 30-Day Free Trial</h3>
            <p className="text-muted-foreground mb-6">
              No credit card required. Cancel anytime. Get full access to all features.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-secondary"
              onClick={() => handleSubscribe('standard', 'monthly')}
            >
              Start Free Trial
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManager;
