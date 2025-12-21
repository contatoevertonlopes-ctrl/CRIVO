import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('Unauthorized request - invalid cron secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM format
    
    console.log(`[close-card-bills] Running on day ${currentDay} of ${currentMonth}`);

    // Get all active cards where today is the closing day
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('is_active', true)
      .eq('closing_day', currentDay);

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      throw cardsError;
    }

    console.log(`[close-card-bills] Found ${cards?.length || 0} cards to close`);

    const results = [];

    for (const card of cards || []) {
      console.log(`[close-card-bills] Processing card: ${card.name} (${card.id})`);

      // Calculate billing month (current month since we're closing today)
      const billingMonth = `${currentMonth}-01`;
      
      // Check if bill already exists for this billing month
      const { data: existingBill } = await supabase
        .from('card_bills')
        .select('id')
        .eq('card_id', card.id)
        .eq('billing_month', billingMonth)
        .maybeSingle();

      if (existingBill) {
        console.log(`[close-card-bills] Bill already exists for ${card.name} - ${billingMonth}`);
        results.push({ card: card.name, status: 'already_closed', billingMonth });
        continue;
      }

      // Get all unpaid card transactions for this billing month
      const { data: transactions, error: txError } = await supabase
        .from('card_transactions')
        .select('*')
        .eq('card_id', card.id)
        .eq('billing_month', billingMonth)
        .eq('is_paid', false);

      if (txError) {
        console.error(`Error fetching transactions for card ${card.id}:`, txError);
        continue;
      }

      const totalAmount = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      console.log(`[close-card-bills] Card ${card.name} has ${transactions?.length || 0} transactions totaling ${totalAmount}`);

      if (totalAmount === 0) {
        console.log(`[close-card-bills] No transactions for ${card.name} - skipping`);
        results.push({ card: card.name, status: 'no_transactions', billingMonth });
        continue;
      }

      // Calculate due date (next month on due_day)
      const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, card.due_day);
      const dueDateStr = dueDate.toISOString().slice(0, 10);

      // Create the card bill
      const { data: bill, error: billError } = await supabase
        .from('card_bills')
        .insert({
          card_id: card.id,
          user_id: card.user_id,
          household_id: card.household_id,
          billing_month: billingMonth,
          total_amount: totalAmount,
          due_date: dueDateStr,
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (billError) {
        console.error(`Error creating bill for card ${card.id}:`, billError);
        results.push({ card: card.name, status: 'error', error: billError.message });
        continue;
      }

      console.log(`[close-card-bills] Created bill ${bill.id} for card ${card.name}`);

      // Create a transaction in the main transactions table for the bill payment
      const { data: transaction, error: txInsertError } = await supabase
        .from('transactions')
        .insert({
          user_id: card.user_id,
          household_id: card.household_id,
          description: `Fatura ${card.name} - ${new Date(billingMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          amount: totalAmount,
          category: 'Pagamento de Cartão',
          type: 'expense',
          status: 'em_aberto',
          date: dueDateStr,
          tag: 'fixa',
        })
        .select()
        .single();

      if (txInsertError) {
        console.error(`Error creating transaction for bill ${bill.id}:`, txInsertError);
      } else {
        // Update the bill with the transaction_id
        await supabase
          .from('card_bills')
          .update({ transaction_id: transaction.id })
          .eq('id', bill.id);
        
        console.log(`[close-card-bills] Created transaction ${transaction.id} for bill ${bill.id}`);
      }

      results.push({ 
        card: card.name, 
        status: 'closed', 
        billingMonth, 
        totalAmount,
        dueDate: dueDateStr,
        billId: bill.id,
        transactionId: transaction?.id 
      });
    }

    console.log(`[close-card-bills] Completed processing. Results:`, results);

    return new Response(JSON.stringify({ 
      success: true, 
      processedAt: new Date().toISOString(),
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[close-card-bills] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
