
DELETE FROM transactions
WHERE is_recurring = true
  AND status NOT IN ('pagamento_concluido', 'paid', 'confirmed')
  AND date > CURRENT_DATE + INTERVAL '2 months';
