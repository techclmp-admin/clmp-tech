import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    // SECURITY: Require webhook secret in production
    if (!webhookSecret) {
      console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not configured!");
      throw new Error("Webhook signature verification required - STRIPE_WEBHOOK_SECRET not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    let event: Stripe.Event;

    // SECURITY: Always verify webhook signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No Stripe signature found in request");
      throw new Error("No Stripe signature found");
    }
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (signatureError) {
      console.error("Webhook signature verification failed:", signatureError);
      throw new Error("Webhook signature verification failed");
    }

    console.log("Received verified Stripe event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;

        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        // Update payment status
        await supabase
          .from("stripe_payments")
          .update({
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string,
            amount: session.amount_total || 0,
          })
          .eq("stripe_checkout_session_id", session.id);

        // If subscription, update subscription record
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              plan: planId?.replace(/_monthly|_yearly/, "") || "basic",
              status: "active",
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              stripe_price_id: subscription.items.data[0]?.price.id,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_ends_at: null,
            }, {
              onConflict: "user_id",
            });

          // Update profile subscription status
          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_plan: planId?.replace(/_monthly|_yearly/, "") || "basic",
            })
            .eq("user_id", userId);

          console.log("Subscription activated for user:", userId);
        }

        // Log to subscription history
        await supabase.from("subscription_history").insert({
          user_id: userId,
          old_plan: "free",
          new_plan: planId || "basic",
          change_reason: "Stripe checkout completed",
        });

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get user_id from metadata or find by customer ID
        let userId = subscription.metadata?.user_id;
        
        if (!userId) {
          // Try to find user by customer ID
          const { data: customer } = await supabase
            .from("stripe_customers")
            .select("user_id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single();
          
          userId = customer?.user_id;
        }

        if (userId) {
          const status = subscription.status === "active" ? "active" : 
                        subscription.status === "past_due" ? "past_due" : 
                        subscription.status === "canceled" ? "canceled" : "inactive";

          // Get the plan from price lookup_key or product name
          let planName = "basic";
          if (subscription.items?.data?.[0]?.price?.lookup_key) {
            const lookupKey = subscription.items.data[0].price.lookup_key;
            planName = lookupKey.replace("price_", "").replace(/_monthly|_yearly/, "");
          }

          await supabase
            .from("subscriptions")
            .update({
              status,
              plan: planName,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          await supabase
            .from("profiles")
            .update({ 
              subscription_status: status,
              subscription_plan: planName
            })
            .eq("user_id", userId);

          console.log("Subscription updated for user:", userId, "Status:", status, "Plan:", planName);
        } else {
          console.log("Could not find user for subscription update:", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          await supabase
            .from("profiles")
            .update({
              subscription_status: "canceled",
              subscription_plan: "free",
            })
            .eq("user_id", userId);

          console.log("Subscription canceled for user:", userId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment succeeded:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: customer } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (customer) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("user_id", customer.user_id);

          console.log("Payment failed for user:", customer.user_id);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
