-- Add payment_method column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN payment_method text DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN public.transactions.payment_method IS 'Payment method used for the transaction (e.g., pix, credit_card, debit_card, cash, bank_transfer, boleto)';