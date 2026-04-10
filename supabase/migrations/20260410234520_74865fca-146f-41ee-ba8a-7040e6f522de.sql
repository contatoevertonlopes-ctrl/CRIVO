
-- 1. Fix subscription privilege escalation: drop user INSERT/UPDATE policies
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- 2. Enable RLS on n8n_chat_histories
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- 3. Fix SECURITY DEFINER functions missing search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_recurrence_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.delete_card_transactions_for_deleted_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  series_root_id uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  series_root_id := COALESCE(OLD.parent_transaction_id, OLD.id);

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
$function$;

CREATE OR REPLACE FUNCTION public.delete_transactions_for_deleted_card_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  IF OLD.transaction_id IS NULL THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.transactions t
  WHERE t.id = OLD.transaction_id;

  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_recurrence_on_due_date()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    trans RECORD;
BEGIN
    FOR trans IN 
        SELECT * FROM transactions 
        WHERE is_recurring = TRUE 
        AND recurrence_processed = FALSE 
        AND date <= CURRENT_DATE 
    LOOP
        INSERT INTO transactions (
            user_id, description, amount, type, status, 
            date, 
            category,
            is_recurring, frequency, recurrence_processed
        ) VALUES (
            trans.user_id, trans.description, trans.amount, trans.type, 
            'em_aberto', 
            calculate_next_due_date(trans.date, trans.frequency), 
            trans.category,
            TRUE, trans.frequency, FALSE
        );
        
        UPDATE transactions SET recurrence_processed = TRUE WHERE id = trans.id;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_next_due_date(current_date_val date, freq text)
 RETURNS date
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF freq = 'monthly' THEN RETURN current_date_val + INTERVAL '1 month';
    ELSIF freq = 'quarterly' THEN RETURN current_date_val + INTERVAL '3 months';
    ELSIF freq = 'weekly' THEN RETURN current_date_val + INTERVAL '1 week';
    ELSIF freq = 'yearly' THEN RETURN current_date_val + INTERVAL '1 year';
    ELSE RETURN current_date_val + INTERVAL '1 month';
    END IF;
END;
$function$;
