
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
        AND status NOT IN ('pagamento_concluido', 'paid', 'confirmed')
    LOOP
        INSERT INTO transactions (
            user_id, household_id, description, amount, type, status, 
            date, category, tag, payment_method,
            bank_account_id, card_id,
            is_recurring, frequency, recurring_interval, recurring_series_id,
            recurrence_processed, source
        ) VALUES (
            trans.user_id, trans.household_id, trans.description, trans.amount, trans.type, 
            'em_aberto', 
            calculate_next_due_date(trans.date, trans.frequency), 
            trans.category, trans.tag, trans.payment_method,
            trans.bank_account_id, trans.card_id,
            TRUE, trans.frequency, trans.recurring_interval, trans.recurring_series_id,
            FALSE, 'recurring'
        );
        
        UPDATE transactions SET recurrence_processed = TRUE WHERE id = trans.id;
    END LOOP;
END;
$function$;
