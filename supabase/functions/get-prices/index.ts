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

const MONTHLY_PRODUCT_NAME = "Plano Pro Mensal";
const ANNUAL_PRODUCT_NAME = "Plano Pro Anual";

const getProductByName = async (stripe: Stripe, name: string) => {
  const products = await stripe.products.search({
    query: `name:"${name}" AND active:"true"`,
  });
  return products.data?.[0] ?? null;
};

const getActivePriceForProduct = async (stripe: Stripe, productId: string) => {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 1,
  });
  return prices.data?.[0] ?? null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");


    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Resolve products by name (avoids hard-coded prod_ IDs tied to a specific Stripe account)
    const [monthlyProduct, annualProduct] = await Promise.all([
      getProductByName(stripe, MONTHLY_PRODUCT_NAME),
      getProductByName(stripe, ANNUAL_PRODUCT_NAME),
    ]);

    if (!monthlyProduct) throw new Error(`No such product: ${MONTHLY_PRODUCT_NAME}`);
    if (!annualProduct) throw new Error(`No such product: ${ANNUAL_PRODUCT_NAME}`);

    const [monthlyPrice, annualPrice] = await Promise.all([
      getActivePriceForProduct(stripe, monthlyProduct.id),
      getActivePriceForProduct(stripe, annualProduct.id),
    ]);

    if (!monthlyPrice) throw new Error(`No active price found for product: ${MONTHLY_PRODUCT_NAME}`);
    if (!annualPrice) throw new Error(`No active price found for product: ${ANNUAL_PRODUCT_NAME}`);

    logStep("Fetched prices", {
      monthlyProductId: monthlyProduct.id,
      annualProductId: annualProduct.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    });

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
        productId: monthlyProduct.id,
      },
      annual: {
        amount: annualAmount,
        priceId: annualPrice?.id || null,
        productId: annualProduct.id,
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
