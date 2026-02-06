import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan configuration - mode determines subscription vs one-time
const PLAN_CONFIG: Record<string, { mode: "subscription" | "payment" }> = {
  // Subscription plans
  standard_monthly: { mode: "subscription" },
  standard_yearly: { mode: "subscription" },
  enterprise_monthly: { mode: "subscription" },
  enterprise_yearly: { mode: "subscription" },
  // One-time add-ons
  additional_projects: { mode: "payment" },
  additional_users: { mode: "payment" },
  priority_support: { mode: "payment" },
  ai_risk_addon: { mode: "payment" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Invalid user token");
    }

    const user = userData.user;
    const { planId, successUrl, cancelUrl } = await req.json();

    if (!planId) {
      throw new Error("Plan ID is required");
    }

    const planConfig = PLAN_CONFIG[planId];
    if (!planConfig) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Get price by lookup key
    const lookupKey = `price_${planId}`;
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
    });

    if (prices.data.length === 0) {
      throw new Error(`Price not found for: ${lookupKey}. Please run stripe-setup-products first.`);
    }

    const priceId = prices.data[0].id;

    // Check for existing Stripe customer
    let stripeCustomerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer mapping
      await supabase.from("stripe_customers").insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
      });
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: planConfig.mode,
      success_url: successUrl || `${req.headers.get("origin")}/billing?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    };

    // Add subscription-specific options
    if (planConfig.mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Log the payment attempt
    await supabase.from("stripe_payments").insert({
      user_id: user.id,
      stripe_checkout_session_id: session.id,
      amount: 0, // Will be updated by webhook
      status: "pending",
      product_type: planConfig.mode === "subscription" ? "subscription" : "addon",
      product_id: planId,
      metadata: { plan_id: planId },
    });

    console.log("Checkout session created:", session.id, "for plan:", planId);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
