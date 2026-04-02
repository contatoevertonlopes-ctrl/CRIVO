-- 1. Trigger: auto-set paid_date on status change (BEFORE UPDATE)
CREATE TRIGGER trg_set_paid_date
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_paid_date_on_status_change();

-- 2. Trigger: process recurrence on payment (BEFORE INSERT OR UPDATE)
CREATE TRIGGER trg_process_recurrence
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.process_recurrence_on_payment();

-- 3. Trigger: update bank account balance (AFTER INSERT, UPDATE, DELETE)
CREATE TRIGGER trg_update_bank_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_account_balance();