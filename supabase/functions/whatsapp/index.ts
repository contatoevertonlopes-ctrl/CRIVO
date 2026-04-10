import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${step}`, details ? JSON.stringify(details) : "");
};

// Evolution API helper functions
async function sendWhatsAppMessage(phone: string, message: string) {
  const apiUrl = Deno.env.get("EVOLUTION_API_URL");
  const apiKey = Deno.env.get("EVOLUTION_API_KEY");
  const instanceName = Deno.env.get("EVOLUTION_INSTANCE_NAME");

  if (!apiUrl || !apiKey || !instanceName) {
    throw new Error("Evolution API credentials not configured");
  }

  // Format phone number (remove special characters, add country code if needed)
  const formattedPhone = phone.replace(/\D/g, "");
  const finalPhone = formattedPhone.startsWith("55") ? formattedPhone : `55${formattedPhone}`;

  logStep("Sending WhatsApp message", { phone: finalPhone, messagePreview: message.substring(0, 50) });

  const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": apiKey,
    },
    body: JSON.stringify({
      number: finalPhone,
      text: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Evolution API error", { status: response.status, error: errorText });
    throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  logStep("Message sent successfully", result);
  return result;
}

// Parse user commands from WhatsApp messages with input validation
function parseCommand(message: string): { action: string; data: any } | null {
  // Limit message size to prevent abuse
  if (!message || message.length > 500) {
    return null;
  }

  const lowerMessage = message.toLowerCase().trim();

  // Command: /adicionar or /add - Add transaction
  const addMatch = message.match(/^\/(adicionar|add)\s+(\d+(?:[.,]\d{1,2})?)\s+(despesa|receita|expense|income)\s+(\S+)\s+(.+)/i);
  if (addMatch) {
    const amount = parseFloat(addMatch[2].replace(",", "."));
    const type = addMatch[3].toLowerCase();
    const category = addMatch[4].trim();
    const description = addMatch[5].trim();

    // Validate amount (0.01 to 10,000,000.00)
    if (isNaN(amount) || !isFinite(amount) || amount <= 0 || amount > 10000000) {
      return null;
    }

    // Validate category (alphanumeric + accented chars, max 50 chars)
    if (category.length > 50 || !/^[a-zA-Z0-9À-ÿ_\s-]+$/.test(category)) {
      return null;
    }

    // Validate description (min 2 chars, max 200 chars)
    if (description.length < 2 || description.length > 200) {
      return null;
    }

    return {
      action: "add_transaction",
      data: {
        amount: Math.round(amount * 100) / 100,
        type: type === "despesa" || type === "expense" ? "expense" : "income",
        category: category.substring(0, 50),
        description: description.substring(0, 200),
      },
    };
  }

  // Command: /resumo or /summary - Get summary
  if (lowerMessage.startsWith("/resumo") || lowerMessage.startsWith("/summary")) {
    return { action: "get_summary", data: {} };
  }

  // Command: /pendentes or /pending - Get pending transactions
  if (lowerMessage.startsWith("/pendentes") || lowerMessage.startsWith("/pending")) {
    return { action: "get_pending", data: {} };
  }

  // Command: /ajuda or /help - Show help
  if (lowerMessage.startsWith("/ajuda") || lowerMessage.startsWith("/help")) {
    return { action: "help", data: {} };
  }

  return null;
}

// Format currency for display
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    logStep("Request received", { method: req.method, action });

    // ACTION: Send notifications (called by cron or manually)
    if (action === "send_notifications") {
      logStep("Sending notifications for upcoming transactions");

      const targetPhone = url.searchParams.get("phone");
      const userId = url.searchParams.get("user_id");

      if (!targetPhone || !userId) {
        return new Response(
          JSON.stringify({ error: "Missing phone or user_id parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get transactions due in the next 3 days
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["em_aberto", "a_vencer", "pending"])
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", threeDaysFromNow.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) {
        logStep("Error fetching transactions", error);
        throw error;
      }

      if (!transactions || transactions.length === 0) {
        logStep("No upcoming transactions found");
        return new Response(
          JSON.stringify({ success: true, message: "No notifications to send" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build notification message
      let message = "📅 *Compromissos Próximos*\n\n";
      
      let totalExpenses = 0;
      let totalIncome = 0;

      for (const tx of transactions) {
        const emoji = tx.type === "expense" ? "🔴" : "🟢";
        const typeLabel = tx.type === "expense" ? "Pagar" : "Receber";
        const dueDate = formatDate(tx.date);
        
        message += `${emoji} *${tx.description}*\n`;
        message += `   💰 ${formatCurrency(tx.amount)}\n`;
        message += `   📆 Vencimento: ${dueDate}\n`;
        message += `   📁 ${tx.category}\n\n`;

        if (tx.type === "expense") {
          totalExpenses += tx.amount;
        } else {
          totalIncome += tx.amount;
        }
      }

      message += "━━━━━━━━━━━━━━━━\n";
      message += `💸 Total a Pagar: ${formatCurrency(totalExpenses)}\n`;
      message += `💰 Total a Receber: ${formatCurrency(totalIncome)}\n`;
      message += `📊 Saldo: ${formatCurrency(totalIncome - totalExpenses)}`;

      await sendWhatsAppMessage(targetPhone, message);

      return new Response(
        JSON.stringify({ success: true, notificationsSent: transactions.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: Webhook handler (receives messages from Evolution API)
    if (action === "webhook" || req.method === "POST") {
      const body = await req.json();
      logStep("Webhook received", body);

      // Evolution API webhook payload structure
      const messageData = body.data?.message;
      const remoteJid = body.data?.key?.remoteJid;

      if (!messageData || !remoteJid) {
        logStep("Invalid webhook payload");
        return new Response(
          JSON.stringify({ success: true, message: "Invalid payload, ignoring" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract phone number from remoteJid (format: 5511999999999@s.whatsapp.net)
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
      const text = messageData.conversation || messageData.extendedTextMessage?.text || "";

      logStep("Processing message", { phone, text });

      // Check if it's a command
      const command = parseCommand(text);

      if (!command) {
        // Not a command, send help message
        const helpMessage = `👋 Olá! Sou seu assistente financeiro.\n\n` +
          `📝 *Comandos disponíveis:*\n\n` +
          `/adicionar [valor] [tipo] [categoria] [descrição]\n` +
          `   Exemplo: /adicionar 50 despesa alimentação Almoço no trabalho\n\n` +
          `/resumo - Ver resumo financeiro\n` +
          `/pendentes - Ver transações pendentes\n` +
          `/ajuda - Ver esta mensagem`;

        await sendWhatsAppMessage(phone, helpMessage);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Process command
      switch (command.action) {
        case "help": {
          const helpMessage = `👋 Assistente Financeiro\n\n` +
            `📝 *Comandos:*\n\n` +
            `*Adicionar transação:*\n` +
            `/adicionar [valor] [despesa|receita] [categoria] [descrição]\n` +
            `Exemplo: /adicionar 150.50 despesa alimentação Jantar restaurante\n\n` +
            `*Ver resumo:*\n` +
            `/resumo\n\n` +
            `*Ver pendentes:*\n` +
            `/pendentes\n\n` +
            `*Ajuda:*\n` +
            `/ajuda`;

          await sendWhatsAppMessage(phone, helpMessage);
          break;
        }

        case "add_transaction": {
          // For adding transactions, we need to identify the user by phone
          // First, check if there's a user associated with this phone
          // For now, we'll respond with instructions to link the account
          
          const { data: profile } = await supabase
            .from("profiles_private")
            .select("user_id")
            .eq("phone", phone)
            .single();

          if (!profile) {
            const message = `❌ *Conta não vinculada*\n\n` +
              `Para adicionar transações via WhatsApp, você precisa vincular seu telefone à sua conta.\n\n` +
              `Acesse o app e vá em Configurações > Vincular WhatsApp`;

            await sendWhatsAppMessage(phone, message);
          } else {
            // Add the transaction
            const { data: newTx, error: insertError } = await supabase
              .from("transactions")
              .insert({
                user_id: profile.user_id,
                description: command.data.description,
                amount: command.data.amount,
                category: command.data.category,
                type: command.data.type,
                status: "em_aberto",
                date: new Date().toISOString().split("T")[0],
              })
              .select()
              .single();

            if (insertError) {
              logStep("Error inserting transaction", insertError);
              await sendWhatsAppMessage(phone, "❌ Erro ao adicionar transação. Tente novamente.");
            } else {
              const emoji = command.data.type === "expense" ? "🔴" : "🟢";
              const typeLabel = command.data.type === "expense" ? "Despesa" : "Receita";
              
              const message = `✅ *Transação adicionada!*\n\n` +
                `${emoji} ${typeLabel}\n` +
                `💰 ${formatCurrency(command.data.amount)}\n` +
                `📁 ${command.data.category}\n` +
                `📝 ${command.data.description}`;

              await sendWhatsAppMessage(phone, message);
            }
          }
          break;
        }

        case "get_summary": {
          const { data: profile } = await supabase
            .from("profiles_private")
            .select("user_id")
            .eq("phone", phone)
            .single();

          if (!profile) {
            await sendWhatsAppMessage(phone, "❌ Conta não vinculada. Acesse o app para vincular seu WhatsApp.");
          } else {
            // Get current month transactions
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

            const { data: transactions } = await supabase
              .from("transactions")
              .select("*")
              .eq("user_id", profile.user_id)
              .gte("date", startOfMonth)
              .lte("date", endOfMonth);

            let totalIncome = 0;
            let totalExpenses = 0;
            let confirmedIncome = 0;
            let confirmedExpenses = 0;

            for (const tx of transactions || []) {
              if (tx.type === "income") {
                totalIncome += tx.amount;
                if (tx.status === "paid" || tx.status === "pagamento_concluido" || tx.status === "confirmed") {
                  confirmedIncome += tx.amount;
                }
              } else {
                totalExpenses += tx.amount;
                if (tx.status === "paid" || tx.status === "pagamento_concluido" || tx.status === "confirmed") {
                  confirmedExpenses += tx.amount;
                }
              }
            }

            const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
              "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

            const message = `📊 *Resumo - ${monthNames[now.getMonth()]}/${now.getFullYear()}*\n\n` +
              `🟢 *Receitas*\n` +
              `   Total: ${formatCurrency(totalIncome)}\n` +
              `   Confirmado: ${formatCurrency(confirmedIncome)}\n\n` +
              `🔴 *Despesas*\n` +
              `   Total: ${formatCurrency(totalExpenses)}\n` +
              `   Confirmado: ${formatCurrency(confirmedExpenses)}\n\n` +
              `━━━━━━━━━━━━━━━━\n` +
              `💰 *Saldo Previsto:* ${formatCurrency(totalIncome - totalExpenses)}\n` +
              `✅ *Saldo Confirmado:* ${formatCurrency(confirmedIncome - confirmedExpenses)}`;

            await sendWhatsAppMessage(phone, message);
          }
          break;
        }

        case "get_pending": {
          const { data: profile } = await supabase
            .from("profiles_private")
            .select("user_id")
            .eq("phone", phone)
            .single();

          if (!profile) {
            await sendWhatsAppMessage(phone, "❌ Conta não vinculada. Acesse o app para vincular seu WhatsApp.");
          } else {
            const { data: transactions } = await supabase
              .from("transactions")
              .select("*")
              .eq("user_id", profile.user_id)
              .in("status", ["em_aberto", "a_vencer", "vencido", "pending"])
              .order("date", { ascending: true })
              .limit(10);

            if (!transactions || transactions.length === 0) {
              await sendWhatsAppMessage(phone, "✅ Você não tem transações pendentes!");
            } else {
              let message = "📋 *Transações Pendentes*\n\n";

              for (const tx of transactions) {
                const emoji = tx.type === "expense" ? "🔴" : "🟢";
                const statusEmoji = tx.status === "vencido" ? "⚠️" : "";
                
                message += `${emoji} ${statusEmoji}*${tx.description}*\n`;
                message += `   💰 ${formatCurrency(tx.amount)}\n`;
                message += `   📆 ${formatDate(tx.date)}\n\n`;
              }

              await sendWhatsAppMessage(phone, message);
            }
          }
          break;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: return API info
    return new Response(
      JSON.stringify({
        name: "WhatsApp Integration API",
        actions: ["send_notifications", "webhook"],
        usage: {
          send_notifications: "GET ?action=send_notifications&phone=5511999999999&user_id=uuid",
          webhook: "POST (configured in Evolution API)",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
