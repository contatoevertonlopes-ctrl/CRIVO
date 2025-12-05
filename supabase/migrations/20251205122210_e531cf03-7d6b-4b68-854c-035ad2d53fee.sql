CREATE OR REPLACE FUNCTION public.create_next_recurring_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_date date;
BEGIN
  -- Only trigger when status changes to 'pagamento_concluido' and is recurring
  IF NEW.status IN ('pagamento_concluido', 'paid', 'confirmed') 
     AND NEW.is_recurring = true 
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Calculate next date based on interval
    CASE NEW.recurring_interval
      WHEN 'weekly' THEN
        next_date := NEW.date + INTERVAL '1 week';
      WHEN 'monthly' THEN
        next_date := NEW.date + INTERVAL '1 month';
      WHEN 'yearly' THEN
        next_date := NEW.date + INTERVAL '1 year';
      ELSE
        next_date := NEW.date + INTERVAL '1 month';
    END CASE;
    
    -- Create next recurring transaction with all info except paid_date and status
    INSERT INTO public.transactions (
      user_id,
      description,
      amount,
      category,
      type,
      status,
      date,
      is_recurring,
      recurring_interval,
      parent_transaction_id,
      tag
    ) VALUES (
      NEW.user_id,
      NEW.description,
      NEW.amount,
      NEW.category,
      NEW.type,
      'em_aberto',
      next_date,
      true,
      NEW.recurring_interval,
      COALESCE(NEW.parent_transaction_id, NEW.id),
      NEW.tag
    );
  END IF;
  
  RETURN NEW;
END;
$function$;