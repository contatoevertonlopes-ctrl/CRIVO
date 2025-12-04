-- Drop the old constraint first
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Update existing data to new status values
UPDATE public.transactions SET status = 'em_aberto' WHERE status = 'pending';
UPDATE public.transactions SET status = 'pagamento_concluido' WHERE status IN ('confirmed', 'paid');

-- Add new constraint with the correct Portuguese values
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check 
CHECK (status = ANY (ARRAY['em_aberto'::text, 'a_vencer'::text, 'vencido'::text, 'pagamento_concluido'::text]));