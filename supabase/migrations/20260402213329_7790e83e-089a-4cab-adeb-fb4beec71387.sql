-- Remove duplicate recurrence triggers (keep only trg_process_recurrence)
DROP TRIGGER IF EXISTS trigger_recurrence_on_insert ON public.transactions;
DROP TRIGGER IF EXISTS trigger_recurrence_on_payment ON public.transactions;

-- Remove duplicate bank balance trigger (keep only trg_update_bank_balance)
DROP TRIGGER IF EXISTS update_balance_on_transaction_change ON public.transactions;

-- Remove duplicate paid_date trigger (keep only trg_set_paid_date)
DROP TRIGGER IF EXISTS set_paid_date_trigger ON public.transactions;