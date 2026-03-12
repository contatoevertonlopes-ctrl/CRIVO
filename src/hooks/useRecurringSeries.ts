import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";

export interface RecurringSeries {
  id: string;
  user_id: string;
  household_id: string | null;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  interval: "weekly" | "biweekly" | "monthly" | "yearly";
  start_date: string;
  tag: string | null;
  payment_method: string | null;
  bank_account_id: string | null;
  card_id: string | null;
  created_at: string;
  updated_at: string;
}

export type RecurringSeriesInsert = Omit<RecurringSeries, "id" | "created_at" | "updated_at">;

/**
 * Creates a recurring_series record and bulk-inserts all future
 * transaction occurrences linked to it.
 *
 * Returns the id of the created series.
 */
export const createRecurringSeries = async (
  data: RecurringSeriesInsert,
  occurrences: Array<{
    date: string;
    status: string;
    paid_date: string | null;
  }>,
  userId: string,
  householdId: string | null,
): Promise<string> => {
  // 1. Create the series record
  const { data: series, error: seriesError } = await supabase
    .from("recurring_series")
    .insert({
      user_id: userId,
      household_id: householdId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      type: data.type,
      interval: data.interval,
      start_date: data.start_date,
      tag: data.tag,
      payment_method: data.payment_method,
      bank_account_id: data.bank_account_id,
      card_id: data.card_id,
    })
    .select("id")
    .single();

  if (seriesError) throw seriesError;
  const seriesId = series.id as string;

  // 2. Bulk-insert all occurrences linked to the series
  const rows = occurrences.map((o) => ({
    user_id: userId,
    household_id: householdId,
    description: data.description,
    amount: data.amount,
    category: data.category,
    type: data.type,
    status: o.status,
    date: o.date,
    paid_date: o.paid_date,
    tag: data.tag,
    payment_method: data.payment_method,
    is_recurring: true,
    recurring_interval: data.interval,
    frequency: data.interval,
    recurring_series_id: seriesId,
    bank_account_id: data.bank_account_id,
    card_id: data.card_id,
    // parent_transaction_id stays NULL — grouping is via recurring_series_id
  }));

  const { error: txError } = await supabase.from("transactions").insert(rows);
  if (txError) throw txError;

  return seriesId;
};

/**
 * Updates all upcoming (unpaid) transactions belonging to a series
 * after the series metadata is changed.
 */
export const updateRecurringSeriesTransactions = async (
  seriesId: string,
  patch: Partial<{
    description: string;
    amount: number;
    category: string;
    tag: string | null;
    payment_method: string | null;
    bank_account_id: string | null;
    card_id: string | null;
  }>,
  todayStr: string,
) => {
  const { error } = await supabase
    .from("transactions")
    .update({
      ...patch,
      ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
    })
    .eq("recurring_series_id", seriesId)
    .neq("status", "pagamento_concluido")
    .neq("status", "paid")
    .neq("status", "confirmed")
    .gte("date", todayStr);

  if (error) throw error;
};

/**
 * Deletes all remaining (unpaid) occurrences of a series and
 * the series record itself.
 */
export const deleteRecurringSeries = async (seriesId: string, todayStr: string) => {
  // Delete future/pending transactions
  const { error: txError } = await supabase
    .from("transactions")
    .delete()
    .eq("recurring_series_id", seriesId)
    .neq("status", "pagamento_concluido")
    .neq("status", "paid")
    .neq("status", "confirmed")
    .gte("date", todayStr);

  if (txError) throw txError;

  // Delete the series record
  const { error: seriesError } = await supabase
    .from("recurring_series")
    .delete()
    .eq("id", seriesId);

  if (seriesError) throw seriesError;
};
