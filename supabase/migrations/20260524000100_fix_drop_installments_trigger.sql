-- Drop the trigger that auto-generates installment rows 2..N on card_transactions INSERT.
-- The frontend (useCards.tsx addCardExpenseMutation) already inserts all installments
-- explicitly, so the trigger was creating duplicates: a 3x purchase produced 5 rows
-- instead of 3 (1 from the root insert + 2 from the trigger + 2 from the frontend batch).
DROP TRIGGER IF EXISTS create_card_installments_trigger ON public.card_transactions;
