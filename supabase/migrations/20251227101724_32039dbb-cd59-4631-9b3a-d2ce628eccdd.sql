-- Create bank_accounts table for treasury management
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  household_id UUID REFERENCES public.households(id),
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking', -- 'checking', 'savings'
  balance NUMERIC NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'landmark',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own accounts"
ON public.bank_accounts FOR SELECT
USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can insert their own accounts"
ON public.bank_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
ON public.bank_accounts FOR UPDATE
USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can delete their own accounts"
ON public.bank_accounts FOR DELETE
USING (user_id = auth.uid());

-- Add bank_account_id to transactions table
ALTER TABLE public.transactions ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id);

-- Add card_id to transactions table (for credit card transactions)
ALTER TABLE public.transactions ADD COLUMN card_id UUID REFERENCES public.cards(id);

-- Create trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update bank account balance when transaction is created/updated/deleted
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_amount_change NUMERIC;
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL AND NEW.status IN ('pagamento_concluido', 'paid', 'confirmed') THEN
      IF NEW.type = 'expense' THEN
        v_amount_change := -NEW.amount;
      ELSE
        v_amount_change := NEW.amount;
      END IF;
      
      UPDATE public.bank_accounts
      SET balance = balance + v_amount_change
      WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old balance change if was linked to account and completed
    IF OLD.bank_account_id IS NOT NULL AND OLD.status IN ('pagamento_concluido', 'paid', 'confirmed') THEN
      IF OLD.type = 'expense' THEN
        v_amount_change := OLD.amount;
      ELSE
        v_amount_change := -OLD.amount;
      END IF;
      
      UPDATE public.bank_accounts
      SET balance = balance + v_amount_change
      WHERE id = OLD.bank_account_id;
    END IF;
    
    -- Apply new balance change if linked to account and completed
    IF NEW.bank_account_id IS NOT NULL AND NEW.status IN ('pagamento_concluido', 'paid', 'confirmed') THEN
      IF NEW.type = 'expense' THEN
        v_amount_change := -NEW.amount;
      ELSE
        v_amount_change := NEW.amount;
      END IF;
      
      UPDATE public.bank_accounts
      SET balance = balance + v_amount_change
      WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL AND OLD.status IN ('pagamento_concluido', 'paid', 'confirmed') THEN
      IF OLD.type = 'expense' THEN
        v_amount_change := OLD.amount;
      ELSE
        v_amount_change := -OLD.amount;
      END IF;
      
      UPDATE public.bank_accounts
      SET balance = balance + v_amount_change
      WHERE id = OLD.bank_account_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic balance updates
CREATE TRIGGER update_balance_on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_account_balance();