import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    console.log("Verifying sessions for user:", user.id);

    // Find the user's Stripe customer
    const { data: customerData } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!customerData) {
      console.log("No Stripe customer found for user");
      return new Response(
        JSON.stringify({ success: false, message: "No Stripe customer found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get the customer's active subscriptions directly from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerData.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.log("No active subscriptions found in Stripe");
      return new Response(
        JSON.stringify({ success: false, message: "No active subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const subscription = subscriptions.data[0];
    console.log("Found active subscription:", subscription.id);

    // Determine plan name from price lookup_key or metadata
    let planName = "standard";
    if (subscription.items?.data?.[0]?.price?.lookup_key) {
      const lookupKey = subscription.items.data[0].price.lookup_key;
      planName = lookupKey.replace("price_", "").replace(/_monthly|_yearly/, "");
    } else if (subscription.metadata?.plan_id) {
      planName = subscription.metadata.plan_id.replace(/_monthly|_yearly/, "");
    }

    // Update subscriptions table
    await supabase
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        plan: planName,
        status: "active",
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerData.stripe_customer_id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_ends_at: null,
      }, {
        onConflict: "user_id",
      });

    // Update profile
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_plan: planName,
      })
      .eq("user_id", user.id);

    console.log("Successfully synced subscription for user:", user.id, "Plan:", planName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: planName,
        status: "active",
        message: "Subscription synced successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Verify session error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
