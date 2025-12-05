-- Add tag column to transactions table
ALTER TABLE public.transactions
ADD COLUMN tag text;