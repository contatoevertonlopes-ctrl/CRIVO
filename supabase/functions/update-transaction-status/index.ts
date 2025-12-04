import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-TRANSACTION-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    
    // Calculate date 3 days from now
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysFromNowStr = threeDaysFromNow.toISOString().split("T")[0];

    // Calculate date 1 day ago
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneDayAgoStr = oneDayAgo.toISOString().split("T")[0];

    logStep("Date calculations", { 
      today: todayStr, 
      threeDaysFromNow: threeDaysFromNowStr,
      oneDayAgo: oneDayAgoStr 
    });

    // 1. Update "em_aberto" to "a_vencer" (3 days before due date)
    // If the transaction date is within 3 days from now
    const { data: toAVencer, error: toAVencerError } = await supabase
      .from("transactions")
      .update({ status: "a_vencer" })
      .eq("status", "em_aberto")
      .lte("date", threeDaysFromNowStr)
      .gte("date", todayStr)
      .select("id");

    if (toAVencerError) {
      logStep("Error updating to a_vencer", { error: toAVencerError });
    } else {
      logStep("Updated to a_vencer", { count: toAVencer?.length || 0 });
    }

    // 2. Update "a_vencer" to "vencido" (1 day after due date)
    // If the transaction date is before yesterday
    const { data: toVencido, error: toVencidoError } = await supabase
      .from("transactions")
      .update({ status: "vencido" })
      .eq("status", "a_vencer")
      .lt("date", oneDayAgoStr)
      .select("id");

    if (toVencidoError) {
      logStep("Error updating to vencido", { error: toVencidoError });
    } else {
      logStep("Updated to vencido", { count: toVencido?.length || 0 });
    }

    // Also update "em_aberto" transactions that are past due directly to "vencido"
    const { data: emAbertoToVencido, error: emAbertoToVencidoError } = await supabase
      .from("transactions")
      .update({ status: "vencido" })
      .eq("status", "em_aberto")
      .lt("date", oneDayAgoStr)
      .select("id");

    if (emAbertoToVencidoError) {
      logStep("Error updating em_aberto to vencido", { error: emAbertoToVencidoError });
    } else {
      logStep("Updated em_aberto to vencido", { count: emAbertoToVencido?.length || 0 });
    }

    const summary = {
      updated_to_a_vencer: toAVencer?.length || 0,
      updated_to_vencido: (toVencido?.length || 0) + (emAbertoToVencido?.length || 0),
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
