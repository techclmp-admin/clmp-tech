import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product and price definitions
// Prices are in cents (CAD)
// Standard: $400 CAD/month, $3,840 CAD/year (20% discount)
// Enterprise: $1,200 CAD/month, $11,520 CAD/year (20% discount)
const PRODUCTS = [
  {
    name: "Standard Plan",
    description: "For growing construction teams",
    prices: [
      { id: "standard_monthly", amount: 40000, interval: "month" as const },
      { id: "standard_yearly", amount: 384000, interval: "year" as const },
    ],
  },
  {
    name: "Enterprise Plan",
    description: "For large construction enterprises",
    prices: [
      { id: "enterprise_monthly", amount: 120000, interval: "month" as const },
      { id: "enterprise_yearly", amount: 1152000, interval: "year" as const },
    ],
  },
];

const ADDONS = [
  {
    name: "Additional Projects Pack",
    description: "Add 5 more active projects to your plan",
    priceId: "additional_projects",
    amount: 2900,
  },
  {
    name: "Additional Team Members",
    description: "Add 10 more team members to your plan",
    priceId: "additional_users",
    amount: 4900,
  },
  {
    name: "Priority Support",
    description: "24/7 priority support with dedicated account manager",
    priceId: "priority_support",
    amount: 9900,
  },
  {
    name: "AI Risk Analysis Add-on",
    description: "Advanced AI-powered risk analysis and predictions",
    priceId: "ai_risk_addon",
    amount: 7900,
  },
];

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

    const results: any = {
      subscriptionProducts: [],
      addonProducts: [],
      priceMapping: {},
    };

    // Create subscription products and prices
    for (const product of PRODUCTS) {
      console.log(`Creating product: ${product.name}`);
      
      // Check if product already exists
      const existingProducts = await stripe.products.search({
        query: `name:'${product.name}'`,
      });

      let stripeProduct: Stripe.Product;
      
      if (existingProducts.data.length > 0) {
        stripeProduct = existingProducts.data[0];
        console.log(`Product already exists: ${stripeProduct.id}`);
      } else {
        stripeProduct = await stripe.products.create({
          name: product.name,
          description: product.description,
          metadata: {
            type: "subscription",
          },
        });
        console.log(`Created product: ${stripeProduct.id}`);
      }

      results.subscriptionProducts.push({
        name: product.name,
        productId: stripeProduct.id,
      });

      // Create prices for this product - always create new price to ensure correct amount
      for (const priceConfig of product.prices) {
        const lookupKey = `price_${priceConfig.id}`;
        
        // Check if price with this lookup_key exists and has correct amount
        const existingPrices = await stripe.prices.list({
          lookup_keys: [lookupKey],
        });

        let stripePrice: Stripe.Price;
        const existingPrice = existingPrices.data[0];

        // If price exists with different amount, create new one and transfer lookup_key
        if (existingPrice && existingPrice.unit_amount === priceConfig.amount) {
          stripePrice = existingPrice;
          console.log(`Price already exists with correct amount: ${stripePrice.id} ($${priceConfig.amount / 100})`);
        } else {
          // Create new price - transfer_lookup_key will move the key from old price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceConfig.amount,
            currency: "cad",
            recurring: {
              interval: priceConfig.interval,
            },
            lookup_key: lookupKey,
            transfer_lookup_key: true, // This transfers the key from any existing price
          });
          
          if (existingPrice) {
            console.log(`Created NEW price: ${stripePrice.id} ($${priceConfig.amount / 100}) - replaced old price ${existingPrice.id} ($${existingPrice.unit_amount! / 100})`);
          } else {
            console.log(`Created price: ${stripePrice.id} for ${priceConfig.id} ($${priceConfig.amount / 100})`);
          }
        }

        results.priceMapping[lookupKey] = stripePrice.id;
      }
    }

    // Create addon products (one-time payments)
    for (const addon of ADDONS) {
      console.log(`Creating addon: ${addon.name}`);

      const existingProducts = await stripe.products.search({
        query: `name:'${addon.name}'`,
      });

      let stripeProduct: Stripe.Product;

      if (existingProducts.data.length > 0) {
        stripeProduct = existingProducts.data[0];
        console.log(`Addon already exists: ${stripeProduct.id}`);
      } else {
        stripeProduct = await stripe.products.create({
          name: addon.name,
          description: addon.description,
          metadata: {
            type: "addon",
          },
        });
        console.log(`Created addon: ${stripeProduct.id}`);
      }

      // Create one-time price - check if amount matches
      const lookupKey = `price_${addon.priceId}`;
      const existingPrices = await stripe.prices.list({
        lookup_keys: [lookupKey],
      });

      let stripePrice: Stripe.Price;
      const existingPrice = existingPrices.data[0];

      if (existingPrice && existingPrice.unit_amount === addon.amount) {
        stripePrice = existingPrice;
        console.log(`Addon price already exists with correct amount: ${stripePrice.id}`);
      } else {
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: addon.amount,
          currency: "cad",
          lookup_key: lookupKey,
          transfer_lookup_key: true,
        });
        
        if (existingPrice) {
          console.log(`Created NEW addon price: ${stripePrice.id} ($${addon.amount / 100}) - replaced old`);
        } else {
          console.log(`Created addon price: ${stripePrice.id}`);
        }
      }

      results.addonProducts.push({
        name: addon.name,
        productId: stripeProduct.id,
        priceId: stripePrice.id,
      });

      results.priceMapping[lookupKey] = stripePrice.id;
    }

    console.log("Setup complete!", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Stripe products and prices created successfully",
        data: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Stripe setup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
