import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    getStripeClient();
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // FIRST: Check local database for admin-granted subscriptions
    const { data: localSub, error: localSubError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!localSubError && localSub && localSub.status === "active" && localSub.plan === "pro") {
      logStep("Found active Pro subscription in local database", { 
        plan: localSub.plan, 
        status: localSub.status,
        expires_at: localSub.expires_at 
      });
      
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: "local_pro",
        subscription_end: localSub.expires_at,
        plan_type: "monthly", // Default for admin-granted
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No active Pro in local DB, checking Stripe");

    // SECOND: Check Stripe for paid subscriptions
    const stripe = getStripeClient();
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let planType = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const rawCurrentPeriodEnd = (subscription as any).current_period_end as unknown;
      const parsedCurrentPeriodEnd =
        typeof rawCurrentPeriodEnd === "number"
          ? rawCurrentPeriodEnd
          : typeof rawCurrentPeriodEnd === "string"
            ? Number(rawCurrentPeriodEnd)
            : typeof rawCurrentPeriodEnd === "bigint"
              ? Number(rawCurrentPeriodEnd)
              : NaN;

      if (Number.isFinite(parsedCurrentPeriodEnd) && parsedCurrentPeriodEnd > 0) {
        subscriptionEnd = new Date(parsedCurrentPeriodEnd * 1000).toISOString();
      } else {
        subscriptionEnd = null;
        logStep("Missing/invalid current_period_end", {
          subscriptionId: subscription.id,
          value: rawCurrentPeriodEnd,
          type: typeof rawCurrentPeriodEnd,
        });
      }
      productId = subscription.items.data[0].price.product as string;
      
      // Determine plan type based on Stripe recurring interval
      const interval = subscription.items.data[0].price.recurring?.interval;
      planType = interval === "month" ? "monthly" : interval === "year" ? "annual" : null;
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd, planType });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      plan_type: planType,
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
