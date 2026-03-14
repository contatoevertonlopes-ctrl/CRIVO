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
    logStep("Function started - public endpoint for cron job");

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
    const { data: toUpcoming, error: toUpcomingError } = await supabase
      .from("transactions")
      .update({ status: "a_vencer" })
      .in("status", ["em_aberto", "pending"])
      .lte("date", threeDaysFromNowStr)
      .gte("date", todayStr)
      .select("id");

    if (toUpcomingError) {
      logStep("Error updating to a_vencer", { error: toUpcomingError });
    } else {
      logStep("Updated to a_vencer", { count: toUpcoming?.length || 0 });
    }

    // 2. Update "a_vencer" to "vencido" (1 day after due date)
    const { data: toOverdue, error: toOverdueError } = await supabase
      .from("transactions")
      .update({ status: "vencido" })
      .in("status", ["a_vencer", "upcoming"])
      .lt("date", oneDayAgoStr)
      .select("id");

    if (toOverdueError) {
      logStep("Error updating to vencido", { error: toOverdueError });
    } else {
      logStep("Updated to vencido", { count: toOverdue?.length || 0 });
    }

    // Also update "em_aberto" transactions that are past due directly to "vencido"
    const { data: pendingToOverdue, error: pendingToOverdueError } = await supabase
      .from("transactions")
      .update({ status: "vencido" })
      .in("status", ["em_aberto", "pending"])
      .lt("date", oneDayAgoStr)
      .select("id");

    if (pendingToOverdueError) {
      logStep("Error updating em_aberto to vencido", { error: pendingToOverdueError });
    } else {
      logStep("Updated em_aberto to vencido", { count: pendingToOverdue?.length || 0 });
    }

    const summary = {
      updated_to_upcoming: toUpcoming?.length || 0,
      updated_to_overdue: (toOverdue?.length || 0) + (pendingToOverdue?.length || 0),
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
