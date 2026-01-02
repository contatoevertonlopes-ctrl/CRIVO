-- Avoid duplicate recurring generation and support biweekly interval
-- This updates the trigger function used to auto-create the next recurring transaction.

CREATE OR REPLACE FUNCTION public.create_next_recurring_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_date date;
  series_id uuid;
BEGIN
  -- Only trigger when status changes to paid and is recurring
  IF NEW.status IN ('pagamento_concluido', 'paid', 'confirmed')
     AND NEW.is_recurring = true
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN

    series_id := COALESCE(NEW.parent_transaction_id, NEW.id);

    -- Calculate next date based on interval
    CASE NEW.recurring_interval
      WHEN 'weekly' THEN
        next_date := NEW.date + INTERVAL '1 week';
      WHEN 'biweekly' THEN
        next_date := NEW.date + INTERVAL '15 days';
      WHEN 'monthly' THEN
        next_date := NEW.date + INTERVAL '1 month';
      WHEN 'yearly' THEN
        next_date := NEW.date + INTERVAL '1 year';
      ELSE
        next_date := NEW.date + INTERVAL '1 month';
    END CASE;

    -- If already exists for this series + date, do nothing
    IF EXISTS (
      SELECT 1
      FROM public.transactions t
      WHERE t.parent_transaction_id = series_id
        AND t.date = next_date
    ) THEN
      RETURN NEW;
    END IF;

    -- Create next recurring transaction
    INSERT INTO public.transactions (
      user_id,
      household_id,
      description,
      amount,
      category,
      type,
      status,
      date,
      is_recurring,
      recurring_interval,
      parent_transaction_id,
      tag,
      payment_method,
      bank_account_id,
      card_id
    ) VALUES (
      NEW.user_id,
      NEW.household_id,
      NEW.description,
      NEW.amount,
      NEW.category,
      NEW.type,
      'em_aberto',
      next_date,
      true,
      NEW.recurring_interval,
      series_id,
      NEW.tag,
      NEW.payment_method,
      NEW.bank_account_id,
      NEW.card_id
    );
  END IF;

  RETURN NEW;
END;
$$;
