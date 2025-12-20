-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_income numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS app_mode text DEFAULT 'survival',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;