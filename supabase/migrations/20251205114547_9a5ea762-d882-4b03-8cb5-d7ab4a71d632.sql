-- Add paid_date column to transactions table
ALTER TABLE public.transactions
ADD COLUMN paid_date date;

-- Create function to auto-fill paid_date when status changes to paid
CREATE OR REPLACE FUNCTION public.set_paid_date_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When status changes to paid and paid_date is not already set
  IF NEW.status IN ('pagamento_concluido', 'paid', 'confirmed') 
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.paid_date IS NULL THEN
    NEW.paid_date := CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-fill paid_date
CREATE TRIGGER set_paid_date_trigger
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_paid_date_on_status_change();