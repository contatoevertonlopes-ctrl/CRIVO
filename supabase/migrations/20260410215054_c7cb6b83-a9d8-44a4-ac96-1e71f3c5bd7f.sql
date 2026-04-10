-- Fix orphaned transactions: assign household_id to transactions that have NULL
UPDATE public.transactions
SET household_id = 'b81149f6-1d84-42d9-a70e-2e6d2910079d'
WHERE user_id = '1e6abf9a-e38f-48ab-9ea3-c16b58d8abfc'
  AND household_id IS NULL;

-- Also fix for other users who have a profile with household but orphaned transactions
UPDATE public.transactions t
SET household_id = p.household_id
FROM public.profiles p
WHERE t.user_id = p.user_id
  AND p.household_id IS NOT NULL
  AND t.household_id IS NULL;