-- 1. Replace process_recurrence_on_payment to copy ALL fields
CREATE OR REPLACE FUNCTION public.process_recurrence_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.status = 'pagamento_concluido'
       AND NEW.is_recurring = TRUE
       AND NEW.recurrence_processed = FALSE
       AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'pagamento_concluido'))
    THEN
       INSERT INTO public.transactions (
           user_id, household_id, description, amount, type, status, date, category,
           tag, payment_method, bank_account_id, card_id,
           is_recurring, frequency, recurring_interval, recurring_series_id,
           recurrence_processed, source
       ) VALUES (
           NEW.user_id, NEW.household_id, NEW.description, NEW.amount, NEW.type,
           'em_aberto',
           public.calculate_next_due_date(NEW.date, NEW.frequency),
           NEW.category, NEW.tag, NEW.payment_method, NEW.bank_account_id, NEW.card_id,
           TRUE, NEW.frequency, NEW.recurring_interval, NEW.recurring_series_id,
           FALSE, 'recurring'
       );
       NEW.recurrence_processed := TRUE;
    END IF;
    RETURN NEW;
END;
$function$;

-- 2. Add BEFORE INSERT trigger for transactions created directly as paid
DROP TRIGGER IF EXISTS trigger_recurrence_on_insert ON public.transactions;
CREATE TRIGGER trigger_recurrence_on_insert
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.process_recurrence_on_payment();