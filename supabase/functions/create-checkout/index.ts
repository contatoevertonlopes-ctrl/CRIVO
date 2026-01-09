import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { enforceRateLimit } from "../_shared/rateLimit.ts";
import { getStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("EDGE_SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { priceType } = await req.json();
    
    if (!priceType || !["monthly", "annual"].includes(priceType)) {
      throw new Error("Invalid price type");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const rateLimited = await enforceRateLimit(corsHeaders, {
      key: `create-checkout:user:${user.id}`,
      limit: 10,
      windowSeconds: 60,
    });
    if (rateLimited) return rateLimited;

    console.log("[CREATE-CHECKOUT] User authenticated:", user.email);

    const stripe = getStripeClient();

    // Fetch active prices dynamically from Stripe.
    // Use products.list() instead of products.search() for better compatibility.
    const productName = priceType === "annual" ? "Plano Pro Anual" : "Plano Pro Mensal";
    const products = await stripe.products.list({ active: true, limit: 100 });
    const product = products.data.find((p) => p.name === productName);

    if (!product) {
      throw new Error(
        `Product not found: ${productName}. Create an ACTIVE product in Stripe (Test mode) with this exact name.`
      );
    }
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      throw new Error(`No active price found for product: ${productName}`);
    }

    const priceId = prices.data[0].id;
    console.log("[CREATE-CHECKOUT] Using price:", priceId);

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-CHECKOUT] Existing customer found:", customerId);
    }

    const origin = req.headers.get("origin") ?? "";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        plan_type: priceType,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: priceType,
        },
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/plans?success=true`,
      cancel_url: `${origin}/plans?canceled=true`,
    });

    console.log("[CREATE-CHECKOUT] Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
