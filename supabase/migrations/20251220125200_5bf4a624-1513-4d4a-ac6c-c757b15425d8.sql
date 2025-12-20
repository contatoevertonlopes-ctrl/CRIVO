-- Create goals table for "Digital Envelopes" / Sinking Funds
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'target',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active',
  color TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goal_items table for checklist
CREATE TABLE public.goal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_amount NUMERIC NOT NULL DEFAULT 0,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add goal_id column to transactions
ALTER TABLE public.transactions 
ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for goals
CREATE POLICY "Users can view household goals"
ON public.goals FOR SELECT
USING (
  user_id = auth.uid() OR 
  (household_id IS NOT NULL AND household_id = user_household_id(auth.uid()))
);

CREATE POLICY "Users can create goals"
ON public.goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update household goals"
ON public.goals FOR UPDATE
USING (
  user_id = auth.uid() OR 
  (household_id IS NOT NULL AND household_id = user_household_id(auth.uid()))
);

CREATE POLICY "Users can delete their own goals"
ON public.goals FOR DELETE
USING (user_id = auth.uid());

-- RLS policies for goal_items
CREATE POLICY "Users can view goal items"
ON public.goal_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_id
    AND (g.user_id = auth.uid() OR 
         (g.household_id IS NOT NULL AND g.household_id = user_household_id(auth.uid())))
  )
);

CREATE POLICY "Users can create goal items"
ON public.goal_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_id
    AND (g.user_id = auth.uid() OR 
         (g.household_id IS NOT NULL AND g.household_id = user_household_id(auth.uid())))
  )
);

CREATE POLICY "Users can update goal items"
ON public.goal_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_id
    AND (g.user_id = auth.uid() OR 
         (g.household_id IS NOT NULL AND g.household_id = user_household_id(auth.uid())))
  )
);

CREATE POLICY "Users can delete goal items"
ON public.goal_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_id
    AND (g.user_id = auth.uid() OR 
         (g.household_id IS NOT NULL AND g.household_id = user_household_id(auth.uid())))
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_items_updated_at
BEFORE UPDATE ON public.goal_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_goals_household_id ON public.goals(household_id);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goal_items_goal_id ON public.goal_items(goal_id);
CREATE INDEX idx_transactions_goal_id ON public.transactions(goal_id);