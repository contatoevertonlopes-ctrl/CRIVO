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

    // Single atomic RPC — both updates run inside one PL/pgSQL transaction.
    // Defined in: supabase/migrations/20260411231240_update_transaction_statuses_rpc.sql
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "update_transaction_statuses",
      { today_date: todayStr, upcoming_date: fiveDaysFromNowStr }
    );

    if (rpcError) {
      throw new Error(`RPC update_transaction_statuses failed: ${rpcError.message}`);
    }

    logStep("RPC completed", rpcResult);

    // 3. Generate next occurrence for recurring transactions that hit their due date
    const { error: recurError } = await supabase.rpc("process_recurrence_on_due_date");
    if (recurError) {
      logStep("Error processing recurrence on due date", { error: recurError });
    } else {
      logStep("Processed recurrence on due date");
    }

    const summary = {
      updated_to_upcoming: rpcResult?.updated_to_upcoming ?? 0,
      updated_to_overdue: rpcResult?.updated_to_overdue ?? 0,
      recurrence_processed: !recurError,
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
