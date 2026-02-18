-- ============================================================
-- Refactor: recurring series
-- 1. Drop the trigger that auto-creates the next occurrence on payment
-- 2. Create recurring_series table and migrate existing series data
-- 3. Remove self-reference (parent_transaction_id = id) from root transactions
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Drop trigger and its function
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_create_next_recurring ON public.transactions;
DROP FUNCTION IF EXISTS public.create_next_recurring_transaction();

-- ----------------------------------------------------------------
-- 2. Create recurring_series table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_series (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id  uuid REFERENCES public.households(id) ON DELETE SET NULL,
  description   text NOT NULL,
  amount        numeric(12,2) NOT NULL,
  category      text NOT NULL,
  type          text NOT NULL CHECK (type IN ('income', 'expense')),
  interval      text NOT NULL DEFAULT 'monthly'
                  CHECK (interval IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  start_date    date NOT NULL,
  tag           text,
  payment_method text,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  card_id        uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.recurring_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring series"
  ON public.recurring_series
  FOR ALL
  USING (
    user_id = auth.uid()
    OR household_id IN (
      SELECT household_id FROM public.profiles WHERE user_id = auth.uid() AND household_id IS NOT NULL
    )
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ----------------------------------------------------------------
-- 3. Add recurring_series_id FK to transactions
-- ----------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_series_id uuid REFERENCES public.recurring_series(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring_series_id
  ON public.transactions(recurring_series_id);

-- ----------------------------------------------------------------
-- 4. Migrate existing recurring series data
--    A series is identified by the root: parent_transaction_id = id
-- ----------------------------------------------------------------
DO $$
DECLARE
  root_row RECORD;
  new_series_id uuid;
BEGIN
  -- Iterate over all root recurring transactions (self-referencing rows)
  FOR root_row IN
    SELECT *
    FROM public.transactions
    WHERE is_recurring = true
      AND parent_transaction_id = id
  LOOP
    -- Create a recurring_series record from the root
    INSERT INTO public.recurring_series (
      id,
      user_id,
      household_id,
      description,
      amount,
      category,
      type,
      interval,
      start_date,
      tag,
      payment_method,
      bank_account_id,
      card_id
    ) VALUES (
      gen_random_uuid(),
      root_row.user_id,
      root_row.household_id,
      root_row.description,
      root_row.amount,
      root_row.category,
      root_row.type,
      COALESCE(root_row.recurring_interval, 'monthly'),
      root_row.date,
      root_row.tag,
      root_row.payment_method,
      root_row.bank_account_id,
      root_row.card_id
    )
    RETURNING id INTO new_series_id;

    -- Point all transactions in this series (including root) to the new series record
    UPDATE public.transactions
    SET recurring_series_id = new_series_id
    WHERE parent_transaction_id = root_row.id
       OR id = root_row.id;
  END LOOP;

  -- Handle orphaned recurring transactions (no self-referencing root found)
  -- Group by user + description and create one series per group
  FOR root_row IN
    SELECT DISTINCT ON (t.user_id, t.description)
      t.*
    FROM public.transactions t
    WHERE t.is_recurring = true
      AND t.recurring_series_id IS NULL
    ORDER BY t.user_id, t.description, t.date ASC
  LOOP
    INSERT INTO public.recurring_series (
      user_id,
      household_id,
      description,
      amount,
      category,
      type,
      interval,
      start_date,
      tag,
      payment_method,
      bank_account_id,
      card_id
    ) VALUES (
      root_row.user_id,
      root_row.household_id,
      root_row.description,
      root_row.amount,
      root_row.category,
      root_row.type,
      COALESCE(root_row.recurring_interval, 'monthly'),
      root_row.date,
      root_row.tag,
      root_row.payment_method,
      root_row.bank_account_id,
      root_row.card_id
    )
    RETURNING id INTO new_series_id;

    UPDATE public.transactions
    SET recurring_series_id = new_series_id
    WHERE is_recurring = true
      AND recurring_series_id IS NULL
      AND user_id = root_row.user_id
      AND description = root_row.description;
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- 5. Remove self-references (parent_transaction_id = id) from root transactions
--    Root transactions no longer need to point to themselves;
--    series membership is now expressed via recurring_series_id.
--    Non-root children keep their parent_transaction_id (needed for installments).
--    For recurring series, clear parent_transaction_id on all members since
--    grouping is now done through recurring_series_id.
-- ----------------------------------------------------------------
UPDATE public.transactions
SET parent_transaction_id = NULL
WHERE is_recurring = true
  AND parent_transaction_id = id;        -- self-references (root rows)

-- Also clear parent_transaction_id on recurring children because
-- grouping now happens via recurring_series_id, not the FK chain.
-- Installment children (is_recurring = false) keep their parent_transaction_id intact.
UPDATE public.transactions
SET parent_transaction_id = NULL
WHERE is_recurring = true
  AND parent_transaction_id IS NOT NULL
  AND parent_transaction_id != id;       -- children that still point to old root

-- ----------------------------------------------------------------
-- 6. updated_at trigger for recurring_series
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recurring_series_updated_at ON public.recurring_series;
CREATE TRIGGER trg_recurring_series_updated_at
  BEFORE UPDATE ON public.recurring_series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
