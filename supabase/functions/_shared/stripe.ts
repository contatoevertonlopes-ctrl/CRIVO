import Stripe from "https://esm.sh/stripe@18.5.0";

export function getStripeClient() {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

  const apiVersion = Deno.env.get("STRIPE_API_VERSION");

  const config: Stripe.StripeConfig = apiVersion ? { apiVersion } : {};
  return new Stripe(stripeKey, config);
}
