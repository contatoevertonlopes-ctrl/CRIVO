import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { computeUnpaidStatus } from "@/lib/statusUtils";
import { getRecurringGenerationCount, getNextRecurringDate } from "@/utils/recurringGeneration";

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
     .neq("status", "paid")
    .neq("status", "pagamento_concluido")
    .neq("status", "confirmed")
    .gte("date", todayStr);

  if (error) throw error;
};

/**
 * Extends a recurring series when the number of future unpaid occurrences
 * drops below a threshold (3). Called after marking a transaction as paid.
 *
 * Generates a new batch of occurrences starting immediately after the last
 * existing occurrence in the series.
 */
export const extendRecurringSeriesIfNeeded = async (seriesId: string): Promise<void> => {
  const todayStr = new Date().toISOString().split("T")[0];

  // Count remaining unpaid future occurrences
  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("recurring_series_id", seriesId)
    .neq("status", "paid")
    .neq("status", "pagamento_concluido")
    .neq("status", "confirmed")
    .gte("date", todayStr);

  if (countError) throw countError;

  const remaining = count ?? 0;
  if (remaining >= 3) return; // Still enough occurrences ahead

  // Fetch series metadata
  const { data: series, error: seriesError } = await supabase
    .from("recurring_series")
    .select("*")
    .eq("id", seriesId)
    .single();

  if (seriesError || !series) throw seriesError ?? new Error("Series not found");

  // Find the latest existing occurrence date
  const { data: lastRow, error: lastError } = await supabase
    .from("transactions")
    .select("date")
    .eq("recurring_series_id", seriesId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (lastError || !lastRow) throw lastError ?? new Error("No occurrences found");

  // Generate a new batch from the day after the last occurrence
  const count_ = getRecurringGenerationCount(series.interval);
  const baseDate = new Date(lastRow.date + "T12:00:00");

  const rows = Array.from({ length: count_ }, (_, i) => {
    const date = getNextRecurringDate(baseDate, i + 1, series.interval);
    const dateStr = date.toISOString().split("T")[0];
    return {
      user_id: series.user_id,
      household_id: series.household_id,
      description: series.description,
      amount: series.amount,
      category: series.category,
      type: series.type,
      status: computeUnpaidStatus(dateStr),
      date: dateStr,
      paid_date: null,
      tag: series.tag,
      payment_method: series.payment_method,
      is_recurring: true,
      recurring_interval: series.interval,
      frequency: series.interval,
      recurring_series_id: seriesId,
      bank_account_id: series.bank_account_id,
      card_id: series.card_id,
    };
  });

  const { error: insertError } = await supabase.from("transactions").insert(rows);
  if (insertError) throw insertError;
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
    .neq("status", "paid")
    .neq("status", "pagamento_concluido")
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
