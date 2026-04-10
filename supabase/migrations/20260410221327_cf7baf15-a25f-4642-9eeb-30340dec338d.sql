
-- 1. Fix transactions that have paid_date but wrong status
UPDATE public.transactions
SET status = 'pagamento_concluido'
WHERE paid_date IS NOT NULL
  AND status NOT IN ('pagamento_concluido', 'paid', 'confirmed');

-- 2. Delete all recurring transactions from June 2026 onwards
DELETE FROM public.transactions
WHERE is_recurring = true
  AND date >= '2026-06-01';
