-- Create cards table for credit card management
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  household_id UUID REFERENCES public.households(id),
  name TEXT NOT NULL,
  last_four_digits TEXT,
  brand TEXT DEFAULT 'generic',
  color TEXT DEFAULT '#8B5CF6',
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create card_transactions table for card expenses (linked to main transactions)
CREATE TABLE public.card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  household_id UUID REFERENCES public.households(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  installment_number INTEGER NOT NULL DEFAULT 1,
  total_installments INTEGER NOT NULL DEFAULT 1,
  parent_card_transaction_id UUID REFERENCES public.card_transactions(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create card_bills table for monthly consolidated bills
CREATE TABLE public.card_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  household_id UUID REFERENCES public.households(id),
  billing_month DATE NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(card_id, billing_month)
);

-- Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cards
CREATE POLICY "Users can view their own cards"
  ON public.cards FOR SELECT
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can insert their own cards"
  ON public.cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON public.cards FOR UPDATE
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can delete their own cards"
  ON public.cards FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for card_transactions
CREATE POLICY "Users can view card transactions"
  ON public.card_transactions FOR SELECT
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can insert card transactions"
  ON public.card_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update card transactions"
  ON public.card_transactions FOR UPDATE
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can delete card transactions"
  ON public.card_transactions FOR DELETE
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

-- RLS Policies for card_bills
CREATE POLICY "Users can view card bills"
  ON public.card_bills FOR SELECT
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can insert card bills"
  ON public.card_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update card bills"
  ON public.card_bills FOR UPDATE
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

CREATE POLICY "Users can delete card bills"
  ON public.card_bills FOR DELETE
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND household_id = user_household_id(auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_transactions_updated_at
  BEFORE UPDATE ON public.card_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_bills_updated_at
  BEFORE UPDATE ON public.card_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate billing month based on purchase date and closing day
CREATE OR REPLACE FUNCTION public.calculate_billing_month(
  p_purchase_date DATE,
  p_closing_day INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_day INTEGER;
  v_result DATE;
BEGIN
  v_day := EXTRACT(DAY FROM p_purchase_date);
  
  -- If purchase is after closing day, it goes to next month's bill
  IF v_day > p_closing_day THEN
    v_result := DATE_TRUNC('month', p_purchase_date) + INTERVAL '1 month';
  ELSE
    v_result := DATE_TRUNC('month', p_purchase_date);
  END IF;
  
  RETURN v_result;
END;
$$;

-- Function to create installment transactions automatically
CREATE OR REPLACE FUNCTION public.create_card_installments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card RECORD;
  v_installment INTEGER;
  v_billing_month DATE;
BEGIN
  -- Only create installments for new records with total_installments > 1
  IF NEW.total_installments > 1 AND NEW.installment_number = 1 THEN
    -- Get card info for closing_day
    SELECT * INTO v_card FROM public.cards WHERE id = NEW.card_id;
    
    -- Create remaining installments
    FOR v_installment IN 2..NEW.total_installments LOOP
      v_billing_month := NEW.billing_month + ((v_installment - 1) * INTERVAL '1 month');
      
      INSERT INTO public.card_transactions (
        card_id,
        transaction_id,
        user_id,
        household_id,
        description,
        amount,
        purchase_date,
        installment_number,
        total_installments,
        parent_card_transaction_id,
        billing_month
      ) VALUES (
        NEW.card_id,
        NULL,
        NEW.user_id,
        NEW.household_id,
        NEW.description || ' (' || v_installment || '/' || NEW.total_installments || ')',
        NEW.amount,
        NEW.purchase_date,
        v_installment,
        NEW.total_installments,
        NEW.id,
        v_billing_month
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_card_installments_trigger
  AFTER INSERT ON public.card_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_card_installments();