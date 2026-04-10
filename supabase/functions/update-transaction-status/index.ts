import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { enforceCronSecret } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-TRANSACTION-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Enforce cron secret — reject unauthorized callers
  const authError = enforceCronSecret(corsHeaders, req);
  if (authError) return authError;

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 5 days from now — threshold for "A vencer"
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const fiveDaysFromNowStr = fiveDaysFromNow.toISOString().split("T")[0];

    logStep("Date calculations", { today: todayStr, fiveDaysFromNow: fiveDaysFromNowStr });

    // 1. "em_aberto" (or legacy English pending) → "a_vencer" — due within the next 5 days (today inclusive)
    const { data: toUpcoming, error: toUpcomingError } = await supabase
      .from("transactions")
      .update({ status: "a_vencer" })
      .in("status", ["em_aberto", "pending"])
      .lte("date", fiveDaysFromNowStr)
      .gte("date", todayStr)
      .select("id");

    if (toUpcomingError) {
      logStep("Error updating to a_vencer", { error: toUpcomingError });
    } else {
      logStep("Updated to a_vencer", { count: toUpcoming?.length || 0 });
    }

    // 2. "a_vencer" or "em_aberto" (or legacy English upcoming/pending) → "vencido" — due date passed and not paid
    const { data: toOverdue, error: toOverdueError } = await supabase
      .from("transactions")
      .update({ status: "vencido" })
      .in("status", ["a_vencer", "em_aberto", "upcoming", "pending"])
      .lt("date", todayStr)
      .select("id");

    if (toOverdueError) {
      logStep("Error updating to vencido", { error: toOverdueError });
    } else {
      logStep("Updated to vencido", { count: toOverdue?.length || 0 });
    }

    const summary = {
      updated_to_upcoming: toUpcoming?.length || 0,
      updated_to_overdue: toOverdue?.length || 0,
      processed_at: new Date().toISOString(),
    };

    logStep("Completed", summary);

    return new Response(JSON.stringify(summary), {
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
