-- Atomic PL/pgSQL function to update transaction statuses in a single transaction.
-- Called by the update-transaction-status Edge Function via supabase.rpc().
-- Replaces the two separate UPDATE queries that could leave state inconsistent on failure.

CREATE OR REPLACE FUNCTION update_transaction_statuses(today_date date, upcoming_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  to_upcoming_count int;
  to_overdue_count  int;
BEGIN
  -- 1. em_aberto / pending → a_vencer (due within the next 5 days, today inclusive)
  UPDATE transactions
  SET status = 'a_vencer'
  WHERE status IN ('em_aberto', 'pending')
    AND date >= today_date
    AND date <= upcoming_date;
  GET DIAGNOSTICS to_upcoming_count = ROW_COUNT;

  -- 2. a_vencer / em_aberto / upcoming / pending → vencido (past due)
  UPDATE transactions
  SET status = 'vencido'
  WHERE status IN ('a_vencer', 'em_aberto', 'upcoming', 'pending')
    AND date < today_date;
  GET DIAGNOSTICS to_overdue_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'updated_to_upcoming', to_upcoming_count,
    'updated_to_overdue',  to_overdue_count
  );
END;
$$;

-- Only the service role can call this function
REVOKE EXECUTE ON FUNCTION update_transaction_statuses(date, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION update_transaction_statuses(date, date) TO service_role;
