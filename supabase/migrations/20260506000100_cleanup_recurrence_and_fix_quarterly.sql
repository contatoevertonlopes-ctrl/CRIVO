-- 1. Drop redundant BEFORE INSERT-only trigger.
--    The newer `trg_process_recurrence` (BEFORE INSERT OR UPDATE) already covers this.
--    Keeping both causes two trigger firings on INSERT (no data corruption due to
--    the `recurrence_processed` guard, but unnecessary overhead).
DROP TRIGGER IF EXISTS trigger_recurrence_on_insert ON public.transactions;

-- 2. Expand the recurring_series.interval CHECK constraint to include 'quarterly'.
--    The UI already exposes "Trimestral" and calculate_next_due_date() handles it,
--    but the constraint was missing the value, causing a silent DB error on insert.
ALTER TABLE public.recurring_series
  DROP CONSTRAINT IF EXISTS recurring_series_interval_check;

ALTER TABLE public.recurring_series
  ADD CONSTRAINT recurring_series_interval_check
  CHECK (interval IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'));
