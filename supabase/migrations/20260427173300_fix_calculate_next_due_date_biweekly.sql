-- Fix: calculate_next_due_date lacked 'biweekly' support.
-- Transactions with frequency='biweekly' were falling to the ELSE branch
-- and getting +1 month instead of +15 days.
-- The recurring_series table already allows 'biweekly' as a valid interval value.

CREATE OR REPLACE FUNCTION public.calculate_next_due_date(current_date_val date, freq text)
  RETURNS date
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF    freq = 'weekly'    THEN RETURN current_date_val + INTERVAL '1 week';
  ELSIF freq = 'biweekly'  THEN RETURN current_date_val + INTERVAL '15 days';
  ELSIF freq = 'monthly'   THEN RETURN current_date_val + INTERVAL '1 month';
  ELSIF freq = 'quarterly' THEN RETURN current_date_val + INTERVAL '3 months';
  ELSIF freq = 'yearly'    THEN RETURN current_date_val + INTERVAL '1 year';
  ELSE                          RETURN current_date_val + INTERVAL '1 month';
  END IF;
END;
$$;
