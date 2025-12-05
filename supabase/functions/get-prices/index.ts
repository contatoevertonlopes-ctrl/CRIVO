import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-PRICES] ${step}${detailsStr}`);
};

// Product IDs from Stripe
const MONTHLY_PRODUCT_ID = "prod_TXoqM83X412xRF";
const ANNUAL_PRODUCT_ID = "prod_TXoru4mtSgWkWf";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get active prices for both products
    const [monthlyPrices, annualPrices] = await Promise.all([
      stripe.prices.list({ product: MONTHLY_PRODUCT_ID, active: true, limit: 1 }),
      stripe.prices.list({ product: ANNUAL_PRODUCT_ID, active: true, limit: 1 }),
    ]);

    logStep("Fetched prices", { 
      monthlyCount: monthlyPrices.data.length, 
      annualCount: annualPrices.data.length 
    });

    const monthlyPrice = monthlyPrices.data[0];
    const annualPrice = annualPrices.data[0];

    const monthlyAmount = monthlyPrice ? (monthlyPrice.unit_amount || 0) / 100 : 0;
    const annualAmount = annualPrice ? (annualPrice.unit_amount || 0) / 100 : 0;
    
    // Calculate equivalent monthly and savings
    const monthlyEquivalent = annualAmount > 0 ? annualAmount / 12 : 0;
    const yearlyCostIfMonthly = monthlyAmount * 12;
    const savings = yearlyCostIfMonthly > 0 
      ? Math.round(((yearlyCostIfMonthly - annualAmount) / yearlyCostIfMonthly) * 100) 
      : 0;

    logStep("Calculated prices", { 
      monthlyAmount, 
      annualAmount, 
      monthlyEquivalent, 
      savings 
    });

    return new Response(JSON.stringify({
      monthly: {
        amount: monthlyAmount,
        priceId: monthlyPrice?.id || null,
      },
      annual: {
        amount: annualAmount,
        priceId: annualPrice?.id || null,
        monthlyEquivalent: Number(monthlyEquivalent.toFixed(2)),
        savings,
      },
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
