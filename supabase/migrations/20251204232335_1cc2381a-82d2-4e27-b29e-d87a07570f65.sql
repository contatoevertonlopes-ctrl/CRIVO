-- Drop existing constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Add new constraint including 'pro'
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan = ANY (ARRAY['free'::text, 'pro'::text, 'monthly'::text, 'annual'::text]));