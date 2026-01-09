import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const stripeIntervalToPlan = (interval: string | null | undefined): "monthly" | "annual" | "pro" => {
  if (interval === "month") return "monthly";
  if (interval === "year") return "annual";
  return "pro";
};

const toDbStatus = (stripeStatus: Stripe.Subscription.Status | string): "active" | "cancelled" => {
  return stripeStatus === "active" || stripeStatus === "trialing" ? "active" : "cancelled";
};

const upsertSubscription = async (
  supabaseClient: ReturnType<typeof createClient>,
  input: {
    userId: string;
    plan: "pro" | "monthly" | "annual" | "free";
    status: "active" | "cancelled";
    expiresAt: string | null;
  },
) => {
  const { error } = await supabaseClient
    .from("subscriptions")
    .upsert(
      {
        user_id: input.userId,
        plan: input.plan,
        status: input.status,
        expires_at: input.expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) throw new Error(`DB upsert failed: ${error.message}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = getStripeClient();

    const supabaseClient = createClient(
      Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Supabase client configured", {
      url: Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? null,
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    logStep("Processing webhook", { hasSignature: !!signature });

    // Parse the event. If STRIPE_WEBHOOK_SECRET is configured, require signature verification.
    let event: Stripe.Event;

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret) {
      if (!signature) {
        logStep("Missing stripe-signature header while STRIPE_WEBHOOK_SECRET is set");
        return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Event signature verified");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Signature verification failed", { error: errorMessage });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("No STRIPE_WEBHOOK_SECRET configured; parsing as JSON (dev-only)");
    }

    logStep("Event type", { type: event.type });

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Checkout session completed", {
        sessionId: session.id,
        customerEmail: session.customer_email,
        clientReferenceId: session.client_reference_id,
        mode: session.mode,
      });

      // Prefer metadata (we set it in create-checkout). Fallback to client_reference_id.
      const userId =
        (session.metadata?.user_id as string | undefined) ??
        (session.client_reference_id as string | null) ??
        null;

      if (!userId) {
        // Don't fail the webhook (Stripe will retry forever); log loudly.
        logStep("Missing userId on checkout session", {
          sessionId: session.id,
          hasMetadataUserId: !!session.metadata?.user_id,
          clientReferenceId: session.client_reference_id,
        });
      } else {
        const planType = (session.metadata?.plan_type as string | undefined) ?? "pro";
        const plan = planType === "monthly" || planType === "annual" ? planType : "pro";

        await upsertSubscription(supabaseClient, {
          userId,
          plan,
          status: "active",
          expiresAt: null,
        });

        logStep("Subscription upserted from checkout", { userId, plan });
      }
    }

    // Handle subscription events (created/updated/deleted)
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = (subscription.metadata?.user_id as string | undefined) ?? null;
      
      logStep("Subscription event", { 
        type: event.type, 
        status: subscription.status,
        customerId: subscription.customer,
        hasMetadataUserId: !!userId,
      });

      if (!userId) {
        // We intentionally avoid searching users by email here (slow, and can hang in local Docker).
        // If metadata isn't present, it's a creation-flow issue.
        logStep("Skipping subscription event: missing metadata.user_id", {
          subscriptionId: subscription.id,
        });
      } else {
        const dbStatus = toDbStatus(subscription.status);
        const interval = subscription.items.data[0]?.price.recurring?.interval;
        const plan = dbStatus === "active" ? stripeIntervalToPlan(interval) : "free";
        const expiresAt =
          dbStatus === "active" ? new Date(subscription.current_period_end * 1000).toISOString() : null;

        await upsertSubscription(supabaseClient, {
          userId,
          plan,
          status: dbStatus,
          expiresAt,
        });

        logStep("Subscription upserted from Stripe subscription", {
          userId,
          plan,
          status: dbStatus,
          expiresAt,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
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
