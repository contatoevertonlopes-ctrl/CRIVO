import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { enforceCronSecret } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-NOTIFICATIONS] ${step}${detailsStr}`);
};

interface UserToNotify {
  user_id: string;
  household_id: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = enforceCronSecret(corsHeaders, req);
  if (authError) return authError;

  try {
    logStep("Function started - checking for due transactions and low balances");

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
    
    // Calculate date 3 days from now for "a_vencer" alerts
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysFromNowStr = threeDaysFromNow.toISOString().split("T")[0];

    const notificationsToCreate: Array<{
      user_id: string;
      household_id: string | null;
      title: string;
      message: string;
      type: string;
      link: string | null;
    }> = [];

    // 1. Check for transactions that are due soon (a_vencer) - within 3 days
    logStep("Checking for transactions due soon");
    const { data: dueSoonTransactions, error: dueSoonError } = await supabase
      .from("transactions")
      .select("id, user_id, household_id, description, amount, date, type")
      .eq("status", "a_vencer")
      .gte("date", todayStr)
      .lte("date", threeDaysFromNowStr);

    if (dueSoonError) {
      logStep("Error fetching due soon transactions", { error: dueSoonError.message });
    } else if (dueSoonTransactions && dueSoonTransactions.length > 0) {
      logStep("Found transactions due soon", { count: dueSoonTransactions.length });

      // Group by user to avoid duplicate notifications
      const userTransactions = new Map<string, typeof dueSoonTransactions>();
      
      for (const tx of dueSoonTransactions) {
        const key = tx.user_id;
        if (!userTransactions.has(key)) {
          userTransactions.set(key, []);
        }
        userTransactions.get(key)!.push(tx);
      }

      for (const [userId, transactions] of userTransactions) {
        // Check if we already sent a notification today for this user about due transactions
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "due_soon")
          .gte("created_at", todayStr)
          .limit(1);

        if (!existingNotif || existingNotif.length === 0) {
          const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
          const firstTx = transactions[0];
          
          notificationsToCreate.push({
            user_id: userId,
            household_id: firstTx.household_id,
            title: "⚠️ Contas a vencer",
            message: `Você tem ${transactions.length} conta(s) a vencer nos próximos 3 dias, totalizando R$ ${totalAmount.toFixed(2).replace(".", ",")}`,
            type: "due_soon",
            link: "/transactions",
          });
        }
      }
    }

    // 2. Check for overdue transactions (vencido)
    logStep("Checking for overdue transactions");
    const { data: overdueTransactions, error: overdueError } = await supabase
      .from("transactions")
      .select("id, user_id, household_id, description, amount, date, type")
      .eq("status", "vencido");

    if (overdueError) {
      logStep("Error fetching overdue transactions", { error: overdueError.message });
    } else if (overdueTransactions && overdueTransactions.length > 0) {
      logStep("Found overdue transactions", { count: overdueTransactions.length });

      const userTransactions = new Map<string, typeof overdueTransactions>();
      
      for (const tx of overdueTransactions) {
        const key = tx.user_id;
        if (!userTransactions.has(key)) {
          userTransactions.set(key, []);
        }
        userTransactions.get(key)!.push(tx);
      }

      for (const [userId, transactions] of userTransactions) {
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "overdue")
          .gte("created_at", todayStr)
          .limit(1);

        if (!existingNotif || existingNotif.length === 0) {
          const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
          const firstTx = transactions[0];
          
          notificationsToCreate.push({
            user_id: userId,
            household_id: firstTx.household_id,
            title: "🚨 Contas vencidas",
            message: `Atenção! Você tem ${transactions.length} conta(s) vencida(s), totalizando R$ ${totalAmount.toFixed(2).replace(".", ",")}`,
            type: "overdue",
            link: "/transactions",
          });
        }
      }
    }

    // 3. Check for low bank account balance (below R$ 500)
    const LOW_BALANCE_THRESHOLD = 500;
    logStep("Checking for low bank account balances", { threshold: LOW_BALANCE_THRESHOLD });

    const { data: lowBalanceAccounts, error: balanceError } = await supabase
      .from("bank_accounts")
      .select("id, user_id, household_id, name, bank_name, balance")
      .eq("is_active", true)
      .lt("balance", LOW_BALANCE_THRESHOLD);

    if (balanceError) {
      logStep("Error fetching low balance accounts", { error: balanceError.message });
    } else if (lowBalanceAccounts && lowBalanceAccounts.length > 0) {
      logStep("Found low balance accounts", { count: lowBalanceAccounts.length });

      for (const account of lowBalanceAccounts) {
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", account.user_id)
          .eq("type", "low_balance")
          .gte("created_at", todayStr)
          .limit(1);

        if (!existingNotif || existingNotif.length === 0) {
          notificationsToCreate.push({
            user_id: account.user_id,
            household_id: account.household_id,
            title: "💰 Saldo baixo",
            message: `Sua conta ${account.name} (${account.bank_name}) está com saldo de R$ ${Number(account.balance).toFixed(2).replace(".", ",")}`,
            type: "low_balance",
            link: "/bank-accounts",
          });
        }
      }
    }

    // 4. Insert all notifications and send push
    if (notificationsToCreate.length > 0) {
      logStep("Creating notifications", { count: notificationsToCreate.length });

      const { data: insertedNotifications, error: insertError } = await supabase
        .from("notifications")
        .insert(notificationsToCreate)
        .select();

      if (insertError) {
        logStep("Error inserting notifications", { error: insertError.message });
      } else {
        logStep("Notifications created successfully", { 
          count: insertedNotifications?.length || 0 
        });

        // Send Web Push to each user
        const uniqueUserIds = [...new Set(notificationsToCreate.map(n => n.user_id))];
        for (const userId of uniqueUserIds) {
          const userNotifs = notificationsToCreate.filter(n => n.user_id === userId);
          const firstNotif = userNotifs[0];
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-push`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                user_id: userId,
                title: firstNotif.title,
                body: firstNotif.message,
                url: firstNotif.link || "/",
                tag: firstNotif.type,
              }),
            });
          } catch (pushErr) {
            logStep("Push send failed", { userId, error: String(pushErr) });
          }
        }
      }
    } else {
      logStep("No new notifications to create");
    }

    const summary = {
      due_soon_checked: dueSoonTransactions?.length || 0,
      overdue_checked: overdueTransactions?.length || 0,
      low_balance_checked: lowBalanceAccounts?.length || 0,
      notifications_created: notificationsToCreate.length,
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
