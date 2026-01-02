-- Inverse sync: when a card_transaction is deleted, delete its linked transaction
-- This keeps Transactions (transactions) in sync when a user deletes entries inside Cards.

CREATE OR REPLACE FUNCTION public.delete_transactions_for_deleted_card_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prevent recursion/loops (e.g. deleting card_transactions as a consequence of deleting transactions)
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  -- Only delete if there is an explicit link
  IF OLD.transaction_id IS NULL THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.transactions t
  WHERE t.id = OLD.transaction_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_transactions_on_card_transaction_delete ON public.card_transactions;
CREATE TRIGGER trg_delete_transactions_on_card_transaction_delete
AFTER DELETE ON public.card_transactions
FOR EACH ROW
EXECUTE FUNCTION public.delete_transactions_for_deleted_card_transaction();
