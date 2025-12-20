-- Create households table
CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Minha Casa',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Create household invites table
CREATE TABLE public.household_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone,
  used_by uuid
);

-- Add household_id to profiles
ALTER TABLE public.profiles
ADD COLUMN household_id uuid REFERENCES public.households(id);

-- Add household_id to transactions
ALTER TABLE public.transactions
ADD COLUMN household_id uuid REFERENCES public.households(id);

-- Enable RLS
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

-- Function to check if user belongs to household
CREATE OR REPLACE FUNCTION public.user_household_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Households policies
CREATE POLICY "Users can view their household"
ON public.households FOR SELECT
USING (id = public.user_household_id(auth.uid()));

CREATE POLICY "Users can create households"
ON public.households FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Household members can update"
ON public.households FOR UPDATE
USING (id = public.user_household_id(auth.uid()));

-- Household invites policies
CREATE POLICY "Household members can view invites"
ON public.household_invites FOR SELECT
USING (household_id = public.user_household_id(auth.uid()));

CREATE POLICY "Household members can create invites"
ON public.household_invites FOR INSERT
WITH CHECK (household_id = public.user_household_id(auth.uid()));

CREATE POLICY "Anyone can view invite by code"
ON public.household_invites FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- Update transactions RLS to include household
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view household transactions"
ON public.transactions FOR SELECT
USING (
  user_id = auth.uid() OR 
  (household_id IS NOT NULL AND household_id = public.user_household_id(auth.uid()))
);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update household transactions"
ON public.transactions FOR UPDATE
USING (
  user_id = auth.uid() OR 
  (household_id IS NOT NULL AND household_id = public.user_household_id(auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete household transactions"
ON public.transactions FOR DELETE
USING (
  user_id = auth.uid() OR 
  (household_id IS NOT NULL AND household_id = public.user_household_id(auth.uid()))
);

-- Function to create household for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_household_id uuid;
BEGIN
  -- Create household for new user
  INSERT INTO public.households (name, created_by)
  VALUES ('Minha Casa', new.id)
  RETURNING id INTO new_household_id;
  
  -- Create profile with household
  INSERT INTO public.profiles (user_id, full_name, household_id)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new_household_id);
  
  -- Create subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active');
  
  -- Update existing transactions to belong to this household
  UPDATE public.transactions 
  SET household_id = new_household_id 
  WHERE user_id = new.id AND household_id IS NULL;
  
  RETURN new;
END;
$function$;

-- Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_household_invite(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_old_household_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Get valid invite
  SELECT * INTO v_invite
  FROM public.household_invites
  WHERE invite_code = p_invite_code
    AND used_at IS NULL
    AND expires_at > now();
    
  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;
  
  -- Get user's current household
  SELECT household_id INTO v_old_household_id
  FROM public.profiles
  WHERE user_id = v_user_id;
  
  -- Update user's profile to new household
  UPDATE public.profiles
  SET household_id = v_invite.household_id
  WHERE user_id = v_user_id;
  
  -- Move user's transactions to new household
  UPDATE public.transactions
  SET household_id = v_invite.household_id
  WHERE user_id = v_user_id;
  
  -- Mark invite as used
  UPDATE public.household_invites
  SET used_at = now(), used_by = v_user_id
  WHERE id = v_invite.id;
  
  -- Delete old household if empty
  DELETE FROM public.households
  WHERE id = v_old_household_id
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE household_id = v_old_household_id
    );
  
  RETURN json_build_object('success', true);
END;
$$;