import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { enforceRateLimit } from "../_shared/rateLimit.ts";
import { getStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-PRICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    getStripeClient();

    // Initialize Supabase client to verify admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const rateLimited = await enforceRateLimit(corsHeaders, {
      key: `update-price:user:${user.id}`,
      limit: 20,
      windowSeconds: 60,
    });
    if (rateLimited) return rateLimited;

    // Verify admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Access denied. Admin role required.");
    }
    logStep("Admin role verified");

    const { productId, newAmount, interval } = await req.json();
    if (!productId || !newAmount) {
      throw new Error("Missing required fields: productId, newAmount");
    }
    logStep("Request params", { productId, newAmount, interval });

    const stripe = getStripeClient();

    // Get existing active prices for the product
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 10,
    });
    logStep("Found existing prices", { count: existingPrices.data.length });

    // Create new price
    const newPriceData: Stripe.PriceCreateParams = {
      product: productId,
      unit_amount: Math.round(newAmount * 100), // Convert to cents
      currency: "brl",
      recurring: {
        interval: interval === "year" ? "year" : "month",
      },
    };

    const newPrice = await stripe.prices.create(newPriceData);
    logStep("New price created", { priceId: newPrice.id, amount: newPrice.unit_amount });

    // Update product's default price FIRST (before archiving old prices)
    await stripe.products.update(productId, {
      default_price: newPrice.id,
    });
    logStep("Updated product default price");

    // Archive old prices with the same interval (now safe since default was updated)
    for (const oldPrice of existingPrices.data) {
      if (oldPrice.recurring?.interval === (interval === "year" ? "year" : "month")) {
        await stripe.prices.update(oldPrice.id, { active: false });
        logStep("Archived old price", { priceId: oldPrice.id });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      newPriceId: newPrice.id,
      amount: newPrice.unit_amount 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
