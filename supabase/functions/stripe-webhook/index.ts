import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    logStep("Processing webhook", { hasSignature: !!signature });

    // Parse the event - in production, verify with webhook secret
    let event: Stripe.Event;
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Event signature verified");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Signature verification failed, parsing as JSON", { error: errorMessage });
        event = JSON.parse(body);
      }
    } else {
      event = JSON.parse(body);
      logStep("No webhook secret configured, parsing as JSON");
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

      // Get customer email from session
      const customerEmail = session.customer_email || session.customer_details?.email;
      const clientReferenceId = session.client_reference_id;

      if (!customerEmail && !clientReferenceId) {
        logStep("No customer email or reference ID found");
        return new Response(JSON.stringify({ error: "No customer identifier" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Find user by email or client_reference_id (which could be user_id)
      let userId: string | null = null;

      if (clientReferenceId) {
        // client_reference_id is the user_id
        userId = clientReferenceId;
        logStep("Using client_reference_id as user_id", { userId });
      } else if (customerEmail) {
        // Find user by email in auth.users
        const { data: users, error: userError } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("user_id", (
            await supabaseClient.auth.admin.listUsers()
          ).data.users.find(u => u.email === customerEmail)?.id || "")
          .maybeSingle();

        // Alternative: search through auth users
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
        const foundUser = authUsers.users.find(u => u.email === customerEmail);
        
        if (foundUser) {
          userId = foundUser.id;
          logStep("Found user by email", { userId, email: customerEmail });
        }
      }

      if (!userId) {
        logStep("Could not find user", { customerEmail, clientReferenceId });
        return new Response(JSON.stringify({ error: "User not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Calculate subscription end date
      let expiresAt: string | null = null;
      
      if (session.mode === "subscription") {
        // For subscriptions, get the actual subscription to find end date
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
          logStep("Subscription period end", { expiresAt });
        }
      } else {
        // For one-time payments, set expiry to 1 year from now
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        expiresAt = oneYearFromNow.toISOString();
      }

      // Update subscription in database
      const { error: updateError } = await supabaseClient
        .from("subscriptions")
        .update({
          plan: "pro",
          status: "active",
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        logStep("Error updating subscription", { error: updateError.message });
        
        // Try to insert if update failed (record might not exist)
        const { error: insertError } = await supabaseClient
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan: "pro",
            status: "active",
            expires_at: expiresAt,
          });

        if (insertError) {
          logStep("Error inserting subscription", { error: insertError.message });
          return new Response(JSON.stringify({ error: insertError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
      }

      logStep("Subscription updated successfully", { userId, plan: "pro", expiresAt });
    }

    // Handle subscription updates (renewal, cancellation, etc.)
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerEmail = subscription.customer as string;
      
      logStep("Subscription event", { 
        type: event.type, 
        status: subscription.status,
        customerId: customerEmail 
      });

      // Get customer email from Stripe
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const email = (customer as Stripe.Customer).email;

      if (email) {
        // Find user by email
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
        const foundUser = authUsers.users.find(u => u.email === email);

        if (foundUser) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          
          await supabaseClient
            .from("subscriptions")
            .update({
              status: isActive ? "active" : "canceled",
              plan: isActive ? "pro" : "free",
              expires_at: isActive 
                ? new Date(subscription.current_period_end * 1000).toISOString() 
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", foundUser.id);

          logStep("Subscription status updated", { 
            userId: foundUser.id, 
            status: isActive ? "active" : "canceled" 
          });
        }
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
