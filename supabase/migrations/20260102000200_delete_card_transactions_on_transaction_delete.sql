-- Delete related card_transactions when deleting transactions
-- This keeps Cards (card_transactions) in sync when a user deletes entries in Transactions.

CREATE OR REPLACE FUNCTION public.delete_card_transactions_for_deleted_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  series_root_id uuid;
BEGIN
  -- Avoid recursion when a delete is triggered from another trigger (e.g. deleting transactions
  -- because card_transactions were deleted). In that case, card_transactions are already being
  -- handled by the initiating trigger.
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  series_root_id := COALESCE(OLD.parent_transaction_id, OLD.id);

  -- If deleting the root of a series (e.g. installments), delete all linked card_transactions
  -- for the whole series (root + children). Otherwise delete only the linked row.
  IF OLD.id = series_root_id THEN
    DELETE FROM public.card_transactions ct
    WHERE ct.transaction_id IN (
      SELECT t.id
      FROM public.transactions t
      WHERE t.id = series_root_id OR t.parent_transaction_id = series_root_id
    );
  ELSE
    DELETE FROM public.card_transactions ct
    WHERE ct.transaction_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_card_transactions_on_transaction_delete ON public.transactions;
CREATE TRIGGER trg_delete_card_transactions_on_transaction_delete
BEFORE DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.delete_card_transactions_for_deleted_transaction();
