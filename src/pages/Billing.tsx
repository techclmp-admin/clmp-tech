import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import SubscriptionManager from "@/components/SubscriptionManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const MAX_VERIFY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

const Billing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedPlan, setVerifiedPlan] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const verifyAttempts = useRef(0);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (!success || verified) return;

    const verifySession = async () => {
      setVerifying(true);
      verifyAttempts.current += 1;
      const attempt = verifyAttempts.current;

      try {
        const response = await supabase.functions.invoke('stripe-verify-session');

        if (response.error) {
          const detail = response.data?.error || response.error.message;
          console.error("Verify error:", detail);
          throw new Error(detail);
        }

        if (response.data?.success) {
          // Subscription confirmed — show success
          setVerified(true);
          setVerifiedPlan(response.data.plan || null);
          toast({
            title: "Subscription Activated!",
            description: `Your ${response.data.plan} plan is now active.`,
          });
          setRefreshKey(prev => prev + 1);
          setSearchParams({});
          setVerifying(false);
          return;
        }

        // Subscription not yet active — retry or give up
        if (attempt < MAX_VERIFY_ATTEMPTS) {
          console.log(`Verify attempt ${attempt}/${MAX_VERIFY_ATTEMPTS}: subscription not yet active, retrying in ${RETRY_DELAY_MS}ms...`);
          setVerifying(false);
          setTimeout(verifySession, RETRY_DELAY_MS);
          return;
        }

        // Exhausted retries
        console.error("Subscription not active after", MAX_VERIFY_ATTEMPTS, "attempts");
        toast({
          title: "Activation Pending",
          description: "Your payment was received. Your subscription should activate shortly — please refresh the page in a moment.",
        });
        setSearchParams({});
      } catch (error: any) {
        console.error("Session verification error:", error);
        if (attempt < MAX_VERIFY_ATTEMPTS) {
          console.log(`Verify attempt ${attempt} errored, retrying in ${RETRY_DELAY_MS}ms...`);
          setTimeout(verifySession, RETRY_DELAY_MS);
          return;
        }
        toast({
          title: "Verification Error",
          description: "Your payment was received but we couldn't confirm your plan. Please refresh the page.",
          variant: "destructive",
        });
        setSearchParams({});
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, [success, verified]);

  useEffect(() => {
    if (canceled) {
      toast({
        title: "Checkout Canceled",
        description: "Your subscription checkout was canceled.",
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [canceled, toast, setSearchParams]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your CLMP subscription, view usage, and upgrade your plan
          </p>
        </div>

        {/* Verifying banner */}
        {verifying && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="font-medium">Activating your subscription...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success banner */}
        {verified && (
          <Card className="mb-6 border-green-500 bg-green-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-700">Your subscription has been activated successfully!</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <SubscriptionManager key={refreshKey} verifiedPlan={verifiedPlan} />
      </div>
    </div>
  );
};

export default Billing;