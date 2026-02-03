import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const { user } = useAuth();
  const { limits, refreshSubscriptionData } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartTrial = async (planName: 'professional' | 'enterprise') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase.rpc('start_trial', {
        p_user_id: user.id,
        p_trial_days: 30
      });

      if (error) throw error;

      toast({
        title: "Trial Started!",
        description: `Your 30-day ${planName.charAt(0).toUpperCase() + planName.slice(1)} trial has started successfully.`,
      });

      // Refresh subscription data
      await refreshSubscriptionData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start trial",
        variant: "destructive"
      });
    }
  };

  const getButtonForPlan = (planId: string) => {
    if (!user) {
      return (
        <Button 
          variant={planId === 'professional' ? 'default' : 'outline'} 
          className={planId === 'professional' ? 'w-full bg-primary hover:bg-primary/90 mt-6' : 'w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 mt-6'}
          onClick={() => navigate('/auth')}
        >
          Start 30-Day Free Trial
        </Button>
      );
    }

    const currentPlan = limits?.plan_name?.toLowerCase() || 'professional';
    const isCurrentPlan = currentPlan === planId;
    const isTrialing = limits?.trial_end_date && new Date(limits.trial_end_date) > new Date();

    if (isCurrentPlan && isTrialing) {
      return <Button variant="outline" className="w-full mt-6" disabled>Current Trial</Button>;
    }

    if (isCurrentPlan && !isTrialing) {
      return <Button variant="outline" className="w-full mt-6" disabled>Current Plan</Button>;
    }

    // If trial expired, allow starting new trial
    if (limits?.status === 'pending') {
      return (
        <Button 
          className={planId === 'professional' ? 'w-full bg-primary hover:bg-primary/90 mt-6' : 'w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 mt-6'}
          onClick={() => handleStartTrial(planId as 'professional' | 'enterprise')}
        >
          Start 30-Day Free Trial
        </Button>
      );
    }

    return (
      <Button 
        variant="outline"
        className="w-full mt-6"
        onClick={() => navigate('/billing')}
      >
        Upgrade Plan
      </Button>
    );
  };

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with a 30-day free trial. No credit card required. Choose your plan anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Professional Plan */}
          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
              MOST POPULAR
            </Badge>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">Professional</CardTitle>
              <div className="text-4xl font-bold text-primary mb-2">$49 CAD</div>
              <p className="text-muted-foreground">per month</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">10 active projects</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Up to 25 team members</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Advanced task management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Priority email support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Advanced analytics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Custom reports</span>
                </li>
              </ul>
              {getButtonForPlan('professional')}
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-2 border-secondary bg-gradient-to-br from-secondary/5 to-accent/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-accent"></div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">Enterprise</CardTitle>
              <div className="text-4xl font-bold text-secondary mb-2">$199 CAD</div>
              <p className="text-muted-foreground">per month</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">20 projects</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">100 team members</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">All Professional features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">24/7 priority support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">API access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">Dedicated account manager</span>
                </li>
              </ul>
              {getButtonForPlan('enterprise')}
            </CardContent>
          </Card>
        </div>

        {/* Enterprise CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-4">Enterprise & Custom Solutions</h3>
              <p className="text-muted-foreground mb-6">
                Need custom pricing, on-premise deployment, or special integrations? 
                Let's discuss a solution that fits your enterprise needs.
              </p>
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;