import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, Sparkles, Building2, Crown, Tag, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'projects' | 'users';
  currentPlan?: string;
  currentUsage?: {
    current: number;
    max: number;
  };
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Sparkles,
    price: 0,
    priceLabel: '/month',
    description: 'Perfect for getting started',
    maxProjects: 1,
    maxUsers: 5,
    features: [
      { name: '1 Active Project', included: true },
      { name: 'Up to 5 Team Members', included: true },
      { name: 'Basic Task Management', included: true },
      { name: 'Email Support', included: true },
      { name: 'Advanced Analytics', included: false },
      { name: 'Priority Support', included: false },
      { name: 'Custom Integrations', included: false },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    icon: Building2,
    price: 400,
    priceLabel: '/month/project',
    description: 'For growing construction teams',
    maxProjects: 10,
    maxUsers: 25,
    popular: true,
    features: [
      { name: 'Project scheduling & task management', included: true },
      { name: 'Cost tracking, budgets & expenses', included: true },
      { name: 'Invoicing & document management', included: true },
      { name: 'Subcontractor communication', included: true },
      { name: 'QuickBooks & Sage 50 integration', included: true },
      { name: 'MS Project import/export', included: true },
      { name: 'Standard analytics & reports', included: true },
      { name: 'Email support', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    price: 1200,
    priceLabel: '/month/project',
    description: 'For large organizations',
    maxProjects: 20,
    maxUsers: 100,
    features: [
      { name: 'All Standard features included', included: true },
      { name: 'Multi-project dashboards', included: true },
      { name: 'Advanced analytics & forecasting', included: true },
      { name: 'Team-level roles & permissions', included: true },
      { name: 'Compliance-ready reporting', included: true },
      { name: 'API access', included: true },
      { name: 'Priority support (SLA)', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
  },
];

export function SubscriptionUpgradeModal({
  open,
  onOpenChange,
  limitType,
  currentPlan,
  currentUsage,
}: SubscriptionUpgradeModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/billing');
  };

  const getLimitMessage = () => {
    if (!currentUsage) return '';
    
    if (limitType === 'projects') {
      return `You've reached your project limit (${currentUsage.current}/${currentUsage.max} projects used)`;
    }
    return `You've reached your team member limit (${currentUsage.current}/${currentUsage.max} members)`;
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setValidatingPromo(true);
    try {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: promoCode.trim()
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.valid) {
        setAppliedPromo({
          code: promoCode.trim(),
          discountType: result.discount_type,
          discountValue: typeof result.discount_value === 'string' 
            ? parseFloat(result.discount_value) 
            : result.discount_value
        });
        toast({
          title: "Promo code applied!",
          description: result.message,
        });
      } else {
        toast({
          title: "Invalid promo code",
          description: result?.message || "This promo code is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast({
        title: "Error",
        description: "Failed to validate promo code",
        variant: "destructive",
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!appliedPromo) return originalPrice;

    if (appliedPromo.discountType === 'percentage') {
      return originalPrice * (1 - appliedPromo.discountValue / 100);
    } else {
      return Math.max(0, originalPrice - appliedPromo.discountValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upgrade Your Subscription</DialogTitle>
          <DialogDescription className="text-base">
            {getLimitMessage()}. Choose a plan that fits your needs.
          </DialogDescription>
        </DialogHeader>

        {/* Promo Code Section */}
        <div className="mt-6 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Have a promo code?</h3>
          </div>
          
          {appliedPromo ? (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md">
              <div className="flex items-center gap-2">
                <Badge variant="default">{appliedPromo.code}</Badge>
                <span className="text-sm text-muted-foreground">
                  {appliedPromo.discountType === 'percentage' 
                    ? `${appliedPromo.discountValue}% off` 
                    : `$${appliedPromo.discountValue} off`}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRemovePromo}
                className="h-8 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
              />
              <Button 
                onClick={handleApplyPromo} 
                disabled={!promoCode.trim() || validatingPromo}
                variant="outline"
              >
                {validatingPromo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan?.toLowerCase() === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'border-muted-foreground' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge variant="outline" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Current Plan
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    {appliedPromo && plan.price > 0 ? (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground line-through">
                          ${plan.price}{plan.priceLabel}
                        </div>
                        <div>
                          <span className="text-4xl font-bold text-primary">
                            ${calculateDiscountedPrice(plan.price).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">{plan.priceLabel}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Save ${(plan.price - calculateDiscountedPrice(plan.price)).toFixed(2)}
                        </Badge>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">{plan.priceLabel}</span>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 pb-4 border-b">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Projects</span>
                      <span className="font-semibold">{plan.maxProjects}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Team Members</span>
                      <span className="font-semibold">{plan.maxUsers}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full mt-4"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={handleUpgrade}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>All prices in CAD. Cancel anytime. No hidden fees.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
