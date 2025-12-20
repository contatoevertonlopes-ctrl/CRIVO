import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserSummary {
  userId: string;
  mode: "survival" | "prosperity";
  currentBalance: number;
  weeklyExpenses: number;
  weeklyIncome: number;
  oxygenDays: number;
  savingsRate: number;
  freedomDays: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting Sunday Summary generation...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date and last week's date
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get all users with their transactions from the last week
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Processing ${profiles?.length || 0} users...`);

    const summaries: UserSummary[] = [];

    for (const profile of profiles || []) {
      // Get transactions for this user
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", profile.user_id)
        .gte("date", lastWeek.toISOString().split("T")[0])
        .lte("date", now.toISOString().split("T")[0]);

      if (txError) {
        console.error(`Error fetching transactions for user ${profile.user_id}:`, txError);
        continue;
      }

      // Calculate weekly metrics
      const weeklyIncome = transactions
        ?.filter(t => t.type === "income" && t.status === "pagamento_concluido")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const weeklyExpenses = transactions
        ?.filter(t => t.type === "expense" && t.status === "pagamento_concluido")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get current balance from all confirmed transactions
      const { data: allTransactions } = await supabase
        .from("transactions")
        .select("type, amount, status")
        .eq("user_id", profile.user_id)
        .eq("status", "pagamento_concluido");

      const income = allTransactions
        ?.filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const expenses = allTransactions
        ?.filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const currentBalance = income - expenses;

      // Calculate daily average for oxygen days
      const dailyAverage = weeklyExpenses > 0 ? weeklyExpenses / 7 : 1;
      const oxygenDays = dailyAverage > 0 ? Math.floor(currentBalance / dailyAverage) : 0;

      // Calculate savings rate
      const savingsRate = weeklyIncome > 0 
        ? ((weeklyIncome - weeklyExpenses) / weeklyIncome) * 100 
        : 0;

      // Calculate freedom days contributed this week
      const freedomDays = dailyAverage > 0 
        ? Math.round((weeklyIncome - weeklyExpenses) / dailyAverage) 
        : 0;

      summaries.push({
        userId: profile.user_id,
        mode: currentBalance < 0 || oxygenDays < 30 ? "survival" : "prosperity",
        currentBalance,
        weeklyExpenses,
        weeklyIncome,
        oxygenDays,
        savingsRate,
        freedomDays,
      });
    }

    console.log(`Generated summaries for ${summaries.length} users`);

    // Format messages based on mode
    const messages = summaries.map(summary => {
      const formatCurrency = (value: number) => 
        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      if (summary.mode === "survival") {
        if (summary.freedomDays > 0) {
          return {
            userId: summary.userId,
            title: "📊 Resumo Semanal - Modo Sobrevivência",
            body: `Você resistiu! Esta semana suas reservas aumentaram em ${summary.freedomDays} dias. Estamos chegando lá. Bom descanso!`,
          };
        } else {
          return {
            userId: summary.userId,
            title: "📊 Resumo Semanal - Modo Sobrevivência",
            body: `Semana desafiadora. Seu oxigênio está em ${summary.oxygenDays} dias. Vamos juntos melhorar isso. Bom descanso!`,
          };
        }
      } else {
        return {
          userId: summary.userId,
          title: "🚀 Resumo Semanal - Modo Prosperidade",
          body: `Semana de crescimento! Você aportou ${formatCurrency(summary.weeklyIncome - summary.weeklyExpenses)} rumo à sua liberdade financeira. Seu patrimônio agradece. Bom descanso!`,
        };
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: summaries.length,
        messages,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-sunday-summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
